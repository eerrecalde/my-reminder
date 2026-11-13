package com.myreminders

import android.app.Activity
import android.content.Intent
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
import androidx.core.view.WindowCompat
import kotlin.math.roundToInt

class AlarmActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    if (Build.VERSION.SDK_INT < 27) {
      @Suppress("DEPRECATION")
      window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
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
        text = localized.getString(R.string.alarm_screen_title)
        setTextColor(Color.rgb(22, 37, 36))
        textSize = 26f
        setTypeface(Typeface.DEFAULT, Typeface.BOLD)
        gravity = Gravity.CENTER
      }, LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT).apply { topMargin = dp(16) })
      addView(Button(context).apply {
        text = localized.getString(R.string.alarm_screen_close)
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
        setOnClickListener {
          stopService(Intent(this@AlarmActivity, AlarmSoundService::class.java))
          finish()
        }
      }, LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT).apply { topMargin = dp(24) })
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
