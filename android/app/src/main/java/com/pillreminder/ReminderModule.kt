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
      val result = Arguments.createMap()
      result.putBoolean("enabled", ReminderScheduler.enabled(reactContext))
      result.putBoolean("exactAlarms", Build.VERSION.SDK_INT < 31 || reactContext.getSystemService(android.app.AlarmManager::class.java).canScheduleExactAlarms())
      result.putBoolean("notifications", androidx.core.app.NotificationManagerCompat.from(reactContext).areNotificationsEnabled())
      result.putString("language", if (Locale.getDefault().language == "es") "es" else "en")
      val medicines = Arguments.createArray()
      MedicineRepository(reactContext).use { repo -> repo.all().forEach { medicine ->
        medicines.pushMap(Arguments.createMap().apply {
          putString("id", medicine.id); putString("name", medicine.name); putString("instructions", medicine.instructions)
          putArray("times", Arguments.createArray().apply { medicine.times.forEach { pushString(it) } })
        })
      } }
      result.putArray("medicines", medicines)
      val today = java.time.LocalDate.now()
      val zone = java.time.ZoneId.systemDefault()
      val start = today.atStartOfDay(zone).toInstant().toEpochMilli()
      val end = today.plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli()
      val doses = Arguments.createArray()
      MedicineRepository(reactContext).use { repo -> repo.todayDoses(start, end).forEach { (id, at) ->
        doses.pushMap(Arguments.createMap().apply { putString("medicineId", id); putDouble("scheduledAt", at.toDouble()) })
      } }
      result.putArray("todayDoses", doses)
      promise.resolve(result)
    } catch (error: Exception) { promise.reject("state_failed", error) }
  }
  @ReactMethod fun save(name: String, instructions: String, times: ReadableArray, promise: Promise) {
    try {
      val clockTimes = (0 until times.size()).map { requireNotNull(times.getString(it)) }
      ReminderScheduler.rebuild(reactContext)
      ReminderScheduler.ensureReconciliation(reactContext)
      MedicineRepository(reactContext).use { repo ->
        val medicine = repo.save(name, instructions, clockTimes, System.currentTimeMillis())
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
    reactContext.startActivity(Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, reactContext.packageName).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
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
