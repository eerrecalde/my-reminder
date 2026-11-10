package com.myreminders

import org.junit.Assert.assertEquals
import org.junit.Test
import java.time.Instant
import java.time.ZoneId

class MonthlyScheduleTest {
  private val utc = ZoneId.of("UTC")
  private fun monthly(day: Int?, policy: String = "last", time: String = "09:00") =
    Medicine("m", "Water", "", listOf(time), 0, scheduleKind = "monthly", monthlyDay = day, shortMonthPolicy = policy)

  @Test fun `short months use last day or skip according to policy`() {
    val after = Instant.parse("2025-01-31T09:00:00Z")
    assertEquals(Instant.parse("2025-02-28T09:00:00Z"), DailySchedule.next(monthly(31), after, utc))
    assertEquals(Instant.parse("2025-03-31T09:00:00Z"), DailySchedule.next(monthly(31, "skip"), after, utc))
    assertEquals(Instant.parse("2025-02-28T09:00:00Z"), DailySchedule.next(monthly(null), after, utc))
    assertEquals(emptyList<Instant>(), DailySchedule.dueToday(monthly(31, "skip"), Instant.parse("2025-02-28T10:00:00Z"), utc))
    assertEquals(listOf(Instant.parse("2025-02-28T09:00:00Z")), DailySchedule.dueToday(monthly(31), Instant.parse("2025-02-28T10:00:00Z"), utc))
  }

  @Test fun `leap day is scheduled and counted as due`() {
    val item = monthly(29, "skip")
    assertEquals(Instant.parse("2028-02-29T09:00:00Z"), DailySchedule.next(item, Instant.parse("2028-01-29T09:00:00Z"), utc))
    assertEquals(listOf(Instant.parse("2028-02-29T09:00:00Z")), DailySchedule.dueToday(item, Instant.parse("2028-02-29T10:00:00Z"), utc))
  }

  @Test fun `local monthly time moves through spring gap and repeats only once`() {
    val zone = ZoneId.of("Europe/London")
    val spring = monthly(29, time = "01:30")
    assertEquals(Instant.parse("2026-03-29T01:30:00Z"), DailySchedule.next(spring, Instant.parse("2026-03-28T12:00:00Z"), zone))
    assertEquals(listOf(Instant.parse("2026-03-29T01:30:00Z")), DailySchedule.dueToday(spring, Instant.parse("2026-03-29T02:00:00Z"), zone))
    val autumn = monthly(25, time = "01:30")
    assertEquals(Instant.parse("2026-11-25T01:30:00Z"), DailySchedule.next(autumn, Instant.parse("2026-10-25T00:45:00Z"), zone))
  }
}
