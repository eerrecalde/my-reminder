package com.myreminders

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ReminderFoundationTest {
  @Test fun unansweredOneOffRemainsVisibleWithoutRestartingAlertsAndClearedHistoryStaysCleared() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val zone = java.time.ZoneId.systemDefault()
    val date = java.time.LocalDate.now(zone).minusDays(2)
    val at = date.atTime(9, 0).atZone(zone).toInstant().toEpochMilli()
    for (type in listOf("reminder", "medicine")) {
      val item = MedicineRepository(context).use { repo ->
        val saved = repo.save("Past one-off", "", listOf("09:00"), at - 60000, type, startDate = date.toString(), endDate = date.toString())
        repo.recordDue(saved.id, at)
        saved
      }
      try {
        ReminderScheduler.rebuild(context, recovery = true)
        MedicineRepository(context).use { repo ->
          val occurrence = repo.occurrences().single { it.medicineId == item.id }
          assertTrue(TodayPolicy.includes(occurrence, item, java.time.Instant.now(), zone))
          assertTrue(TodayPolicy.actionable(occurrence, item, java.time.Instant.now(), zone))
          assertFalse(occurrence.outstanding)
          assertNull(repo.alarm(item.id))
          assertFalse(context.getSystemService(NotificationManager::class.java).activeNotifications.any { it.id == ("${item.id}:$at").hashCode() })
          repo.edit(item.id, "Edited", "", listOf("00:00"), type, "notification", now = at + 60_000)
        }
        val change = requireNotNull(ReminderScheduler.recordOutcome(context, item.id, at, "completed"))
        assertTrue(ReminderScheduler.undoOutcome(context, item.id, at, null, change.revision))
        MedicineRepository(context).use { repo ->
          val restored = repo.occurrences().single { it.medicineId == item.id && it.at == at }
          assertFalse(restored.missedAcknowledged)
          assertTrue(TodayPolicy.actionable(restored, repo.all().single { it.id == item.id }, java.time.Instant.now(), zone))
          repo.setOutcome(item.id, at, "completed")
          repo.edit(item.id, "Past one-off", "", listOf("09:00"), type, "notification", startDate = date.toString(), endDate = date.toString())
          repo.clearHistory()
        }
        ReminderScheduler.rebuild(context, recovery = true)
        MedicineRepository(context).use { repo ->
          assertTrue(repo.occurrences().none { it.medicineId == item.id })
          val cleared = repo.occurrences(includeCleared = true).single { it.medicineId == item.id }
          assertTrue(cleared.cleared)
          assertFalse(TodayPolicy.includes(cleared, item, java.time.Instant.now(), zone))
        }
      } finally {
        MedicineRepository(context).use { repo ->
          repo.writableDatabase.delete("doses", "medicine_id = ?", arrayOf(item.id))
          repo.writableDatabase.delete("occurrence_tracking", "medicine_id = ?", arrayOf(item.id))
          repo.writableDatabase.delete("medicines", "id = ?", arrayOf(item.id))
        }
      }
    }
  }
  @Test fun rebuildDismissesAlertLeftAfterInterruptedPauseCleanup() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val manager = context.getSystemService(NotificationManager::class.java)
    assertTrue(ReminderScheduler.enabled(context))
    assertTrue(MedicineRepository(context).use { it.all().isEmpty() })
    val now = System.currentTimeMillis()
    val due = now - 1000
    val time = LocalTime.now().plusHours(2).format(DateTimeFormatter.ofPattern("HH:mm"))
    val item = MedicineRepository(context).use { repo ->
      val saved = repo.save("Cleanup", "", listOf(time), now - 10000, "reminder")
      repo.setAlarm(saved.id, due, "cleanup-due")
      saved
    }
    try {
      ReminderScheduler.deliver(context, item.id, due, "cleanup-due")
      val notificationId = ("${item.id}:$due").hashCode()
      assertTrue(manager.activeNotifications.any { it.id == notificationId })
      MedicineRepository(context).use { repo ->
        repo.beginTransition(item.id)
        repo.setStatus(item.id, "paused", System.currentTimeMillis())
        repo.setOutstanding(item.id, due, false)
      }
      ReminderScheduler.rebuild(context)
      assertFalse(manager.activeNotifications.any { it.id == notificationId })
      assertNull(MedicineRepository(context).use { it.alarm(item.id) })
    } finally {
      ReminderScheduler.setStatus(context, item.id, "deleted")
      MedicineRepository(context).use { repo ->
        repo.alarm(item.id)?.let { cancel(context, it) }
        repo.finishTransition(item.id)
        repo.writableDatabase.delete("alarms", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("doses", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("occurrence_tracking", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("medicines", "id = ?", arrayOf(item.id))
      }
    }
  }
  @Test fun watchdogRetriesDueAlarmAfterUncommittedTransition() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    assertTrue(ReminderScheduler.enabled(context))
    assertTrue(MedicineRepository(context).use { it.all().isEmpty() })
    val now = System.currentTimeMillis()
    val time = LocalTime.now().plusHours(2).format(DateTimeFormatter.ofPattern("HH:mm"))
    val item = MedicineRepository(context).use { repo ->
      val saved = repo.save("Retry", "", listOf(time), now - 10000, "reminder")
      repo.setAlarm(saved.id, now - 1000, "retry-transition")
      repo.markAlarmRegistered(saved.id, "retry-transition")
      repo.beginTransition(saved.id)
      saved
    }
    try {
      ReminderScheduler.recoverInterruptedDelivery(context, item.id, now - 1000, "retry-transition")
      val intent = Intent(context, ReminderReceiver::class.java)
        .setData(Uri.parse("myreminders://medicine/${item.id}/retry-transition"))
      val pending = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE)
      requireNotNull(pending).send()
      repeat(80) {
        if (MedicineRepository(context).use { it.occurrences().none { occurrence -> occurrence.medicineId == item.id } }) Thread.sleep(50)
      }
      MedicineRepository(context).use { repo ->
        assertNull(repo.transition(item.id))
        assertTrue(repo.occurrences().any { it.medicineId == item.id && it.at == now - 1000 })
        assertTrue(requireNotNull(repo.alarm(item.id)).at > now)
      }
    } finally {
      MedicineRepository(context).use { repo ->
        repo.alarm(item.id)?.let { cancel(context, it) }
        repo.finishTransition(item.id)
        repo.writableDatabase.delete("alarms", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("doses", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("occurrence_tracking", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("medicines", "id = ?", arrayOf(item.id))
      }
    }
  }
  @Test fun interruptedTransitionsRecoverSavedAndUnsavedChangesWithoutTouchingOtherAlarms() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    assertTrue(ReminderScheduler.enabled(context))
    assertTrue(MedicineRepository(context).use { it.all().isEmpty() })
    val now = System.currentTimeMillis()
    val oldTime = LocalTime.now().plusHours(2).format(DateTimeFormatter.ofPattern("HH:mm"))
    val newTime = LocalTime.now().plusHours(4).format(DateTimeFormatter.ofPattern("HH:mm"))
    val first = MedicineRepository(context).use { it.save("Original", "", listOf(oldTime), now - 10000, "reminder") }
    val second = MedicineRepository(context).use { it.save("Other", "", listOf(oldTime), now - 10000, "reminder") }
    try {
      ReminderScheduler.schedule(context, first)
      ReminderScheduler.schedule(context, second)
      val original = requireNotNull(MedicineRepository(context).use { it.alarm(first.id) })
      val other = MedicineRepository(context).use { it.alarm(second.id) }
      MedicineRepository(context).use { it.beginTransition(first.id) }
      ReminderScheduler.rebuild(context)
      MedicineRepository(context).use { repo ->
        assertNull(repo.transition(first.id))
        assertEquals(original, repo.alarm(first.id))
        assertEquals(other, repo.alarm(second.id))
        repo.beginTransition(first.id)
        repo.edit(first.id, "Changed", "", listOf(newTime), "reminder", "notification", System.currentTimeMillis())
        assertNull(repo.alarm(first.id))
        assertTrue(requireNotNull(repo.transition(first.id)).committed)
      }
      ReminderScheduler.deliver(context, first.id, original.at, original.token)
      MedicineRepository(context).use { repo ->
        assertNull(repo.transition(first.id))
        assertEquals("Changed", repo.all().first { it.id == first.id }.name)
        assertNotEquals(original.token, requireNotNull(repo.alarm(first.id)).token)
        assertEquals(other, repo.alarm(second.id))
        repo.beginTransition(first.id)
        repo.setStatus(first.id, "paused", System.currentTimeMillis())
      }
      ReminderScheduler.rebuild(context)
      MedicineRepository(context).use { repo ->
        assertNull(repo.transition(first.id))
        assertNull(repo.alarm(first.id))
        assertEquals(other, repo.alarm(second.id))
      }
    } finally {
      MedicineRepository(context).use { repo ->
        listOf(first, second).forEach { item ->
          repo.alarm(item.id)?.let { cancel(context, it) }
          repo.finishTransition(item.id)
          repo.writableDatabase.delete("alarms", "medicine_id = ?", arrayOf(item.id))
          repo.writableDatabase.delete("doses", "medicine_id = ?", arrayOf(item.id))
          repo.writableDatabase.delete("occurrence_tracking", "medicine_id = ?", arrayOf(item.id))
          repo.writableDatabase.delete("medicines", "id = ?", arrayOf(item.id))
        }
      }
    }
  }
  @Test fun pauseAndResumeCancelOnlyTheSelectedReminderAndPreserveDueOccurrence() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    assertTrue(ReminderScheduler.enabled(context))
    assertTrue(MedicineRepository(context).use { it.all().isEmpty() })
    val now = System.currentTimeMillis()
    val time = LocalTime.now().plusHours(2).format(DateTimeFormatter.ofPattern("HH:mm"))
    val first = MedicineRepository(context).use { it.save("First", "", listOf(time), now - 10000, "reminder") }
    val second = MedicineRepository(context).use { it.save("Second", "", listOf(time), now - 10000, "reminder") }
    val due = now - 1000
    try {
      MedicineRepository(context).use { it.setAlarm(first.id, due, "first-due") }
      ReminderScheduler.deliver(context, first.id, due, "first-due")
      ReminderScheduler.schedule(context, second)
      val secondAlarm = MedicineRepository(context).use { it.alarm(second.id) }
      try {
        ReminderScheduler.edit(context, first.id, "", "", listOf(time), "reminder", "notification")
        fail("Invalid edits should fail")
      } catch (_: IllegalArgumentException) { }
      assertNotNull(MedicineRepository(context).use { it.alarm(first.id) })
      ReminderScheduler.setStatus(context, first.id, "paused")
      MedicineRepository(context).use { repo ->
        assertNull(repo.alarm(first.id))
        assertEquals(secondAlarm, repo.alarm(second.id))
        assertNotNull(repo.occurrences().find { it.medicineId == first.id && it.at == due })
        assertFalse(repo.occurrences().first { it.medicineId == first.id && it.at == due }.outstanding)
        assertTrue(repo.occurrences().first { it.medicineId == first.id && it.at == due }.retained)
      }
      ReminderScheduler.setStatus(context, first.id, "active")
      MedicineRepository(context).use { repo ->
        assertTrue(requireNotNull(repo.alarm(first.id)).at > System.currentTimeMillis())
        assertEquals(secondAlarm, repo.alarm(second.id))
      }
      ReminderScheduler.setStatus(context, first.id, "deleted")
      ReminderScheduler.recordOutcome(context, first.id, due, "completed")
      assertEquals("completed", MedicineRepository(context).use { it.outcome(first.id, due) })
    } finally {
      MedicineRepository(context).use { repo ->
        listOf(first, second).forEach { item ->
          repo.alarm(item.id)?.let { cancel(context, it) }
          repo.writableDatabase.delete("alarms", "medicine_id = ?", arrayOf(item.id))
          repo.writableDatabase.delete("doses", "medicine_id = ?", arrayOf(item.id))
          repo.writableDatabase.delete("occurrence_tracking", "medicine_id = ?", arrayOf(item.id))
          repo.writableDatabase.delete("medicines", "id = ?", arrayOf(item.id))
        }
      }
    }
  }
  @Test fun recoveryPreservesOverdueAlarmFromBeforeTrackingBegan() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    assertTrue(ReminderScheduler.enabled(context))
    assertTrue(MedicineRepository(context).use { it.all().isEmpty() })
    val now = System.currentTimeMillis()
    val at = now - 2 * 24 * 60 * 60 * 1000L
    val time = LocalTime.now().minusMinutes(1).format(DateTimeFormatter.ofPattern("HH:mm"))
    val item = MedicineRepository(context).use { repo ->
      val medicine = repo.save("Old alarm", "", listOf(time), at - 10000, "reminder", "alarm")
      repo.writableDatabase.execSQL("UPDATE occurrence_tracking SET starts_after = ? WHERE medicine_id = ?", arrayOf(now - 60000, medicine.id))
      repo.setAlarm(medicine.id, at, "old")
      medicine
    }
    try {
      ReminderScheduler.rebuild(context, recovery = true)
      val occurrences = MedicineRepository(context).use { it.occurrences().filter { occurrence -> occurrence.medicineId == item.id } }
      assertEquals("missed", occurrences.find { it.at == at }?.outcome)
      assertFalse(context.getSystemService(NotificationManager::class.java).activeNotifications.any { it.id == ("${item.id}:$at").hashCode() })
    } finally {
      MedicineRepository(context).use { repo ->
        repo.alarm(item.id)?.let { cancel(context, it) }
        repo.writableDatabase.delete("alarms", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("doses", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("occurrence_tracking", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("medicines", "id = ?", arrayOf(item.id))
      }
    }
  }
  @Test fun recoveryKeepsPastOccurrencesAndMarksEarlierOnesMissedWithoutAlerts() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    assertTrue(ReminderScheduler.enabled(context))
    assertTrue(MedicineRepository(context).use { it.all().isEmpty() })
    val now = System.currentTimeMillis()
    val time = LocalTime.now().minusHours(1).format(DateTimeFormatter.ofPattern("HH:mm"))
    val item = MedicineRepository(context).use { it.save("Recovery test", "", listOf(time), now - 3 * 24 * 60 * 60 * 1000L, "reminder") }
    try {
      ReminderScheduler.rebuild(context, recovery = true)
      val occurrences = MedicineRepository(context).use { repo -> repo.occurrences().filter { it.medicineId == item.id } }
      assertTrue(occurrences.size >= 3)
      assertTrue(occurrences.dropLast(1).all { it.outcome == "missed" })
      assertNull(occurrences.last().outcome)
      val notifications = context.getSystemService(NotificationManager::class.java)
      assertTrue(occurrences.none { occurrence -> notifications.activeNotifications.any { it.id == ("${item.id}:${occurrence.at}").hashCode() } })
      val first = occurrences.first()
      ReminderScheduler.recordOutcome(context, item.id, first.at, null)
      ReminderScheduler.rebuild(context)
      assertNull(MedicineRepository(context).use { it.outcome(item.id, first.at) })
    } finally {
      MedicineRepository(context).use { repo ->
        repo.alarm(item.id)?.let { cancel(context, it) }
        repo.writableDatabase.delete("alarms", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("doses", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("medicines", "id = ?", arrayOf(item.id))
      }
    }
  }
  @Test fun notificationActionsDismissWithoutConfirmationAndKeepFutureScheduleForBothTypes() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val manager = context.getSystemService(NotificationManager::class.java)
    assertTrue(ReminderScheduler.enabled(context))
    assertTrue(MedicineRepository(context).use { it.all().isEmpty() })
    listOf("medicine", "reminder").forEach { type ->
      val now = System.currentTimeMillis()
      val time = LocalTime.now().plusHours(2).format(DateTimeFormatter.ofPattern("HH:mm"))
      val item = MedicineRepository(context).use { it.save("Action test", "", listOf(time), now - 10000, type) }
      val due = now - 1000
      val notificationId = ("${item.id}:$due").hashCode()
      try {
        MedicineRepository(context).use { it.setAlarm(item.id, due, "action-test") }
        ReminderScheduler.deliver(context, item.id, due, "action-test")
        val future = MedicineRepository(context).use { it.alarm(item.id) }
        val notification = requireNotNull(manager.activeNotifications.find { it.id == notificationId }).notification
        assertEquals(context.getString(if (type == "medicine") R.string.taken else R.string.completed), notification.actions[0].title.toString())
        val action = notification.actions[0].actionIntent
        action.send()
        repeat(50) { if (MedicineRepository(context).use { it.outcome(item.id, due) } != "completed") Thread.sleep(50) }
        assertEquals("completed", MedicineRepository(context).use { it.outcome(item.id, due) })
        action.send()
        repeat(50) { if (manager.activeNotifications.any { it.id == notificationId }) Thread.sleep(50) }
        assertFalse(manager.activeNotifications.any { it.id == notificationId })
        assertEquals(future, MedicineRepository(context).use { it.alarm(item.id) })
        ReminderScheduler.recordOutcome(context, item.id, due, null)
        assertNull(MedicineRepository(context).use { it.outcome(item.id, due) })
        assertEquals(future, MedicineRepository(context).use { it.alarm(item.id) })
      } finally {
        manager.cancel(notificationId)
        MedicineRepository(context).use { repo ->
          repo.alarm(item.id)?.let { cancel(context, it) }
          repo.writableDatabase.delete("alarms", "medicine_id = ?", arrayOf(item.id))
          repo.writableDatabase.delete("doses", "medicine_id = ?", arrayOf(item.id))
          repo.writableDatabase.delete("medicines", "id = ?", arrayOf(item.id))
        }
      }
    }
  }
  @Test fun snoozingAnOccurrenceDoesNotChangeItsNextReminderAndCompletionCancelsSnooze() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val now = System.currentTimeMillis()
    val time = LocalTime.now().plusHours(2).format(DateTimeFormatter.ofPattern("HH:mm"))
    val item = MedicineRepository(context).use { it.save("Snooze test", "", listOf(time), now - 10000, "reminder") }
    val due = now - 1000
    try {
      MedicineRepository(context).use { it.setAlarm(item.id, due, "snooze-test") }
      ReminderScheduler.deliver(context, item.id, due, "snooze-test")
      val next = MedicineRepository(context).use { it.alarm(item.id) }
      assertTrue(ReminderScheduler.snooze(context, item.id, due, 10))
      val firstSnooze = MedicineRepository(context).use { it.snooze(item.id, due) }
      assertTrue(ReminderScheduler.snooze(context, item.id, due, 10))
      assertEquals(firstSnooze, MedicineRepository(context).use { it.snooze(item.id, due) })
      assertEquals(next, MedicineRepository(context).use { it.alarm(item.id) })
      ReminderScheduler.recordOutcome(context, item.id, due, "completed")
      assertFalse(ReminderScheduler.snooze(context, item.id, due, 10))
      assertNull(MedicineRepository(context).use { it.snooze(item.id, due) })
    } finally {
      runCatching { ReminderScheduler.recordOutcome(context, item.id, due, "skipped") }
      MedicineRepository(context).use { repo ->
        repo.alarm(item.id)?.let { cancel(context, it) }
        repo.writableDatabase.delete("alarms", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("doses", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("occurrence_tracking", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("medicines", "id = ?", arrayOf(item.id))
      }
    }
  }
  @Test fun androidDeliversNewScheduleKindsForBothTypes() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val manager = context.getSystemService(NotificationManager::class.java)
    assertTrue(ReminderScheduler.enabled(context))
    val target = java.time.ZonedDateTime.now().plusMinutes(2).withSecond(0).withNano(0)
    val at = target.toInstant().toEpochMilli()
    val clock = target.toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm"))
    val items = mutableListOf<Medicine>()
    try {
      for (type in listOf("reminder", "medicine")) for (kind in listOf("weekday", "interval", "monthly", "once")) {
        val item = MedicineRepository(context).use { repo ->
          repo.save("Delivery $kind $type", "", listOf(clock), System.currentTimeMillis() - 1000, type,
            mode = if (kind == "once") "alarm" else "notification",
            startDate = if (kind == "once") target.toLocalDate().toString() else null,
            endDate = if (kind == "once") target.toLocalDate().toString() else null,
            scheduleKind = if (kind == "once") "daily" else kind, weekdays = if (kind == "weekday") listOf(target.dayOfWeek.value) else emptyList(),
            intervalHours = if (kind == "interval") 1 else null, intervalAnchor = if (kind == "interval") at else null,
            monthlyDay = if (kind == "monthly") target.dayOfMonth else null)
        }
        items.add(item)
        ReminderScheduler.schedule(context, item)
        val alarm = requireNotNull(MedicineRepository(context).use { it.alarm(item.id) })
        assertEquals(at, alarm.at)
        assertTrue(alarm.registered)
      }
      val deadline = at + 30_000
      while (System.currentTimeMillis() < deadline && items.any { item ->
        val notified = manager.activeNotifications.any { it.id == ("${item.id}:$at").hashCode() }
        val next = MedicineRepository(context).use { it.alarm(item.id) }
        !notified || if (item.endDate != null) next != null else next == null || !next.registered || next.at <= at
      }) Thread.sleep(200)
      MedicineRepository(context).use { repo ->
        for (item in items) {
          assertTrue("Android should deliver ${item.scheduleKind} for ${item.type}", repo.occurrences().any { it.medicineId == item.id && it.at == at })
          if (item.endDate != null) assertNull("A one-off must not schedule another occurrence", repo.alarm(item.id))
          else assertTrue("A future occurrence should be registered", requireNotNull(repo.alarm(item.id)).let { it.registered && it.at > at })
          assertTrue("Notification should be visible", manager.activeNotifications.any { it.id == ("${item.id}:$at").hashCode() })
        }
      }
    } finally {
      context.stopService(Intent(context, AlarmSoundService::class.java))
      manager.cancel(119348)
      for (item in items) {
        manager.cancel(("${item.id}:$at").hashCode())
        MedicineRepository(context).use { repo ->
          repo.alarm(item.id)?.let { cancel(context, it) }
          repo.writableDatabase.delete("alarms", "medicine_id = ?", arrayOf(item.id))
          repo.writableDatabase.delete("doses", "medicine_id = ?", arrayOf(item.id))
          repo.writableDatabase.delete("occurrence_tracking", "medicine_id = ?", arrayOf(item.id))
          repo.writableDatabase.delete("medicines", "id = ?", arrayOf(item.id))
        }
      }
    }
  }
  @Test fun androidDeliversSnoozesForBothTypesAndModes() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val manager = context.getSystemService(NotificationManager::class.java)
    assertTrue(ReminderScheduler.enabled(context))
    for (type in listOf("medicine", "reminder")) for (mode in listOf("notification", "alarm")) {
      val now = System.currentTimeMillis()
      val time = LocalTime.now().plusHours(2).format(DateTimeFormatter.ofPattern("HH:mm"))
      val item = MedicineRepository(context).use { it.save("Delivery $type $mode", "", listOf(time), now - 10000, type, mode) }
      val due = now - 1000
      val notificationId = ("${item.id}:$due").hashCode()
      try {
        MedicineRepository(context).use { it.setAlarm(item.id, due, "delivery-test") }
        ReminderScheduler.deliver(context, item.id, due, "delivery-test")
        assertTrue(ReminderScheduler.snooze(context, item.id, due, 5))
        // Accelerate the persisted snooze, then let Android deliver the registered alarm.
        MedicineRepository(context).use { it.writableDatabase.execSQL("UPDATE snoozes SET alert_at = ? WHERE medicine_id = ?", arrayOf(System.currentTimeMillis() + 2000, item.id)) }
        ReminderScheduler.rebuild(context)
        repeat(100) {
          if (manager.activeNotifications.none { it.id == notificationId }) Thread.sleep(100)
        }
        assertTrue("Android should deliver the snoozed notification", manager.activeNotifications.any { it.id == notificationId })
        assertNull(MedicineRepository(context).use { it.snooze(item.id, due) })
        assertEquals(1, MedicineRepository(context).use { it.occurrences().count { occurrence -> occurrence.medicineId == item.id && occurrence.at == due } })
        ReminderScheduler.recordOutcome(context, item.id, due, "skipped")
      } finally {
        runCatching { ReminderScheduler.recordOutcome(context, item.id, due, "skipped") }
        manager.cancel(notificationId)
        context.stopService(Intent(context, AlarmSoundService::class.java))
        MedicineRepository(context).use { repo ->
          repo.alarm(item.id)?.let { cancel(context, it) }
          repo.writableDatabase.delete("snoozes", "medicine_id = ?", arrayOf(item.id))
          repo.writableDatabase.delete("alarms", "medicine_id = ?", arrayOf(item.id))
          repo.writableDatabase.delete("doses", "medicine_id = ?", arrayOf(item.id))
          repo.writableDatabase.delete("occurrence_tracking", "medicine_id = ?", arrayOf(item.id))
          repo.writableDatabase.delete("medicines", "id = ?", arrayOf(item.id))
        }
      }
    }
  }
  @Test fun reconciliationRecoversAnInterruptedOverdueSnooze() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val now = System.currentTimeMillis()
    val time = LocalTime.now().plusHours(2).format(DateTimeFormatter.ofPattern("HH:mm"))
    val item = MedicineRepository(context).use { it.save("Interrupted snooze", "", listOf(time), now - 10000, "reminder") }
    val due = now - 1000
    try {
      MedicineRepository(context).use { repo ->
        repo.recordDue(item.id, due)
        repo.setOutstanding(item.id, due, true)
        assertTrue(repo.saveSnooze(MedicineRepository.Snooze(item.id, due, now - 500, "interrupted")))
      }
      ReminderScheduler.rebuild(context)
      val manager = context.getSystemService(NotificationManager::class.java)
      val notificationId = ("${item.id}:$due").hashCode()
      repeat(100) { if (manager.activeNotifications.none { it.id == notificationId }) Thread.sleep(100) }
      assertTrue(manager.activeNotifications.any { it.id == notificationId })
      assertNull(MedicineRepository(context).use { it.snooze(item.id, due) })
      ReminderScheduler.recordOutcome(context, item.id, due, "skipped")
    } finally {
      MedicineRepository(context).use { repo ->
        repo.alarm(item.id)?.let { cancel(context, it) }
        repo.writableDatabase.delete("snoozes", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("alarms", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("doses", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("occurrence_tracking", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("medicines", "id = ?", arrayOf(item.id))
      }
    }
  }
  private fun cancel(context: Context, alarm: MedicineRepository.Alarm) {
    val manager = context.getSystemService(AlarmManager::class.java)
    listOf(ReminderReceiver::class.java to "medicine", ReminderWatchdogReceiver::class.java to "watchdog").forEach { (receiver, path) ->
      val intent = Intent(context, receiver).setData(Uri.parse("myreminders://$path/${alarm.medicineId}/${alarm.token}"))
      PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE)?.let {
        manager.cancel(it)
        it.cancel()
      }
    }
  }

  @Test fun androidAndAppLanguageSettingsStayInSync() {
    if (android.os.Build.VERSION.SDK_INT < 33) return
    val context = ApplicationProvider.getApplicationContext<Context>()
    val manager = context.getSystemService(android.app.LocaleManager::class.java)
    try {
      AppLanguage.set(context, "es")
      assertEquals("es", manager.applicationLocales[0].language)
      manager.applicationLocales = android.os.LocaleList.forLanguageTags("en")
      assertEquals("en", AppLanguage.preference(context))
      assertEquals("en", AppLanguage.effective(context))
      AppLanguage.set(context, "system")
      assertTrue(manager.applicationLocales.isEmpty)
      manager.applicationLocales = android.os.LocaleList.forLanguageTags("es")
      assertEquals("es", AppLanguage.preference(context))
    } finally { AppLanguage.set(context, "system") }
  }

  @Test fun languagePreferencePersistsAndSystemFallsBackToEnglish() {
    val base = ApplicationProvider.getApplicationContext<Context>()
    val config = android.content.res.Configuration(base.resources.configuration)
    config.setLocale(java.util.Locale.FRENCH)
    val french = base.createConfigurationContext(config)
    try {
      AppLanguage.set(base, "es")
      assertEquals("es", AppLanguage.preference(french))
      assertEquals("es", AppLanguage.effective(french))
      AppLanguage.set(base, "en")
      assertEquals("en", AppLanguage.effective(french))
      AppLanguage.set(base, "system")
      val systemLanguage = android.content.res.Resources.getSystem().configuration.locales[0].language
      assertEquals(if (systemLanguage == "es") "es" else "en", AppLanguage.effective(french))
    } finally { AppLanguage.set(base, "system") }
  }

  @Test fun directDeliveryUsesLocalizedTextAndActionsForBothTypes() {
    val base = ApplicationProvider.getApplicationContext<Context>()
    val manager = base.getSystemService(NotificationManager::class.java)
    assertTrue(ReminderScheduler.enabled(base))
    for (language in listOf("en", "es")) {
      val config = android.content.res.Configuration(base.resources.configuration)
      config.setLocale(java.util.Locale.forLanguageTag(language))
      val context = base.createConfigurationContext(config)
      for (type in listOf("reminder", "medicine")) {
        AppLanguage.set(context, if (language == "en") "es" else "en")
        val now = System.currentTimeMillis()
        val time = LocalTime.now().plusHours(2).format(DateTimeFormatter.ofPattern("HH:mm"))
        val item = MedicineRepository(context).use { it.save("Personal name", "", listOf(time), now - 10_000, type) }
        val due = now - 1_000
        val notificationId = ("${item.id}:$due").hashCode()
        try {
          MedicineRepository(context).use { it.setAlarm(item.id, due, "locale-test") }
          val before = MedicineRepository(context).use { repo -> repo.all().first { it.id == item.id } to repo.alarm(item.id) }
          if (android.os.Build.VERSION.SDK_INT >= 33) {
            context.getSystemService(android.app.LocaleManager::class.java).applicationLocales =
              android.os.LocaleList.forLanguageTags(language)
          } else {
            AppLanguage.set(context, language)
          }
          MedicineRepository(context).use { repo ->
            assertEquals(before.first, repo.all().first { it.id == item.id })
            assertEquals(before.second, repo.alarm(item.id))
          }
          ReminderScheduler.deliver(context, item.id, due, "locale-test")
          val notification = requireNotNull(manager.activeNotifications.find { it.id == notificationId }).notification
          val expectedBody = if (language == "en") {
            if (type == "medicine") "Your medicine is due" else "Your reminder is due"
          } else {
            if (type == "medicine") "Es hora de tomar tu medicamento" else "Es hora de tu recordatorio"
          }
          val expectedActions = if (language == "en") {
            listOf(if (type == "medicine") "Taken" else "Done", "Skip", "Snooze 10 minutes")
          } else {
            listOf(if (type == "medicine") "Tomado" else "Hecho", "Omitir", "Posponer 10 minutos")
          }
          assertEquals("Personal name", notification.extras.getCharSequence(Notification.EXTRA_TITLE).toString())
          assertEquals(expectedBody, notification.extras.getCharSequence(Notification.EXTRA_TEXT).toString())
          assertEquals(expectedActions, notification.actions.map { it.title.toString() })
        } finally {
          manager.cancel(notificationId)
          MedicineRepository(context).use { repo ->
            repo.alarm(item.id)?.let { cancel(context, it) }
            repo.writableDatabase.delete("alarms", "medicine_id = ?", arrayOf(item.id))
            repo.writableDatabase.delete("doses", "medicine_id = ?", arrayOf(item.id))
            repo.writableDatabase.delete("medicines", "id = ?", arrayOf(item.id))
          }
        }
      }
    }
    AppLanguage.set(base, "system")
  }
  @Test fun bothTypesRecoverTheirDailyScheduleAndDeliverTheRightText() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    assertTrue("Enable notification and exact-alarm access before this test", ReminderScheduler.enabled(context))
    assertTrue("Run this test only on a disposable installation with no reminders", MedicineRepository(context).use { it.all().isEmpty() })
    val ids = mutableListOf<String>()
    val notificationIds = mutableListOf<Int>()
    val notifications = context.getSystemService(NotificationManager::class.java)
    try {
      listOf("medicine", "reminder").forEach { type ->
        val now = System.currentTimeMillis()
        val time = LocalTime.now().plusHours(2).format(DateTimeFormatter.ofPattern("HH:mm"))
        val item = MedicineRepository(context).use { repo -> repo.save("02b test $type", "", listOf(time), now - 10_000, type) }
        ids.add(item.id)
        ReminderScheduler.schedule(context, item)
        val original = MedicineRepository(context).use { it.alarm(item.id) }
        assertNotNull(original)
        assertTrue(original!!.registered)
        // A fresh repository and a recovery rebuild model process restart and rescheduling.
        ReminderScheduler.rebuild(context, recovery = true)
        val recovered = MedicineRepository(context).use { it.alarm(item.id) }
        assertNotNull(recovered)
        assertTrue(recovered!!.registered)
        assertTrue(recovered.at > System.currentTimeMillis())
        cancel(context, recovered)
        val due = System.currentTimeMillis() - 1_000
        val token = "02b-test-token"
        MedicineRepository(context).use { it.setAlarm(item.id, due, token) }
        ReminderScheduler.deliver(context, item.id, due, token)
        val notificationId = ("${item.id}:$due").hashCode()
        notificationIds.add(notificationId)
        val notification = notifications.activeNotifications.find { it.id == notificationId }
        assertNotNull(notification)
        val expected = context.getString(if (type == "medicine") R.string.reminder_due else R.string.general_reminder_due)
        assertEquals(expected, notification!!.notification.extras.getCharSequence(Notification.EXTRA_TEXT).toString())
        val next = MedicineRepository(context).use { it.alarm(item.id) }
        assertNotNull(next)
        assertTrue(next!!.registered)
        assertTrue(next.at > System.currentTimeMillis())
        notifications.cancel(notificationId)
      }
    } finally {
      notificationIds.forEach { notifications.cancel(it) }
      MedicineRepository(context).use { repo ->
        ids.forEach { id ->
          repo.alarm(id)?.let { cancel(context, it) }
          repo.writableDatabase.delete("alarms", "medicine_id = ?", arrayOf(id))
          repo.writableDatabase.delete("doses", "medicine_id = ?", arrayOf(id))
          repo.writableDatabase.delete("medicines", "id = ?", arrayOf(id))
        }
      }
    }
  }
  @Test fun overlappingAlarmsShareSoundAndStopWithoutChangingOccurrences() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    assertTrue(ReminderScheduler.enabled(context))
    assertTrue(MedicineRepository(context).use { it.all().isEmpty() })
    val ids = mutableListOf<String>()
    val notificationIds = mutableListOf<Int>()
    val dueTimes = mutableListOf<Long>()
    val scheduledIntents = mutableListOf<PendingIntent>()
    val due = System.currentTimeMillis() + 5000
    val notifications = context.getSystemService(NotificationManager::class.java)
    try {
      listOf("medicine", "reminder", "reminder").forEachIndexed { index, type ->
        val now = System.currentTimeMillis()
        val time = LocalTime.now().plusHours(2).format(DateTimeFormatter.ofPattern("HH:mm"))
        val item = MedicineRepository(context).use { it.save("Alarm test", "", listOf(time), now - 10_000, type, "alarm") }
        ids.add(item.id)
        val at = due + if (index == 2) 1000 else 0
        val token = "test-$index"
        dueTimes.add(at)
        MedicineRepository(context).use { it.setAlarm(item.id, at, token) }
        val intent = Intent(context, ReminderReceiver::class.java)
          .setData(Uri.parse("myreminders://test/${item.id}/$token"))
          .putExtra("medicineId", item.id).putExtra("scheduledAt", at).putExtra("token", token)
        val operation = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        scheduledIntents.add(operation)
        val show = PendingIntent.getActivity(context, 0, Intent(context, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE)
        context.getSystemService(AlarmManager::class.java).setAlarmClock(AlarmManager.AlarmClockInfo(at, show), operation)
        notificationIds.add(("${item.id}:$at").hashCode())
      }
      repeat(150) { if (notificationIds.any { id -> notifications.activeNotifications.none { it.id == id } }) Thread.sleep(100) }
      assertTrue("All scheduled alarms should be delivered", notificationIds.all { id -> notifications.activeNotifications.any { it.id == id } })
      var session: Notification? = null
      repeat(50) {
        if (session == null) { Thread.sleep(100); session = notifications.activeNotifications.find { it.id == 119348 }?.notification }
      }
      assertNotNull("Alarm sound session should be running", session)
      assertEquals(1, notifications.activeNotifications.count { it.id == 119348 })
      val audio = context.getSystemService(android.media.AudioManager::class.java)
      repeat(100) { if (audio.activePlaybackConfigurations.none { it.audioAttributes.usage == android.media.AudioAttributes.USAGE_NOTIFICATION }) Thread.sleep(50) }
      assertTrue("Alarm audio should be playing", audio.activePlaybackConfigurations.any { it.audioAttributes.usage == android.media.AudioAttributes.USAGE_NOTIFICATION })
      assertEquals(context.getString(R.string.stop_sound), session!!.actions.single().title.toString())
      val first = requireNotNull(notifications.activeNotifications.find { it.id == notificationIds[0] }).notification
      first.actions[0].actionIntent.send()
      repeat(50) { if (MedicineRepository(context).use { it.outcome(ids[0], dueTimes[0]) } != "completed") Thread.sleep(50) }
      assertEquals("completed", MedicineRepository(context).use { it.outcome(ids[0], dueTimes[0]) })
      assertNull(MedicineRepository(context).use { it.outcome(ids[1], dueTimes[1]) })
      androidx.test.platform.app.InstrumentationRegistry.getInstrumentation().waitForIdleSync()
      assertTrue("The other occurrence should keep the session running", notifications.activeNotifications.any { it.id == 119348 })
      assertTrue("The other occurrence should keep sound playing", audio.activePlaybackConfigurations.any { it.audioAttributes.usage == android.media.AudioAttributes.USAGE_NOTIFICATION })
      val second = requireNotNull(notifications.activeNotifications.find { it.id == notificationIds[1] }).notification
      second.actions[1].actionIntent.send()
      repeat(50) { if (MedicineRepository(context).use { it.outcome(ids[1], dueTimes[1]) } != "skipped") Thread.sleep(50) }
      assertEquals("skipped", MedicineRepository(context).use { it.outcome(ids[1], dueTimes[1]) })
      androidx.test.platform.app.InstrumentationRegistry.getInstrumentation().waitForIdleSync()
      assertTrue("The remaining occurrence should keep sound playing", audio.activePlaybackConfigurations.any { it.audioAttributes.usage == android.media.AudioAttributes.USAGE_NOTIFICATION })
      // Removing the last occurrence must end the session, proving the earlier actions
      // were processed too. A stale membership would keep the service alive.
      val third = requireNotNull(notifications.activeNotifications.find { it.id == notificationIds[2] }).notification
      third.actions[0].actionIntent.send()
      repeat(100) { if (notifications.activeNotifications.any { it.id == 119348 }) Thread.sleep(50) }
      assertFalse("Acting on all occurrences should end the session", notifications.activeNotifications.any { it.id == 119348 })

      // Start two fresh unresolved occurrences to check the shared Stop sound action.
      listOf("reminder", "medicine").forEachIndexed { index, type ->
        val now = System.currentTimeMillis()
        val item = MedicineRepository(context).use { it.save("Stop test", "", listOf(LocalTime.now().plusHours(2).format(DateTimeFormatter.ofPattern("HH:mm"))), now - 10_000, type, "alarm") }
        ids.add(item.id)
        val stopAt = now - 1000
        dueTimes.add(stopAt)
        notificationIds.add(("${item.id}:$stopAt").hashCode())
        MedicineRepository(context).use { it.setAlarm(item.id, stopAt, "stop-test-$index") }
        ReminderScheduler.deliver(context, item.id, stopAt, "stop-test-$index")
      }
      var stopSession: Notification? = null
      repeat(100) {
        if (stopSession == null) { Thread.sleep(50); stopSession = notifications.activeNotifications.find { it.id == 119348 }?.notification }
      }
      assertNotNull("A fresh session should start", stopSession)
      stopSession!!.actions.single().actionIntent.send()
      repeat(50) {
        if (notifications.activeNotifications.any { it.id == 119348 }) Thread.sleep(100)
      }
      assertFalse(notifications.activeNotifications.any { it.id == 119348 })
      repeat(50) { if (audio.activePlaybackConfigurations.any { it.audioAttributes.usage == android.media.AudioAttributes.USAGE_NOTIFICATION }) Thread.sleep(100) }
      assertFalse("Alarm audio should stop", audio.activePlaybackConfigurations.any { it.audioAttributes.usage == android.media.AudioAttributes.USAGE_NOTIFICATION })
      listOf(3, 4).forEach { index ->
        assertNull(MedicineRepository(context).use { it.outcome(ids[index], dueTimes[index]) })
        assertTrue(notifications.activeNotifications.any { it.id == notificationIds[index] })
      }
      MedicineRepository(context).use { repo ->
        assertEquals(5, repo.todayDoses(0, System.currentTimeMillis() + 1000).count { it.first in ids })
      }
    } finally {
      scheduledIntents.forEach { context.getSystemService(AlarmManager::class.java).cancel(it); it.cancel() }
      context.stopService(Intent(context, AlarmSoundService::class.java))
      notificationIds.forEach { notifications.cancel(it) }
      MedicineRepository(context).use { repo -> ids.forEach { id ->
        repo.alarm(id)?.let { cancel(context, it) }
        repo.writableDatabase.delete("alarms", "medicine_id = ?", arrayOf(id))
        repo.writableDatabase.delete("doses", "medicine_id = ?", arrayOf(id))
        repo.writableDatabase.delete("medicines", "id = ?", arrayOf(id))
      } }
    }
  }
  @Test fun closeOnTheLockScreenKeepsTheScheduledAlarmUnanswered() {
    val instrumentation = androidx.test.platform.app.InstrumentationRegistry.getInstrumentation()
    val context = ApplicationProvider.getApplicationContext<Context>()
    val notifications = context.getSystemService(NotificationManager::class.java)
    val keyguard = context.getSystemService(android.app.KeyguardManager::class.java)
    val power = context.getSystemService(android.os.PowerManager::class.java)
    val automation = instrumentation.uiAutomation
    fun press(key: String) = automation.executeShellCommand("input keyevent $key").use {
      android.os.ParcelFileDescriptor.AutoCloseInputStream(it).readBytes()
    }

    assertTrue(ReminderScheduler.enabled(context))
    assertTrue(MedicineRepository(context).use { it.all().isEmpty() })
    if (android.os.Build.VERSION.SDK_INT >= 34) {
      assertTrue("Enable full-screen access on the disposable emulator", notifications.canUseFullScreenIntent())
    }
    val now = System.currentTimeMillis()
    val candidate = java.time.ZonedDateTime.now().plusMinutes(1).withSecond(0).withNano(0)
    val due = if (candidate.toInstant().toEpochMilli() - now < 10_000) candidate.plusMinutes(1) else candidate
    val at = due.toInstant().toEpochMilli()
    val time = due.toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm"))
    val item = MedicineRepository(context).use {
      it.save("Private medicine name", "Private dosage instructions", listOf(time), now, "medicine", "alarm")
    }
    val notificationId = ("${item.id}:$at").hashCode()
    val language = AppLanguage.preference(context)
    try {
      AppLanguage.set(context, "es")
      ReminderScheduler.notify(context, "Earlier notification", "Already delivered", notificationId xor Int.MIN_VALUE)
      ReminderScheduler.schedule(context, item)
      press("KEYCODE_SLEEP")
      repeat(30) { if (power.isInteractive) Thread.sleep(100) }
      assertFalse("The display should be off before delivery", power.isInteractive)
      val deadline = at + 15_000
      var screen = automation.rootInActiveWindow
      while (screen?.findAccessibilityNodeInfosByText("Cerrar").isNullOrEmpty() && System.currentTimeMillis() < deadline) {
        Thread.sleep(200)
        screen = automation.rootInActiveWindow
      }
      val alarm = requireNotNull(screen)
      assertEquals(context.packageName, alarm.packageName.toString())
      assertTrue("The phone should remain locked", keyguard.isKeyguardLocked)
      assertTrue(alarm.findAccessibilityNodeInfosByText("Recordatorio pendiente").isNotEmpty())
      assertTrue(alarm.findAccessibilityNodeInfosByText(item.name).isEmpty())
      assertTrue(alarm.findAccessibilityNodeInfosByText(item.instructions).isEmpty())
      val close = alarm.findAccessibilityNodeInfosByText("Cerrar").single()
      assertTrue(notifications.activeNotifications.any { it.id == 119348 })
      assertTrue(close.performAction(android.view.accessibility.AccessibilityNodeInfo.ACTION_CLICK))
      repeat(50) { if (notifications.activeNotifications.any { it.id == 119348 }) Thread.sleep(100) }
      assertFalse(notifications.activeNotifications.any { it.id == 119348 })
      assertTrue(notifications.activeNotifications.any { it.id == notificationId })
      repeat(30) { if (automation.rootInActiveWindow?.packageName == context.packageName) Thread.sleep(100) }
      assertNotEquals("Close should dismiss the Alarm screen", context.packageName, automation.rootInActiveWindow?.packageName?.toString())
      assertTrue(keyguard.isKeyguardLocked)
      val occurrence = MedicineRepository(context).use { repo -> repo.occurrences().single { it.medicineId == item.id && it.at == at } }
      assertTrue(occurrence.outstanding)
      assertNull(occurrence.outcome)
    } finally {
      press("KEYCODE_WAKEUP")
      press("KEYCODE_MENU")
      AppLanguage.set(context, language)
      notifications.cancel(notificationId xor Int.MIN_VALUE)
      context.stopService(Intent(context, AlarmSoundService::class.java))
      notifications.cancel(notificationId)
      MedicineRepository(context).use { repo ->
        repo.alarm(item.id)?.let { cancel(context, it) }
        repo.writableDatabase.delete("alarms", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("doses", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("occurrence_tracking", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("medicines", "id = ?", arrayOf(item.id))
      }
    }
  }

  @Test fun nextScheduledOccurrenceSupersedesTheSoundingOccurrence() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val notifications = context.getSystemService(NotificationManager::class.java)
    assertTrue(ReminderScheduler.enabled(context))
    assertTrue(MedicineRepository(context).use { it.all().isEmpty() })
    val now = System.currentTimeMillis()
    val candidate = java.time.ZonedDateTime.now().plusMinutes(1).withSecond(0).withNano(0)
    val next = if (candidate.toInstant().toEpochMilli() - now < 10_000) candidate.plusMinutes(1) else candidate
    val nextAt = next.toInstant().toEpochMilli()
    val priorAt = now - 1000
    val time = next.toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm"))
    val item = MedicineRepository(context).use { it.save("Supersession test", "", listOf(time), now - 10_000, "reminder", "alarm") }
    val oldNotification = ("${item.id}:$priorAt").hashCode()
    val nextNotification = ("${item.id}:$nextAt").hashCode()
    try {
      MedicineRepository(context).use { it.setAlarm(item.id, priorAt, "supersession-test") }
      // Seed the first due occurrence; the scheduler registers the next with Android.
      ReminderScheduler.deliver(context, item.id, priorAt, "supersession-test")
      repeat(100) { if (notifications.activeNotifications.none { it.id == 119348 }) Thread.sleep(50) }
      assertTrue("The earlier occurrence should be sounding", notifications.activeNotifications.any { it.id == 119348 })
      assertTrue(notifications.activeNotifications.any { it.id == oldNotification })
      repeat(750) { if (notifications.activeNotifications.none { it.id == nextNotification }) Thread.sleep(100) }
      val nextAlert = requireNotNull(notifications.activeNotifications.find { it.id == nextNotification }) { "The next scheduled occurrence was not delivered" }.notification
      assertNotNull("A scheduled Alarm should request full-screen presentation", nextAlert.fullScreenIntent)
      assertEquals("The Alarm notification must allow visual interruptions", Notification.GROUP_ALERT_ALL, nextAlert.groupAlertBehavior)
      val channel = notifications.getNotificationChannel(nextAlert.channelId)
      assertEquals(NotificationManager.IMPORTANCE_HIGH, channel.importance)
      assertNull("The sound session handles Alarm audio", channel.sound)
      assertFalse(channel.shouldVibrate())
      assertEquals("missed", MedicineRepository(context).use { it.outcome(item.id, priorAt) })
      assertNull(MedicineRepository(context).use { it.outcome(item.id, nextAt) })
      assertFalse(notifications.activeNotifications.any { it.id == oldNotification })
      assertTrue("The next occurrence should be sounding", notifications.activeNotifications.any { it.id == 119348 })
      nextAlert.actions[0].actionIntent.send()
      repeat(100) { if (notifications.activeNotifications.any { it.id == 119348 }) Thread.sleep(50) }
      assertFalse("The superseded occurrence must not keep the session alive", notifications.activeNotifications.any { it.id == 119348 })
      assertEquals("completed", MedicineRepository(context).use { it.outcome(item.id, nextAt) })
    } finally {
      context.stopService(Intent(context, AlarmSoundService::class.java))
      notifications.cancel(oldNotification)
      notifications.cancel(nextNotification)
      MedicineRepository(context).use { repo ->
        repo.alarm(item.id)?.let { cancel(context, it) }
        repo.writableDatabase.delete("alarms", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("doses", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("occurrence_tracking", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("medicines", "id = ?", arrayOf(item.id))
      }
    }
  }

}
