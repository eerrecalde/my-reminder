#!/usr/bin/env bash
set -euo pipefail

: "${ANDROID_HOME:?Set ANDROID_HOME to your Android SDK directory}"
: "${ANDROID_SERIAL:?Set ANDROID_SERIAL to the disposable emulator serial}"
[[ "$ANDROID_SERIAL" =~ ^emulator-[0-9]+$ ]] || { echo 'Select an emulator serial, never a physical device.' >&2; exit 1; }
adb="$ANDROID_HOME/platform-tools/adb"
avd_name="$("$adb" -s "$ANDROID_SERIAL" emu avd name | tr -d '\r' | head -n 1)"
[[ "$avd_name" == 'pill_reminder_test' ]] || { echo 'This test requires the disposable pill_reminder_test emulator.' >&2; exit 1; }
root="$(cd "$(dirname "$0")/.." && pwd)"
(cd "$root/android" && ./gradlew :app:assembleDebug :app:assembleDebugAndroidTest)
"$adb" -s "$ANDROID_SERIAL" install -r "$root/android/app/build/outputs/apk/debug/app-debug.apk"
"$adb" -s "$ANDROID_SERIAL" install -r "$root/android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk"
"$adb" -s "$ANDROID_SERIAL" shell pm grant com.myreminders android.permission.POST_NOTIFICATIONS
"$adb" -s "$ANDROID_SERIAL" shell appops set com.myreminders SCHEDULE_EXACT_ALARM allow
"$adb" -s "$ANDROID_SERIAL" shell appops set com.myreminders USE_FULL_SCREEN_INTENT allow
"$adb" -s "$ANDROID_SERIAL" shell locksettings set-disabled false
result="$(mktemp)"
trap 'rm -f "$result"' EXIT
"$adb" -s "$ANDROID_SERIAL" shell am instrument -w com.myreminders.test/androidx.test.runner.AndroidJUnitRunner | tee "$result"
if ! grep -Eq '^OK \([0-9]+ tests?\)' "$result"; then
  echo 'Android instrumentation tests failed or did not finish.' >&2
  exit 1
fi
