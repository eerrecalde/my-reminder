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
  private fun notificationId(id: String, at: Long) = ("$id:$at").hashCode()
  private fun dismissOccurrence(context: Context, id: String, at: Long) {
    cancelSnooze(context, id, at)
    MedicineRepository(context).use { it.setOutstanding(id, at, false) }
    NotificationManagerCompat.from(context).cancel(notificationId(id, at))
    AlarmSoundService.stopOccurrence(context, id, at)
  }

  private fun snoozeIntent(context: Context, item: MedicineRepository.Snooze, watchdog: Boolean = false): PendingIntent {
    val intent = Intent(context, SnoozeReceiver::class.java)
      .setData(Uri.parse("pillreminder://${if (watchdog) "snooze-watchdog" else "snooze"}/${item.medicineId}/${item.at}/${item.token}"))
      .putExtra("id", item.medicineId).putExtra("at", item.at).putExtra("token", item.token)
    return PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }
  private fun registerSnooze(context: Context, item: MedicineRepository.Snooze) {
    val show = PendingIntent.getActivity(context, 0, Intent(context, MainActivity::class.java), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    alarmManager(context).setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, maxOf(item.alertAt + 60_000, System.currentTimeMillis() + 60_000), snoozeIntent(context, item, true))
    alarmManager(context).setAlarmClock(AlarmManager.AlarmClockInfo(item.alertAt, show), snoozeIntent(context, item))
  }
  private fun cancelSnooze(context: Context, id: String, at: Long) {
    MedicineRepository(context).use { repo ->
      repo.snooze(id, at)?.let { item ->
        listOf(false, true).forEach { watchdog ->
          val operation = snoozeIntent(context, item, watchdog)
          alarmManager(context).cancel(operation)
          operation.cancel()
        }
      }
      repo.removeSnooze(id, at)
    }
  }
  @Synchronized fun snooze(context: Context, id: String, at: Long, minutes: Int): Boolean {
    require(minutes in listOf(5, 10, 15))
    if (!enabled(context)) return false
    val item = MedicineRepository.Snooze(id, at, System.currentTimeMillis() + minutes * 60_000L, UUID.randomUUID().toString())
    MedicineRepository(context).use { repo ->
      val medicine = repo.all().find { it.id == id } ?: return false
      val occurrence = repo.occurrences().find { it.medicineId == id && it.at == at } ?: return false
      if (!occurrence.outstanding || occurrence.outcome != null || (DailySchedule.next(medicine, Instant.ofEpochMilli(maxOf(at, medicine.changedAt)), ZoneId.systemDefault())?.let { it <= Instant.now() } == true)) return false
      if (!repo.saveSnooze(item)) return true
      try { registerSnooze(context, item) }
      catch (_: SecurityException) { repo.removeSnooze(id, at); return false }
    }
    NotificationManagerCompat.from(context).cancel(notificationId(id, at))
    AlarmSoundService.stopOccurrence(context, id, at)
    return true
  }
  @Synchronized fun deliverSnooze(context: Context, id: String, at: Long, token: String) {
    MedicineRepository(context).use { repo ->
      val item = repo.snooze(id, at) ?: return
      if (item.token != token || item.alertAt > System.currentTimeMillis()) return
      val medicine = repo.all().find { it.id == id }
      val occurrence = repo.occurrences().find { it.medicineId == id && it.at == at }
      if (medicine == null || medicine.status != "active" || occurrence == null || !enabled(context) || recoveryPending(context) || occurrence.outcome != null || (DailySchedule.next(medicine, Instant.ofEpochMilli(maxOf(at, medicine.changedAt)), ZoneId.systemDefault())?.let { it <= Instant.now() } == true)) {
        cancelSnooze(context, id, at)
        return
      }
      val original = medicine.copy(name = occurrence.name ?: medicine.name, instructions = occurrence.instructions ?: medicine.instructions, type = occurrence.type ?: medicine.type, mode = occurrence.mode ?: medicine.mode)
      notifyOccurrence(context, original, at)
      if (original.mode == "alarm") AlarmSoundService.start(context, id, at)
      cancelSnooze(context, id, at)
    }
  }

  private fun reconcileOccurrences(context: Context, repo: MedicineRepository, medicine: Medicine, now: Instant, zone: ZoneId) {
    var cursor = Instant.ofEpochMilli(maxOf(repo.latestOccurrence(medicine.id) ?: medicine.createdAt, repo.trackingStart(medicine.id)))
    while (true) {
      val next = DailySchedule.next(medicine, cursor, zone) ?: break
      if (next > now) break
      repo.recordDue(medicine.id, next.toEpochMilli())
      cursor = next
    }
    repo.occurrences().filter { it.medicineId == medicine.id && it.outcome == null }.forEach { occurrence ->
      val next = DailySchedule.next(medicine, Instant.ofEpochMilli(maxOf(occurrence.at, medicine.changedAt)), zone)
      if (next != null && next <= now && repo.markMissed(medicine.id, occurrence.at)) {
        dismissOccurrence(context, medicine.id, occurrence.at)
      }
    }
  }
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
    if (!enabled(context) || medicine.status != "active") return
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
      val next = DailySchedule.next(medicine, after, ZoneId.systemDefault())?.toEpochMilli() ?: return
      val alarm = MedicineRepository.Alarm(medicine.id, next, UUID.randomUUID().toString())
      repo.setAlarm(alarm.medicineId, alarm.at, alarm.token)
      try {
        register(context, alarm)
        repo.markAlarmRegistered(medicine.id, alarm.token)
      } catch (_: SecurityException) { repo.invalidateAlarm(medicine.id) }
    }
  }

  private fun transitionWatchdog(context: Context, id: String): PendingIntent {
    val intent = Intent(context, TransitionReceiver::class.java).setData(Uri.parse("pillreminder://transition/$id"))
    return PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun beginTransition(context: Context, repo: MedicineRepository, id: String) {
    repo.beginTransition(id)
    ensureReconciliation(context)
    if (enabled(context)) {
      try { alarmManager(context).setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, System.currentTimeMillis() + 60_000, transitionWatchdog(context, id)) }
      catch (_: SecurityException) { }
    }
  }

  private fun finishTransition(context: Context, repo: MedicineRepository, transition: MedicineRepository.Transition) {
    if (transition.committed && transition.at != null && transition.token != null) {
      val old = MedicineRepository.Alarm(transition.medicineId, transition.at, transition.token, transition.registered)
      listOf(pending(context, old), watchdog(context, old)).forEach { operation ->
        alarmManager(context).cancel(operation); operation.cancel()
      }
    }
    repo.finishTransition(transition.medicineId)
    val repair = transitionWatchdog(context, transition.medicineId)
    alarmManager(context).cancel(repair); repair.cancel()
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
      val transitions = repo.transitions()
      if (medicines.isNotEmpty()) ensureReconciliation(context)
      repo.snoozes().forEach { item ->
        if (available && (item.alertAt > now.toEpochMilli() || !invalidate)) {
          try { registerSnooze(context, item) } catch (_: SecurityException) { cancelSnooze(context, item.medicineId, item.at) }
        } else if (item.alertAt <= now.toEpochMilli() && invalidate) cancelSnooze(context, item.medicineId, item.at)
      }
      medicines.filter { it.status != "active" }.forEach { medicine ->
        cancelFuture(context, repo, medicine.id)
        repo.retainUnconfirmed(medicine.id)
        repo.occurrences(includeCleared = true).filter { it.medicineId == medicine.id }.forEach { dismissOccurrence(context, medicine.id, it.at) }
        repo.snoozes().filter { it.medicineId == medicine.id }.forEach { cancelSnooze(context, medicine.id, it.at) }
      }
      medicines.filter { it.status == "active" }.forEach { medicine ->
        if (invalidate) {
          val legacyIntent = Intent(context, ReminderReceiver::class.java).setData(Uri.parse("pillreminder://medicine/${medicine.id}"))
          val legacy = PendingIntent.getBroadcast(context, 0, legacyIntent, PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE)
          if (legacy != null) { alarmManager(context).cancel(legacy); legacy.cancel() }
          val oldAlarm = repo.alarm(medicine.id)
          oldAlarm?.let {
            alarmManager(context).cancel(pending(context, it))
            alarmManager(context).cancel(watchdog(context, it))
          }
          repo.invalidateAlarm(medicine.id)
          if (oldAlarm != null && oldAlarm.at <= now.toEpochMilli() && oldAlarm.at > medicine.createdAt) repo.recordDue(medicine.id, oldAlarm.at)
        }
        reconcileOccurrences(context, repo, medicine, now, zone)
        if (available) schedule(context, medicine, now)
      }
      transitions.forEach { finishTransition(context, repo, it) }
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
    if (MedicineRepository(context).use { it.transition(id) != null }) rebuild(context)
    val now = System.currentTimeMillis()
    MedicineRepository(context).use { repo ->
      val medicine = repo.all().find { it.id == id && it.status == "active" } ?: return
      reconcileOccurrences(context, repo, medicine, Instant.ofEpochMilli(now), ZoneId.systemDefault())
      val active = repo.alarm(id)
      if (active != null && active.at == at && active.token == token && at <= now) {
        val following = DailySchedule.next(medicine, Instant.ofEpochMilli(at), ZoneId.systemDefault())
        if (following != null && !following.isAfter(Instant.ofEpochMilli(now))) {
          repo.invalidateAlarm(id)
          repo.recordDue(id, at)
          reconcileOccurrences(context, repo, medicine, Instant.ofEpochMilli(now), ZoneId.systemDefault())
          schedule(context, medicine, Instant.ofEpochMilli(now))
          return
        }
      }
      if (at <= now && at > medicine.createdAt && repo.claimAlarm(id, at, token)) {
        repo.setOutstanding(id, at, true)
        notifyOccurrence(context, medicine, at)
        if (medicine.mode == "alarm") AlarmSoundService.start(context, id, at)
        schedule(context, medicine)
      }
    }
  }
  private fun cancelFuture(context: Context, repo: MedicineRepository, id: String) {
    val alarm = repo.alarm(id)
    repo.invalidateAlarm(id)
    if (alarm != null && alarm.at <= System.currentTimeMillis()) repo.recordDue(id, alarm.at)
    alarm?.let {
      listOf(pending(context, it), watchdog(context, it)).forEach { operation ->
        alarmManager(context).cancel(operation); operation.cancel()
      }
    }
  }

  @Synchronized fun edit(context: Context, id: String, name: String, instructions: String, times: List<String>, type: String, mode: String, startDate: String? = null, endDate: String? = null) {
    rebuild(context)
    MedicineRepository(context).use { repo ->
      val old = requireNotNull(repo.all().find { it.id == id && it.status != "deleted" })
      try {
        beginTransition(context, repo, id)
        repo.edit(id, name, instructions, times, type, mode, startDate = startDate, endDate = endDate)
        if (old.status == "active") schedule(context, requireNotNull(repo.all().find { it.id == id }))
        repo.transition(id)?.let { finishTransition(context, repo, it) }
      } catch (error: Exception) {
        rebuild(context)
        throw error
      }
    }
  }

  @Synchronized fun setStatus(context: Context, id: String, status: String) {
    require(status in listOf("active", "paused", "deleted"))
    rebuild(context)
    MedicineRepository(context).use { repo ->
      requireNotNull(repo.all().find { it.id == id && it.status != "deleted" })
      try {
        beginTransition(context, repo, id)
        repo.setStatus(id, status)
        if (status != "active") {
          repo.retainUnconfirmed(id)
          repo.occurrences(includeCleared = true).filter { it.medicineId == id }.forEach { dismissOccurrence(context, id, it.at) }
          repo.snoozes().filter { it.medicineId == id }.forEach { cancelSnooze(context, id, it.at) }
        }
        if (status == "active") schedule(context, requireNotNull(repo.all().find { it.id == id }))
        repo.transition(id)?.let { finishTransition(context, repo, it) }
      } catch (error: Exception) {
        rebuild(context)
        throw error
      }
    }
  }

  @Synchronized fun recordOutcome(context: Context, id: String, at: Long, outcome: String?, onlyUnconfirmed: Boolean = false): MedicineRepository.OutcomeChange? {
    val changed = MedicineRepository(context).use { repo ->
      if (onlyUnconfirmed) {
        if (repo.setOutcomeIfUnconfirmed(id, at, requireNotNull(outcome))) MedicineRepository.OutcomeChange(null, repo.revision(id, at)) else null
      }
      else {
        val medicine = requireNotNull(repo.all().find { it.id == id })
        val next = DailySchedule.next(medicine, Instant.ofEpochMilli(maxOf(at, medicine.changedAt)), ZoneId.systemDefault())
        repo.setOutcome(id, at, outcome, outcome == null && next != null && next <= Instant.now())
      }
    }
    if (changed?.changed == true) dismissOccurrence(context, id, at)
    return changed
  }

  @Synchronized fun undoOutcome(context: Context, id: String, at: Long, previous: String?, revision: Long, previousCleared: Boolean = false): Boolean {
    val undone = MedicineRepository(context).use { repo ->
      val medicine = repo.all().find { it.id == id } ?: return false
      val next = DailySchedule.next(medicine, Instant.ofEpochMilli(maxOf(at, medicine.changedAt)), ZoneId.systemDefault())
      repo.undoOutcome(id, at, revision, previous, previous == null && next != null && next <= Instant.now(), previousCleared)
    }
    if (undone) dismissOccurrence(context, id, at)
    return undone
  }

  @Synchronized fun notificationOutcome(context: Context, id: String, at: Long, outcome: String) {
    if (outcome == "snooze") { snooze(context, id, at, 10); return }
    if (outcome.startsWith("undo_")) {
      val revision = outcome.removePrefix("undo_").toLongOrNull() ?: return
      undoOutcome(context, id, at, null, revision)
      return
    }
    if (outcome !in listOf("completed", "skipped")) return
    val change = recordOutcome(context, id, at, outcome, true) ?: return
    val medicine = MedicineRepository(context).use { repo -> repo.all().find { it.id == id } } ?: return
    val notification = NotificationCompat.Builder(context, CHANNEL).setSmallIcon(android.R.drawable.ic_dialog_info)
      .setContentTitle(medicine.name).setContentText(context.getString(if (outcome == "skipped") R.string.skipped else if (medicine.type == "medicine") R.string.taken else R.string.completed))
      .setSilent(true).setAutoCancel(true).addAction(0, context.getString(R.string.undo), outcomeIntent(context, id, at, "undo_${change.revision}")).build()
    try { NotificationManagerCompat.from(context).notify(notificationId(id, at), notification) } catch (_: SecurityException) { }
  }

  private fun outcomeIntent(context: Context, id: String, at: Long, outcome: String): PendingIntent {
    val intent = Intent(context, OutcomeReceiver::class.java)
      .setData(Uri.parse("pillreminder://outcome/$id/$at/$outcome"))
      .putExtra("id", id).putExtra("at", at).putExtra("outcome", outcome)
    return PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun notifyOccurrence(context: Context, medicine: Medicine, at: Long) {
    val manager = context.getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(NotificationChannel(CHANNEL, context.getString(R.string.reminder_channel), NotificationManager.IMPORTANCE_HIGH).apply { enableVibration(true) })
    val open = PendingIntent.getActivity(context, 0, Intent(context, MainActivity::class.java), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val body = medicine.instructions.takeIf { medicine.type == "medicine" && it.isNotBlank() }
      ?: context.getString(if (medicine.type == "medicine") R.string.reminder_due else R.string.general_reminder_due)
    val notification = NotificationCompat.Builder(context, CHANNEL).setSmallIcon(android.R.drawable.ic_dialog_info)
      .setContentTitle(medicine.name).setContentText(body).setContentIntent(open).setAutoCancel(false)
      .setCategory(NotificationCompat.CATEGORY_REMINDER).setSilent(medicine.mode == "alarm").setPriority(NotificationCompat.PRIORITY_HIGH)
      .addAction(0, context.getString(if (medicine.type == "medicine") R.string.taken else R.string.completed), outcomeIntent(context, medicine.id, at, "completed"))
      .addAction(0, context.getString(R.string.skip), outcomeIntent(context, medicine.id, at, "skipped"))
      .addAction(0, context.getString(R.string.snooze_ten), outcomeIntent(context, medicine.id, at, "snooze"))
      .build()
    try { NotificationManagerCompat.from(context).notify(notificationId(medicine.id, at), notification) } catch (_: SecurityException) { }
  }
  @Synchronized fun recoverInterruptedDelivery(context: Context, id: String, at: Long, token: String) {
    if (MedicineRepository(context).use { it.transition(id) != null }) rebuild(context)
    if (!enabled(context) || recoveryPending(context)) { rebuild(context, recovery = true); return }
    if (at > System.currentTimeMillis()) return
    MedicineRepository(context).use { repo ->
      val current = repo.alarm(id)
      if (current != null && !RecoveryPolicy.shouldRetry(current, at, token)) {
        if (current.registered) return
      }
      val medicine = repo.all().find { it.id == id && it.status == "active" } ?: return
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
          val following = DailySchedule.next(medicine, Instant.ofEpochMilli(at), ZoneId.systemDefault())
          if (following != null && !following.isAfter(now)) {
            repo.invalidateAlarm(id)
            DailySchedule.dueToday(medicine, now, ZoneId.systemDefault()).forEach { due ->
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
      DailySchedule.dueToday(medicine, now, ZoneId.systemDefault()).forEach { due ->
        repo.recordDue(id, due.toEpochMilli())
      }
      schedule(context, medicine, now)
    }
  }
  fun notify(context: Context, title: String, text: String, id: Int, silent: Boolean = false) {
    val manager = context.getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(NotificationChannel(CHANNEL, context.getString(R.string.reminder_channel), NotificationManager.IMPORTANCE_HIGH).apply { enableVibration(true) })
    val open = PendingIntent.getActivity(context, 0, Intent(context, MainActivity::class.java), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val notification = NotificationCompat.Builder(context, CHANNEL).setSmallIcon(android.R.drawable.ic_dialog_info)
      .setContentTitle(title).setContentText(text).setContentIntent(open).setAutoCancel(true).setCategory(NotificationCompat.CATEGORY_REMINDER).setSilent(silent).setPriority(NotificationCompat.PRIORITY_HIGH).build()
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

class OutcomeReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val id = intent.getStringExtra("id") ?: return
    val outcome = intent.getStringExtra("outcome") ?: return
    ReminderScheduler.notificationOutcome(context, id, intent.getLongExtra("at", 0), outcome)
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

class SnoozeReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val id = intent.getStringExtra("id") ?: return
    val token = intent.getStringExtra("token") ?: return
    ReminderScheduler.deliverSnooze(context, id, intent.getLongExtra("at", 0), token)
  }
}

class TransitionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) { ReminderScheduler.rebuild(context) }
}
