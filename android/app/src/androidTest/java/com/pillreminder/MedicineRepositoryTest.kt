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
}
