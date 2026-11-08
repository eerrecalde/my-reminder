package com.pillreminder

import org.junit.Assert.*
import org.junit.Test

class RecoveryPolicyTest {
  @Test fun `a registered alarm remains eligible even if delivery is delayed`() {
    assertFalse(RecoveryPolicy.needsRepair(MedicineRepository.Alarm("medicine", 1000, "token", true)))
  }
  @Test fun `an interrupted registration or consumed alarm needs repair`() {
    assertTrue(RecoveryPolicy.needsRepair(MedicineRepository.Alarm("medicine", 1000, "token", false)))
    assertTrue(RecoveryPolicy.needsRepair(null))
  }
  @Test fun `overdue interrupted registration retries the same alarm`() {
    val alarm = MedicineRepository.Alarm("medicine", 1000, "token", false)
    assertTrue(RecoveryPolicy.shouldRegister(alarm, 2000))
  }
  @Test fun `registered delayed alarm is left for normal delivery`() {
    val alarm = MedicineRepository.Alarm("medicine", 1000, "token", true)
    assertFalse(RecoveryPolicy.shouldRegister(alarm, 2000))
  }
  @Test fun `a new boot invalidates old alarms before they can be retried`() {
    assertTrue(RecoveryPolicy.bootChanged(12, 13))
    assertFalse(RecoveryPolicy.bootChanged(13, 13))
  }
}
