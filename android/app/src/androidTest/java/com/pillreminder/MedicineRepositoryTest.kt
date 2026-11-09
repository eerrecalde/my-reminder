package com.pillreminder

import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import android.content.Context
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class MedicineRepositoryTest {
  @Test fun recentUpgradesRetainAlarmAndOccurrenceDetails() {
    for (version in listOf(12, 13)) {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val db = "v12-transition-upgrade.db"
    context.deleteDatabase(db)
    val item = MedicineRepository(context, db).use { repo ->
      val saved = repo.save("Aspirin", "With food", listOf("09:00"), 1000)
      repo.recordDue(saved.id, 2000)
      repo.setOutcome(saved.id, 2000, "completed")
      repo.setAlarm(saved.id, 3000, "future")
      repo.markAlarmRegistered(saved.id, "future")
      repo.writableDatabase.execSQL("ALTER TABLE medicines DROP COLUMN start_date")
      repo.writableDatabase.execSQL("ALTER TABLE medicines DROP COLUMN end_date")
      if (version == 12) repo.writableDatabase.execSQL("DROP TABLE reminder_transitions")
      repo.writableDatabase.version = version
      saved
    }
    MedicineRepository(context, db).use { repo ->
      assertEquals(item, repo.all().single())
      assertEquals(MedicineRepository.Alarm(item.id, 3000, "future", true), repo.alarm(item.id))
      val occurrence = repo.occurrences().single()
      assertEquals(item.id, occurrence.medicineId)
      assertEquals(2000L, occurrence.at)
      assertEquals("Aspirin", occurrence.name)
      assertEquals("With food", occurrence.instructions)
      assertEquals("medicine", occurrence.type)
      assertEquals("completed", occurrence.outcome)
      repo.beginTransition(item.id)
      assertEquals("future", repo.transition(item.id)?.token)
    }
    context.deleteDatabase(db)
    }
  }
  @Test fun transitionPersistsOldAlarmUntilEditIsCommitted() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val db = "transition-test.db"
    context.deleteDatabase(db)
    val item = MedicineRepository(context, db).use { repo ->
      val saved = repo.save("Aspirin", "With food", listOf("09:00"), 1000)
      repo.setAlarm(saved.id, 2000, "old")
      repo.markAlarmRegistered(saved.id, "old")
      repo.beginTransition(saved.id)
      saved
    }
    MedicineRepository(context, db).use { repo ->
      assertEquals("old", repo.transition(item.id)?.token)
      assertEquals("old", repo.alarm(item.id)?.token)
      repo.edit(item.id, "Water", "", listOf("10:00"), "reminder", "notification", 3000)
    }
    MedicineRepository(context, db).use { repo ->
      assertEquals("old", repo.transition(item.id)?.token)
      assertNull(repo.alarm(item.id))
      val due = repo.occurrences().single()
      assertEquals(2000L, due.at)
      assertEquals("Aspirin", due.name)
      assertEquals("Water", repo.all().single().name)
      repo.finishTransition(item.id)
      assertNull(repo.transition(item.id))
    }
    context.deleteDatabase(db)
  }
  @Test fun editedAndDeletedReminderPreservesOccurrenceDetails() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val db = "manage-test.db"
    context.deleteDatabase(db)
    val id = MedicineRepository(context, db).use { repo ->
      val item = repo.save("Aspirin", "With food", listOf("09:00"), 1000)
      repo.recordDue(item.id, 2000)
      repo.setOutcome(item.id, 2000, "completed")
      repo.edit(item.id, "Water", "With food", listOf("10:00"), "reminder", "alarm", 3000)
      repo.setStatus(item.id, "deleted", 4000)
      item.id
    }
    MedicineRepository(context, db).use { repo ->
      assertEquals("deleted", repo.all().single().status)
      val occurrence = repo.occurrences().single()
      assertEquals("Aspirin", occurrence.name)
      assertEquals("With food", occurrence.instructions)
      assertEquals("medicine", occurrence.type)
      assertEquals("completed", occurrence.outcome)
      repo.setOutcome(id, 2000, "skipped")
      assertEquals("skipped", repo.outcome(id, 2000))
    }
    context.deleteDatabase(db)
  }
  @Test fun nextOccurrenceMarksOnlyEarlierUnansweredOccurrencesMissed() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val name = "missed-test.db"
    context.deleteDatabase(name)
    MedicineRepository(context, name).use { repo ->
      val medicine = repo.save("Water", "", listOf("09:00"), 1000, "reminder")
      repo.recordDue(medicine.id, 2000)
      repo.recordDue(medicine.id, 3000)
      repo.setOutcome(medicine.id, 2000, "completed")
      repo.recordDue(medicine.id, 4000)
      assertFalse(repo.markMissed(medicine.id, 2000))
      assertTrue(repo.markMissed(medicine.id, 3000))
      assertEquals(listOf("completed", "missed", null), repo.occurrences().map { it.outcome })
      assertFalse(repo.setOutcomeIfUnconfirmed(medicine.id, 3000, "skipped"))
      assertTrue(repo.setOutcomeIfUnconfirmed(medicine.id, 4000, "skipped"))
      assertFalse(repo.setOutcomeIfUnconfirmed(medicine.id, 4000, "completed"))
    }
    context.deleteDatabase(name)
  }
  @Test fun previousSchemasRetainAlarmAndOccurrence() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    for (version in listOf(6, 7, 8, 9, 11)) {
    val name = "v6-upgrade.db"
    context.deleteDatabase(name)
    context.openOrCreateDatabase(name, Context.MODE_PRIVATE, null).use { db ->
      db.execSQL("CREATE TABLE medicines (id TEXT PRIMARY KEY, name TEXT NOT NULL, instructions TEXT NOT NULL, times TEXT NOT NULL, created_at INTEGER NOT NULL, type TEXT NOT NULL, mode TEXT NOT NULL)")
      db.execSQL("CREATE TABLE alarms (medicine_id TEXT PRIMARY KEY, scheduled_at INTEGER NOT NULL, token TEXT NOT NULL, registered INTEGER NOT NULL DEFAULT 0)")
      db.execSQL("CREATE TABLE doses (id TEXT PRIMARY KEY, medicine_id TEXT NOT NULL, scheduled_at INTEGER NOT NULL, alerted INTEGER NOT NULL DEFAULT 0)")
      if (version >= 7) db.execSQL("ALTER TABLE doses ADD COLUMN outcome TEXT")
      if (version >= 8) {
        db.execSQL("ALTER TABLE doses ADD COLUMN cleared INTEGER NOT NULL DEFAULT 0")
        db.execSQL("ALTER TABLE doses ADD COLUMN missed_acknowledged INTEGER NOT NULL DEFAULT 0")
      }
      if (version >= 9) {
        db.execSQL("ALTER TABLE doses ADD COLUMN silenced INTEGER NOT NULL DEFAULT 0")
        db.execSQL("ALTER TABLE doses ADD COLUMN revision INTEGER NOT NULL DEFAULT 0")
        db.execSQL("CREATE TABLE occurrence_tracking (medicine_id TEXT PRIMARY KEY, starts_after INTEGER NOT NULL)")
        db.execSQL("INSERT INTO occurrence_tracking VALUES ('m', 1000)")
      }
      if (version >= 10) db.execSQL("CREATE TABLE snoozes (medicine_id TEXT NOT NULL, occurrence_at INTEGER NOT NULL, alert_at INTEGER NOT NULL, token TEXT NOT NULL, PRIMARY KEY (medicine_id, occurrence_at))")
      if (version >= 11) db.execSQL("ALTER TABLE doses ADD COLUMN outstanding INTEGER NOT NULL DEFAULT 0")
      db.execSQL("INSERT INTO medicines VALUES ('m', 'Water', '', '[\"09:00\"]', 1000, 'reminder', 'notification')")
      db.execSQL("INSERT INTO alarms VALUES ('m', 3000, 'token', 1)")
      db.execSQL("INSERT INTO doses (id, medicine_id, scheduled_at, alerted) VALUES ('m:2000', 'm', 2000, 1)")
      db.version = version
    }
    MedicineRepository(context, name).use { repo ->
      assertEquals(listOf("09:00"), repo.all().single().times)
      assertEquals(MedicineRepository.Alarm("m", 3000, "token", true), repo.alarm("m"))
      assertEquals(listOf("m" to 2000L), repo.todayDoses(0, 3000))
      assertNull(repo.outcome("m", 2000))
      assertEquals("Water", repo.occurrences().single().name)
      if (version < 9) assertTrue(repo.trackingStart("m") >= java.time.LocalDate.now().atStartOfDay(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli() - 1)
    }
    context.deleteDatabase(name)
    }
  }

  @Test fun staleUndoCannotOverwriteANewerOutcome() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val name = "revision-test.db"
    context.deleteDatabase(name)
    MedicineRepository(context, name).use { repo ->
      val item = repo.save("Water", "", listOf("09:00"), 1000, "reminder")
      repo.recordDue(item.id, 2000)
      val first = repo.setOutcome(item.id, 2000, "completed")
      assertFalse(repo.setOutcome(item.id, 2000, "completed").changed)
      repo.setOutcome(item.id, 2000, "skipped")
      val last = repo.setOutcome(item.id, 2000, "completed")
      assertFalse(repo.undoOutcome(item.id, 2000, first.revision, first.previous, false))
      assertEquals("completed", repo.outcome(item.id, 2000))
      assertTrue(repo.undoOutcome(item.id, 2000, last.revision, last.previous, false))
      assertEquals("skipped", repo.outcome(item.id, 2000))
      repo.clearHistory()
      val restored = repo.setOutcome(item.id, 2000, "completed")
      assertTrue(restored.previousCleared)
      assertTrue(repo.undoOutcome(item.id, 2000, restored.revision, restored.previous, false, restored.previousCleared))
      assertTrue(repo.occurrences().isEmpty())
    }
    context.deleteDatabase(name)
  }

  @Test fun historyClearingRetainsRemindersAndDoesNotRecreateClearedOccurrences() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val name = "history-test.db"
    context.deleteDatabase(name)
    MedicineRepository(context, name).use { repo ->
      val medicine = repo.save("Water", "", listOf("09:00"), 1000, "reminder")
      repo.recordDue(medicine.id, 2000)
      repo.setOutcome(medicine.id, 2000, "completed")
      repo.clearHistory()
      repo.recordDue(medicine.id, 2000)
      assertTrue(repo.occurrences().isEmpty())
      assertEquals(medicine, repo.all().single())
    }
    context.deleteDatabase(name)
  }
  @Test fun outcomeSurvivesReopenAndCanBeCorrected() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val name = "outcome-test.db"
    context.deleteDatabase(name)
    val id = MedicineRepository(context, name).use { repo ->
      val medicine = repo.save("Water", "", listOf("09:00"), 1000, "reminder")
      repo.recordDue(medicine.id, 2000)
      repo.setOutcome(medicine.id, 2000, "completed")
      repo.setOutcome(medicine.id, 2000, "completed")
      medicine.id
    }
    MedicineRepository(context, name).use { repo ->
      assertEquals("completed", repo.outcome(id, 2000))
      repo.setOutcome(id, 2000, "skipped")
      assertEquals("skipped", repo.outcome(id, 2000))
      repo.setOutcome(id, 2000, null)
      assertNull(repo.outcome(id, 2000))
    }
    context.deleteDatabase(name)
  }
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
