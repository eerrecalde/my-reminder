package com.myreminders

import android.content.Context
import android.content.Intent
import android.database.DatabaseUtils
import android.os.SystemClock
import android.util.Log
import android.view.accessibility.AccessibilityNodeInfo
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith

/** Opt-in measurement of the seeded dataset through the real app UI. */
@RunWith(AndroidJUnit4::class)
class LongHistoryUiBenchmark {
  @Test fun measureFirstVisibleRows() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    val arguments = InstrumentationRegistry.getArguments()
    assumeTrue(arguments.getString("longHistoryUiBenchmark") == "true")
    check(android.os.Build.HARDWARE == "ranchu" &&
      arguments.getString("confirmDisposableAvd") == "pill_reminder_test") {
      "Confirm the pill_reminder_test disposable emulator before running"
    }
    val context = ApplicationProvider.getApplicationContext<Context>()
    MedicineRepository(context).use { repo ->
      val names = repo.all().map { it.name }.toSet()
      val count = DatabaseUtils.longForQuery(repo.readableDatabase, "SELECT COUNT(*) FROM doses", null)
      check(names == (0 until 24).map { "Benchmark $it" }.toSet() && count >= 8760) {
        "Requires the seeded long-history benchmark dataset"
      }
    }
    val automation = instrumentation.uiAutomation
    val previousLanguage = AppLanguage.preference(context)

    fun find(root: AccessibilityNodeInfo?, predicate: (AccessibilityNodeInfo) -> Boolean): AccessibilityNodeInfo? {
      if (root == null) return null
      if (predicate(root)) return root
      for (index in 0 until root.childCount) find(root.getChild(index), predicate)?.let { return it }
      return null
    }
    fun awaitNode(description: String, predicate: (AccessibilityNodeInfo) -> Boolean): AccessibilityNodeInfo {
      val deadline = SystemClock.elapsedRealtime() + 120_000
      while (SystemClock.elapsedRealtime() < deadline) {
        find(automation.rootInActiveWindow, predicate)?.let { return it }
        SystemClock.sleep(250)
      }
      throw AssertionError("Timed out waiting for $description")
    }
    fun tab(label: String) = awaitNode("$label tab") {
      it.isClickable && it.isVisibleToUser && it.contentDescription?.toString() == label
    }
    fun selected(id: String) = awaitNode("selected $id tab") {
      it.viewIdResourceName == "nav-$id" && it.isSelected
    }
    fun heading(label: String) = awaitNode("$label screen heading") {
      it.isVisibleToUser && !it.isClickable && it.text?.toString() == label
    }
    fun firstBenchmarkRow() = awaitNode("visible benchmark row") {
      it.isVisibleToUser && it.text?.toString()?.startsWith("Benchmark ") == true
    }
    try {
      AppLanguage.set(context, "en")
      val startedAt = SystemClock.elapsedRealtime()
      context.startActivity(Intent(context, MainActivity::class.java)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK))
      assertTrue("Open Reminders", tab("Reminders").performAction(AccessibilityNodeInfo.ACTION_CLICK))
      selected("reminders")
      heading("Reminders")
      firstBenchmarkRow()
      val remindersMs = SystemClock.elapsedRealtime() - startedAt
      Log.i("LongHistoryUiBenchmark", "reminders_first_row_ms=$remindersMs")

      val historyStartedAt = SystemClock.elapsedRealtime()
      assertTrue("Open History", tab("History").performAction(AccessibilityNodeInfo.ACTION_CLICK))
      selected("history")
      heading("History")
      firstBenchmarkRow()
      val firstHistoryRowMs = SystemClock.elapsedRealtime() - historyStartedAt
      Log.i("LongHistoryUiBenchmark", "history_first_row_ms=$firstHistoryRowMs")
      automation.waitForIdle(500, 20_000)
      val historyIdleMs = SystemClock.elapsedRealtime() - historyStartedAt
      Log.i("LongHistoryUiBenchmark", "history_idle_ms=$historyIdleMs")
    } finally {
      AppLanguage.set(context, previousLanguage)
    }
  }
}
