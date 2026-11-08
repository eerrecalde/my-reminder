package com.pillreminder

import java.time.Instant
import java.time.LocalTime
import java.time.ZoneId

object DailySchedule {
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
