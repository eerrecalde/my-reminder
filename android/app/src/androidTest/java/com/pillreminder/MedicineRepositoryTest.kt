package com.pillreminder

import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import android.content.Context
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class MedicineRepositoryTest {
  @Test fun saveSurvivesReopenAndDoseIdentityIsStable() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    context.deleteDatabase("medicines-test.db")
    val first = MedicineRepository(context, "medicines-test.db")
    val medicine = first.save("Aspirin", "one tablet", listOf("09:00", "21:00"), 1000)
    first.close()
    val reopened = MedicineRepository(context, "medicines-test.db")
    assertEquals(medicine, reopened.all().single())
    reopened.recordDue(medicine.id, 2000)
    assertEquals(listOf(medicine.id to 2000L), reopened.todayDoses(0, 3000))
    assertFalse(reopened.recordDose(medicine.id, 2000))
    assertTrue(reopened.recordDose(medicine.id, 2500))
    assertFalse(reopened.recordDose(medicine.id, 2500))
    reopened.close()
    context.deleteDatabase("medicines-test.db")
  }
  @Test fun openingAppMustNotSuppressDelayedReminder() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    context.deleteDatabase("race-test.db")
    val repository = MedicineRepository(context, "race-test.db")
    val medicine = repository.save("Test", "", listOf("09:00"), 1000)
    repository.setAlarm(medicine.id, 2000, "valid")
    repository.recordDue(medicine.id, 2000) // normal app resume reconstructs today's due dose
    assertTrue("A still-valid delayed alarm must be allowed to notify", repository.claimAlarm(medicine.id, 2000, "valid"))
    repository.close()
    context.deleteDatabase("race-test.db")
  }

  @Test fun recoveryMustNotAllowAnOlderQueuedReminder() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    context.deleteDatabase("stale-test.db")
    val repository = MedicineRepository(context, "stale-test.db")
    val medicine = repository.save("Test", "", listOf("09:00"), 1000)
    repository.setAlarm(medicine.id, 2000, "old")
    repository.invalidateAlarm(medicine.id)
    repository.setAlarm(medicine.id, 3000, "new")
    assertFalse("An obsolete reminder must not sound after recovery", repository.claimAlarm(medicine.id, 2000, "old"))
    assertEquals("new", repository.alarm(medicine.id)?.token)
    assertTrue(repository.claimAlarm(medicine.id, 3000, "new"))
    assertFalse(repository.claimAlarm(medicine.id, 3000, "new"))
    repository.close()
    context.deleteDatabase("stale-test.db")
  }
}
