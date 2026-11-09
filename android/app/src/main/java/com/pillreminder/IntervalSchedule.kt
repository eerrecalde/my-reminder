package com.pillreminder

import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

/** An interval schedule keeps its original instant across time-zone and clock changes. */
object IntervalSchedule {
  fun next(anchor: Instant, hours: Int, after: Instant, endDate: String?, zone: ZoneId): Instant? {
    require(hours > 0)
    val interval = hours.toLong() * 3_600_000L
    val anchorMs = anchor.toEpochMilli()
    val afterMs = after.toEpochMilli()
    val index = if (afterMs < anchorMs) 0L else (afterMs - anchorMs) / interval + 1
    val candidate = Instant.ofEpochMilli(Math.addExact(anchorMs, Math.multiplyExact(index, interval)))
    if (endDate != null && candidate.atZone(zone).toLocalDate() > LocalDate.parse(endDate)) return null
    return candidate
  }

  fun dueToday(anchor: Instant, hours: Int, created: Instant, now: Instant, endDate: String?, zone: ZoneId): List<Instant> {
    val startOfDay = now.atZone(zone).toLocalDate().atStartOfDay(zone).toInstant()
    var after = maxOf(created, startOfDay.minusNanos(1))
    val result = mutableListOf<Instant>()
    while (true) {
      val occurrence = next(anchor, hours, after, endDate, zone) ?: break
      if (occurrence > now) break
      result.add(occurrence)
      after = occurrence
    }
    return result
  }
}
