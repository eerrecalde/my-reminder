package com.myreminders

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import java.util.Locale
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LocalizedPickerTest {
  private fun texts(view: View): List<String> =
    (if (view is TextView) listOf(view.text.toString()) else emptyList()) +
      (if (view is ViewGroup) (0 until view.childCount).flatMap { texts(view.getChildAt(it)) } else emptyList())

  @Test fun pickersShowSelectedLanguageAndRestoreProcessLocale() {
    ActivityScenario.launch(MainActivity::class.java).use { scenario ->
      scenario.onActivity { activity ->
        val original = Locale.getDefault()
        try {
          for (language in listOf("es", "en")) {
            AppLanguage.set(activity, language)
            val date = LocalizedPicker.create(activity) { context ->
              DatePickerDialog(context, null, 2026, 10, 12)
            }
            assertEquals(original, Locale.getDefault())
            date.show()
            val labels = texts(date.window!!.decorView).joinToString(" ").lowercase(Locale.ROOT)
            assertTrue(labels, labels.contains(if (language == "es") "cancelar" else "cancel"))
            assertTrue(labels, labels.contains(if (language == "es") "jue" else "thu"))
            date.datePicker.updateDate(2026, 10, 13)
            val updatedLabels = texts(date.window!!.decorView).joinToString(" ").lowercase(Locale.ROOT)
            assertTrue(updatedLabels, updatedLabels.contains(if (language == "es") "vie" else "fri"))
            date.dismiss()
            val time = LocalizedPicker.create(activity) { context ->
              TimePickerDialog(context, null, 9, 30, true)
            }
            time.show()
            val timeLabels = texts(time.window!!.decorView).joinToString(" ").lowercase(Locale.ROOT)
            assertTrue(timeLabels, timeLabels.contains(if (language == "es") "cancelar" else "cancel"))
            assertEquals(original, Locale.getDefault())
            time.dismiss()
          }
        } finally { AppLanguage.set(activity, "system") }
      }
    }
  }
}
