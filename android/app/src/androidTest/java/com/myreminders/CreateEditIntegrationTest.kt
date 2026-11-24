package com.myreminders

import android.app.AlarmManager
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.SystemClock
import android.view.accessibility.AccessibilityNodeInfo
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class CreateEditIntegrationTest {
  @Test fun createAndEditReminderThroughAppRegistersItsSchedule() {
    org.junit.Assume.assumeTrue("Requires the disposable emulator", android.os.Build.HARDWARE == "ranchu")
    val context = ApplicationProvider.getApplicationContext<Context>()
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    val automation = instrumentation.uiAutomation
    val originalLanguage = AppLanguage.preference(context)
    val createdName = "Integration create reminder"
    val editedName = "Integration edited reminder"
    assertTrue("Requires an empty disposable installation", MedicineRepository(context).use { it.all().isEmpty() })
    assertTrue("Reminder permissions must be enabled", ReminderScheduler.enabled(context))

    fun nodes(root: AccessibilityNodeInfo?): List<AccessibilityNodeInfo> =
      if (root == null) emptyList() else listOf(root) + (0 until root.childCount).flatMap { nodes(root.getChild(it)) }
    fun find(predicate: (AccessibilityNodeInfo) -> Boolean) = nodes(automation.rootInActiveWindow).firstOrNull(predicate)
    fun awaitNode(description: String, predicate: (AccessibilityNodeInfo) -> Boolean): AccessibilityNodeInfo {
      val deadline = SystemClock.elapsedRealtime() + 20_000
      while (SystemClock.elapsedRealtime() < deadline) {
        find(predicate)?.let { return it }
        SystemClock.sleep(100)
      }
      val snapshot = nodes(automation.rootInActiveWindow).mapNotNull {
        (it.contentDescription ?: it.text)?.toString()?.takeIf(String::isNotBlank)
      }.joinToString(" | ")
      throw AssertionError("Timed out waiting for $description; screen: $snapshot")
    }
    fun button(label: String) = awaitNode("button $label") {
      it.isClickable && it.isVisibleToUser && it.contentDescription?.toString() == label
    }
    fun click(label: String) {
      assertTrue("Click $label", button(label).performAction(AccessibilityNodeInfo.ACTION_CLICK))
    }
    fun text(label: String) = awaitNode("text $label") { it.isVisibleToUser && it.text?.toString() == label }
    fun remindersTab() {
      click("Reminders")
      awaitNode("selected Reminders tab") { it.viewIdResourceName == "nav-reminders" && it.isSelected }
      text("Reminders")
    }
    fun setName(value: String) {
      val field = awaitNode("reminder name") { it.isEditable && it.contentDescription?.toString() == "Reminder name" }
      val args = Bundle().apply { putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, value) }
      assertTrue("Set reminder name", field.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args))
    }
    fun scrollTo(label: String) {
      val deadline = SystemClock.elapsedRealtime() + 20_000
      while (SystemClock.elapsedRealtime() < deadline) {
        if (find { it.isClickable && it.isVisibleToUser && it.contentDescription?.toString() == label } != null) return
        val scroll = find { it.isScrollable && it.isVisibleToUser }
        assertNotNull("Scrollable setup screen for $label", scroll)
        assertTrue("Scroll to $label", scroll!!.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD))
        automation.waitForIdle(300, 5_000)
      }
      throw AssertionError("Timed out scrolling to $label")
    }
    try {
      AppLanguage.set(context, "en")
      val launch = Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
      context.startActivity(launch)
      remindersTab()
      click("Add reminder")
      text("Choose a type")
      click("Reminder")
      setName(createdName)
      click("Next")
      click("Repeat: Once")
      click("Every day")
      button("Repeat: Every day")
      scrollTo("Select a time")
      click("Select a time")
      val ok = awaitNode("time picker OK") { it.isClickable && it.text?.toString()?.equals("OK", ignoreCase = true) == true }
      assertTrue(ok.performAction(AccessibilityNodeInfo.ACTION_CLICK))
      awaitNode("selected time") { it.isClickable && it.contentDescription?.toString()?.startsWith("Change time:") == true }
      scrollTo("Review")
      click("Review")
      click("Save reminder")
      remindersTab()
      text(createdName)
      val created = MedicineRepository(context).use { it.all().single { item -> item.name == createdName } }
      assertEquals("daily", created.scheduleKind)
      assertEquals(1, created.times.size)
      val firstAlarm = MedicineRepository(context).use { it.alarm(created.id) }
      assertNotNull(firstAlarm)
      assertTrue(firstAlarm!!.registered)
      assertEquals("Android's next alarm clock should match the scheduled time", firstAlarm.at,
        context.getSystemService(AlarmManager::class.java).nextAlarmClock?.triggerTime)

      click("Edit")
      click("Reminder")
      setName(editedName)
      click("Next")
      button("Repeat: Every day")
      scrollTo("Review")
      click("Review")
      click("Save reminder")
      remindersTab()
      text(editedName)
      val edited = MedicineRepository(context).use { it.all().single { item -> item.name == editedName } }
      assertEquals(created.id, edited.id)
      assertEquals(created.times, edited.times)
      assertEquals(created.scheduleKind, edited.scheduleKind)
      val editedAlarm = MedicineRepository(context).use { it.alarm(edited.id) }
      assertNotNull(editedAlarm)
      assertTrue(editedAlarm!!.registered)
      assertEquals("Android's next alarm clock should match the edited schedule", editedAlarm.at,
        context.getSystemService(AlarmManager::class.java).nextAlarmClock?.triggerTime)
    } finally {
      MedicineRepository(context).use { repo ->
        repo.all().filter { it.name == createdName || it.name == editedName }.forEach { item ->
          ReminderScheduler.setStatus(context, item.id, "deleted")
          for (table in listOf("doses", "occurrence_tracking", "reminder_sound_choices")) {
            repo.writableDatabase.delete(table, "medicine_id = ?", arrayOf(item.id))
          }
          repo.writableDatabase.delete("medicines", "id = ?", arrayOf(item.id))
        }
      }
      AppLanguage.set(context, originalLanguage)
    }
  }
}
