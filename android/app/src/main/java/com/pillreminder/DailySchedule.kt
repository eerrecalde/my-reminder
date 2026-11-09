package com.pillreminder

import java.time.Instant
import java.time.LocalTime
import java.time.LocalDate
import java.time.ZoneId

object DailySchedule {
  fun next(medicine: Medicine, after: Instant, zone: ZoneId): Instant? {
    val start = medicine.startDate?.let(LocalDate::parse)
    val end = medicine.endDate?.let(LocalDate::parse)
    var day = after.atZone(zone).toLocalDate()
    if (start != null && day < start) day = start
    val times = medicine.times.distinct().map(LocalTime::parse)
    require(times.isNotEmpty())
    while (end == null || day <= end) {
      val candidate = times.map { day.atTime(it).atZone(zone).toInstant() }.filter { it > after }.minOrNull()
      if (candidate != null) return candidate
      day = day.plusDays(1)
    }
    return null
  }
  fun dueToday(medicine: Medicine, now: Instant, zone: ZoneId): List<Instant> {
    val date = now.atZone(zone).toLocalDate()
    if (medicine.startDate != null && date < LocalDate.parse(medicine.startDate)) return emptyList()
    if (medicine.endDate != null && date > LocalDate.parse(medicine.endDate)) return emptyList()
    return dueToday(medicine.times, Instant.ofEpochMilli(maxOf(medicine.createdAt, medicine.changedAt)), now, zone)
  }
  fun dueToday(times: List<String>, created: Instant, now: Instant, zone: ZoneId): List<Instant> {
    val date = now.atZone(zone).toLocalDate()
    return times.distinct().map { date.atTime(LocalTime.parse(it)).atZone(zone).toInstant() }
      .filter { it > created && it <= now }.distinct().sorted()
  }
  fun next(times: List<String>, after: Instant, zone: ZoneId): Instant {
    require(times.isNotEmpty())
    val localTimes = times.distinct().map(LocalTime::parse)
    var day = after.atZone(zone).toLocalDate()
    while (true) {
      val next = localTimes.map { day.atTime(it).atZone(zone).toInstant() }
        .filter { it > after }.minOrNull()
      if (next != null) return next
      day = day.plusDays(1)
    }
  }
}
