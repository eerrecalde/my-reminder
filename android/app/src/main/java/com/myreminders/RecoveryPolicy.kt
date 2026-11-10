package com.myreminders

object RecoveryPolicy {
  fun shouldInvalidate(recovery: Boolean, available: Boolean, wasAvailable: Boolean, bootChanged: Boolean, pending: Boolean): Boolean =
    recovery || !available || !wasAvailable || bootChanged || pending
  fun shouldRegister(alarm: MedicineRepository.Alarm, now: Long): Boolean = alarm.at > now
  fun bootChanged(previous: Int, current: Int): Boolean = previous >= 0 && current >= 0 && previous != current
  fun shouldRetry(alarm: MedicineRepository.Alarm, at: Long, token: String): Boolean = alarm.at == at && alarm.token == token
}
