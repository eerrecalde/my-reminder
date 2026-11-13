package com.myreminders

import android.app.Activity
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class AlarmActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    if (Build.VERSION.SDK_INT < 27) {
      @Suppress("DEPRECATION")
      window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
    }

    val localized = AppLanguage.context(this)
    val padding = (24 * resources.displayMetrics.density).toInt()
    setContentView(LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setPadding(padding, padding, padding, padding)
      addView(TextView(context).apply {
        text = localized.getString(R.string.alarm_screen_title)
        textSize = 28f
        gravity = Gravity.CENTER
      })
      addView(Button(context).apply {
        text = localized.getString(R.string.alarm_screen_close)
        setOnClickListener {
          stopService(Intent(this@AlarmActivity, AlarmSoundService::class.java))
          finish()
        }
      })
    })
  }
}
