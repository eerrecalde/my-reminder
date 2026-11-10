package com.myreminders

import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId

/** Weekdays use ISO numbering, Monday = 1 and Sunday = 7. */
object WeekdaySchedule {
  fun next(times: List<String>, weekdays: List<Int>, after: Instant, zone: ZoneId, startDate: String? = null, endDate: String? = null): Instant? {
    if (times.isEmpty() || weekdays.isEmpty()) return null
    require(weekdays.all { it in 1..7 })
    val clocks = times.distinct().map(LocalTime::parse)
    val start = startDate?.let(LocalDate::parse)
    val end = endDate?.let(LocalDate::parse)
    var day = after.atZone(zone).toLocalDate()
    if (start != null && day < start) day = start
    while (end == null || day <= end) {
      if (day.dayOfWeek.value in weekdays) {
        val candidate = clocks.map { day.atTime(it).atZone(zone).toInstant() }.filter { it > after }.minOrNull()
        if (candidate != null) return candidate
      }
      day = day.plusDays(1)
    }
    return null
  }

  fun dueToday(times: List<String>, weekdays: List<Int>, created: Instant, now: Instant, zone: ZoneId, startDate: String? = null, endDate: String? = null): List<Instant> {
    require(weekdays.all { it in 1..7 })
    val day = now.atZone(zone).toLocalDate()
    if (day.dayOfWeek.value !in weekdays || (startDate != null && day < LocalDate.parse(startDate)) || (endDate != null && day > LocalDate.parse(endDate))) return emptyList()
    return times.distinct().map { day.atTime(LocalTime.parse(it)).atZone(zone).toInstant() }.filter { it > created && it <= now }.distinct().sorted()
  }
}
