package com.myreminders

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Process
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith

/** Run the two methods separately, killing the target process between them on a disposable emulator. */
@RunWith(AndroidJUnit4::class)
class RestartDeliveryTest {
  @Test fun prepare() {
    assumeTrue(android.os.Build.HARDWARE == "ranchu" && androidx.test.platform.app.InstrumentationRegistry.getArguments().getString("restartDeliveryTest") == "true")
    val context = ApplicationProvider.getApplicationContext<Context>()
    assertTrue(MedicineRepository(context).use { it.all().isEmpty() })
    ReminderScheduler.rebuild(context)
    val now = System.currentTimeMillis()
    val at = now + 15_000
    val prefs = context.getSharedPreferences("restart_delivery_test", Context.MODE_PRIVATE)
    prefs.edit().putInt("pid", Process.myPid()).putLong("at", at).commit()
    val manager = context.getSystemService(AlarmManager::class.java)
    for (type in listOf("reminder", "medicine")) {
      val time = LocalTime.now().plusHours(2).format(DateTimeFormatter.ofPattern("HH:mm"))
      val item = MedicineRepository(context).use { it.save("Restart $type", "", listOf(time), now - 150L * 86_400_000, type) }
      prefs.edit().putString(type, item.id).commit()
      val intent = Intent(context, ReminderReceiver::class.java)
        .setData(Uri.parse("myreminders://restart-test/${item.id}"))
        .putExtra("medicineId", item.id).putExtra("scheduledAt", at).putExtra("token", type)
      val pending = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      val show = PendingIntent.getActivity(context, 0, Intent(context, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE)
      MedicineRepository(context).use { it.setAlarm(item.id, at, type) }
      manager.setAlarmClock(AlarmManager.AlarmClockInfo(at, show), pending)
    }
  }

  @Test fun verify() {
    assumeTrue(android.os.Build.HARDWARE == "ranchu" && androidx.test.platform.app.InstrumentationRegistry.getArguments().getString("restartDeliveryTest") == "true")
    val context = ApplicationProvider.getApplicationContext<Context>()
    val prefs = context.getSharedPreferences("restart_delivery_test", Context.MODE_PRIVATE)
    assertNotEquals("The target process must have restarted", prefs.getInt("pid", -1), Process.myPid())
    val at = prefs.getLong("at", 0)
    assertTrue(at > 0)
    MedicineRepository(context).use { repo ->
      for (type in listOf("reminder", "medicine")) {
        val id = requireNotNull(prefs.getString(type, null))
        assertNotNull(repo.occurrence(id, at))
        assertTrue("The next $type alarm should be registered", repo.alarm(id)?.let { it.registered && it.at > at } == true)
        assertTrue(repo.occurrences().count { it.medicineId == id } >= 150)
      }
    }
  }
}
