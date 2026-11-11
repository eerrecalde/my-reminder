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
