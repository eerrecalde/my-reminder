package com.pillreminder

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.core.app.NotificationCompat

/** One sound session for all currently sounding occurrences. */
class AlarmSoundService : Service() {
  private val active = mutableMapOf<String, Long>()
  private var player: MediaPlayer? = null
  private var vibrator: Vibrator? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == STOP) {
      active.clear()
      finish()
      return START_NOT_STICKY
    }
    val id = intent?.getStringExtra("id") ?: run { finish(); return START_NOT_STICKY }
    val at = intent.getLongExtra("at", 0)
    val previous = active[id]
    if (previous != null && at <= previous) return START_NOT_STICKY
    active[id] = at
    val manager = getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(NotificationChannel(CHANNEL, getString(R.string.alarm_channel), NotificationManager.IMPORTANCE_LOW).apply { setSound(null, null) })
    val stop = PendingIntent.getService(this, 1, Intent(this, AlarmSoundService::class.java).setAction(STOP), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val notification = NotificationCompat.Builder(this, CHANNEL).setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setContentTitle(getString(R.string.alarm_playing)).setOngoing(true)
      .addAction(0, getString(R.string.stop_sound), stop).build()
    startForeground(NOTIFICATION_ID, notification)
    if (player == null && vibrator == null) startSound(manager)
    return START_NOT_STICKY
  }

  private fun startSound(manager: NotificationManager) {
    val audio = getSystemService(AudioManager::class.java)
    if (manager.currentInterruptionFilter != NotificationManager.INTERRUPTION_FILTER_ALL) { finish(); return }
    val reminderChannel = manager.getNotificationChannel("medicine_reminders")
    val uri = reminderChannel?.sound
    if (uri != null && audio.ringerMode == AudioManager.RINGER_MODE_NORMAL && audio.getStreamVolume(AudioManager.STREAM_NOTIFICATION) > 0) {
      try {
        player = MediaPlayer().apply {
          setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
          setDataSource(this@AlarmSoundService, uri)
          isLooping = true
          prepare()
          start()
        }
      } catch (_: Exception) { player?.release(); player = null }
    }
    if (audio.ringerMode != AudioManager.RINGER_MODE_SILENT && reminderChannel?.shouldVibrate() == true) {
      @Suppress("DEPRECATION")
      val device = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
      if (device.hasVibrator()) {
        vibrator = device
        device.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 500, 500), 0))
      }
    }
    if (player == null && vibrator == null) finish()
  }

  private fun finish() { stopSelf() }
  override fun onDestroy() {
    player?.release()
    vibrator?.cancel()
    super.onDestroy()
  }
  companion object {
    private const val CHANNEL = "alarm_sound_session"
    private const val NOTIFICATION_ID = 119348
    private const val STOP = "com.pillreminder.STOP_SOUND"
    fun start(context: Context, id: String, at: Long) {
      val intent = Intent(context, AlarmSoundService::class.java).putExtra("id", id).putExtra("at", at)
      androidx.core.content.ContextCompat.startForegroundService(context, intent)
    }
  }
}
