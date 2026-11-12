package com.myreminders

import android.app.Activity
import android.content.res.Configuration
import android.view.ContextThemeWrapper
import java.util.Locale

object LocalizedPicker {
  // Android's picker delegates read Locale.getDefault() during construction as
  // well as the supplied context. Restore it before returning to the event loop.
  @Synchronized fun <T> create(activity: Activity, create: (ContextThemeWrapper) -> T): T {
    val locale = Locale.forLanguageTag(if (AppLanguage.effective(activity) == "es") "es-MX" else "en-GB")
    val context = ContextThemeWrapper(activity, android.R.style.Theme_Material_Light).apply {
      applyOverrideConfiguration(Configuration(activity.resources.configuration).apply { setLocale(locale) })
    }
    val previous = Locale.getDefault()
    val previousDisplay = Locale.getDefault(Locale.Category.DISPLAY)
    val previousFormat = Locale.getDefault(Locale.Category.FORMAT)
    return try {
      Locale.setDefault(locale)
      create(context)
    } finally {
      Locale.setDefault(previous)
      Locale.setDefault(Locale.Category.DISPLAY, previousDisplay)
      Locale.setDefault(Locale.Category.FORMAT, previousFormat)
    }
  }
}
