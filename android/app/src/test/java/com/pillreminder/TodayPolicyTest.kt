package com.pillreminder

import java.time.Instant
import java.time.ZoneId
import org.junit.Assert.*
import org.junit.Test

class TodayPolicyTest {
  @Test fun previousDayAlertStaysUntilActionOrNextOccurrence() {
    val zone = ZoneId.of("Europe/London")
    val at = Instant.parse("2026-06-01T22:55:00Z").toEpochMilli()
    val now = Instant.parse("2026-06-01T23:05:00Z")
    for (type in listOf("reminder", "medicine")) for (mode in listOf("notification", "alarm")) {
      val medicine = Medicine("id", "Example", "", listOf("23:55"), 0, type, mode)
      val due = MedicineRepository.Occurrence("id", at, null, outstanding = true)
      assertTrue(TodayPolicy.includes(due, medicine, now, zone))
      assertFalse(TodayPolicy.includes(due.copy(outcome = "completed"), medicine, now, zone))
      assertFalse(TodayPolicy.includes(due.copy(outcome = "skipped"), medicine, now, zone))
      assertFalse(TodayPolicy.includes(due.copy(outstanding = false), medicine, now, zone))
      assertFalse(TodayPolicy.includes(due, medicine, Instant.parse("2026-06-02T22:55:00Z"), zone))
    }
  }
}
