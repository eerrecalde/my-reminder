package com.myreminders

import android.content.Context
import android.os.SystemClock
import android.util.Log
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import java.time.LocalDate
import java.time.ZoneId
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith

/** Explicitly invoked on an empty disposable emulator; leaves the dataset for UI measurement. */
@RunWith(AndroidJUnit4::class)
class LongHistoryBenchmark {
  @Test fun seedAndMeasure() {
    assumeTrue(InstrumentationRegistry.getArguments().getString("longHistoryBenchmark") == "true")
    check(android.os.Build.HARDWARE == "ranchu" &&
      InstrumentationRegistry.getArguments().getString("confirmDisposableAvd") == "pill_reminder_test") {
      "Confirm the pill_reminder_test disposable emulator before running"
    }
    val context = ApplicationProvider.getApplicationContext<Context>()
    val zone = ZoneId.systemDefault()
    val today = LocalDate.now(zone)
    val gapStart = today.minusDays(90).atStartOfDay(zone).toInstant().toEpochMilli()
    val historyStart = today.minusDays(455).atStartOfDay(zone).toInstant().toEpochMilli()
    val ids = mutableListOf<String>()
    MedicineRepository(context).use { repo ->
      check(repo.all().isEmpty() && repo.occurrences(true).isEmpty()) { "Benchmark needs an empty disposable installation" }
      repeat(24) { index ->
        val type = if (index % 2 == 0) "medicine" else "reminder"
        val mode = if (index % 3 == 0) "alarm" else "notification"
        val item = repo.save("Benchmark $index", if (type == "medicine") "Instructions $index" else "", listOf("09:00"), historyStart - 1, type, mode)
        ids.add(item.id)
        if (index >= 12) repo.setStatus(item.id, if (index < 18) "paused" else "deleted", gapStart)
      }
      val db = repo.writableDatabase
      db.beginTransaction()
      try {
        val statement = db.compileStatement("INSERT INTO doses (id, medicine_id, scheduled_at, alerted, outcome, cleared, silenced, name, instructions, type, mode, times, retained) VALUES (?, ?, ?, 1, ?, ?, 1, ?, ?, ?, ?, ?, ?)")
        statement.use { insert ->
          ids.forEachIndexed { index, id ->
            repeat(365) { day ->
              val at = today.minusDays(455L - day).atTime(9, 0).atZone(zone).toInstant().toEpochMilli()
              val type = if (index % 2 == 0) "medicine" else "reminder"
              val mode = if (index % 3 == 0) "alarm" else "notification"
              insert.bindString(1, "$id:$at"); insert.bindString(2, id); insert.bindLong(3, at)
              if (day % 10 == 0) insert.bindNull(4) else insert.bindString(4, if (day % 7 == 0) "skipped" else "completed")
              insert.bindLong(5, if (day % 50 == 0) 1 else 0)
              insert.bindString(6, "Benchmark $index"); insert.bindString(7, if (type == "medicine") "Instructions $index" else "")
              insert.bindString(8, type); insert.bindString(9, mode); insert.bindString(10, "[\"09:00\"]")
              insert.bindLong(11, if (index >= 12) 1 else 0); insert.executeInsert(); insert.clearBindings()
            }
          }
        }
        ids.take(12).forEach { db.execSQL("UPDATE occurrence_tracking SET starts_after = ? WHERE medicine_id = ?", arrayOf<Any>(gapStart, it)) }
        db.setTransactionSuccessful()
      } finally { db.endTransaction() }
      assertTrue(repo.occurrences(true).size == 8760)
    }
    val start = SystemClock.elapsedRealtime()
    ReminderScheduler.rebuild(context, recovery = true)
    val recoveryMs = SystemClock.elapsedRealtime() - start
    MedicineRepository(context).use { repo ->
      val readStart = SystemClock.elapsedRealtime()
      val occurrences = repo.occurrences(true)
      val readMs = SystemClock.elapsedRealtime() - readStart
      val active = repo.all().filter { it.status == "active" }
      val scheduleStart = SystemClock.elapsedRealtime()
      active.forEach { ReminderScheduler.schedule(context, it) }
      val scheduleMs = SystemClock.elapsedRealtime() - scheduleStart
      Log.i("LongHistoryBenchmark", "recovery_ms=$recoveryMs occurrence_read_ms=$readMs scheduling_ms=$scheduleMs occurrences=${occurrences.size} active=${active.size} total=${repo.all().size}")
      assertTrue(active.all { repo.alarm(it.id)?.registered == true })
    }
  }
}
