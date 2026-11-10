package com.myreminders

import org.junit.Assert.*
import org.junit.Test

class RecoveryPolicyTest {
  @Test fun `overdue interrupted registration does not produce a catch-up alarm`() {
    val alarm = MedicineRepository.Alarm("medicine", 1000, "token", false)
    assertFalse(RecoveryPolicy.shouldRegister(alarm, 2000))
  }
  @Test fun `registered delayed alarm is left for normal delivery`() {
    val alarm = MedicineRepository.Alarm("medicine", 1000, "token", true)
    assertFalse(RecoveryPolicy.shouldRegister(alarm, 2000))
  }
  @Test fun `a new boot invalidates old alarms before they can be retried`() {
    assertTrue(RecoveryPolicy.bootChanged(12, 13))
    assertFalse(RecoveryPolicy.bootChanged(13, 13))
  }
  @Test fun `watchdog retries the same overdue alarm without claiming it`() {
    val alarm = MedicineRepository.Alarm("medicine", 1000, "token", true)
    assertTrue(RecoveryPolicy.shouldRetry(alarm, 1000, "token"))
    assertFalse(RecoveryPolicy.shouldRetry(alarm, 1000, "older-token"))
  }
  @Test fun `an interrupted recovery continues invalidating stale alarms on the next run`() {
    assertTrue(RecoveryPolicy.shouldInvalidate(false, true, true, false, true))
    assertFalse(RecoveryPolicy.shouldInvalidate(false, true, true, false, false))
  }
}
