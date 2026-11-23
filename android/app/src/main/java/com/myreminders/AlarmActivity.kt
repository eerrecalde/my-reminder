package com.myreminders

import android.app.Activity
import android.app.KeyguardManager
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.RippleDrawable
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import kotlin.math.roundToInt

class AlarmActivity : Activity() {
  private val keyguard by lazy { getSystemService(KeyguardManager::class.java) }
  private var showingDetails: Boolean? = null
  private val occurrences = mutableListOf<Uri>()
  private var firstDeliveryOrder = 0L
  private val handler = Handler(Looper.getMainLooper())
  private var keepAwakeUntil = 0L
  private val releaseScreen = Runnable { window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) }
  private data class RecordedOutcome(val label: Int, val change: MedicineRepository.OutcomeChange)
  private var recordedOutcome: RecordedOutcome? = null
  private val deliveries = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      enqueue(intent.data)
    }
  }
  private val lockEvents = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      if (intent.action == Intent.ACTION_SCREEN_OFF) render(showDetails = false)
      else refreshScreen()
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    keepAwakeUntil = savedInstanceState?.getLong("keepAwakeUntil")
      ?: (SystemClock.elapsedRealtime() + 120_000L)
    if (Build.VERSION.SDK_INT < 27) {
      @Suppress("DEPRECATION")
      window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
    }

    ContextCompat.registerReceiver(this, lockEvents, IntentFilter().apply {
      addAction(Intent.ACTION_SCREEN_OFF)
      addAction(Intent.ACTION_USER_PRESENT)
    }, ContextCompat.RECEIVER_NOT_EXPORTED)
    ContextCompat.registerReceiver(this, deliveries, IntentFilter(DELIVERED).apply {
      addDataScheme("myreminders")
    }, ContextCompat.RECEIVER_NOT_EXPORTED)
    val saved = savedInstanceState?.getStringArrayList("occurrences")
    firstDeliveryOrder = savedInstanceState?.getLong("firstDeliveryOrder")
      ?: intent.getLongExtra(DELIVERY_ORDER, 0L)
    if (saved != null) occurrences.addAll(saved.map(Uri::parse))
    else enqueue(intent.data)
    addDeliveriesAlreadyPosted(occurrences.firstOrNull() ?: intent.data)
    refreshScreen()
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    enqueue(intent.data)
  }

  override fun onSaveInstanceState(outState: Bundle) {
    outState.putStringArrayList("occurrences", ArrayList(occurrences.map(Uri::toString)))
    outState.putLong("firstDeliveryOrder", firstDeliveryOrder)
    outState.putLong("keepAwakeUntil", keepAwakeUntil)
    super.onSaveInstanceState(outState)
  }

  override fun onResume() {
    super.onResume()
    val remaining = keepAwakeUntil - SystemClock.elapsedRealtime()
    if (remaining > 0) {
      window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
      handler.postDelayed(releaseScreen, remaining)
    }
    showingDetails = null
    discardInactiveOccurrences()
    refreshScreen()
  }

  override fun onPause() {
    handler.removeCallbacks(releaseScreen)
    releaseScreen.run()
    super.onPause()
    render(showDetails = false)
  }

  override fun onDestroy() {
    unregisterReceiver(lockEvents)
    unregisterReceiver(deliveries)
    super.onDestroy()
  }

  private fun isLocked() = keyguard.isKeyguardLocked || keyguard.isDeviceLocked

  private fun discardInactiveOccurrences() {
    val posted = getSystemService(NotificationManager::class.java).activeNotifications.map { it.notification.group }.toSet()
    MedicineRepository(this).use { repo ->
      occurrences.removeAll { uri ->
        val id = uri.pathSegments.getOrNull(0)
        val at = uri.pathSegments.getOrNull(1)?.toLongOrNull()
        id == null || at == null || repo.occurrence(id, at)?.let { !it.outstanding || it.outcome != null } != false ||
          (repo.snooze(id, at) != null && uri.toString() !in posted)
      }
    }
  }

  private fun refreshScreen() {
    if (!isFinishing && !isDestroyed) render(showDetails = !isLocked())
  }

  private fun enqueue(uri: Uri?, refresh: Boolean = true) {
    val segments = uri?.pathSegments ?: return
    val id = segments.getOrNull(0) ?: return
    val at = segments.getOrNull(1)?.toLongOrNull() ?: return
    if (occurrences.contains(uri)) return
    val valid = MedicineRepository(this).use { repo ->
      val outstanding = repo.occurrence(id, at)?.let { it.outstanding && it.outcome == null } == true
      // A snooze delivery posts its notification before removing its snooze record.
      val alertPosted = repo.snooze(id, at) == null ||
        getSystemService(NotificationManager::class.java).activeNotifications.any { it.notification.group == uri.toString() }
      outstanding && alertPosted
    }
    if (!valid) return
    occurrences.add(uri)
    if (recordedOutcome != null) {
      occurrences.removeAt(0)
      recordedOutcome = null
    }
    val orders = getSystemService(NotificationManager::class.java).activeNotifications.associate {
      it.notification.group to it.notification.extras.getLong(DELIVERY_ORDER, Long.MAX_VALUE)
    }
    if (occurrences.size > 2) occurrences.subList(1, occurrences.size).sortBy {
      orders[it.toString()] ?: Long.MAX_VALUE
    }
    showingDetails = null
    if (refresh) refreshScreen()
  }

  private fun addDeliveriesAlreadyPosted(first: Uri?, refresh: Boolean = true) {
    if (first == null || isFinishing) return
    val notifications = getSystemService(NotificationManager::class.java).activeNotifications
    if (firstDeliveryOrder == 0L) {
      firstDeliveryOrder = notifications.firstOrNull { it.notification.group == first.toString() }
        ?.notification?.extras?.getLong(DELIVERY_ORDER, 0L) ?: return
    }
    if (firstDeliveryOrder == 0L) return
    notifications.asSequence()
      .filter { it.notification.extras.getLong(DELIVERY_ORDER, 0L) >= firstDeliveryOrder }
      .sortedBy { it.notification.extras.getLong(DELIVERY_ORDER) }
      .mapNotNull { it.notification.group }
      .map(Uri::parse)
      .filter { it.scheme == "myreminders" && it.host == "alarm-screen" }
      .forEach { enqueue(it, refresh) }
  }

  private fun advance() {
    addDeliveriesAlreadyPosted(occurrences.firstOrNull(), refresh = false)
    if (occurrences.isNotEmpty()) occurrences.removeAt(0)
    MedicineRepository(this).use { repo ->
      occurrences.removeAll { uri ->
        val id = uri.pathSegments.getOrNull(0)
        val at = uri.pathSegments.getOrNull(1)?.toLongOrNull()
        id == null || at == null || repo.occurrence(id, at)?.let { !it.outstanding || it.outcome != null } != false || repo.snooze(id, at) != null
      }
    }
    if (occurrences.isEmpty()) finish()
    else {
      recordedOutcome = null
      showingDetails = null
      refreshScreen()
    }
  }

  private fun render(showDetails: Boolean) {
    if (isFinishing) return
    if (showingDetails == showDetails) return
    val result = recordedOutcome
    if (!showDetails && result != null) {
      setContentView(View(this))
      finish()
      return
    }
    val segments = occurrences.firstOrNull()?.pathSegments
    val id = segments?.getOrNull(0)
    val at = segments?.getOrNull(1)?.toLongOrNull()
    if (id == null || at == null) {
      finish()
      return
    }
    showingDetails = showDetails

    val occurrence = if (showDetails && result == null) MedicineRepository(this).use { repo ->
      repo.occurrence(id, at)?.takeIf { it.outstanding && it.outcome == null }
    } else null
    if (showDetails && occurrence == null && result == null) {
      advance()
      return
    }

    val pageColour = Color.rgb(251, 246, 235)
    window.decorView.setBackgroundColor(pageColour)
    WindowCompat.getInsetsController(window, window.decorView).apply {
      isAppearanceLightStatusBars = true
      isAppearanceLightNavigationBars = true
    }

    val localized = AppLanguage.context(this)
    val cardWidth = dp((resources.configuration.screenWidthDp - 48).coerceIn(0, 360))
    val card = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      setPadding(dp(24), dp(28), dp(24), dp(24))
      background = rounded(Color.rgb(255, 250, 241), 16).apply {
        setStroke(dp(1), Color.rgb(229, 225, 207))
      }
      addView(ImageView(context).apply {
        background = rounded(Color.rgb(238, 240, 216), 24)
        setPadding(dp(12), dp(12), dp(12), dp(12))
        setImageResource(R.drawable.ic_alarm_screen_clock)
        importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
      }, LinearLayout.LayoutParams(dp(48), dp(48)))
      addView(TextView(context).apply {
        text = occurrence?.name ?: localized.getString(result?.label ?: R.string.alarm_screen_title)
        setTextColor(Color.rgb(22, 37, 36))
        textSize = 26f
        setTypeface(Typeface.DEFAULT, Typeface.BOLD)
        gravity = Gravity.CENTER
      }, LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT).apply { topMargin = dp(16) })
      if (occurrences.size > 1) {
        addView(TextView(context).apply {
          text = localized.getString(R.string.alarm_screen_another_due)
          setTextColor(Color.rgb(62, 93, 51))
          textSize = 16f
          gravity = Gravity.CENTER
        }, LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT).apply { topMargin = dp(8) })
      }
      val snooze = {
        if (ReminderScheduler.snooze(this@AlarmActivity, id, at, 10)) {
          advance()
        } else {
          Toast.makeText(localized, R.string.alarm_screen_snooze_failed, Toast.LENGTH_SHORT).show()
        }
      }
      val secondaryActions = mutableListOf<Button>()
      if (result != null) {
        addPrimaryAction(localized.getString(R.string.undo)) {
          if (!isLocked()) {
            val change = result.change
            ReminderScheduler.undoOutcome(context, id, at, change.previous, change.revision, change.previousCleared)
          }
          finish()
        }
      } else if (occurrence != null) {
        val medicine = occurrence.type == "medicine"
        occurrence.instructions?.takeIf { medicine && it.isNotBlank() }?.let { instructions ->
          addView(TextView(context).apply {
            text = instructions
            setTextColor(Color.rgb(22, 37, 36))
            textSize = 16f
            gravity = Gravity.CENTER
          }, LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT).apply { topMargin = dp(8) })
        }
        val completion = if (medicine) R.string.taken else R.string.completed
        addPrimaryAction(localized.getString(completion)) {
          answer(id, at, "completed", completion)
        }
        secondaryActions += actionButton(localized.getString(R.string.skip), primary = false) {
          answer(id, at, "skipped", R.string.skipped)
        }
        secondaryActions += actionButton(localized.getString(R.string.alarm_screen_snooze), primary = false, action = snooze)
      } else {
        addPrimaryAction(localized.getString(R.string.snooze_ten), action = snooze)
        secondaryActions += actionButton(localized.getString(R.string.alarm_screen_unlock), primary = false) {
          keyguard.requestDismissKeyguard(this@AlarmActivity, object : KeyguardManager.KeyguardDismissCallback() {
            override fun onDismissSucceeded() = refreshScreen()
          })
        }
      }
      secondaryActions += actionButton(localized.getString(R.string.alarm_screen_close), primary = false) {
        if (result == null) stopService(Intent(this@AlarmActivity, AlarmSoundService::class.java))
        finish()
      }
      addSecondaryActions(secondaryActions, cardWidth - paddingLeft - paddingRight)
    }
    val brand = LinearLayout(this).apply {
      gravity = Gravity.CENTER
      addView(ImageView(context).apply {
        setImageResource(R.drawable.alarm_brand_sprig)
        scaleType = ImageView.ScaleType.FIT_CENTER
        importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
      }, LinearLayout.LayoutParams(dp(48), dp(36)))
      addView(TextView(context).apply {
        setText(R.string.app_name)
        setTextColor(Color.rgb(23, 35, 26))
        textSize = 17f
        setTypeface(Typeface.DEFAULT, Typeface.BOLD)
      })
    }
    setContentView(ScrollView(this).apply {
      isFillViewport = true
      setBackgroundColor(pageColour)
      addView(LinearLayout(context).apply {
        orientation = LinearLayout.VERTICAL
        gravity = Gravity.CENTER_HORIZONTAL
        setPadding(0, dp(24), 0, dp(24))
        addView(brand, LinearLayout.LayoutParams(cardWidth, WRAP_CONTENT))
        addView(FrameLayout(context).apply {
          setPadding(0, dp(16), 0, 0)
          addView(card, FrameLayout.LayoutParams(cardWidth, WRAP_CONTENT, Gravity.CENTER))
        }, LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT, 1f))
      })
    })
  }

  private fun answer(id: String, at: Long, outcome: String, resultLabel: Int) {
    if (recordedOutcome != null || isFinishing) return
    if (isLocked()) {
      refreshScreen()
      return
    }
    val change = ReminderScheduler.recordOutcome(this, id, at, outcome, onlyUnconfirmed = true)
    if (change == null) {
      advance()
      return
    }
    if (occurrences.size > 1) {
      advance()
      return
    }
    recordedOutcome = RecordedOutcome(resultLabel, change)
    showingDetails = null
    refreshScreen()
  }

  private fun LinearLayout.addPrimaryAction(label: String, action: () -> Unit) {
    addView(actionButton(label, primary = true, action = action),
      LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT).apply { topMargin = dp(24) })
  }

  private fun LinearLayout.addSecondaryActions(actions: List<Button>, availableWidth: Int) {
    val unconstrained = View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED)
    val horizontal = actions.sumOf { button ->
      button.measure(unconstrained, unconstrained)
      button.measuredWidth
    } <= availableWidth
    addView(LinearLayout(context).apply {
      orientation = if (horizontal) LinearLayout.HORIZONTAL else LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      actions.forEach { button ->
        val width = if (horizontal) WRAP_CONTENT else MATCH_PARENT
        val weight = if (horizontal) 1f else 0f
        addView(button, LinearLayout.LayoutParams(width, WRAP_CONTENT, weight))
      }
    }, LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT).apply { topMargin = dp(4) })
  }

  private fun actionButton(label: String, primary: Boolean, action: () -> Unit) = Button(this).apply {
    text = label
    isAllCaps = false
    setTextColor(if (primary) Color.rgb(255, 253, 244) else Color.rgb(62, 93, 51))
    textSize = if (primary) 16f else 14f
    letterSpacing = 0f
    setTypeface(Typeface.DEFAULT, Typeface.BOLD)
    minWidth = dp(48)
    minHeight = dp(48)
    val horizontalPadding = dp(if (primary) 18 else 8)
    setPadding(horizontalPadding, dp(10), horizontalPadding, dp(10))
    stateListAnimator = null
    backgroundTintList = null
    background = RippleDrawable(
      ColorStateList.valueOf(if (primary) 0x33FFFFFF else 0x224B6F3D),
      if (primary) rounded(Color.rgb(75, 111, 61), 24) else null,
      rounded(Color.WHITE, 24),
    )
    setOnClickListener { action() }
  }

  private fun dp(value: Int): Int = (value * resources.displayMetrics.density).roundToInt()

  private fun rounded(colour: Int, radius: Int) = GradientDrawable().apply {
    setColor(colour)
    cornerRadius = dp(radius).toFloat()
  }

  companion object {
    const val DELIVERY_ORDER = "com.myreminders.ALARM_DELIVERY_ORDER"
    private const val DELIVERED = "com.myreminders.ALARM_SCREEN_DELIVERED"
    private const val MATCH_PARENT = LinearLayout.LayoutParams.MATCH_PARENT
    private const val WRAP_CONTENT = LinearLayout.LayoutParams.WRAP_CONTENT
    fun occurrenceDelivered(context: Context, id: String, at: Long) {
      context.sendBroadcast(Intent(DELIVERED).setPackage(context.packageName)
        .setData(Uri.parse("myreminders://alarm-screen/$id/$at")))
    }
  }
}
