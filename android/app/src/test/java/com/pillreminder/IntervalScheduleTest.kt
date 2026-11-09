package com.pillreminder

import org.junit.Assert.assertEquals
import org.junit.Test
import java.time.Instant
import java.time.ZoneId

class IntervalScheduleTest {
  @Test fun `past anchor keeps elapsed cadence through DST and zone changes`() {
    val anchor = Instant.parse("2026-03-28T21:00:00Z")
    val after = Instant.parse("2026-03-29T00:00:00Z")
    val expected = Instant.parse("2026-03-29T03:00:00Z")
    assertEquals(expected, IntervalSchedule.next(anchor, 6, after, null, ZoneId.of("Europe/London")))
    assertEquals(expected, IntervalSchedule.next(anchor, 6, after, null, ZoneId.of("America/New_York")))
  }

  @Test fun `inclusive end date bounds interval and due occurrences`() {
    val anchor = Instant.parse("2026-06-01T23:00:00Z")
    val zone = ZoneId.of("UTC")
    assertEquals(Instant.parse("2026-06-02T23:00:00Z"), IntervalSchedule.next(anchor, 6, Instant.parse("2026-06-02T17:00:00Z"), "2026-06-02", zone))
    assertEquals(null, IntervalSchedule.next(anchor, 6, Instant.parse("2026-06-02T23:00:00Z"), "2026-06-02", zone))
    assertEquals(listOf(Instant.parse("2026-06-02T05:00:00Z"), Instant.parse("2026-06-02T11:00:00Z")), IntervalSchedule.dueToday(anchor, 6, Instant.parse("2026-06-02T00:00:00Z"), Instant.parse("2026-06-02T12:00:00Z"), null, zone))
  }
}
