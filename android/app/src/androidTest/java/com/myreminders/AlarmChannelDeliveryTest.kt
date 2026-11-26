package com.myreminders

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioManager
import android.os.SystemClock
import android.provider.Settings
import android.view.accessibility.AccessibilityNodeInfo
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.time.LocalTime
import java.time.format.DateTimeFormatter

@RunWith(AndroidJUnit4::class)
class AlarmChannelDeliveryTest {
  @Test fun androidDeliveryRespectsBlockedAlarmAlertChannel() {
    org.junit.Assume.assumeTrue(android.os.Build.HARDWARE == "ranchu")
    val context = ApplicationProvider.getApplicationContext<Context>()
    val manager = context.getSystemService(NotificationManager::class.java)
    val audio = context.getSystemService(AudioManager::class.java)
    val automation = InstrumentationRegistry.getInstrumentation().uiAutomation
    assertTrue(MedicineRepository(context).use { it.all().isEmpty() })
    manager.createNotificationChannel(android.app.NotificationChannel("alarm_alerts", "Alarm alerts", NotificationManager.IMPORTANCE_HIGH).apply { setSound(null, null); enableVibration(false) })
    ReminderScheduler.notify(context, "Channel setup", "Channel setup", 198274)
    manager.cancel(198274)
    fun nodes(root: AccessibilityNodeInfo?): List<AccessibilityNodeInfo> =
      if (root == null) emptyList() else listOf(root) + (0 until root.childCount).flatMap { nodes(root.getChild(it)) }
    fun await(predicate: () -> Boolean) {
      val deadline = SystemClock.elapsedRealtime() + 20000
      while (!predicate() && SystemClock.elapsedRealtime() < deadline) SystemClock.sleep(100)
      assertTrue("Timed out waiting for Android settings", predicate())
    }
    fun openSettings() {
      context.startActivity(Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS)
        .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName).putExtra(Settings.EXTRA_CHANNEL_ID, "alarm_alerts")
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      await { nodes(automation.rootInActiveWindow).any { it.viewIdResourceName == "android:id/switch_widget" } }
    }
    fun setEnabled(enabled: Boolean) {
      val toggle = nodes(automation.rootInActiveWindow).first { it.viewIdResourceName == "android:id/switch_widget" }
      if (toggle.isChecked != enabled) {
        var target: AccessibilityNodeInfo? = toggle
        while (target != null && !target.isClickable) target = target.parent
        assertTrue(requireNotNull(target).performAction(AccessibilityNodeInfo.ACTION_CLICK))
      }
      await { (manager.getNotificationChannel("alarm_alerts").importance != NotificationManager.IMPORTANCE_NONE) == enabled }
    }
    fun shell(command: String) {
      android.os.ParcelFileDescriptor.AutoCloseInputStream(automation.executeShellCommand(command)).use { it.readBytes() }
    }
    fun observe(label: String) {
      // Simulate interrupted access recovery, then complete the recovery normally
      // performed by the app before directly inserting this test alarm.
      context.getSharedPreferences("reminder_access", Context.MODE_PRIVATE).edit().putBoolean("recovery_pending", true).commit()
      ReminderScheduler.rebuild(context)
      val now = System.currentTimeMillis()
      val at = now + 3000
      val item = MedicineRepository(context).use { it.save("Alarm channel experiment", "", listOf(LocalTime.now().plusHours(2).format(DateTimeFormatter.ofPattern("HH:mm"))), now - 10000, "reminder", "alarm") }
      val id = ("${item.id}:$at").hashCode()
      try {
        val alarms = context.getSystemService(android.app.AlarmManager::class.java)
        val intent = Intent(context, ReminderReceiver::class.java).setData(android.net.Uri.parse("myreminders://alarm-channel-test/${item.id}"))
          .putExtra("medicineId", item.id).putExtra("scheduledAt", at).putExtra("token", label)
        val operation = android.app.PendingIntent.getBroadcast(context, 0, intent, android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE)
        val show = android.app.PendingIntent.getActivity(context, 0, Intent(context, MainActivity::class.java), android.app.PendingIntent.FLAG_IMMUTABLE)
        MedicineRepository(context).use { it.setAlarm(item.id, at, label) }
        shell("input keyevent KEYCODE_SLEEP")
        alarms.setAlarmClock(android.app.AlarmManager.AlarmClockInfo(at, show), operation)
        await { MedicineRepository(context).use { repo -> repo.occurrences().any { it.medicineId == item.id && it.at == at } } }
        SystemClock.sleep(2000)
        alarms.cancel(operation); operation.cancel()
        val notification = manager.activeNotifications.any { it.id == id }
        val session = manager.activeNotifications.any { it.id == 119348 }
        val playing = audio.activePlaybackConfigurations.any { it.audioAttributes.usage == AudioAttributes.USAGE_NOTIFICATION }
        val screen = automation.rootInActiveWindow?.packageName?.toString() == context.packageName
        assertEquals("Occurrence notification: $label", label != "blocked", notification)
        assertTrue("Sound session: $label", session)
        assertTrue("Sound playback: $label", playing)
        assertEquals("Alarm screen: $label", label != "blocked", screen)
      } finally {
        context.stopService(Intent(context, AlarmSoundService::class.java))
        manager.cancel(id)
        ReminderScheduler.setStatus(context, item.id, "deleted")
        MedicineRepository(context).use { repo ->
          for (table in listOf("alarms", "doses", "occurrence_tracking", "reminder_sound_choices")) repo.writableDatabase.delete(table, "medicine_id = ?", arrayOf(item.id))
          repo.writableDatabase.delete("medicines", "id = ?", arrayOf(item.id))
        }
        shell("input keyevent KEYCODE_WAKEUP")
        shell("wm dismiss-keyguard")
        shell("input keyevent KEYCODE_BACK")
      }
    }
    try {
      shell("input keyevent KEYCODE_WAKEUP")
      shell("wm dismiss-keyguard")
        shell("input keyevent KEYCODE_BACK")
      openSettings(); setEnabled(true)
      observe("enabled")
      openSettings(); setEnabled(false)
      observe("blocked")
      openSettings(); setEnabled(true)
      observe("restored")

    } finally {
      openSettings(); setEnabled(true)
    }
  }
}
