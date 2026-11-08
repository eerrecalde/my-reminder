package com.pillreminder

import java.time.Instant
import java.time.ZoneId

object TodayPolicy {
  fun includes(occurrence: MedicineRepository.Occurrence, medicine: Medicine?, now: Instant, zone: ZoneId): Boolean {
    val today = now.atZone(zone).toLocalDate()
    val start = today.atStartOfDay(zone).toInstant().toEpochMilli()
    val end = today.plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli()
    return occurrence.at in start until end || (
      occurrence.at < start && occurrence.outstanding && !occurrence.cleared && occurrence.outcome == null && medicine != null &&
        DailySchedule.next(medicine.times, Instant.ofEpochMilli(occurrence.at), zone) > now
      )
  }
}
