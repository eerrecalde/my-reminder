package com.myreminders

import android.app.Activity
import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.RippleDrawable
import android.os.Build
import android.os.Bundle
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
  private val lockEvents = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      if (intent.action == Intent.ACTION_SCREEN_OFF) render(showDetails = false)
      else refreshScreen()
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    if (Build.VERSION.SDK_INT < 27) {
      @Suppress("DEPRECATION")
      window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
    }

    ContextCompat.registerReceiver(this, lockEvents, IntentFilter().apply {
      addAction(Intent.ACTION_SCREEN_OFF)
      addAction(Intent.ACTION_USER_PRESENT)
    }, ContextCompat.RECEIVER_NOT_EXPORTED)
    refreshScreen()
  }

  override fun onResume() {
    super.onResume()
    refreshScreen()
  }

  override fun onPause() {
    super.onPause()
    render(showDetails = false)
  }

  override fun onDestroy() {
    unregisterReceiver(lockEvents)
    super.onDestroy()
  }

  private fun isLocked() = keyguard.isKeyguardLocked || keyguard.isDeviceLocked

  private fun refreshScreen() {
    if (!isFinishing && !isDestroyed) render(showDetails = !isLocked())
  }

  private fun render(showDetails: Boolean) {
    if (showingDetails == showDetails || isFinishing) return
    val segments = intent.data?.pathSegments
    val id = segments?.getOrNull(0)
    val at = segments?.getOrNull(1)?.toLongOrNull()
    if (id == null || at == null) {
      finish()
      return
    }
    showingDetails = showDetails

    val occurrence = if (showDetails) MedicineRepository(this).use { repo ->
      repo.occurrences().find { it.medicineId == id && it.at == at && it.outstanding && it.outcome == null }
    } else null
    if (showDetails && occurrence == null) {
      finish()
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
        text = occurrence?.name ?: localized.getString(R.string.alarm_screen_title)
        setTextColor(Color.rgb(22, 37, 36))
        textSize = 26f
        setTypeface(Typeface.DEFAULT, Typeface.BOLD)
        gravity = Gravity.CENTER
      }, LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT).apply { topMargin = dp(16) })
      val medicine = occurrence?.type == "medicine"
      if (occurrence != null) {
        occurrence.instructions?.takeIf { medicine && it.isNotBlank() }?.let { instructions ->
          addView(TextView(context).apply {
            text = instructions
            setTextColor(Color.rgb(22, 37, 36))
            textSize = 16f
            gravity = Gravity.CENTER
          }, LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT).apply { topMargin = dp(8) })
        }
        addAction(localized.getString(if (medicine) R.string.taken else R.string.completed), topMargin = 24) {
          answer(id, at, "completed")
        }
        addAction(localized.getString(R.string.skip)) { answer(id, at, "skipped") }
      } else {
        addAction(localized.getString(R.string.alarm_screen_unlock), topMargin = 24) {
          keyguard.requestDismissKeyguard(this@AlarmActivity, object : KeyguardManager.KeyguardDismissCallback() {
            override fun onDismissSucceeded() = refreshScreen()
          })
        }
      }
      addAction(localized.getString(R.string.snooze_ten)) {
        if (ReminderScheduler.snooze(this@AlarmActivity, id, at, 10)) {
          finish()
        } else {
          Toast.makeText(localized, R.string.alarm_screen_snooze_failed, Toast.LENGTH_SHORT).show()
        }
      }
      addAction(localized.getString(R.string.alarm_screen_close)) {
        stopService(Intent(this@AlarmActivity, AlarmSoundService::class.java))
        finish()
      }
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

  private fun answer(id: String, at: Long, outcome: String) {
    if (isLocked()) {
      refreshScreen()
      return
    }
    ReminderScheduler.notificationOutcome(this, id, at, outcome)
    finish()
  }

  private fun LinearLayout.addAction(label: String, topMargin: Int = 8, action: () -> Unit) {
    addView(Button(context).apply {
      text = label
      isAllCaps = false
      setTextColor(Color.rgb(255, 253, 244))
      textSize = 16f
      letterSpacing = 0f
      setTypeface(Typeface.DEFAULT, Typeface.BOLD)
      minHeight = dp(48)
      setPadding(dp(18), dp(10), dp(18), dp(10))
      stateListAnimator = null
      backgroundTintList = null
      background = RippleDrawable(
        ColorStateList.valueOf(0x33FFFFFF),
        rounded(Color.rgb(75, 111, 61), 24),
        null,
      )
      setOnClickListener { action() }
    }, LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT).apply { this.topMargin = dp(topMargin) })
  }

  private fun dp(value: Int): Int = (value * resources.displayMetrics.density).roundToInt()

  private fun rounded(colour: Int, radius: Int) = GradientDrawable().apply {
    setColor(colour)
    cornerRadius = dp(radius).toFloat()
  }

  private companion object {
    const val MATCH_PARENT = LinearLayout.LayoutParams.MATCH_PARENT
    const val WRAP_CONTENT = LinearLayout.LayoutParams.WRAP_CONTENT
  }
}
