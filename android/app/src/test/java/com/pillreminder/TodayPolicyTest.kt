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
    assertTrue(TodayPolicy.includes(occurrence.copy(retained = true), medicine, now, zone))
    assertTrue(TodayPolicy.includes(occurrence, medicine.copy(status = "paused"), now, zone))
    assertTrue(TodayPolicy.includes(occurrence, medicine.copy(status = "deleted"), now, zone))
    assertFalse(TodayPolicy.includes(occurrence.copy(outcome = "skipped"), medicine.copy(status = "deleted"), now, zone))
  }
  @Test fun editedScheduleKeepsPriorOutstandingOccurrenceUntilNextFutureReminder() {
    val zone = ZoneId.of("UTC")
    val occurrence = MedicineRepository.Occurrence("id", Instant.parse("2026-06-01T07:00:00Z").toEpochMilli(), null, outstanding = true)
    val medicine = Medicine("id", "Example", "", listOf("08:00"), 0, changedAt = Instant.parse("2026-06-01T09:00:00Z").toEpochMilli())
    assertTrue(TodayPolicy.includes(occurrence, medicine, Instant.parse("2026-06-02T07:30:00Z"), zone))
    assertFalse(TodayPolicy.includes(occurrence, medicine, Instant.parse("2026-06-02T08:00:00Z"), zone))
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
