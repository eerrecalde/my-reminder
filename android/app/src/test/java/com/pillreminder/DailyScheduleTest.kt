package com.pillreminder

import org.junit.Assert.assertEquals
import org.junit.Test
import java.time.Instant
import java.time.ZoneId

class DailyScheduleTest {
  @Test fun `next dose uses local time after daylight saving gap`() {
    val next = DailySchedule.next(listOf("01:30"), Instant.parse("2026-03-28T12:00:00Z"), ZoneId.of("Europe/London"))
    assertEquals(Instant.parse("2026-03-29T01:30:00Z"), next)
  }
  @Test fun `repeated local time occurs once at first offset`() {
    val next = DailySchedule.next(listOf("01:30"), Instant.parse("2026-10-25T00:45:00Z"), ZoneId.of("Europe/London"))
    assertEquals(Instant.parse("2026-10-26T01:30:00Z"), next)
  }
}
