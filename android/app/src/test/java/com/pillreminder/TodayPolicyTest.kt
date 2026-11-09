package com.pillreminder

import java.time.Instant
import java.time.ZoneId
import org.junit.Assert.*
import org.junit.Test

class TodayPolicyTest {
  @Test fun inactiveReminderKeepsOlderUnconfirmedOccurrencesAccessible() {
    val zone = ZoneId.of("Europe/London")
    val occurrence = MedicineRepository.Occurrence("id", Instant.parse("2026-06-01T09:00:00Z").toEpochMilli(), null)
    val now = Instant.parse("2026-06-03T12:00:00Z")
    val medicine = Medicine("id", "Example", "", listOf("09:00"), 0)
    assertFalse(TodayPolicy.includes(occurrence, medicine, now, zone))
    assertTrue(TodayPolicy.includes(occurrence, medicine.copy(status = "paused"), now, zone))
    assertTrue(TodayPolicy.includes(occurrence, medicine.copy(status = "deleted"), now, zone))
    assertFalse(TodayPolicy.includes(occurrence.copy(outcome = "skipped"), medicine.copy(status = "deleted"), now, zone))
  }
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
