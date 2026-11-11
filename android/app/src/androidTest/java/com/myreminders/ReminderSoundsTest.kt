package com.myreminders

import android.app.NotificationManager
import android.content.Context
import android.media.RingtoneManager
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ReminderSoundsTest {
  @Test fun defaultsOverridesSilentAndUnavailableChoicesResolveIndependently() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val notification = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION).toString()
    try {
      ReminderSounds.setDefault(context, "notification", notification)
      ReminderSounds.setDefault(context, "alarm", "")
      assertEquals(notification, ReminderSounds.resolve(context, "notification", null))
      assertEquals("", ReminderSounds.resolve(context, "alarm", null))
      assertEquals("", ReminderSounds.resolve(context, "notification", ""))
      assertEquals(notification, ReminderSounds.resolve(context, "notification", "content://missing.invalid/sound"))
      assertFalse(ReminderSounds.available(context, "content://missing.invalid/sound"))
      ReminderSounds.setDefault(context, "notification", "content://missing.invalid/sound")
      assertNull(ReminderSounds.resolve(context, "notification", null))
    } finally {
      ReminderSounds.setDefault(context, "notification", null)
      ReminderSounds.setDefault(context, "alarm", null)
    }
  }

  @Test fun snoozedNotificationUsesCurrentDefaultOnRedelivery() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val manager = context.getSystemService(NotificationManager::class.java)
    val now = System.currentTimeMillis()
    val time = java.time.LocalTime.now().plusHours(2).format(java.time.format.DateTimeFormatter.ofPattern("HH:mm"))
    val item = MedicineRepository(context).use { it.save("Sound test", "", listOf(time), now - 10000, "reminder") }
    val at = now - 1000
    val notificationId = ("${item.id}:$at").hashCode()
    try {
      ReminderSounds.setDefault(context, "notification", "")
      MedicineRepository(context).use { it.setAlarm(item.id, at, "sound-test") }
      ReminderScheduler.deliver(context, item.id, at, "sound-test")
      repeat(50) { if (manager.activeNotifications.none { it.id == notificationId }) Thread.sleep(50) }
      assertEquals(ReminderSounds.channel(context, ""), manager.activeNotifications.first { it.id == notificationId }.notification.channelId)
      assertTrue(ReminderScheduler.snooze(context, item.id, at, 10))
      ReminderSounds.setDefault(context, "notification", null)
      val token = MedicineRepository(context).use { repo ->
        val snooze = requireNotNull(repo.snooze(item.id, at))
        repo.writableDatabase.execSQL("UPDATE snoozes SET alert_at = ? WHERE medicine_id = ?", arrayOf(now - 1, item.id))
        snooze.token
      }
      ReminderScheduler.deliverSnooze(context, item.id, at, token)
      repeat(50) { if (manager.activeNotifications.none { it.id == notificationId }) Thread.sleep(50) }
      assertEquals("medicine_reminders", manager.activeNotifications.first { it.id == notificationId }.notification.channelId)
    } finally {
      ReminderSounds.setDefault(context, "notification", null)
      ReminderScheduler.setStatus(context, item.id, "deleted")
      manager.cancel(notificationId)
      MedicineRepository(context).use { repo ->
        repo.writableDatabase.delete("doses", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("occurrence_tracking", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("medicines", "id = ?", arrayOf(item.id))
      }
    }
  }

  @Test fun androidAlarmDeliversNotificationUsingSelectedSound() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val manager = context.getSystemService(NotificationManager::class.java)
    val alarms = context.getSystemService(android.app.AlarmManager::class.java)
    val now = System.currentTimeMillis()
    val time = java.time.LocalTime.now().plusHours(2).format(java.time.format.DateTimeFormatter.ofPattern("HH:mm"))
    val item = MedicineRepository(context).use { it.save("Actual sound delivery", "", listOf(time), now - 10000, "medicine", soundChoices = MedicineRepository.SoundChoices("", null)) }
    val at = now + 3000
    val token = "actual-sound-delivery"
    val id = ("${item.id}:$at").hashCode()
    val intent = android.content.Intent(context, ReminderReceiver::class.java).setData(android.net.Uri.parse("myreminders://sound-test/${item.id}"))
      .putExtra("medicineId", item.id).putExtra("scheduledAt", at).putExtra("token", token)
    val operation = android.app.PendingIntent.getBroadcast(context, 0, intent, android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE)
    val show = android.app.PendingIntent.getActivity(context, 0, android.content.Intent(context, MainActivity::class.java), android.app.PendingIntent.FLAG_IMMUTABLE)
    try {
      MedicineRepository(context).use { it.setAlarm(item.id, at, token) }
      alarms.setAlarmClock(android.app.AlarmManager.AlarmClockInfo(at, show), operation)
      repeat(150) { if (manager.activeNotifications.none { it.id == id }) Thread.sleep(100) }
      val notification = requireNotNull(manager.activeNotifications.find { it.id == id }) { "Android did not deliver the scheduled reminder" }
      assertEquals(ReminderSounds.channel(context, ""), notification.notification.channelId)
    } finally {
      alarms.cancel(operation); operation.cancel()
      ReminderScheduler.setStatus(context, item.id, "deleted")
      manager.cancel(id)
      MedicineRepository(context).use { repo ->
        repo.writableDatabase.delete("doses", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("occurrence_tracking", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("reminder_sound_choices", "medicine_id = ?", arrayOf(item.id))
        repo.writableDatabase.delete("medicines", "id = ?", arrayOf(item.id))
      }
    }
  }

  @Test fun overlappingAlarmsKeepTheFirstSilentSound() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val manager = context.getSystemService(NotificationManager::class.java)
    val audio = context.getSystemService(android.media.AudioManager::class.java)
    val now = System.currentTimeMillis()
    val time = java.time.LocalTime.now().plusHours(2).format(java.time.format.DateTimeFormatter.ofPattern("HH:mm"))
    val ids = mutableListOf<String>()
    val notifications = mutableListOf<Int>()
    try {
      listOf("", RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION).toString()).forEachIndexed { index, sound ->
        val item = MedicineRepository(context).use { repo -> repo.save("Sound session $index", "", listOf(time), now - 10000, "reminder", "alarm", soundChoices = MedicineRepository.SoundChoices(null, sound)) }
        ids.add(item.id)
        val at = now - 1000 + index
        val token = "session-$index"
        notifications.add(("${item.id}:$at").hashCode())
        MedicineRepository(context).use { it.setAlarm(item.id, at, token) }
        ReminderScheduler.deliver(context, item.id, at, token)
        repeat(50) { if (manager.activeNotifications.none { it.id == 119348 }) Thread.sleep(50) }
        assertTrue(manager.activeNotifications.any { it.id == 119348 })
      }
      ReminderSounds.setDefault(context, "alarm", RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION).toString())
      Thread.sleep(500)
      assertTrue(manager.activeNotifications.any { it.id == 119348 })
      assertTrue(audio.activePlaybackConfigurations.none { it.audioAttributes.usage == android.media.AudioAttributes.USAGE_NOTIFICATION })
    } finally {
      ReminderSounds.setDefault(context, "alarm", null)
      ids.forEach { ReminderScheduler.setStatus(context, it, "deleted") }
      context.stopService(android.content.Intent(context, AlarmSoundService::class.java))
      notifications.forEach { manager.cancel(it) }
      MedicineRepository(context).use { repo -> ids.forEach { id ->
        repo.writableDatabase.delete("doses", "medicine_id = ?", arrayOf(id))
        repo.writableDatabase.delete("occurrence_tracking", "medicine_id = ?", arrayOf(id))
        repo.writableDatabase.delete("reminder_sound_choices", "medicine_id = ?", arrayOf(id))
        repo.writableDatabase.delete("medicines", "id = ?", arrayOf(id))
      } }
    }
  }

  @Test fun mutedOrLowImportanceChannelsSuppressCustomSounds() {
    val channel = android.app.NotificationChannel("test", "Test", NotificationManager.IMPORTANCE_HIGH)
    channel.setSound(null, null)
    assertFalse(ReminderSounds.channelAllowsSound(channel))
    val quiet = android.app.NotificationChannel("test-low", "Test", NotificationManager.IMPORTANCE_LOW)
    assertFalse(ReminderSounds.channelAllowsSound(quiet))
  }

  @Test fun stricterLegacySettingsCannotBeBypassedBySoundChannels() {
    val legacy = android.app.NotificationChannel("legacy-test", "Test", NotificationManager.IMPORTANCE_DEFAULT).apply { enableVibration(false) }
    val selected = android.app.NotificationChannel("selected-test", "Test", NotificationManager.IMPORTANCE_HIGH).apply { enableVibration(true) }
    assertTrue(ReminderSounds.useLegacyControls(legacy, selected))
    val blocked = android.app.NotificationChannel("blocked-test", "Test", NotificationManager.IMPORTANCE_NONE).apply { enableVibration(true) }
    assertFalse(ReminderSounds.useLegacyControls(legacy, blocked))
  }

  @Test fun customChannelsRetainUserChanges() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val manager = context.getSystemService(NotificationManager::class.java)
    val id = ReminderSounds.channel(context, "")
    try {
      assertNull(manager.getNotificationChannel(id).sound)
      assertEquals(id, ReminderSounds.channel(context, ""))
    } finally { manager.deleteNotificationChannel(id) }
  }
}
