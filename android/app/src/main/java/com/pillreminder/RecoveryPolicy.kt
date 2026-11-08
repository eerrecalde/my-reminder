package com.pillreminder

object RecoveryPolicy {
  fun shouldRegister(alarm: MedicineRepository.Alarm, now: Long): Boolean = !alarm.registered || alarm.at > now
  fun bootChanged(previous: Int, current: Int): Boolean = previous >= 0 && current >= 0 && previous != current
  fun needsRepair(alarm: MedicineRepository.Alarm?): Boolean = alarm == null || !alarm.registered
}
