package com.myreminders

import java.time.Instant
import java.time.ZoneId

object TodayPolicy {
  fun actionable(occurrence: MedicineRepository.Occurrence, medicine: Medicine?, now: Instant, zone: ZoneId): Boolean {
    if (medicine == null || occurrence.cleared || occurrence.missedAcknowledged || occurrence.outcome != null || occurrence.at > now.toEpochMilli()) return false
    if (medicine.status != "active") return true
    return DailySchedule.next(medicine, Instant.ofEpochMilli(maxOf(occurrence.at, medicine.changedAt)), zone)?.let { it > now } != false
  }

  fun includes(occurrence: MedicineRepository.Occurrence, medicine: Medicine?, now: Instant, zone: ZoneId): Boolean {
    val today = now.atZone(zone).toLocalDate()
    val start = today.atStartOfDay(zone).toInstant().toEpochMilli()
    val end = today.plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli()
    val oneOff = medicine != null && medicine.scheduleKind == "daily" && medicine.startDate != null && medicine.startDate == medicine.endDate && medicine.times.size == 1
    return (oneOff && occurrence.at <= now.toEpochMilli() && !occurrence.cleared && occurrence.outcome == null) || occurrence.at in start until end || (occurrence.retained && !occurrence.cleared && occurrence.outcome == null) || (occurrence.at < start && medicine?.status != "active" && medicine != null && !occurrence.cleared && occurrence.outcome == null) || (
      occurrence.at < start && occurrence.outstanding && !occurrence.cleared && occurrence.outcome == null && medicine != null &&
        DailySchedule.next(medicine, Instant.ofEpochMilli(maxOf(occurrence.at, medicine.changedAt)), zone)?.let { it > now } != false
      )
  }
}
