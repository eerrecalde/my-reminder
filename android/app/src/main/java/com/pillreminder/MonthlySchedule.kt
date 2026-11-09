package com.pillreminder

import java.time.LocalDate

object MonthlySchedule {
  /** A null day denotes the last day of each month. */
  fun matches(date: LocalDate, dayOfMonth: Int?, shortMonth: String): Boolean {
    require(dayOfMonth == null || dayOfMonth in 1..31)
    require(shortMonth == "last" || shortMonth == "skip")
    val last = date.lengthOfMonth()
    val target = dayOfMonth ?: last
    return date.dayOfMonth == if (target > last && shortMonth == "last") last else target
  }
}
