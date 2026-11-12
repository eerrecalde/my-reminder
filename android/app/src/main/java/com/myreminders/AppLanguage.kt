package com.myreminders

import android.app.LocaleManager
import android.content.Context
import android.content.res.Configuration
import android.os.Build
import android.os.LocaleList
import java.util.Locale

object AppLanguage {
  private const val PREFS = "app_language"

  @Synchronized private fun migrate(context: Context) {
    if (Build.VERSION.SDK_INT < 33) return
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    if (prefs.getBoolean("android_locale_migrated", false)) return
    val manager = context.getSystemService(LocaleManager::class.java)
    val previous = prefs.getString("language", "system")
    if (manager.applicationLocales.isEmpty && previous in listOf("en", "es")) {
      manager.applicationLocales = LocaleList.forLanguageTags(previous)
    }
    prefs.edit().putBoolean("android_locale_migrated", true).commit()
  }

  fun preference(context: Context): String {
    if (Build.VERSION.SDK_INT >= 33) {
      migrate(context)
      val locales = context.getSystemService(LocaleManager::class.java).applicationLocales
      if (locales.isEmpty) return "system"
      return if (locales[0].language == "es") "es" else "en"
    }
    return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("language", "system") ?: "system"
  }

  fun set(context: Context, language: String) {
    require(language in listOf("system", "en", "es"))
    if (Build.VERSION.SDK_INT >= 33) {
      migrate(context)
      context.getSystemService(LocaleManager::class.java).applicationLocales =
        LocaleList.forLanguageTags(if (language == "system") "" else language)
    } else {
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("language", language).apply()
    }
  }

  fun effective(context: Context): String {
    val selected = preference(context)
    val language = if (selected == "system") android.content.res.Resources.getSystem().configuration.locales[0].language else selected
    return if (language == "es") "es" else "en"
  }
  fun context(context: Context): Context {
    val configuration = Configuration(context.resources.configuration)
    configuration.setLocale(Locale.forLanguageTag(effective(context)))
    return context.createConfigurationContext(configuration)
  }
}
