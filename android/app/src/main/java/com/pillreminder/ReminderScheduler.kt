package com.pillreminder

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import java.time.Instant
import java.time.ZoneId

object ReminderScheduler {
  private const val CHANNEL = "medicine_reminders"
  private fun alarmManager(context: Context) = context.getSystemService(AlarmManager::class.java)
  fun enabled(context: Context): Boolean {
    val alarms = Build.VERSION.SDK_INT < 31 || alarmManager(context).canScheduleExactAlarms()
    val notifications = NotificationManagerCompat.from(context).areNotificationsEnabled()
    val channel = context.getSystemService(NotificationManager::class.java).getNotificationChannel(CHANNEL)
    return alarms && notifications && (channel == null || channel.importance != NotificationManager.IMPORTANCE_NONE)
  }
  private fun pending(context: Context, id: String, at: Long): PendingIntent {
    val intent = Intent(context, ReminderReceiver::class.java).setData(Uri.parse("pillreminder://medicine/$id"))
      .putExtra("medicineId", id).putExtra("scheduledAt", at)
    return PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }
  fun schedule(context: Context, medicine: Medicine, after: Instant = Instant.now()) {
    if (!enabled(context)) return
    val next = DailySchedule.next(medicine.times, after, ZoneId.systemDefault()).toEpochMilli()
    val show = PendingIntent.getActivity(context, 0, Intent(context, MainActivity::class.java), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    try { alarmManager(context).setAlarmClock(AlarmManager.AlarmClockInfo(next, show), pending(context, medicine.id, next)) }
    catch (_: SecurityException) { /* Access may have been revoked since the check. */ }
  }
  fun rebuild(context: Context) {
    MedicineRepository(context).use { repo ->
      val now = Instant.now()
      val zone = ZoneId.systemDefault()
      repo.all().forEach { medicine ->
        DailySchedule.dueToday(medicine.times, Instant.ofEpochMilli(medicine.createdAt), now, zone).forEach { due ->
          repo.recordDue(medicine.id, due.toEpochMilli())
        }
        schedule(context, medicine, now)
      }
    }
  }
  fun notify(context: Context, title: String, text: String, id: Int) {
    val manager = context.getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(NotificationChannel(CHANNEL, context.getString(R.string.reminder_channel), NotificationManager.IMPORTANCE_HIGH).apply { enableVibration(true) })
    val open = PendingIntent.getActivity(context, 0, Intent(context, MainActivity::class.java), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val notification = NotificationCompat.Builder(context, CHANNEL).setSmallIcon(android.R.drawable.ic_dialog_info)
      .setContentTitle(title).setContentText(text).setContentIntent(open).setAutoCancel(true).setPriority(NotificationCompat.PRIORITY_HIGH).build()
    try { NotificationManagerCompat.from(context).notify(id, notification) } catch (_: SecurityException) { }
  }
}

class ReminderReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val id = intent.getStringExtra("medicineId") ?: return
    val at = intent.getLongExtra("scheduledAt", 0)
    val now = System.currentTimeMillis()
    MedicineRepository(context).use { repo ->
      val medicine = repo.all().find { it.id == id } ?: return
      // A recovery rebuild schedules only future reminders.
      if (at > medicine.createdAt && at <= now && ReminderScheduler.enabled(context) && repo.recordDose(id, at)) {
        ReminderScheduler.notify(context, medicine.name, medicine.instructions.ifBlank { context.getString(R.string.reminder_due) }, ("$id:$at").hashCode())
      }
      ReminderScheduler.schedule(context, medicine)
    }
  }
}
class RecoveryReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) { ReminderScheduler.rebuild(context) }
}
