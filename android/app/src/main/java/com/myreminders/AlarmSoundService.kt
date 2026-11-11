package com.myreminders

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.BroadcastReceiver
import android.content.IntentFilter
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
  private var sessionSound: String? = null
  private var sessionStarted = false
  private val settingsChanged = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      stopOutputs()
      startSound(getSystemService(NotificationManager::class.java))
    }
  }
  private val occurrenceStopped = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      val id = intent.getStringExtra("id") ?: return
      val at = intent.getLongExtra("at", 0)
      if (active[id] == at) active.remove(id)
      if (active.isEmpty()) finish()
    }
  }

  override fun onCreate() {
    super.onCreate()
    val filter = IntentFilter().apply {
      addAction(AudioManager.RINGER_MODE_CHANGED_ACTION)
      addAction(NotificationManager.ACTION_INTERRUPTION_FILTER_CHANGED)
      addAction(NotificationManager.ACTION_NOTIFICATION_CHANNEL_BLOCK_STATE_CHANGED)
    }
    androidx.core.content.ContextCompat.registerReceiver(this, settingsChanged, filter, androidx.core.content.ContextCompat.RECEIVER_NOT_EXPORTED)
    androidx.core.content.ContextCompat.registerReceiver(this, occurrenceStopped, IntentFilter(STOP_OCCURRENCE), androidx.core.content.ContextCompat.RECEIVER_NOT_EXPORTED)
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == STOP) {
      active.clear()
      finish()
      return START_NOT_STICKY
    }
    val id = intent?.getStringExtra("id") ?: run { finish(); return START_NOT_STICKY }
    val at = intent.getLongExtra("at", 0)
    if (!MedicineRepository(this).use { it.soundAllowed(id, at) }) {
      if (active.isEmpty()) finish()
      return START_NOT_STICKY
    }
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
    if (!sessionStarted) {
      sessionSound = MedicineRepository(this).use { ReminderSounds.resolve(this, "alarm", it.soundChoice(id, "alarm")) }
      sessionStarted = true
      startSound(manager)
    }
    return START_NOT_STICKY
  }

  private fun startSound(manager: NotificationManager) {
    val audio = getSystemService(AudioManager::class.java)
    val reminderChannel = manager.getNotificationChannel("medicine_reminders")
    val allowed = when (manager.currentInterruptionFilter) {
      NotificationManager.INTERRUPTION_FILTER_ALL -> true
      NotificationManager.INTERRUPTION_FILTER_PRIORITY -> try {
        reminderChannel?.canBypassDnd() == true ||
          manager.notificationPolicy.priorityCategories and NotificationManager.Policy.PRIORITY_CATEGORY_REMINDERS != 0
      } catch (_: SecurityException) { false }
      else -> false
    }
    if (!allowed || reminderChannel == null || reminderChannel.importance == NotificationManager.IMPORTANCE_NONE) { finish(); return }
    val uri = if (!ReminderSounds.channelAllowsSound(reminderChannel)) null else when (val selected = sessionSound) { null -> reminderChannel.sound; "" -> null; else -> android.net.Uri.parse(selected) }
    if (uri != null && audio.ringerMode == AudioManager.RINGER_MODE_NORMAL && audio.getStreamVolume(AudioManager.STREAM_NOTIFICATION) > 0) {
      val newPlayer = MediaPlayer()
      try {
        newPlayer.apply {
          setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
          setDataSource(this@AlarmSoundService, uri)
          isLooping = true
          prepare()
          start()
        }
        player = newPlayer
      } catch (_: Exception) { newPlayer.release() }
    }
    if (audio.ringerMode != AudioManager.RINGER_MODE_SILENT && reminderChannel?.shouldVibrate() == true) {
      @Suppress("DEPRECATION")
      val device = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
      if (device.hasVibrator()) {
        vibrator = device
        device.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 500, 500), 0))
      }
    }
  }

  private fun finish() { stopSelf() }
  private fun stopOutputs() {
    player?.release()
    player = null
    vibrator?.cancel()
    vibrator = null
  }
  override fun onDestroy() {
    unregisterReceiver(settingsChanged)
    unregisterReceiver(occurrenceStopped)
    stopOutputs()
    super.onDestroy()
  }
  companion object {
    private const val CHANNEL = "alarm_sound_session"
    private const val NOTIFICATION_ID = 119348
    private const val STOP = "com.myreminders.STOP_SOUND"
    private const val STOP_OCCURRENCE = "com.myreminders.STOP_OCCURRENCE"
    fun stopOccurrence(context: Context, id: String, at: Long) {
      context.sendBroadcast(Intent(STOP_OCCURRENCE).setPackage(context.packageName).putExtra("id", id).putExtra("at", at))
    }
    fun start(context: Context, id: String, at: Long) {
      val intent = Intent(context, AlarmSoundService::class.java).putExtra("id", id).putExtra("at", at)
      androidx.core.content.ContextCompat.startForegroundService(context, intent)
    }
  }
}
