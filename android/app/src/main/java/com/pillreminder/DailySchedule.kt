package com.pillreminder

import java.time.Instant
import java.time.LocalTime
import java.time.ZoneId

object DailySchedule {
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
