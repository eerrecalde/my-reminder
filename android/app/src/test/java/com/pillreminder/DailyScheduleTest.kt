package com.pillreminder

import org.junit.Assert.assertEquals
import org.junit.Test
import java.time.Instant
import java.time.ZoneId

class DailyScheduleTest {
  @Test fun `start and inclusive end dates bound future occurrences`() {
    val medicine = Medicine("m", "Water", "", listOf("09:00", "21:00"), 0, startDate = "2026-06-03", endDate = "2026-06-03")
    val zone = ZoneId.of("Europe/London")
    val first = DailySchedule.next(medicine, Instant.parse("2026-06-01T12:00:00Z"), zone)
    assertEquals(Instant.parse("2026-06-03T08:00:00Z"), first)
    val last = DailySchedule.next(medicine, first!!, zone)
    assertEquals(Instant.parse("2026-06-03T20:00:00Z"), last)
    assertEquals(null, DailySchedule.next(medicine, last!!, zone))
  }
  @Test fun `next dose uses local time after daylight saving gap`() {
    val next = DailySchedule.next(listOf("01:30"), Instant.parse("2026-03-28T12:00:00Z"), ZoneId.of("Europe/London"))
    assertEquals(Instant.parse("2026-03-29T01:30:00Z"), next)
  }
  @Test fun `recovery includes only doses due after medicine was created`() {
    val zone = ZoneId.of("Europe/London")
    val due = DailySchedule.dueToday(listOf("09:00", "21:00"), Instant.parse("2026-06-01T09:00:00Z"), Instant.parse("2026-06-01T22:00:00Z"), zone)
    assertEquals(listOf(Instant.parse("2026-06-01T20:00:00Z")), due)
  }
  @Test fun `repeated local time occurs once at first offset`() {
    val next = DailySchedule.next(listOf("01:30"), Instant.parse("2026-10-25T00:45:00Z"), ZoneId.of("Europe/London"))
    assertEquals(Instant.parse("2026-10-26T01:30:00Z"), next)
  }
  @Test fun `changing time zone follows the new local clock`() {
    val after = Instant.parse("2026-06-01T06:00:00Z")
    assertEquals(Instant.parse("2026-06-01T08:00:00Z"), DailySchedule.next(listOf("09:00"), after, ZoneId.of("Europe/London")))
    assertEquals(Instant.parse("2026-06-01T13:00:00Z"), DailySchedule.next(listOf("09:00"), after, ZoneId.of("America/New_York")))
  }
  @Test fun `coincident times in a daylight saving gap produce one occurrence`() {
    val due = DailySchedule.dueToday(listOf("01:30", "02:30"), Instant.parse("2026-03-28T00:00:00Z"), Instant.parse("2026-03-29T02:00:00Z"), ZoneId.of("Europe/London"))
    assertEquals(listOf(Instant.parse("2026-03-29T01:30:00Z")), due)
  }
}
