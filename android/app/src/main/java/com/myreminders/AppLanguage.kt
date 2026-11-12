package com.myreminders

import android.content.Context
import android.content.res.Configuration
import java.util.Locale

object AppLanguage {
  private const val PREFS = "app_language"
  fun preference(context: Context): String = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("language", "system") ?: "system"
  fun set(context: Context, language: String) {
    require(language in listOf("system", "en", "es"))
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("language", language).apply()
  }
  fun effective(context: Context): String {
    val selected = preference(context)
    val language = if (selected == "system") context.resources.configuration.locales[0].language else selected
    return if (language == "es") "es" else "en"
  }
  fun context(context: Context): Context {
    val configuration = Configuration(context.resources.configuration)
    configuration.setLocale(Locale.forLanguageTag(effective(context)))
    return context.createConfigurationContext(configuration)
  }
}
