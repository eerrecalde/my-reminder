package com.pillreminder

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import org.json.JSONArray
import java.util.UUID

data class Medicine(val id: String, val name: String, val instructions: String, val times: List<String>, val createdAt: Long, val type: String = "medicine")

/** Shared by the React Native bridge and Android receivers. */
class MedicineRepository(context: Context, databaseName: String = "medicines.db") : SQLiteOpenHelper(context.applicationContext, databaseName, null, 5) {
  override fun onCreate(db: SQLiteDatabase) {
    db.execSQL("CREATE TABLE medicines (id TEXT PRIMARY KEY, name TEXT NOT NULL, instructions TEXT NOT NULL, times TEXT NOT NULL, created_at INTEGER NOT NULL, type TEXT NOT NULL DEFAULT 'medicine')")
    db.execSQL("CREATE TABLE alarms (medicine_id TEXT PRIMARY KEY, scheduled_at INTEGER NOT NULL, token TEXT NOT NULL, registered INTEGER NOT NULL DEFAULT 0)")
    db.execSQL("CREATE TABLE doses (id TEXT PRIMARY KEY, medicine_id TEXT NOT NULL, scheduled_at INTEGER NOT NULL, alerted INTEGER NOT NULL DEFAULT 0)")
  }
  override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
    if (oldVersion < 5) db.execSQL("ALTER TABLE medicines ADD COLUMN type TEXT NOT NULL DEFAULT 'medicine'")
    if (oldVersion < 3) db.execSQL("CREATE TABLE alarms (medicine_id TEXT PRIMARY KEY, scheduled_at INTEGER NOT NULL, token TEXT NOT NULL, registered INTEGER NOT NULL DEFAULT 0)")
    else if (oldVersion < 4) db.execSQL("ALTER TABLE alarms ADD COLUMN registered INTEGER NOT NULL DEFAULT 1")
    if (oldVersion < 2) db.execSQL("ALTER TABLE doses ADD COLUMN alerted INTEGER NOT NULL DEFAULT 1")
  }

  fun save(name: String, instructions: String, times: List<String>, now: Long, type: String = "medicine"): Medicine {
    require(name.isNotBlank() && times.isNotEmpty() && type in listOf("medicine", "reminder"))
    times.forEach { java.time.LocalTime.parse(it) }
    val medicine = Medicine(UUID.randomUUID().toString(), name.trim(), instructions.trim(), times.distinct(), now, type)
    val values = ContentValues().apply {
      put("id", medicine.id); put("name", medicine.name); put("instructions", medicine.instructions)
      put("type", medicine.type); put("times", JSONArray(medicine.times).toString()); put("created_at", medicine.createdAt)
    }
    writableDatabase.insertOrThrow("medicines", null, values)
    return medicine
  }

  fun all(): List<Medicine> {
    val medicines = mutableListOf<Medicine>()
    readableDatabase.rawQuery("SELECT id, name, instructions, times, created_at, type FROM medicines ORDER BY created_at", null).use { cursor ->
      while (cursor.moveToNext()) {
        val array = JSONArray(cursor.getString(3))
        medicines.add(Medicine(cursor.getString(0), cursor.getString(1), cursor.getString(2), (0 until array.length()).map { array.getString(it) }, cursor.getLong(4), cursor.getString(5)))
      }
    }
    return medicines
  }

  data class Alarm(val medicineId: String, val at: Long, val token: String, val registered: Boolean = false)

  fun alarm(medicineId: String): Alarm? {
    readableDatabase.rawQuery("SELECT scheduled_at, token, registered FROM alarms WHERE medicine_id = ?", arrayOf(medicineId)).use { cursor ->
      return if (cursor.moveToFirst()) Alarm(medicineId, cursor.getLong(0), cursor.getString(1), cursor.getInt(2) != 0) else null
    }
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

  fun recordDue(medicineId: String, at: Long) {
    if (alarm(medicineId)?.at == at) return
    val values = ContentValues().apply { put("id", "$medicineId:$at"); put("medicine_id", medicineId); put("scheduled_at", at); put("alerted", 1) }
    writableDatabase.insertWithOnConflict("doses", null, values, SQLiteDatabase.CONFLICT_IGNORE)
  }

  fun recordDose(medicineId: String, at: Long): Boolean {
    val db = writableDatabase
    db.beginTransaction()
    try {
      val initial = ContentValues().apply { put("id", "$medicineId:$at"); put("medicine_id", medicineId); put("scheduled_at", at) }
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
