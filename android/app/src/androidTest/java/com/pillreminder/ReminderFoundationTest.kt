package com.pillreminder

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
  @Test fun recoveryPreservesOverdueAlarmFromBeforeTrackingBegan() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    assertTrue(ReminderScheduler.enabled(context))
    assertTrue(MedicineRepository(context).use { it.all().isEmpty() })
    val now = System.currentTimeMillis()
    val at = now - 2 * 24 * 60 * 60 * 1000L
    val time = LocalTime.now().minusMinutes(1).format(DateTimeFormatter.ofPattern("HH:mm"))
    val item = MedicineRepository(context).use { repo ->
      val medicine = repo.save("Old alarm", "", listOf(time), at - 10000, "reminder")
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
  @Test fun notificationActionsPersistUndoAndKeepFutureScheduleForBothTypes() {
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
        repeat(50) { if (manager.activeNotifications.find { it.id == notificationId }?.notification?.actions?.singleOrNull()?.title?.toString() != context.getString(R.string.undo)) Thread.sleep(50) }
        val undo = requireNotNull(manager.activeNotifications.find { it.id == notificationId }).notification.actions.single().actionIntent
        assertEquals(future, MedicineRepository(context).use { it.alarm(item.id) })
        undo.send()
        repeat(50) { if (MedicineRepository(context).use { it.outcome(item.id, due) } != null) Thread.sleep(50) }
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
  private fun cancel(context: Context, alarm: MedicineRepository.Alarm) {
    val manager = context.getSystemService(AlarmManager::class.java)
    listOf(ReminderReceiver::class.java to "medicine", ReminderWatchdogReceiver::class.java to "watchdog").forEach { (receiver, path) ->
      val intent = Intent(context, receiver).setData(Uri.parse("pillreminder://$path/${alarm.medicineId}/${alarm.token}"))
      PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE)?.let {
        manager.cancel(it)
        it.cancel()
      }
    }
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
    val notifications = context.getSystemService(NotificationManager::class.java)
    try {
      listOf("medicine", "reminder").forEach { type ->
        val now = System.currentTimeMillis()
        val time = LocalTime.now().plusHours(2).format(DateTimeFormatter.ofPattern("HH:mm"))
        val item = MedicineRepository(context).use { it.save("Alarm test", "", listOf(time), now - 10_000, type, "alarm") }
        ids.add(item.id)
        val due = now - 1000
        MedicineRepository(context).use { it.setAlarm(item.id, due, "test-$type") }
        ReminderScheduler.deliver(context, item.id, due, "test-$type")
        notificationIds.add(("${item.id}:$due").hashCode())
      }
      var session: Notification? = null
      repeat(50) {
        if (session == null) { Thread.sleep(100); session = notifications.activeNotifications.find { it.id == 119348 }?.notification }
      }
      assertNotNull("Alarm sound session should be running", session)
      assertEquals(1, notifications.activeNotifications.count { it.id == 119348 })
      val audio = context.getSystemService(android.media.AudioManager::class.java)
      assertTrue("Alarm audio should be playing", audio.activePlaybackConfigurations.any { it.audioAttributes.usage == android.media.AudioAttributes.USAGE_NOTIFICATION })
      assertEquals(context.getString(R.string.stop_sound), session!!.actions.single().title.toString())
      session!!.actions.single().actionIntent.send()
      repeat(50) {
        if (notifications.activeNotifications.any { it.id == 119348 }) Thread.sleep(100)
      }
      assertFalse(notifications.activeNotifications.any { it.id == 119348 })
      assertFalse("Alarm audio should stop", audio.activePlaybackConfigurations.any { it.audioAttributes.usage == android.media.AudioAttributes.USAGE_NOTIFICATION })
      MedicineRepository(context).use { repo ->
        assertEquals(2, repo.todayDoses(0, System.currentTimeMillis() + 1000).count { it.first in ids })
      }
    } finally {
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
}
