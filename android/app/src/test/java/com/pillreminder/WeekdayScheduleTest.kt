package com.pillreminder

import org.junit.Assert.assertEquals
import org.junit.Test
import java.time.Instant
import java.time.ZoneId

class WeekdayScheduleTest {
  private val zone = ZoneId.of("Europe/London")

  @Test fun `scheduler honours selected weekdays and inclusive bounds`() {
    val medicine = Medicine("m", "Water", "", listOf("09:00", "21:00"), 0, startDate = "2026-06-02", endDate = "2026-06-03", scheduleKind = "weekday", weekdays = listOf(1, 3))
    val first = DailySchedule.next(medicine, Instant.parse("2026-06-01T12:00:00Z"), zone)
    assertEquals(Instant.parse("2026-06-03T08:00:00Z"), first)
    val last = DailySchedule.next(medicine, first!!, zone)
    assertEquals(Instant.parse("2026-06-03T20:00:00Z"), last)
    assertEquals(null, DailySchedule.next(medicine, last!!, zone))
    assertEquals(emptyList<Instant>(), DailySchedule.dueToday(medicine, Instant.parse("2026-06-04T20:00:00Z"), zone))
  }

  @Test fun `scheduler handles daylight saving gap and overlap once`() {
    val medicine = Medicine("m", "Water", "", listOf("01:30", "02:30"), 0, scheduleKind = "weekday", weekdays = listOf(7))
    assertEquals(listOf(Instant.parse("2026-03-29T01:30:00Z")), DailySchedule.dueToday(medicine, Instant.parse("2026-03-29T02:00:00Z"), zone))
    val overlap = medicine.copy(times = listOf("01:30"))
    assertEquals(Instant.parse("2026-11-01T01:30:00Z"), DailySchedule.next(overlap, Instant.parse("2026-10-25T00:45:00Z"), zone))
  }
}
