package com.myreminders

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.net.Uri
import java.security.MessageDigest

/** Empty choice means silent, null means inherit. Unset defaults preserve the old channel. */
object ReminderSounds {
  private const val LEGACY = "medicine_reminders"
  private fun prefs(context: Context) = context.getSharedPreferences("reminder_sounds", Context.MODE_PRIVATE)
  fun default(context: Context, mode: String): String? = prefs(context).getString(mode, null)
  fun setDefault(context: Context, mode: String, choice: String?) {
    require(mode == "notification" || mode == "alarm")
    prefs(context).edit().apply { if (choice == null) remove(mode) else putString(mode, choice) }.apply()
  }
  fun available(context: Context, choice: String?): Boolean {
    if (choice.isNullOrEmpty()) return true
    if (RingtoneManager.isDefault(Uri.parse(choice))) return true
    return try { context.contentResolver.openAssetFileDescriptor(Uri.parse(choice), "r")?.use { true } ?: false } catch (_: Exception) { false }
  }
  fun resolve(context: Context, mode: String, override: String?): String? {
    val fallback = default(context, mode)
    if (override != null && available(context, override)) return override
    return if (available(context, fallback)) fallback else null
  }
  fun title(context: Context, choice: String?): String? {
    if (choice.isNullOrEmpty() || !available(context, choice)) return null
    return try { RingtoneManager.getRingtone(context, Uri.parse(choice))?.getTitle(context) } catch (_: Exception) { null }
  }
  fun channelAllowsSound(channel: NotificationChannel): Boolean = channel.importance >= NotificationManager.IMPORTANCE_DEFAULT && channel.sound != null
  fun useLegacyControls(legacy: NotificationChannel, selected: NotificationChannel): Boolean =
    selected.importance != NotificationManager.IMPORTANCE_NONE &&
      ((selected.shouldVibrate() && !legacy.shouldVibrate()) || selected.importance > legacy.importance)
  fun channel(context: Context, choice: String?): String {
    if (choice == null) return LEGACY
    val manager = context.getSystemService(NotificationManager::class.java)
    val hash = MessageDigest.getInstance("SHA-256").digest(choice.toByteArray()).take(12).joinToString("") { "%02x".format(it) }
    val id = "reminder_sound_$hash"
    val legacy = manager.getNotificationChannel(LEGACY)
    val attributes = AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()
    val soundName = if (choice.isEmpty()) context.getString(R.string.sound_silent) else title(context, choice) ?: context.getString(R.string.sound_selected)
    val channelName = "${context.getString(R.string.reminder_channel)} – $soundName"
    manager.createNotificationChannel(NotificationChannel(id, channelName, legacy?.importance ?: NotificationManager.IMPORTANCE_HIGH).apply {
      setSound(if (choice.isEmpty()) null else Uri.parse(choice), attributes)
      enableVibration(legacy?.shouldVibrate() ?: true)
    })
    return id
  }
}
