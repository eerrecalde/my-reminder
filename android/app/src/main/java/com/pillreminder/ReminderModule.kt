package com.pillreminder

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager
import java.util.Locale

class ReminderModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), LifecycleEventListener {
  init { reactContext.addLifecycleEventListener(this) }
  override fun getName() = "ReminderRepository"
  override fun onHostResume() { ReminderScheduler.rebuild(reactContext) }
  override fun onHostPause() = Unit
  override fun onHostDestroy() = Unit

  @ReactMethod fun state(promise: Promise) {
    try {
      ReminderScheduler.rebuild(reactContext)
      val result = Arguments.createMap()
      result.putBoolean("enabled", ReminderScheduler.enabled(reactContext))
      result.putBoolean("exactAlarms", Build.VERSION.SDK_INT < 31 || reactContext.getSystemService(android.app.AlarmManager::class.java).canScheduleExactAlarms())
      result.putBoolean("notifications", ReminderScheduler.notificationsEnabled(reactContext))
      result.putString("language", if (Locale.getDefault().language == "es") "es" else "en")
      val medicines = Arguments.createArray()
      MedicineRepository(reactContext).use { repo -> repo.all().forEach { medicine ->
        medicines.pushMap(Arguments.createMap().apply {
          putString("id", medicine.id); putString("type", medicine.type); putString("mode", medicine.mode); putString("name", medicine.name); putString("instructions", medicine.instructions)
          putArray("times", Arguments.createArray().apply { medicine.times.forEach { pushString(it) } })
        })
      } }
      result.putArray("medicines", medicines)
      val today = java.time.LocalDate.now()
      val zone = java.time.ZoneId.systemDefault()
      val end = today.plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli()
      val doses = Arguments.createArray()
      val history = Arguments.createArray()
      val upcoming = Arguments.createArray()
      MedicineRepository(reactContext).use { repo ->
        val now = java.time.Instant.now()
        val medicinesById = repo.all().associateBy { it.id }
        repo.occurrences(includeCleared = true).forEach { occurrence ->
          fun occurrenceMap() = Arguments.createMap().apply {
            putString("medicineId", occurrence.medicineId); putDouble("scheduledAt", occurrence.at.toDouble()); putString("outcome", occurrence.outcome); putBoolean("outstanding", occurrence.outstanding); putBoolean("snoozed", repo.snooze(occurrence.medicineId, occurrence.at) != null)
          }
          val medicine = medicinesById[occurrence.medicineId]
          if (TodayPolicy.includes(occurrence, medicine, now, zone)) doses.pushMap(occurrenceMap())
          if (!occurrence.cleared && occurrence.outcome != null) history.pushMap(occurrenceMap())
        }
        medicinesById.values.forEach { medicine ->
          var next = DailySchedule.next(medicine.times, now, zone)
          // Include the next occurrence even when it is tomorrow, plus all of today's upcoming occurrences.
          do {
            upcoming.pushMap(Arguments.createMap().apply { putString("medicineId", medicine.id); putDouble("scheduledAt", next.toEpochMilli().toDouble()) })
            next = DailySchedule.next(medicine.times, next, zone)
          } while (next.toEpochMilli() < end)
        }
      }
      result.putArray("todayDoses", doses)
      result.putArray("history", history)
      result.putArray("upcoming", upcoming)
      promise.resolve(result)
    } catch (error: Exception) { promise.reject("state_failed", error) }
  }
  @ReactMethod fun snooze(id: String, at: Double, minutes: Int, promise: Promise) {
    try { check(ReminderScheduler.snooze(reactContext, id, at.toLong(), minutes)) { "Unable to snooze occurrence" }; promise.resolve(null) }
    catch (error: Exception) { promise.reject("snooze_failed", error) }
  }
  @ReactMethod fun setOutcome(id: String, at: Double, outcome: String?, promise: Promise) {
    try {
      val result = requireNotNull(ReminderScheduler.recordOutcome(reactContext, id, at.toLong(), outcome))
      promise.resolve(Arguments.createMap().apply { putString("previous", result.previous); putDouble("revision", result.revision.toDouble()); putBoolean("previousCleared", result.previousCleared); putBoolean("changed", result.changed) })
    }
    catch (error: Exception) { promise.reject("outcome_failed", error) }
  }
  @ReactMethod fun undoOutcome(id: String, at: Double, previous: String?, revision: Double, previousCleared: Boolean, promise: Promise) {
    try {
      check(ReminderScheduler.undoOutcome(reactContext, id, at.toLong(), previous, revision.toLong(), previousCleared)) { "Occurrence changed since this action" }
      promise.resolve(null)
    } catch (error: Exception) { promise.reject("undo_failed", error) }
  }
  @ReactMethod fun clearHistory(promise: Promise) {
    try { MedicineRepository(reactContext).use { it.clearHistory() }; promise.resolve(null) }
    catch (error: Exception) { promise.reject("history_failed", error) }
  }
  @ReactMethod fun save(name: String, instructions: String, times: ReadableArray, promise: Promise) {
    saveWithMode("medicine", name, instructions, times, "notification", promise)
  }
  @ReactMethod fun saveTyped(type: String, name: String, instructions: String, times: ReadableArray, mode: String, promise: Promise) {
    saveWithMode(type, name, instructions, times, mode, promise)
  }
  private fun saveWithMode(type: String, name: String, instructions: String, times: ReadableArray, mode: String, promise: Promise) {
    try {
      val clockTimes = (0 until times.size()).map { requireNotNull(times.getString(it)) }
      ReminderScheduler.rebuild(reactContext)
      ReminderScheduler.ensureReconciliation(reactContext)
      MedicineRepository(reactContext).use { repo ->
        val medicine = repo.save(name, instructions, clockTimes, System.currentTimeMillis(), type, mode)
        ReminderScheduler.schedule(reactContext, medicine)
      }
      promise.resolve(null)
    } catch (error: Exception) { promise.reject("save_failed", error) }
  }
  @ReactMethod fun openAlarmSettings() {
    if (Build.VERSION.SDK_INT >= 31) {
      reactContext.startActivity(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${reactContext.packageName}")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
  }
  @ReactMethod fun openNotificationSettings() {
    val manager = reactContext.getSystemService(android.app.NotificationManager::class.java)
    val channel = manager.getNotificationChannel("medicine_reminders")
    val intent = if (channel != null && channel.importance == android.app.NotificationManager.IMPORTANCE_NONE) {
      Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_CHANNEL_ID, "medicine_reminders")
    } else Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
    reactContext.startActivity(intent.putExtra(Settings.EXTRA_APP_PACKAGE, reactContext.packageName).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
  }
  @ReactMethod fun selectTime(time: String, promise: Promise) {
    val current = try { java.time.LocalTime.parse(time) } catch (error: Exception) { promise.reject("invalid_time", error); return }
    reactContext.runOnUiQueueThread {
      val activity = reactContext.currentActivity
      if (activity == null) { promise.reject("no_activity", "No activity is available"); return@runOnUiQueueThread }
      val dialog = android.app.TimePickerDialog(activity, { _, hour, minute ->
        promise.resolve(String.format(Locale.ROOT, "%02d:%02d", hour, minute))
      }, current.hour, current.minute, android.text.format.DateFormat.is24HourFormat(activity))
      dialog.setOnCancelListener { promise.resolve(null) }
      dialog.show()
    }
  }
  @ReactMethod fun testReminder() {
    ReminderScheduler.notify(reactContext, reactContext.getString(R.string.test_reminder), reactContext.getString(R.string.test_reminder_body), 0)
  }
}
class ReminderPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(ReminderModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
