package com.myreminders

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import org.json.JSONArray
import java.util.UUID

data class Medicine(val id: String, val name: String, val instructions: String, val times: List<String>, val createdAt: Long, val type: String = "medicine", val mode: String = "notification", val status: String = "active", val changedAt: Long = 0, val startDate: String? = null, val endDate: String? = null, val scheduleKind: String = "daily", val weekdays: List<Int> = emptyList(), val intervalHours: Int? = null, val intervalAnchor: Long? = null, val monthlyDay: Int? = null, val shortMonthPolicy: String = "last")

/** Shared by the React Native bridge and Android receivers. */
class MedicineRepository(context: Context, databaseName: String = "medicines.db") : SQLiteOpenHelper(context.applicationContext, databaseName, null, 17) {
  override fun onCreate(db: SQLiteDatabase) {
    db.execSQL("CREATE TABLE medicines (id TEXT PRIMARY KEY, name TEXT NOT NULL, instructions TEXT NOT NULL, times TEXT NOT NULL, created_at INTEGER NOT NULL, type TEXT NOT NULL DEFAULT 'medicine', mode TEXT NOT NULL DEFAULT 'notification', status TEXT NOT NULL DEFAULT 'active', changed_at INTEGER NOT NULL DEFAULT 0, start_date TEXT, end_date TEXT, schedule_kind TEXT NOT NULL DEFAULT 'daily', weekdays TEXT NOT NULL DEFAULT '[]', interval_hours INTEGER, interval_anchor INTEGER, monthly_day INTEGER, short_month_policy TEXT NOT NULL DEFAULT 'last')")
    createSoundChoices(db)
    db.execSQL("CREATE TABLE alarms (medicine_id TEXT PRIMARY KEY, scheduled_at INTEGER NOT NULL, token TEXT NOT NULL, registered INTEGER NOT NULL DEFAULT 0)")
    db.execSQL("CREATE TABLE doses (id TEXT PRIMARY KEY, medicine_id TEXT NOT NULL, scheduled_at INTEGER NOT NULL, alerted INTEGER NOT NULL DEFAULT 0, outcome TEXT, cleared INTEGER NOT NULL DEFAULT 0, missed_acknowledged INTEGER NOT NULL DEFAULT 0, silenced INTEGER NOT NULL DEFAULT 0, revision INTEGER NOT NULL DEFAULT 0, outstanding INTEGER NOT NULL DEFAULT 0, name TEXT, instructions TEXT, type TEXT, mode TEXT, times TEXT, retained INTEGER NOT NULL DEFAULT 0, one_off INTEGER NOT NULL DEFAULT 0)")
    db.execSQL("CREATE TABLE snoozes (medicine_id TEXT NOT NULL, occurrence_at INTEGER NOT NULL, alert_at INTEGER NOT NULL, token TEXT NOT NULL, PRIMARY KEY (medicine_id, occurrence_at))")
    db.execSQL("CREATE TABLE reminder_transitions (medicine_id TEXT PRIMARY KEY, scheduled_at INTEGER, token TEXT, registered INTEGER, changed_at INTEGER NOT NULL, committed INTEGER NOT NULL DEFAULT 0)")
    db.execSQL("CREATE TABLE occurrence_tracking (medicine_id TEXT PRIMARY KEY, starts_after INTEGER NOT NULL)")
  }
  private fun createSoundChoices(db: SQLiteDatabase) {
    db.execSQL("CREATE TABLE IF NOT EXISTS reminder_sound_choices (medicine_id TEXT NOT NULL, mode TEXT NOT NULL, choice TEXT NOT NULL, PRIMARY KEY (medicine_id, mode))")
  }

  override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
    if (oldVersion < 16) createSoundChoices(db)
    if (oldVersion < 15) {
      db.execSQL("ALTER TABLE medicines ADD COLUMN schedule_kind TEXT NOT NULL DEFAULT 'daily'")
      db.execSQL("ALTER TABLE medicines ADD COLUMN weekdays TEXT NOT NULL DEFAULT '[]'")
      db.execSQL("ALTER TABLE medicines ADD COLUMN interval_hours INTEGER")
      db.execSQL("ALTER TABLE medicines ADD COLUMN interval_anchor INTEGER")
      db.execSQL("ALTER TABLE medicines ADD COLUMN monthly_day INTEGER")
      db.execSQL("ALTER TABLE medicines ADD COLUMN short_month_policy TEXT NOT NULL DEFAULT 'last'")
    }
    if (oldVersion < 14) {
      db.execSQL("ALTER TABLE medicines ADD COLUMN start_date TEXT")
      db.execSQL("ALTER TABLE medicines ADD COLUMN end_date TEXT")
    }
    if (oldVersion < 13) db.execSQL("CREATE TABLE reminder_transitions (medicine_id TEXT PRIMARY KEY, scheduled_at INTEGER, token TEXT, registered INTEGER, changed_at INTEGER NOT NULL, committed INTEGER NOT NULL DEFAULT 0)")
    if (oldVersion < 10) {
      db.execSQL("CREATE TABLE snoozes (medicine_id TEXT NOT NULL, occurrence_at INTEGER NOT NULL, alert_at INTEGER NOT NULL, token TEXT NOT NULL, PRIMARY KEY (medicine_id, occurrence_at))")
    }
    if (oldVersion < 7) db.execSQL("ALTER TABLE doses ADD COLUMN outcome TEXT")
    if (oldVersion < 8) {
      db.execSQL("ALTER TABLE doses ADD COLUMN cleared INTEGER NOT NULL DEFAULT 0")
      db.execSQL("ALTER TABLE doses ADD COLUMN missed_acknowledged INTEGER NOT NULL DEFAULT 0")
    }
    if (oldVersion < 9) {
      db.execSQL("ALTER TABLE doses ADD COLUMN silenced INTEGER NOT NULL DEFAULT 0")
      db.execSQL("ALTER TABLE doses ADD COLUMN revision INTEGER NOT NULL DEFAULT 0")
      db.execSQL("CREATE TABLE occurrence_tracking (medicine_id TEXT PRIMARY KEY, starts_after INTEGER NOT NULL)")
      val start = java.time.LocalDate.now().atStartOfDay(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli() - 1
      db.execSQL("INSERT INTO occurrence_tracking SELECT id, MAX(created_at, ?) FROM medicines", arrayOf(start))
    }
    if (oldVersion < 6) db.execSQL("ALTER TABLE medicines ADD COLUMN mode TEXT NOT NULL DEFAULT 'notification'")
    if (oldVersion < 5) db.execSQL("ALTER TABLE medicines ADD COLUMN type TEXT NOT NULL DEFAULT 'medicine'")
    if (oldVersion < 3) db.execSQL("CREATE TABLE alarms (medicine_id TEXT PRIMARY KEY, scheduled_at INTEGER NOT NULL, token TEXT NOT NULL, registered INTEGER NOT NULL DEFAULT 0)")
    else if (oldVersion < 4) db.execSQL("ALTER TABLE alarms ADD COLUMN registered INTEGER NOT NULL DEFAULT 1")
    if (oldVersion < 2) db.execSQL("ALTER TABLE doses ADD COLUMN alerted INTEGER NOT NULL DEFAULT 1")
    if (oldVersion < 11) {
      db.execSQL("ALTER TABLE doses ADD COLUMN outstanding INTEGER NOT NULL DEFAULT 0")
      db.execSQL("UPDATE doses SET outstanding = 1 WHERE alerted = 1 AND outcome IS NULL AND cleared = 0 AND silenced = 0")
    }
    if (oldVersion < 12) {
      db.execSQL("ALTER TABLE medicines ADD COLUMN status TEXT NOT NULL DEFAULT 'active'")
      db.execSQL("ALTER TABLE medicines ADD COLUMN changed_at INTEGER NOT NULL DEFAULT 0")
      db.execSQL("ALTER TABLE doses ADD COLUMN name TEXT")
      db.execSQL("ALTER TABLE doses ADD COLUMN instructions TEXT")
      db.execSQL("ALTER TABLE doses ADD COLUMN type TEXT")
      db.execSQL("ALTER TABLE doses ADD COLUMN mode TEXT")
      db.execSQL("ALTER TABLE doses ADD COLUMN times TEXT")
      db.execSQL("ALTER TABLE doses ADD COLUMN retained INTEGER NOT NULL DEFAULT 0")
      db.execSQL("UPDATE doses SET name = (SELECT name FROM medicines WHERE id = medicine_id), instructions = (SELECT instructions FROM medicines WHERE id = medicine_id), type = (SELECT type FROM medicines WHERE id = medicine_id), mode = (SELECT mode FROM medicines WHERE id = medicine_id), times = (SELECT times FROM medicines WHERE id = medicine_id)")
    }
    if (oldVersion < 17) {
      db.execSQL("ALTER TABLE doses ADD COLUMN one_off INTEGER NOT NULL DEFAULT 0")
      db.rawQuery("SELECT doses.id, doses.scheduled_at, medicines.start_date, medicines.times FROM doses JOIN medicines ON medicines.id = doses.medicine_id WHERE medicines.schedule_kind = 'daily' AND medicines.start_date IS NOT NULL AND medicines.start_date = medicines.end_date", null).use { cursor ->
        val zone = java.time.ZoneId.systemDefault()
        while (cursor.moveToNext()) {
          val times = JSONArray(cursor.getString(3))
          val scheduled = if (times.length() == 1) java.time.LocalDate.parse(cursor.getString(2)).atTime(java.time.LocalTime.parse(times.getString(0))).atZone(zone).toInstant().toEpochMilli() else null
          if (scheduled == cursor.getLong(1)) db.execSQL("UPDATE doses SET one_off = 1 WHERE id = ?", arrayOf(cursor.getString(0)))
        }
      }
    }
  }

  data class SoundChoices(val notification: String?, val alarm: String?)

  /** Null inherits the app default; an empty string is an explicit silent choice. */
  fun soundChoice(id: String, mode: String): String? {
    require(mode == "notification" || mode == "alarm")
    return readableDatabase.rawQuery("SELECT choice FROM reminder_sound_choices WHERE medicine_id = ? AND mode = ?", arrayOf(id, mode)).use { cursor ->
      if (cursor.moveToFirst()) cursor.getString(0) else null
    }
  }

  fun setSoundChoice(id: String, mode: String, choice: String?) {
    require(mode == "notification" || mode == "alarm")
    val db = writableDatabase
    db.beginTransaction()
    try {
      check(db.rawQuery("SELECT 1 FROM medicines WHERE id = ? AND status != 'deleted'", arrayOf(id)).use { it.moveToFirst() })
      if (choice == null) db.delete("reminder_sound_choices", "medicine_id = ? AND mode = ?", arrayOf(id, mode))
      else db.insertWithOnConflict("reminder_sound_choices", null, ContentValues().apply {
        put("medicine_id", id); put("mode", mode); put("choice", choice)
      }, SQLiteDatabase.CONFLICT_REPLACE)
      db.setTransactionSuccessful()
    } finally { db.endTransaction() }
  }

  data class Occurrence(val medicineId: String, val at: Long, val outcome: String?, val cleared: Boolean = false, val outstanding: Boolean = false, val name: String? = null, val instructions: String? = null, val type: String? = null, val mode: String? = null, val times: List<String>? = null, val retained: Boolean = false, val missedAcknowledged: Boolean = false, val oneOff: Boolean = false)

  private fun update(sql: String, vararg args: Any?): Int = writableDatabase.compileStatement(sql).use { statement ->
    args.forEachIndexed { index, value -> when (value) {
      null -> statement.bindNull(index + 1)
      is Number -> statement.bindLong(index + 1, value.toLong())
      else -> statement.bindString(index + 1, value.toString())
    } }
    statement.executeUpdateDelete()
  }

  fun occurrences(includeCleared: Boolean = false): List<Occurrence> {
    val result = mutableListOf<Occurrence>()
    readableDatabase.rawQuery("SELECT medicine_id, scheduled_at, outcome, cleared, outstanding, name, instructions, type, mode, times, retained, missed_acknowledged, one_off FROM doses ${if (includeCleared) "" else "WHERE cleared = 0"} ORDER BY scheduled_at", null).use { cursor ->
      while (cursor.moveToNext()) {
        val times = cursor.getString(9)?.let { value -> JSONArray(value).let { array -> (0 until array.length()).map { array.getString(it) } } }
        result.add(Occurrence(cursor.getString(0), cursor.getLong(1), cursor.getString(2), cursor.getInt(3) != 0, cursor.getInt(4) != 0, cursor.getString(5), cursor.getString(6), cursor.getString(7), cursor.getString(8), times, cursor.getInt(10) != 0, cursor.getInt(11) != 0, cursor.getInt(12) != 0))
      }
    }
    return result
  }

  fun retainUnconfirmed(id: String) {
    update("UPDATE doses SET retained = 1 WHERE medicine_id = ? AND outcome IS NULL AND cleared = 0", id)
  }

  fun setOutstanding(id: String, at: Long, outstanding: Boolean) {
    update("UPDATE doses SET outstanding = ? WHERE id = ?", if (outstanding) 1 else 0, "$id:$at")
  }

  fun clearHistory() {
    writableDatabase.execSQL("UPDATE doses SET cleared = 1, revision = revision + 1 WHERE outcome IS NOT NULL")
  }

  fun markMissed(medicineId: String, at: Long): Boolean {
    return update("UPDATE doses SET outcome = 'missed', silenced = 1, revision = revision + 1 WHERE id = ? AND outcome IS NULL AND cleared = 0 AND missed_acknowledged = 0 AND one_off = 0", "$medicineId:$at") == 1
  }

  fun latestOccurrence(medicineId: String): Long? {
    readableDatabase.rawQuery("SELECT MAX(scheduled_at) FROM doses WHERE medicine_id = ?", arrayOf(medicineId)).use { cursor ->
      return if (cursor.moveToFirst() && !cursor.isNull(0)) cursor.getLong(0) else null
    }
  }
  fun trackingStart(medicineId: String): Long = readableDatabase.rawQuery("SELECT starts_after FROM occurrence_tracking WHERE medicine_id = ?", arrayOf(medicineId)).use { cursor ->
    check(cursor.moveToFirst()) { "Reminder not found" }; cursor.getLong(0)
  }
  fun soundAllowed(medicineId: String, at: Long): Boolean = readableDatabase.rawQuery("SELECT silenced, outcome FROM doses WHERE id = ?", arrayOf("$medicineId:$at")).use { cursor ->
    cursor.moveToFirst() && cursor.getInt(0) == 0 && cursor.isNull(1)
  }

  fun setOutcomeIfUnconfirmed(medicineId: String, at: Long, outcome: String): Boolean {
    require(outcome == "completed" || outcome == "skipped")
    return update("UPDATE doses SET outcome = ?, silenced = 1, revision = revision + 1 WHERE id = ? AND outcome IS NULL AND cleared = 0", outcome, "$medicineId:$at") == 1
  }

  fun undoOutcome(medicineId: String, at: Long, expectedRevision: Long, previous: String?, missedAcknowledged: Boolean, previousCleared: Boolean = false): Boolean {
    return update("UPDATE doses SET outcome = ?, missed_acknowledged = ?, cleared = ?, silenced = 1, revision = revision + 1 WHERE id = ? AND revision = ? AND cleared = 0", previous, if (missedAcknowledged) 1 else 0, if (previousCleared) 1 else 0, "$medicineId:$at", expectedRevision) == 1
  }

  fun revision(medicineId: String, at: Long): Long = readableDatabase.rawQuery("SELECT revision FROM doses WHERE id = ?", arrayOf("$medicineId:$at")).use { cursor ->
    check(cursor.moveToFirst()); cursor.getLong(0)
  }

  data class OutcomeChange(val previous: String?, val revision: Long, val previousCleared: Boolean = false, val changed: Boolean = true)
  fun setOutcome(medicineId: String, at: Long, outcome: String?, missedAcknowledged: Boolean = false): OutcomeChange {
    require(outcome == null || outcome in listOf("completed", "skipped", "missed"))
    val db = writableDatabase
    db.beginTransaction()
    try {
      val prior = db.rawQuery("SELECT outcome, revision, cleared FROM doses WHERE id = ?", arrayOf("$medicineId:$at")).use { cursor ->
        check(cursor.moveToFirst()) { "Occurrence not found" }
        OutcomeChange(cursor.getString(0), cursor.getLong(1), cursor.getInt(2) != 0)
      }
      if (prior.previous == outcome && !prior.previousCleared) {
        db.setTransactionSuccessful()
        return prior.copy(changed = false)
      }
      check(update("UPDATE doses SET outcome = ?, missed_acknowledged = ?, cleared = 0, silenced = 1, revision = revision + 1 WHERE id = ?", outcome, if (missedAcknowledged) 1 else 0, "$medicineId:$at") == 1)
      val result = prior.copy(revision = prior.revision + 1)
      db.setTransactionSuccessful()
      return result
    } finally { db.endTransaction() }
  }

  fun outcome(medicineId: String, at: Long): String? {
    readableDatabase.rawQuery("SELECT outcome FROM doses WHERE id = ?", arrayOf("$medicineId:$at")).use { cursor ->
      return if (cursor.moveToFirst()) cursor.getString(0) else null
    }
  }

  fun save(name: String, instructions: String, times: List<String>, now: Long, type: String = "medicine", mode: String = "notification", startDate: String? = null, endDate: String? = null, scheduleKind: String = "daily", weekdays: List<Int> = emptyList(), intervalHours: Int? = null, intervalAnchor: Long? = null, monthlyDay: Int? = null, shortMonthPolicy: String = "last", soundChoices: SoundChoices? = null): Medicine {
    require(name.isNotBlank() && times.isNotEmpty() && type in listOf("medicine", "reminder") && mode in listOf("notification", "alarm"))
    times.forEach { java.time.LocalTime.parse(it) }
    validateDates(startDate, endDate)
    validateSchedule(scheduleKind, weekdays, intervalHours, intervalAnchor, monthlyDay, shortMonthPolicy)
    val medicine = Medicine(UUID.randomUUID().toString(), name.trim(), instructions.trim(), times.distinct(), now, type, mode, startDate = startDate, endDate = endDate, scheduleKind = scheduleKind, weekdays = weekdays, intervalHours = intervalHours, intervalAnchor = intervalAnchor, monthlyDay = monthlyDay, shortMonthPolicy = shortMonthPolicy)
    val values = ContentValues().apply {
      putSchedule(scheduleKind, weekdays, intervalHours, intervalAnchor, monthlyDay, shortMonthPolicy)
      put("id", medicine.id); put("name", medicine.name); put("instructions", medicine.instructions)
      put("start_date", startDate); put("end_date", endDate); put("type", medicine.type); put("mode", medicine.mode); put("times", JSONArray(medicine.times).toString()); put("created_at", medicine.createdAt)
    }
    val db = writableDatabase
    db.beginTransaction()
    try {
      db.insertOrThrow("medicines", null, values)
      soundChoices?.let { setSoundChoice(medicine.id, "notification", it.notification); setSoundChoice(medicine.id, "alarm", it.alarm) }
      db.insertOrThrow("occurrence_tracking", null, ContentValues().apply { put("medicine_id", medicine.id); put("starts_after", now) })
      db.setTransactionSuccessful()
    } finally { db.endTransaction() }
    return medicine
  }

  fun all(): List<Medicine> {
    val medicines = mutableListOf<Medicine>()
    readableDatabase.rawQuery("SELECT id, name, instructions, times, created_at, type, mode, status, changed_at, start_date, end_date, schedule_kind, weekdays, interval_hours, interval_anchor, monthly_day, short_month_policy FROM medicines ORDER BY created_at", null).use { cursor ->
      while (cursor.moveToNext()) {
        val array = JSONArray(cursor.getString(3))
        medicines.add(Medicine(cursor.getString(0), cursor.getString(1), cursor.getString(2), (0 until array.length()).map { array.getString(it) }, cursor.getLong(4), cursor.getString(5), cursor.getString(6), cursor.getString(7), cursor.getLong(8), cursor.getString(9), cursor.getString(10), cursor.getString(11), JSONArray(cursor.getString(12)).let { a -> (0 until a.length()).map { a.getInt(it) } }, if (cursor.isNull(13)) null else cursor.getInt(13), if (cursor.isNull(14)) null else cursor.getLong(14), if (cursor.isNull(15)) null else cursor.getInt(15), cursor.getString(16)))
      }
    }
    return medicines
  }

  data class Snooze(val medicineId: String, val at: Long, val alertAt: Long, val token: String)
  fun snooze(id: String, at: Long): Snooze? = readableDatabase.rawQuery("SELECT alert_at, token FROM snoozes WHERE medicine_id = ? AND occurrence_at = ?", arrayOf(id, at.toString())).use { c ->
    if (c.moveToFirst()) Snooze(id, at, c.getLong(0), c.getString(1)) else null
  }
  fun saveSnooze(item: Snooze): Boolean {
    val values = ContentValues().apply { put("medicine_id", item.medicineId); put("occurrence_at", item.at); put("alert_at", item.alertAt); put("token", item.token) }
    return writableDatabase.insertWithOnConflict("snoozes", null, values, SQLiteDatabase.CONFLICT_IGNORE) != -1L
  }
  fun removeSnooze(id: String, at: Long): Int = writableDatabase.delete("snoozes", "medicine_id = ? AND occurrence_at = ?", arrayOf(id, at.toString()))
  fun snoozes(): List<Snooze> = readableDatabase.rawQuery("SELECT medicine_id, occurrence_at, alert_at, token FROM snoozes", null).use { c ->
    val items = mutableListOf<Snooze>()
    while (c.moveToNext()) items.add(Snooze(c.getString(0), c.getLong(1), c.getLong(2), c.getString(3)))
    items
  }

  data class Alarm(val medicineId: String, val at: Long, val token: String, val registered: Boolean = false)

  fun alarm(medicineId: String): Alarm? {
    readableDatabase.rawQuery("SELECT scheduled_at, token, registered FROM alarms WHERE medicine_id = ?", arrayOf(medicineId)).use { cursor ->
      return if (cursor.moveToFirst()) Alarm(medicineId, cursor.getLong(0), cursor.getString(1), cursor.getInt(2) != 0) else null
    }
  }

  data class Transition(val medicineId: String, val at: Long?, val token: String?, val registered: Boolean, val changedAt: Long, val committed: Boolean)

  fun beginTransition(id: String) {
    val db = writableDatabase
    db.beginTransaction()
    try {
      val item = requireNotNull(all().find { it.id == id && it.status != "deleted" })
      val alarm = alarm(id)
      val values = ContentValues().apply {
        put("medicine_id", id); put("scheduled_at", alarm?.at); put("token", alarm?.token)
        put("registered", if (alarm?.registered == true) 1 else 0); put("changed_at", item.changedAt)
      }
      db.insertOrThrow("reminder_transitions", null, values)
      db.setTransactionSuccessful()
    } finally { db.endTransaction() }
  }

  fun transitions(): List<Transition> = readableDatabase.rawQuery("SELECT medicine_id, scheduled_at, token, registered, changed_at, committed FROM reminder_transitions", null).use { cursor ->
    val result = mutableListOf<Transition>()
    while (cursor.moveToNext()) result.add(Transition(cursor.getString(0), if (cursor.isNull(1)) null else cursor.getLong(1), cursor.getString(2), cursor.getInt(3) != 0, cursor.getLong(4), cursor.getInt(5) != 0))
    result
  }
  fun transition(id: String): Transition? = transitions().find { it.medicineId == id }
  fun finishTransition(id: String) { writableDatabase.delete("reminder_transitions", "medicine_id = ?", arrayOf(id)) }

  private fun retireTransitionAlarm(id: String, now: Long) {
    if (transition(id) == null) return
    val old = alarm(id)
    invalidateAlarm(id)
    if (old != null && old.at <= now) recordDue(id, old.at)
    update("UPDATE reminder_transitions SET committed = 1 WHERE medicine_id = ?", id)
  }

  fun setAlarm(medicineId: String, at: Long, token: String) {
    val values = ContentValues().apply { put("medicine_id", medicineId); put("scheduled_at", at); put("token", token) }
    writableDatabase.insertWithOnConflict("alarms", null, values, SQLiteDatabase.CONFLICT_REPLACE)
  }

  fun markAlarmRegistered(medicineId: String, token: String) {
    val values = ContentValues().apply { put("registered", 1) }
    writableDatabase.update("alarms", values, "medicine_id = ? AND token = ?", arrayOf(medicineId, token))
  }

  fun invalidateAlarm(medicineId: String) {
    writableDatabase.delete("alarms", "medicine_id = ?", arrayOf(medicineId))
  }

  fun claimAlarm(medicineId: String, at: Long, token: String): Boolean {
    val db = writableDatabase
    db.beginTransaction()
    try {
      val removed = db.delete("alarms", "medicine_id = ? AND scheduled_at = ? AND token = ?", arrayOf(medicineId, at.toString(), token)) == 1
      val claimed = removed && recordDose(medicineId, at)
      db.setTransactionSuccessful()
      return claimed
    } finally { db.endTransaction() }
  }

  private fun occurrenceValues(id: String, at: Long): ContentValues {
    val item = requireNotNull(all().find { it.id == id })
    return ContentValues().apply {
      put("id", "$id:$at"); put("medicine_id", id); put("scheduled_at", at)
      put("one_off", item.scheduleKind == "daily" && item.startDate != null && item.startDate == item.endDate && item.times.size == 1)
      put("name", item.name); put("instructions", item.instructions); put("type", item.type); put("mode", item.mode); put("times", JSONArray(item.times).toString())
    }
  }

  private fun validateSchedule(kind: String, weekdays: List<Int>, hours: Int?, anchor: Long?, day: Int?, policy: String) {
    require(kind in listOf("daily", "weekday", "interval", "monthly"))
    require(policy in listOf("last", "skip"))
    require(day == null || day in 1..31)
    require(weekdays.all { it in 1..7 })
    if (kind == "weekday") require(weekdays.isNotEmpty())
    if (kind == "interval") require(hours != null && hours > 0 && anchor != null)
  }

  private fun ContentValues.putSchedule(kind: String, weekdays: List<Int>, hours: Int?, anchor: Long?, day: Int?, policy: String) {
    put("schedule_kind", kind); put("weekdays", JSONArray(weekdays.distinct()).toString())
    put("interval_hours", hours); put("interval_anchor", anchor); put("monthly_day", day); put("short_month_policy", policy)
  }

  private fun validateDates(startDate: String?, endDate: String?) {
    val start = startDate?.let(java.time.LocalDate::parse)
    val end = endDate?.let(java.time.LocalDate::parse)
    require(start == null || end == null || end >= start)
  }

  fun edit(id: String, name: String, instructions: String, times: List<String>, type: String, mode: String, now: Long? = null, startDate: String? = null, endDate: String? = null, scheduleKind: String = "daily", weekdays: List<Int> = emptyList(), intervalHours: Int? = null, intervalAnchor: Long? = null, monthlyDay: Int? = null, shortMonthPolicy: String = "last", soundChoices: SoundChoices? = null) {
    require(name.isNotBlank() && times.isNotEmpty() && type in listOf("medicine", "reminder") && mode in listOf("notification", "alarm"))
    times.forEach { java.time.LocalTime.parse(it) }
    validateDates(startDate, endDate)
    validateSchedule(scheduleKind, weekdays, intervalHours, intervalAnchor, monthlyDay, shortMonthPolicy)
    val values = ContentValues().apply {
      putSchedule(scheduleKind, weekdays, intervalHours, intervalAnchor, monthlyDay, shortMonthPolicy)
      put("start_date", startDate); put("end_date", endDate)
      put("name", name.trim()); put("instructions", instructions.trim()); put("times", JSONArray(times.distinct()).toString()); put("type", type); put("mode", mode)
    }
    val db = writableDatabase
    db.beginTransaction()
    try {
      val cutoff = now ?: System.currentTimeMillis()
      values.put("changed_at", cutoff)
      retireTransitionAlarm(id, cutoff)
      check(db.update("medicines", values, "id = ? AND status != 'deleted'", arrayOf(id)) == 1)
      soundChoices?.let { setSoundChoice(id, "notification", it.notification); setSoundChoice(id, "alarm", it.alarm) }
      db.execSQL("UPDATE occurrence_tracking SET starts_after = ? WHERE medicine_id = ?", arrayOf<Any>(cutoff, id))
      db.setTransactionSuccessful()
    } finally { db.endTransaction() }
  }

  fun setStatus(id: String, status: String, now: Long? = null) {
    require(status in listOf("active", "paused", "deleted"))
    val db = writableDatabase
    db.beginTransaction()
    try {
      val cutoff = now ?: System.currentTimeMillis()
      retireTransitionAlarm(id, cutoff)
      check(update("UPDATE medicines SET status = ?, changed_at = ? WHERE id = ? AND status != 'deleted'", status, cutoff, id) == 1)
      db.execSQL("UPDATE occurrence_tracking SET starts_after = ? WHERE medicine_id = ?", arrayOf<Any>(cutoff, id))
      db.setTransactionSuccessful()
    } finally { db.endTransaction() }
  }

  fun recordDue(medicineId: String, at: Long) {
    if (alarm(medicineId)?.at == at) return
    val values = occurrenceValues(medicineId, at).apply { put("alerted", 1) }
    writableDatabase.insertWithOnConflict("doses", null, values, SQLiteDatabase.CONFLICT_IGNORE)
  }

  fun recordDose(medicineId: String, at: Long): Boolean {
    val db = writableDatabase
    db.beginTransaction()
    try {
      val initial = occurrenceValues(medicineId, at)
      db.insertWithOnConflict("doses", null, initial, SQLiteDatabase.CONFLICT_IGNORE)
      val values = ContentValues().apply { put("alerted", 1) }
      val changed = db.update("doses", values, "id = ? AND alerted = 0", arrayOf("$medicineId:$at")) == 1
      db.setTransactionSuccessful()
      return changed
    } finally { db.endTransaction() }
  }

  fun todayDoses(start: Long, end: Long): List<Pair<String, Long>> {
    val doses = mutableListOf<Pair<String, Long>>()
    readableDatabase.rawQuery("SELECT medicine_id, scheduled_at FROM doses WHERE scheduled_at >= ? AND scheduled_at < ? ORDER BY scheduled_at", arrayOf(start.toString(), end.toString())).use { cursor ->
      while (cursor.moveToNext()) doses.add(cursor.getString(0) to cursor.getLong(1))
    }
    return doses
  }
}
