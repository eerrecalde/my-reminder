package com.myreminders

import java.time.Instant
import java.time.LocalTime
import java.time.LocalDate
import java.time.ZoneId

object DailySchedule {
  fun next(medicine: Medicine, after: Instant, zone: ZoneId): Instant? {
    if (medicine.scheduleKind == "weekday") return WeekdaySchedule.next(medicine.times, medicine.weekdays, after, zone, medicine.startDate, medicine.endDate)
    if (medicine.scheduleKind == "interval") {
      val start = medicine.startDate?.let { LocalDate.parse(it).atStartOfDay(zone).toInstant().minusNanos(1) }
      return IntervalSchedule.next(Instant.ofEpochMilli(requireNotNull(medicine.intervalAnchor)), requireNotNull(medicine.intervalHours), if (start == null) after else maxOf(after, start), medicine.endDate, zone)
    }
    val start = medicine.startDate?.let(LocalDate::parse)
    val end = medicine.endDate?.let(LocalDate::parse)
    var day = after.atZone(zone).toLocalDate()
    if (start != null && day < start) day = start
    val times = medicine.times.distinct().map(LocalTime::parse)
    require(times.isNotEmpty())
    while (end == null || day <= end) {
      val candidate = if (medicine.scheduleKind != "monthly" || MonthlySchedule.matches(day, medicine.monthlyDay, medicine.shortMonthPolicy)) times.map { day.atTime(it).atZone(zone).toInstant() }.filter { it > after }.minOrNull() else null
      if (candidate != null) return candidate
      day = day.plusDays(1)
    }
    return null
  }
  fun dueToday(medicine: Medicine, now: Instant, zone: ZoneId): List<Instant> {
    val created = Instant.ofEpochMilli(maxOf(medicine.createdAt, medicine.changedAt))
    if (medicine.scheduleKind == "weekday") return WeekdaySchedule.dueToday(medicine.times, medicine.weekdays, created, now, zone, medicine.startDate, medicine.endDate)
    if (medicine.scheduleKind == "interval") {
      val start = medicine.startDate?.let { LocalDate.parse(it).atStartOfDay(zone).toInstant().minusNanos(1) }
      return IntervalSchedule.dueToday(Instant.ofEpochMilli(requireNotNull(medicine.intervalAnchor)), requireNotNull(medicine.intervalHours), if (start == null) created else maxOf(created, start), now, medicine.endDate, zone)
    }
    val date = now.atZone(zone).toLocalDate()
    if (medicine.scheduleKind == "monthly" && !MonthlySchedule.matches(date, medicine.monthlyDay, medicine.shortMonthPolicy)) return emptyList()
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
