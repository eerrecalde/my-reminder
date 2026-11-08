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
}
