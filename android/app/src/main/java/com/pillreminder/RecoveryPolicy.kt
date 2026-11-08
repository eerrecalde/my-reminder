package com.pillreminder

object RecoveryPolicy {
  fun needsRepair(alarm: MedicineRepository.Alarm?): Boolean = alarm == null || !alarm.registered
}
