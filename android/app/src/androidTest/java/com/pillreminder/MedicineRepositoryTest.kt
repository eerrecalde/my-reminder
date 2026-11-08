package com.pillreminder

import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import android.content.Context
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class MedicineRepositoryTest {
  @Test fun versionFourMedicineAndAlarmSurviveUpgrade() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val name = "migration-test.db"
    context.deleteDatabase(name)
    val legacy = context.openOrCreateDatabase(name, Context.MODE_PRIVATE, null)
    legacy.execSQL("CREATE TABLE medicines (id TEXT PRIMARY KEY, name TEXT NOT NULL, instructions TEXT NOT NULL, times TEXT NOT NULL, created_at INTEGER NOT NULL)")
    legacy.execSQL("CREATE TABLE alarms (medicine_id TEXT PRIMARY KEY, scheduled_at INTEGER NOT NULL, token TEXT NOT NULL, registered INTEGER NOT NULL DEFAULT 0)")
    legacy.execSQL("CREATE TABLE doses (id TEXT PRIMARY KEY, medicine_id TEXT NOT NULL, scheduled_at INTEGER NOT NULL, alerted INTEGER NOT NULL DEFAULT 0)")
    legacy.execSQL("INSERT INTO medicines VALUES ('old', 'Aspirin', 'one tablet', '[\"09:00\"]', 1000)")
    legacy.execSQL("INSERT INTO alarms VALUES ('old', 2000, 'token', 1)")
    legacy.execSQL("INSERT INTO doses VALUES ('old:1500', 'old', 1500, 1)")
    legacy.version = 4
    legacy.close()
    MedicineRepository(context, name).use { repo ->
      assertEquals(Medicine("old", "Aspirin", "one tablet", listOf("09:00"), 1000, "medicine"), repo.all().single())
      assertEquals(MedicineRepository.Alarm("old", 2000, "token", true), repo.alarm("old"))
      assertEquals(listOf("old" to 1500L), repo.todayDoses(0, 2000))
      repo.save("Water", "", listOf("10:00"), 3000, "reminder", "alarm")
    }
    MedicineRepository(context, name).use {
      assertEquals(listOf("medicine", "reminder"), it.all().map { item -> item.type })
      assertEquals(listOf("notification", "alarm"), it.all().map { item -> item.mode })
    }
    context.deleteDatabase(name)
  }

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
