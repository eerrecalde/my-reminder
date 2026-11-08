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
}
