package com.myreminders

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith

/** Opt-in test; the operator reboots the disposable emulator between methods. */
@RunWith(AndroidJUnit4::class)
class BootRecoveryTest {
  private fun context(): Context {
    assumeTrue(android.os.Build.HARDWARE == "ranchu" && InstrumentationRegistry.getArguments().getString("bootRecoveryTest") == "true")
    return ApplicationProvider.getApplicationContext()
  }

  @Test fun prepare() {
    val context = context()
    assertTrue(ReminderScheduler.enabled(context))
    assertTrue(MedicineRepository(context).use { it.all().isEmpty() })
    ReminderScheduler.rebuild(context)
    val now = System.currentTimeMillis()
    val prefs = context.getSharedPreferences("boot_recovery_test", Context.MODE_PRIVATE)
    val boot = android.provider.Settings.Global.getInt(context.contentResolver, android.provider.Settings.Global.BOOT_COUNT, -1)
    assertTrue(boot >= 0)
    prefs.edit().putInt("boot", boot).commit()
    for (type in listOf("reminder", "medicine")) {
      val item = MedicineRepository(context).use { repo ->
        repo.save("Boot $type", "", listOf("09:00"), now - 86_400_000, type,
          scheduleKind = "interval", intervalHours = 24, intervalAnchor = now + 3_600_000)
      }
      ReminderScheduler.schedule(context, item)
      val alarm = MedicineRepository(context).use { requireNotNull(it.alarm(item.id)) }
      assertTrue(alarm.registered)
      prefs.edit().putString(type, item.id).putString("$type-token", alarm.token).putLong("$type-at", alarm.at).commit()
    }
  }

  @Test fun verify() {
    val context = context()
    val prefs = context.getSharedPreferences("boot_recovery_test", Context.MODE_PRIVATE)
    val boot = android.provider.Settings.Global.getInt(context.contentResolver, android.provider.Settings.Global.BOOT_COUNT, -1)
    assertTrue("The emulator must actually have rebooted", boot > prefs.getInt("boot", -1))
    MedicineRepository(context).use { repo ->
      for (type in listOf("reminder", "medicine")) {
        val id = requireNotNull(prefs.getString(type, null))
        val alarm = requireNotNull(repo.alarm(id))
        assertTrue("The $type alarm must be registered in the future", alarm.registered && alarm.at > System.currentTimeMillis())
        assertEquals("The scheduled time should survive reboot", prefs.getLong("$type-at", 0), alarm.at)
        assertNotEquals("The boot receiver should replace the old alarm", prefs.getString("$type-token", null), alarm.token)
      }
    }
  }

  @Test fun preparePermissionChange() {
    val context = context()
    val prefs = context.getSharedPreferences("boot_recovery_test", Context.MODE_PRIVATE)
    MedicineRepository(context).use { repo ->
      for (type in listOf("reminder", "medicine")) {
        val id = requireNotNull(prefs.getString(type, null))
        val alarm = requireNotNull(repo.alarm(id))
        prefs.edit().putString("$type-token", alarm.token).putLong("$type-at", alarm.at).commit()
      }
    }
  }

  @Test fun verifyPermissionChange() {
    val context = context()
    assertTrue(ReminderScheduler.enabled(context))
    val prefs = context.getSharedPreferences("boot_recovery_test", Context.MODE_PRIVATE)
    MedicineRepository(context).use { repo ->
      for (type in listOf("reminder", "medicine")) {
        val id = requireNotNull(prefs.getString(type, null))
        val alarm = requireNotNull(repo.alarm(id))
        assertTrue(alarm.registered && alarm.at > System.currentTimeMillis())
        assertEquals(prefs.getLong("$type-at", 0), alarm.at)
        assertNotEquals(prefs.getString("$type-token", null), alarm.token)
      }
    }
  }
}
