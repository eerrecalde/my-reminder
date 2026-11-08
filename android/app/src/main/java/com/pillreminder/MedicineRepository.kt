package com.pillreminder

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import org.json.JSONArray
import java.util.UUID

data class Medicine(val id: String, val name: String, val instructions: String, val times: List<String>, val createdAt: Long)

/** Shared by the React Native bridge and Android receivers. */
class MedicineRepository(context: Context, databaseName: String = "medicines.db") : SQLiteOpenHelper(context.applicationContext, databaseName, null, 2) {
  override fun onCreate(db: SQLiteDatabase) {
    db.execSQL("CREATE TABLE medicines (id TEXT PRIMARY KEY, name TEXT NOT NULL, instructions TEXT NOT NULL, times TEXT NOT NULL, created_at INTEGER NOT NULL)")
    db.execSQL("CREATE TABLE doses (id TEXT PRIMARY KEY, medicine_id TEXT NOT NULL, scheduled_at INTEGER NOT NULL, alerted INTEGER NOT NULL DEFAULT 0)")
  }
  override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
    if (oldVersion < 2) db.execSQL("ALTER TABLE doses ADD COLUMN alerted INTEGER NOT NULL DEFAULT 1")
  }

  fun save(name: String, instructions: String, times: List<String>, now: Long): Medicine {
    require(name.isNotBlank() && times.isNotEmpty())
    times.forEach { java.time.LocalTime.parse(it) }
    val medicine = Medicine(UUID.randomUUID().toString(), name.trim(), instructions.trim(), times.distinct(), now)
    val values = ContentValues().apply {
      put("id", medicine.id); put("name", medicine.name); put("instructions", medicine.instructions)
      put("times", JSONArray(medicine.times).toString()); put("created_at", medicine.createdAt)
    }
    writableDatabase.insertOrThrow("medicines", null, values)
    return medicine
  }

  fun all(): List<Medicine> {
    val medicines = mutableListOf<Medicine>()
    readableDatabase.rawQuery("SELECT id, name, instructions, times, created_at FROM medicines ORDER BY created_at", null).use { cursor ->
      while (cursor.moveToNext()) {
        val array = JSONArray(cursor.getString(3))
        medicines.add(Medicine(cursor.getString(0), cursor.getString(1), cursor.getString(2), (0 until array.length()).map { array.getString(it) }, cursor.getLong(4)))
      }
    }
    return medicines
  }

  fun recordDue(medicineId: String, at: Long) {
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
