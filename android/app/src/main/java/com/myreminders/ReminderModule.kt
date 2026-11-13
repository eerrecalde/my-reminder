package com.myreminders

import android.app.NotificationManager
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager
import java.util.Locale

class ReminderModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), LifecycleEventListener {
  private var pickerPromise: Promise? = null
  private val pickerListener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: android.app.Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (requestCode != 21931) return
      val promise = pickerPromise ?: return
      pickerPromise = null
      if (resultCode != android.app.Activity.RESULT_OK || data == null) { promise.resolve(null); return }
      @Suppress("DEPRECATION")
      val uri = data.getParcelableExtra<Uri>(android.media.RingtoneManager.EXTRA_RINGTONE_PICKED_URI)
      if (uri != null && data.flags and Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION != 0) {
        try { reactContext.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) } catch (_: SecurityException) { }
      }
      promise.resolve(uri?.toString() ?: "")
    }
  }
  init { reactContext.addLifecycleEventListener(this); reactContext.addActivityEventListener(pickerListener) }
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
      result.putString("fullScreenAccess", when {
        Build.VERSION.SDK_INT < 34 -> "automatic"
        reactContext.getSystemService(NotificationManager::class.java).canUseFullScreenIntent() -> "allowed"
        else -> "denied"
      })
      result.putBoolean("notifications", ReminderScheduler.notificationsEnabled(reactContext))
      result.putString("language", AppLanguage.effective(reactContext))
      result.putString("languagePreference", AppLanguage.preference(reactContext))
      val medicines = Arguments.createArray()
      MedicineRepository(reactContext).use { repo -> repo.all().filter { it.status != "deleted" }.forEach { medicine ->
        medicines.pushMap(Arguments.createMap().apply {
          putString("notificationSound", repo.soundChoice(medicine.id, "notification")); putString("alarmSound", repo.soundChoice(medicine.id, "alarm"))
          putString("id", medicine.id); putString("status", medicine.status); putString("type", medicine.type); putString("mode", medicine.mode); putString("name", medicine.name); putString("instructions", medicine.instructions)
          putString("startDate", medicine.startDate); putString("endDate", medicine.endDate)
          putString("scheduleKind", medicine.scheduleKind)
          putArray("weekdays", Arguments.createArray().apply { medicine.weekdays.forEach { pushInt(it) } })
          if (medicine.intervalHours == null) putNull("intervalHours") else putInt("intervalHours", medicine.intervalHours)
          if (medicine.intervalAnchor == null) putNull("intervalAnchor") else putDouble("intervalAnchor", medicine.intervalAnchor.toDouble())
          if (medicine.monthlyDay == null) putNull("monthlyDay") else putInt("monthlyDay", medicine.monthlyDay)
          putString("shortMonthPolicy", medicine.shortMonthPolicy)
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
          val medicine = medicinesById[occurrence.medicineId]
          fun occurrenceMap() = Arguments.createMap().apply {
            putString("name", occurrence.name); putString("instructions", occurrence.instructions); putString("type", occurrence.type); putString("medicineId", occurrence.medicineId); putDouble("scheduledAt", occurrence.at.toDouble()); putString("outcome", occurrence.outcome); putBoolean("outstanding", occurrence.outstanding); putBoolean("actionable", TodayPolicy.actionable(occurrence, medicine, now, zone)); putBoolean("snoozed", repo.snooze(occurrence.medicineId, occurrence.at) != null)
          }
          if (TodayPolicy.includes(occurrence, medicine, now, zone)) doses.pushMap(occurrenceMap())
          if (!occurrence.cleared && occurrence.outcome != null) history.pushMap(occurrenceMap())
        }
        medicinesById.values.filter { it.status == "active" }.forEach { medicine ->
          var next = DailySchedule.next(medicine, now, zone)
          while (next != null) {
            val occurrence = next
            upcoming.pushMap(Arguments.createMap().apply { putString("medicineId", medicine.id); putDouble("scheduledAt", occurrence.toEpochMilli().toDouble()) })
            next = DailySchedule.next(medicine, occurrence, zone)
            if (next == null || next.toEpochMilli() >= end) break
          }
        }
      }
      result.putArray("todayDoses", doses)
      result.putArray("history", history)
      result.putArray("upcoming", upcoming)
      promise.resolve(result)
    } catch (error: Exception) { promise.reject("state_failed", error) }
  }
  @ReactMethod fun setLanguage(language: String, promise: Promise) {
    try { AppLanguage.set(reactContext, language); promise.resolve(null) }
    catch (error: Exception) { promise.reject("language_failed", error) }
  }
  @ReactMethod fun soundInfo(choice: String?, promise: Promise) {
    promise.resolve(Arguments.createMap().apply {
      putBoolean("available", ReminderSounds.available(reactContext, choice))
      putString("title", ReminderSounds.title(reactContext, choice))
    })
  }
  @ReactMethod fun soundDefaults(promise: Promise) {
    promise.resolve(Arguments.createMap().apply {
      putString("notification", ReminderSounds.default(reactContext, "notification"))
      putString("alarm", ReminderSounds.default(reactContext, "alarm"))
    })
  }
  @ReactMethod fun setSoundDefault(mode: String, choice: String?, promise: Promise) {
    try { ReminderSounds.setDefault(reactContext, mode, choice); promise.resolve(null) }
    catch (error: Exception) { promise.reject("sound_failed", error) }
  }
  @ReactMethod fun selectSound(mode: String, current: String?, promise: Promise) {
    if (mode !in listOf("notification", "alarm")) { promise.reject("invalid_mode", "Invalid sound mode"); return }
    reactContext.runOnUiQueueThread {
      val activity = reactContext.currentActivity
      if (activity == null || pickerPromise != null) { promise.reject("picker_unavailable", "Sound picker unavailable"); return@runOnUiQueueThread }
      val intent = Intent(android.media.RingtoneManager.ACTION_RINGTONE_PICKER).apply {
        putExtra(android.media.RingtoneManager.EXTRA_RINGTONE_TYPE, if (mode == "alarm") android.media.RingtoneManager.TYPE_ALARM else android.media.RingtoneManager.TYPE_NOTIFICATION)
        putExtra(android.media.RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, true)
        putExtra(android.media.RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, true)
        putExtra(android.media.RingtoneManager.EXTRA_RINGTONE_EXISTING_URI, if (current == "") null else if (current == null) android.media.RingtoneManager.getDefaultUri(if (mode == "alarm") android.media.RingtoneManager.TYPE_ALARM else android.media.RingtoneManager.TYPE_NOTIFICATION) else Uri.parse(current))
      }
      try { pickerPromise = promise; activity.startActivityForResult(intent, 21931) }
      catch (error: Exception) { pickerPromise = null; promise.reject("picker_failed", error) }
    }
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
    saveWithMode("medicine", name, instructions, times, "notification", null, null, promise)
  }
  @ReactMethod fun saveTyped(type: String, name: String, instructions: String, times: ReadableArray, mode: String, promise: Promise) {
    saveWithMode(type, name, instructions, times, mode, null, null, promise)
  }
  private fun saveWithMode(type: String, name: String, instructions: String, times: ReadableArray, mode: String, startDate: String?, endDate: String?, promise: Promise) {
    try {
      val clockTimes = (0 until times.size()).map { requireNotNull(times.getString(it)) }
      ReminderScheduler.rebuild(reactContext)
      ReminderScheduler.ensureReconciliation(reactContext)
      MedicineRepository(reactContext).use { repo ->
        val medicine = repo.save(name, instructions, clockTimes, System.currentTimeMillis(), type, mode, startDate, endDate)
        ReminderScheduler.schedule(reactContext, medicine)
      }
      promise.resolve(null)
    } catch (error: Exception) { promise.reject("save_failed", error) }
  }
  @ReactMethod fun saveDated(type: String, name: String, instructions: String, times: ReadableArray, mode: String, startDate: String, endDate: String?, promise: Promise) {
    saveWithMode(type, name, instructions, times, mode, startDate, endDate, promise)
  }
  @ReactMethod fun saveScheduled(type: String, name: String, instructions: String, times: ReadableArray, mode: String, startDate: String, endDate: String?, scheduleKind: String, weekdays: ReadableArray, intervalHours: Double?, intervalAnchor: Double?, monthlyDay: Double?, shortMonthPolicy: String, notificationSound: String?, alarmSound: String?, promise: Promise) {
    try {
      require(intervalHours == null || (intervalHours.isFinite() && intervalHours > 0 && intervalHours <= Int.MAX_VALUE && intervalHours % 1.0 == 0.0))
      require(monthlyDay == null || (monthlyDay.isFinite() && monthlyDay % 1.0 == 0.0 && monthlyDay in 1.0..31.0))
      require(intervalAnchor == null || (intervalAnchor.isFinite() && intervalAnchor % 1.0 == 0.0))
      val clockTimes = (0 until times.size()).map { requireNotNull(times.getString(it)) }
      val days = (0 until weekdays.size()).map { weekdays.getInt(it) }
      ReminderScheduler.rebuild(reactContext)
      ReminderScheduler.ensureReconciliation(reactContext)
      MedicineRepository(reactContext).use { repo ->
        val medicine = repo.save(name, instructions, clockTimes, System.currentTimeMillis(), type, mode, startDate, endDate, scheduleKind, days, intervalHours?.toInt(), intervalAnchor?.toLong(), monthlyDay?.toInt(), shortMonthPolicy, MedicineRepository.SoundChoices(notificationSound, alarmSound))
        ReminderScheduler.schedule(reactContext, medicine)
        promise.resolve(medicine.id)
      }
    } catch (error: Exception) { promise.reject("save_failed", error) }
  }
  @ReactMethod fun editScheduled(id: String, type: String, name: String, instructions: String, times: ReadableArray, mode: String, startDate: String, endDate: String?, scheduleKind: String, weekdays: ReadableArray, intervalHours: Double?, intervalAnchor: Double?, monthlyDay: Double?, shortMonthPolicy: String, notificationSound: String?, alarmSound: String?, promise: Promise) {
    try {
      require(intervalHours == null || (intervalHours.isFinite() && intervalHours > 0 && intervalHours <= Int.MAX_VALUE && intervalHours % 1.0 == 0.0))
      require(monthlyDay == null || (monthlyDay.isFinite() && monthlyDay % 1.0 == 0.0 && monthlyDay in 1.0..31.0))
      require(intervalAnchor == null || (intervalAnchor.isFinite() && intervalAnchor % 1.0 == 0.0))
      ReminderScheduler.edit(reactContext, id, name, instructions, (0 until times.size()).map { requireNotNull(times.getString(it)) }, type, mode, startDate, endDate, scheduleKind, (0 until weekdays.size()).map { weekdays.getInt(it) }, intervalHours?.toInt(), intervalAnchor?.toLong(), monthlyDay?.toInt(), shortMonthPolicy, MedicineRepository.SoundChoices(notificationSound, alarmSound))
      promise.resolve(null)
    } catch (error: Exception) { promise.reject("edit_failed", error) }
  }
  @ReactMethod fun editDated(id: String, type: String, name: String, instructions: String, times: ReadableArray, mode: String, startDate: String, endDate: String?, promise: Promise) {
    try {
      ReminderScheduler.edit(reactContext, id, name, instructions, (0 until times.size()).map { requireNotNull(times.getString(it)) }, type, mode, startDate, endDate)
      promise.resolve(null)
    } catch (error: Exception) { promise.reject("edit_failed", error) }
  }
  @ReactMethod fun edit(id: String, type: String, name: String, instructions: String, times: ReadableArray, mode: String, promise: Promise) {
    try {
      ReminderScheduler.edit(reactContext, id, name, instructions, (0 until times.size()).map { requireNotNull(times.getString(it)) }, type, mode)
      promise.resolve(null)
    } catch (error: Exception) { promise.reject("edit_failed", error) }
  }
  @ReactMethod fun setStatus(id: String, status: String, promise: Promise) {
    try { ReminderScheduler.setStatus(reactContext, id, status); promise.resolve(null) }
    catch (error: Exception) { promise.reject("status_failed", error) }
  }
  @ReactMethod fun openAlarmSettings() {
    if (Build.VERSION.SDK_INT >= 31) {
      reactContext.startActivity(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${reactContext.packageName}")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
  }
  @ReactMethod fun openFullScreenSettings(promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT >= 34) {
        val intent = Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:${reactContext.packageName}"))
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactContext.startActivity(intent)
      }
      promise.resolve(null)
    } catch (error: Exception) { promise.reject("full_screen_settings_failed", error) }
  }
  @ReactMethod fun openNotificationSettings() {
    val manager = reactContext.getSystemService(NotificationManager::class.java)
    val channel = manager.getNotificationChannel("medicine_reminders")
    val intent = if (channel != null && channel.importance == NotificationManager.IMPORTANCE_NONE) {
      Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_CHANNEL_ID, "medicine_reminders")
    } else Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
    reactContext.startActivity(intent.putExtra(Settings.EXTRA_APP_PACKAGE, reactContext.packageName).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
  }
  @ReactMethod fun selectDate(date: String, promise: Promise) {
    val current = try { java.time.LocalDate.parse(date) } catch (error: Exception) { promise.reject("invalid_date", error); return }
    reactContext.runOnUiQueueThread {
      val activity = reactContext.currentActivity
      if (activity == null) { promise.reject("no_activity", "No activity is available"); return@runOnUiQueueThread }
      val dialog = LocalizedPicker.create(activity) { localized ->
        android.app.DatePickerDialog(localized, { _, year, month, day ->
          promise.resolve(java.time.LocalDate.of(year, month + 1, day).toString())
        }, current.year, current.monthValue - 1, current.dayOfMonth)
      }
      dialog.setOnCancelListener { promise.resolve(null) }
      dialog.show()
    }
  }
  @ReactMethod fun selectTime(time: String, promise: Promise) {
    val current = try { java.time.LocalTime.parse(time) } catch (error: Exception) { promise.reject("invalid_time", error); return }
    reactContext.runOnUiQueueThread {
      val activity = reactContext.currentActivity
      if (activity == null) { promise.reject("no_activity", "No activity is available"); return@runOnUiQueueThread }
      val dialog = LocalizedPicker.create(activity) { localized ->
        android.app.TimePickerDialog(localized, { _, hour, minute ->
          promise.resolve(String.format(Locale.ROOT, "%02d:%02d", hour, minute))
        }, current.hour, current.minute, android.text.format.DateFormat.is24HourFormat(activity))
      }
      dialog.setOnCancelListener { promise.resolve(null) }
      dialog.show()
    }
  }
  @ReactMethod fun testReminder() {
    val localized = AppLanguage.context(reactContext)
    ReminderScheduler.notify(localized, localized.getString(R.string.test_reminder), localized.getString(R.string.test_reminder_body), 0)
  }
}
class ReminderPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(ReminderModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
