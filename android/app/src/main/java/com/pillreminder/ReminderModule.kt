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
      promise.resolve(result)
    } catch (error: Exception) { promise.reject("state_failed", error) }
  }
  @ReactMethod fun save(name: String, instructions: String, times: ReadableArray, promise: Promise) {
    try {
      val clockTimes = (0 until times.size()).map { requireNotNull(times.getString(it)) }
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
  @ReactMethod fun testReminder() {
    ReminderScheduler.notify(reactContext, reactContext.getString(R.string.test_reminder), reactContext.getString(R.string.test_reminder_body), 0)
  }
}
class ReminderPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(ReminderModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
