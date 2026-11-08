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
  fun notificationsEnabled(context: Context): Boolean {
    val channel = context.getSystemService(NotificationManager::class.java).getNotificationChannel(CHANNEL)
    return NotificationManagerCompat.from(context).areNotificationsEnabled() && (channel == null || channel.importance != NotificationManager.IMPORTANCE_NONE)
  }
  fun enabled(context: Context): Boolean {
    val alarms = Build.VERSION.SDK_INT < 31 || alarmManager(context).canScheduleExactAlarms()
    return alarms && notificationsEnabled(context)
  }
  fun ensureReconciliation(context: Context) {
    val intent = Intent(context, ReconciliationReceiver::class.java)
    val operation = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    // This is a fallback for interrupted work; actual reminders use exact alarm clocks.
    alarmManager(context).setInexactRepeating(AlarmManager.ELAPSED_REALTIME_WAKEUP,
      android.os.SystemClock.elapsedRealtime() + AlarmManager.INTERVAL_FIFTEEN_MINUTES,
      AlarmManager.INTERVAL_FIFTEEN_MINUTES, operation)
  }
  private fun pending(context: Context, alarm: MedicineRepository.Alarm): PendingIntent {
    val intent = Intent(context, ReminderReceiver::class.java)
      .setData(Uri.parse("pillreminder://medicine/${alarm.medicineId}/${alarm.token}"))
      .putExtra("medicineId", alarm.medicineId).putExtra("scheduledAt", alarm.at).putExtra("token", alarm.token)
    return PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun watchdog(context: Context, alarm: MedicineRepository.Alarm): PendingIntent {
    val intent = Intent(context, ReminderWatchdogReceiver::class.java)
      .setData(Uri.parse("pillreminder://watchdog/${alarm.medicineId}/${alarm.token}"))
      .putExtra("medicineId", alarm.medicineId).putExtra("scheduledAt", alarm.at).putExtra("token", alarm.token)
    return PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun register(context: Context, alarm: MedicineRepository.Alarm) {
    val show = PendingIntent.getActivity(context, 0, Intent(context, MainActivity::class.java), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    // Register recovery first: if delivery is interrupted it can rebuild the next alarm.
    alarmManager(context).setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, maxOf(alarm.at + 60_000, System.currentTimeMillis() + 60_000), watchdog(context, alarm))
    alarmManager(context).setAlarmClock(AlarmManager.AlarmClockInfo(alarm.at, show), pending(context, alarm))
  }

  @Synchronized fun schedule(context: Context, medicine: Medicine, after: Instant = Instant.now()) {
    if (!enabled(context)) return
    MedicineRepository(context).use { repo ->
      val old = repo.alarm(medicine.id)
      if (old != null) {
        if (!old.registered && old.at <= after.toEpochMilli()) {
          repo.invalidateAlarm(medicine.id)
          repo.recordDue(medicine.id, old.at)
        } else {
          if (RecoveryPolicy.shouldRegister(old, after.toEpochMilli())) {
            try {
              register(context, old)
              repo.markAlarmRegistered(medicine.id, old.token)
            } catch (_: SecurityException) { repo.invalidateAlarm(medicine.id) }
          }
          return
        }
      }
      val next = DailySchedule.next(medicine.times, after, ZoneId.systemDefault()).toEpochMilli()
      val alarm = MedicineRepository.Alarm(medicine.id, next, UUID.randomUUID().toString())
      repo.setAlarm(alarm.medicineId, alarm.at, alarm.token)
      try {
        register(context, alarm)
        repo.markAlarmRegistered(medicine.id, alarm.token)
      } catch (_: SecurityException) { repo.invalidateAlarm(medicine.id) }
    }
  }

  @Synchronized fun rebuild(context: Context, recovery: Boolean = false) {
    val available = enabled(context)
    val prefs = context.getSharedPreferences("reminder_access", Context.MODE_PRIVATE)
    val wasAvailable = prefs.getBoolean("enabled", available)
    val boot = android.provider.Settings.Global.getInt(context.contentResolver, android.provider.Settings.Global.BOOT_COUNT, -1)
    val previousBoot = prefs.getInt("boot", boot)
    val invalidate = RecoveryPolicy.shouldInvalidate(recovery, available, wasAvailable, RecoveryPolicy.bootChanged(previousBoot, boot), prefs.getBoolean("recovery_pending", false))
    if (invalidate) prefs.edit().putBoolean("recovery_pending", true).commit()
    MedicineRepository(context).use { repo ->
      val now = Instant.now()
      val zone = ZoneId.systemDefault()
      val medicines = repo.all()
      if (medicines.isNotEmpty()) ensureReconciliation(context)
      medicines.forEach { medicine ->
        if (invalidate) {
          val legacyIntent = Intent(context, ReminderReceiver::class.java).setData(Uri.parse("pillreminder://medicine/${medicine.id}"))
          val legacy = PendingIntent.getBroadcast(context, 0, legacyIntent, PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE)
          if (legacy != null) { alarmManager(context).cancel(legacy); legacy.cancel() }
          repo.alarm(medicine.id)?.let {
            alarmManager(context).cancel(pending(context, it))
            alarmManager(context).cancel(watchdog(context, it))
          }
          repo.invalidateAlarm(medicine.id)
        }
        DailySchedule.dueToday(medicine.times, Instant.ofEpochMilli(medicine.createdAt), now, zone).forEach { due ->
          repo.recordDue(medicine.id, due.toEpochMilli())
        }
        if (available) schedule(context, medicine, now)
      }
    }
    prefs.edit().putBoolean("enabled", available).putInt("boot", boot).putBoolean("recovery_pending", false).commit()
  }

  private fun recoveryPending(context: Context): Boolean {
    val prefs = context.getSharedPreferences("reminder_access", Context.MODE_PRIVATE)
    val boot = android.provider.Settings.Global.getInt(context.contentResolver, android.provider.Settings.Global.BOOT_COUNT, -1)
    return prefs.getBoolean("recovery_pending", false) ||
      !prefs.getBoolean("enabled", enabled(context)) ||
      RecoveryPolicy.bootChanged(prefs.getInt("boot", boot), boot)
  }

  @Synchronized fun deliver(context: Context, id: String, at: Long, token: String) {
    if (!enabled(context) || recoveryPending(context)) { rebuild(context, recovery = true); return }
    val now = System.currentTimeMillis()
    MedicineRepository(context).use { repo ->
      val medicine = repo.all().find { it.id == id } ?: return
      val active = repo.alarm(id)
      if (active != null && active.at == at && active.token == token && at <= now) {
        val following = DailySchedule.next(medicine.times, Instant.ofEpochMilli(at), ZoneId.systemDefault())
        if (!following.isAfter(Instant.ofEpochMilli(now))) {
          repo.invalidateAlarm(id)
          DailySchedule.dueToday(medicine.times, Instant.ofEpochMilli(medicine.createdAt), Instant.ofEpochMilli(now), ZoneId.systemDefault()).forEach { due -> repo.recordDue(id, due.toEpochMilli()) }
          schedule(context, medicine, Instant.ofEpochMilli(now))
          return
        }
      }
      if (at <= now && at > medicine.createdAt && repo.claimAlarm(id, at, token)) {
        notify(context, medicine.name, medicine.instructions.takeIf { medicine.type == "medicine" && it.isNotBlank() } ?: context.getString(if (medicine.type == "medicine") R.string.reminder_due else R.string.general_reminder_due), ("$id:$at").hashCode())
        schedule(context, medicine)
      }
    }
  }
  @Synchronized fun recoverInterruptedDelivery(context: Context, id: String, at: Long, token: String) {
    if (!enabled(context) || recoveryPending(context)) { rebuild(context, recovery = true); return }
    if (at > System.currentTimeMillis()) return
    MedicineRepository(context).use { repo ->
      val current = repo.alarm(id)
      if (current != null && !RecoveryPolicy.shouldRetry(current, at, token)) {
        if (current.registered) return
      }
      val medicine = repo.all().find { it.id == id } ?: return
      if (current != null) {
        if (!current.registered && current.at <= System.currentTimeMillis()) {
          repo.invalidateAlarm(id)
          repo.recordDue(id, current.at)
          schedule(context, medicine)
          return
        }
        if (RecoveryPolicy.shouldRetry(current, at, token)) {
          if (!enabled(context)) { rebuild(context); return }
          val now = Instant.now()
          val following = DailySchedule.next(medicine.times, Instant.ofEpochMilli(at), ZoneId.systemDefault())
          if (!following.isAfter(now)) {
            repo.invalidateAlarm(id)
            DailySchedule.dueToday(medicine.times, Instant.ofEpochMilli(medicine.createdAt), now, ZoneId.systemDefault()).forEach { due ->
              repo.recordDue(id, due.toEpochMilli())
            }
            schedule(context, medicine, now)
            return
          }
          try {
            register(context, current)
            repo.markAlarmRegistered(id, current.token)
          } catch (_: SecurityException) { repo.invalidateAlarm(id) }
        } else {
          schedule(context, medicine)
        }
        return
      }
      val now = Instant.now()
      DailySchedule.dueToday(medicine.times, Instant.ofEpochMilli(medicine.createdAt), now, ZoneId.systemDefault()).forEach { due ->
        repo.recordDue(id, due.toEpochMilli())
      }
      schedule(context, medicine, now)
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
    val token = intent.getStringExtra("token")
    if (token == null) {
      val exists = MedicineRepository(context).use { it.alarm(id) != null }
      if (!exists) ReminderScheduler.rebuild(context, recovery = true)
      return
    }
    ReminderScheduler.deliver(context, id, intent.getLongExtra("scheduledAt", 0), token)
  }
}
class RecoveryReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val allowed = setOf(Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_USER_UNLOCKED, Intent.ACTION_TIME_CHANGED,
      Intent.ACTION_TIMEZONE_CHANGED, Intent.ACTION_MY_PACKAGE_REPLACED, AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED)
    if (intent.action in allowed) ReminderScheduler.rebuild(context, recovery = true)
  }
}

class ReminderWatchdogReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val id = intent.getStringExtra("medicineId") ?: return
    val token = intent.getStringExtra("token") ?: return
    ReminderScheduler.recoverInterruptedDelivery(context, id, intent.getLongExtra("scheduledAt", 0), token)
  }
}

class ReconciliationReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) { ReminderScheduler.rebuild(context) }
}
