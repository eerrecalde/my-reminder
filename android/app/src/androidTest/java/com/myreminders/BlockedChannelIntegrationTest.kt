package com.myreminders

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
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
class BlockedChannelIntegrationTest {
  @Test fun blockedCustomChannelIsShownForBothTypesAndClearsAfterSettingsReturn() = exercise("custom", "en")
  @Test fun blockedSilentChannelIsShownAndClearsAfterSettingsReturn() = exercise("silent", "es")
  @Test fun blockedDefaultChannelIsShownAndClearsAfterSettingsReturn() = exercise("legacy", "en")

  private fun exercise(kind: String, language: String) {
    org.junit.Assume.assumeTrue("Requires disposable emulator", android.os.Build.HARDWARE == "ranchu")
    val context = ApplicationProvider.getApplicationContext<Context>()
    val manager = context.getSystemService(NotificationManager::class.java)
    val automation = InstrumentationRegistry.getInstrumentation().uiAutomation
    val originalLanguage = AppLanguage.preference(context)
    val originalDefault = ReminderSounds.default(context, "notification")
    val ids = mutableListOf<String>()
    val channelSound = when (kind) {
      "legacy" -> null
      "silent" -> ""
      else -> requireNotNull(RingtoneManager.getActualDefaultRingtoneUri(context, RingtoneManager.TYPE_NOTIFICATION)).toString()
    }
    ReminderScheduler.notify(context, "Channel setup", "Channel setup", 198274)
    manager.cancel(198274)
    val channel = ReminderSounds.channel(context, channelSound)
    assertTrue("Requires a restored channel", manager.getNotificationChannel(channel).importance != NotificationManager.IMPORTANCE_NONE)
    assertTrue("Requires an empty disposable installation", MedicineRepository(context).use { it.all().isEmpty() })

    fun nodes(root: AccessibilityNodeInfo?): List<AccessibilityNodeInfo> =
      if (root == null) emptyList() else listOf(root) + (0 until root.childCount).flatMap { nodes(root.getChild(it)) }
    fun find(predicate: (AccessibilityNodeInfo) -> Boolean) = nodes(automation.rootInActiveWindow).firstOrNull(predicate)
    fun await(description: String, predicate: () -> Boolean) {
      val deadline = SystemClock.elapsedRealtime() + 20000
      while (SystemClock.elapsedRealtime() < deadline) {
        if (predicate()) return
        SystemClock.sleep(100)
      }
      val labels = nodes(automation.rootInActiveWindow).mapNotNull { (it.contentDescription ?: it.text)?.toString() }.joinToString(" | ")
      throw AssertionError("Timed out waiting for $description; screen: $labels")
    }
    fun click(node: AccessibilityNodeInfo?) {
      var target = node
      while (target != null && !target.isClickable) target = target.parent
      assertNotNull("Clickable target", target)
      assertTrue("Click target", target!!.performAction(AccessibilityNodeInfo.ACTION_CLICK))
    }
    fun button(label: String): AccessibilityNodeInfo {
      var result: AccessibilityNodeInfo? = null
      await("button $label") { find { it.isVisibleToUser && it.isClickable && it.contentDescription?.toString() == label }.also { result = it } != null }
      return requireNotNull(result)
    }
    fun openChannel() {
      context.startActivity(Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS)
        .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
        .putExtra(Settings.EXTRA_CHANNEL_ID, channel)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      await("selected Android channel settings") {
        find { it.packageName?.toString() == "com.android.settings" && it.viewIdResourceName == "android:id/switch_widget" } != null &&
          find { it.packageName?.toString() == "com.android.settings" && it.contentDescription?.toString() == manager.getNotificationChannel(channel).name.toString() } != null
      }
    }
    fun setChannelEnabled(enabled: Boolean) {
      val switch = find { it.viewIdResourceName == "android:id/switch_widget" }
      assertNotNull(switch)
      if (switch!!.isChecked != enabled) click(switch)
      await("channel importance change") {
        (manager.getNotificationChannel(channel).importance != NotificationManager.IMPORTANCE_NONE) == enabled
      }
    }
    try {
      for (command in listOf("input keyevent KEYCODE_WAKEUP", "wm dismiss-keyguard")) {
        android.os.ParcelFileDescriptor.AutoCloseInputStream(automation.executeShellCommand(command)).use { it.readBytes() }
      }
      AppLanguage.set(context, language)
      ReminderSounds.setDefault(context, "notification", null)
      val time = LocalTime.now().plusHours(2).format(DateTimeFormatter.ofPattern("HH:mm"))
      MedicineRepository(context).use { repo ->
        for ((type, name) in listOf("reminder" to "Channel test water", "medicine" to "Channel test medicine")) {
          val item = repo.save(name, "", listOf(time), System.currentTimeMillis(), type, soundChoices = MedicineRepository.SoundChoices(channelSound, null))
          ids.add(item.id)
          ReminderScheduler.schedule(context, item)
        }
      }
      openChannel()
      setChannelEnabled(false)
      context.startActivity(Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK))
      await("blocked channel warning") { find { it.viewIdResourceName == "blocked-channel-warning" } != null }
      click(button(if (language == "es") "Revisar acceso a recordatorios" else "Review reminder access"))
      await("reminder access screen") { find { it.text?.toString() == if (language == "es") "Se necesitan notificaciones y alarmas exactas para recibir recordatorios a tiempo." else "Notifications and exact alarms are needed for reminders to arrive on time." } != null }
      val deadline = SystemClock.elapsedRealtime() + 20000
      while (find { it.text?.toString() == "Channel test medicine" && it.isVisibleToUser } == null && SystemClock.elapsedRealtime() < deadline) {
        val scroll = find { it.isScrollable && it.isVisibleToUser }
        assertNotNull("Scrollable access screen", scroll)
        assertTrue(scroll!!.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD))
        automation.waitForIdle(300, 5000)
      }
      assertNotNull("Affected Medicine is shown", find { it.text?.toString() == "Channel test medicine" && it.isVisibleToUser })
      assertNotNull("Affected Reminder is shown", find { it.text?.toString() == "Channel test water" && it.isVisibleToUser })
      val settingsLabel = if (language == "es") "Abrir configuración de notificaciones" else "Open notification settings"
      while (find { it.isClickable && it.isVisibleToUser && it.contentDescription?.toString() == settingsLabel } == null && SystemClock.elapsedRealtime() < deadline) {
        val scroll = find { it.isScrollable && it.isVisibleToUser }
        assertNotNull("Scrollable access screen", scroll)
        assertTrue(scroll!!.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD))
        automation.waitForIdle(300, 5000)
      }
      click(button(settingsLabel))
      await("relevant channel settings") {
        find { it.packageName?.toString() == "com.android.settings" && it.contentDescription?.toString() == manager.getNotificationChannel(channel).name.toString() } != null
      }
      setChannelEnabled(true)
      automation.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK)
      await("restored app access status") {
        automation.rootInActiveWindow?.packageName?.toString() == context.packageName &&
          find { it.text?.toString() == if (language == "es") "Los permisos necesarios están habilitados." else "Required permissions are allowed." } != null &&
          find { it.viewIdResourceName == "blocked-channel-warning" } == null
      }
    } finally {
      if (manager.getNotificationChannel(channel)?.importance == NotificationManager.IMPORTANCE_NONE) {
        openChannel(); setChannelEnabled(true)
      }
      ids.forEach { id ->
        ReminderScheduler.setStatus(context, id, "deleted")
        MedicineRepository(context).use { repo ->
          for (table in listOf("doses", "occurrence_tracking", "reminder_sound_choices")) repo.writableDatabase.delete(table, "medicine_id = ?", arrayOf(id))
          repo.writableDatabase.delete("medicines", "id = ?", arrayOf(id))
        }
      }
      AppLanguage.set(context, originalLanguage)
      ReminderSounds.setDefault(context, "notification", originalDefault)
    }
  }
}
