package com.myreminders

import java.time.Instant
import java.time.ZoneId

object TodayPolicy {
  fun includes(occurrence: MedicineRepository.Occurrence, medicine: Medicine?, now: Instant, zone: ZoneId): Boolean {
    val today = now.atZone(zone).toLocalDate()
    val start = today.atStartOfDay(zone).toInstant().toEpochMilli()
    val end = today.plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli()
    return occurrence.at in start until end || (occurrence.retained && !occurrence.cleared && occurrence.outcome == null) || (occurrence.at < start && medicine?.status != "active" && medicine != null && !occurrence.cleared && occurrence.outcome == null) || (
      occurrence.at < start && occurrence.outstanding && !occurrence.cleared && occurrence.outcome == null && medicine != null &&
        DailySchedule.next(medicine, Instant.ofEpochMilli(maxOf(occurrence.at, medicine.changedAt)), zone)?.let { it > now } != false
      )
  }
}
