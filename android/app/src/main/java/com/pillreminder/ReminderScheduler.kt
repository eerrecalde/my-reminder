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
import java.util.UUID

object ReminderScheduler {
  private const val CHANNEL = "medicine_reminders"
  private fun alarmManager(context: Context) = context.getSystemService(AlarmManager::class.java)
  fun enabled(context: Context): Boolean {
    val alarms = Build.VERSION.SDK_INT < 31 || alarmManager(context).canScheduleExactAlarms()
    val notifications = NotificationManagerCompat.from(context).areNotificationsEnabled()
    val channel = context.getSystemService(NotificationManager::class.java).getNotificationChannel(CHANNEL)
    return alarms && notifications && (channel == null || channel.importance != NotificationManager.IMPORTANCE_NONE)
  }
  private fun pending(context: Context, alarm: MedicineRepository.Alarm): PendingIntent {
    val intent = Intent(context, ReminderReceiver::class.java)
      .setData(Uri.parse("pillreminder://medicine/${alarm.medicineId}/${alarm.token}"))
      .putExtra("medicineId", alarm.medicineId).putExtra("scheduledAt", alarm.at).putExtra("token", alarm.token)
    return PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  @Synchronized fun schedule(context: Context, medicine: Medicine, after: Instant = Instant.now()) {
    if (!enabled(context)) return
    MedicineRepository(context).use { repo ->
      val old = repo.alarm(medicine.id)
      if (old != null) return // Keep a valid alarm even if its delivery is delayed.
      val next = DailySchedule.next(medicine.times, after, ZoneId.systemDefault()).toEpochMilli()
      val alarm = MedicineRepository.Alarm(medicine.id, next, UUID.randomUUID().toString())
      val show = PendingIntent.getActivity(context, 0, Intent(context, MainActivity::class.java), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      repo.setAlarm(alarm.medicineId, alarm.at, alarm.token)
      try { alarmManager(context).setAlarmClock(AlarmManager.AlarmClockInfo(next, show), pending(context, alarm)) }
      catch (_: SecurityException) { repo.invalidateAlarm(medicine.id) }
    }
  }

  @Synchronized fun rebuild(context: Context, recovery: Boolean = false) {
    val available = enabled(context)
    val prefs = context.getSharedPreferences("reminder_access", Context.MODE_PRIVATE)
    val wasAvailable = prefs.getBoolean("enabled", available)
    val invalidate = recovery || !available || !wasAvailable
    prefs.edit().putBoolean("enabled", available).commit()
    MedicineRepository(context).use { repo ->
      val now = Instant.now()
      val zone = ZoneId.systemDefault()
      repo.all().forEach { medicine ->
        if (invalidate) {
          repo.alarm(medicine.id)?.let { alarmManager(context).cancel(pending(context, it)) }
          repo.invalidateAlarm(medicine.id)
        }
        DailySchedule.dueToday(medicine.times, Instant.ofEpochMilli(medicine.createdAt), now, zone).forEach { due ->
          repo.recordDue(medicine.id, due.toEpochMilli())
        }
        if (available) schedule(context, medicine, now)
      }
    }
  }

  @Synchronized fun deliver(context: Context, id: String, at: Long, token: String) {
    if (!enabled(context)) { rebuild(context); return }
    val now = System.currentTimeMillis()
    MedicineRepository(context).use { repo ->
      val medicine = repo.all().find { it.id == id } ?: return
      if (at <= now && at > medicine.createdAt && repo.claimAlarm(id, at, token)) {
        notify(context, medicine.name, medicine.instructions.ifBlank { context.getString(R.string.reminder_due) }, ("$id:$at").hashCode())
        schedule(context, medicine)
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
    val token = intent.getStringExtra("token") ?: return
    ReminderScheduler.deliver(context, id, intent.getLongExtra("scheduledAt", 0), token)
  }
}
class RecoveryReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) { ReminderScheduler.rebuild(context, recovery = true) }
}
