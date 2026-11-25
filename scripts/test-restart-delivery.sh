#!/usr/bin/env bash
set -euo pipefail

: "${ANDROID_HOME:?Set ANDROID_HOME to your Android SDK directory}"
: "${ANDROID_SERIAL:?Set ANDROID_SERIAL to the disposable emulator serial}"
[[ "$ANDROID_SERIAL" =~ ^emulator-[0-9]+$ ]] || { echo 'Select an emulator, never a physical device.' >&2; exit 1; }
adb="$ANDROID_HOME/platform-tools/adb"
avd_name="$("$adb" -s "$ANDROID_SERIAL" emu avd name | tr -d '\r' | head -n 1)"
[[ "$avd_name" == 'pill_reminder_test' ]] || { echo 'This test requires the disposable pill_reminder_test emulator.' >&2; exit 1; }
root="$(cd "$(dirname "$0")/.." && pwd)"
(cd "$root/android" && ./gradlew -PbundleTestDebug :app:assembleDebug :app:assembleDebugAndroidTest)
"$adb" -s "$ANDROID_SERIAL" install -r "$root/android/app/build/outputs/apk/debug/app-debug.apk"
"$adb" -s "$ANDROID_SERIAL" install -r "$root/android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk"
"$adb" -s "$ANDROID_SERIAL" shell pm clear com.myreminders
"$adb" -s "$ANDROID_SERIAL" shell pm grant com.myreminders android.permission.POST_NOTIFICATIONS
"$adb" -s "$ANDROID_SERIAL" shell appops set com.myreminders SCHEDULE_EXACT_ALARM allow
"$adb" -s "$ANDROID_SERIAL" logcat -c
run_test() {
  local result
  result="$("$adb" -s "$ANDROID_SERIAL" shell am instrument -w -e restartDeliveryTest true -e class "com.myreminders.RestartDeliveryTest#$1" com.myreminders.test/androidx.test.runner.AndroidJUnitRunner)"
  echo "$result"
  [[ "$result" == *'OK (1 test)'* ]] || return 1
}
trap '"$adb" -s "$ANDROID_SERIAL" shell pm clear com.myreminders >/dev/null' EXIT
run_test prepare
# Starting instrumentation force-stops the target process. Inspect Android's
# notifications and alarms before invoking the verification instrumentation.
for attempt in {1..30}; do
  notifications="$("$adb" -s "$ANDROID_SERIAL" shell dumpsys notification --noredact)"
  if [[ "$notifications" == *'Restart reminder'* && "$notifications" == *'Restart medicine'* ]]; then break; fi
  sleep 1
done
[[ "$notifications" == *'Restart reminder'* && "$notifications" == *'Restart medicine'* ]] || { echo 'Both notifications were not delivered.' >&2; exit 1; }
"$adb" -s "$ANDROID_SERIAL" logcat -d -s ActivityManager:I '*:S' | grep -Eq 'Start proc .*com\.myreminders.*for broadcast.*ReminderReceiver' || { echo 'No receiver process restart observed.' >&2; exit 1; }
alarm_count="$("$adb" -s "$ANDROID_SERIAL" shell dumpsys alarm | awk '/Past-due non-wakeup alarms/{exit} /tag=\*walarm\*:com\.myreminders\/\.ReminderReceiver/{n++} END{print n+0}')"
(( alarm_count >= 2 )) || { echo 'Fewer than two future Android reminder alarms were found.' >&2; exit 1; }
run_test verify
echo 'Observed both notifications, a receiver process restart, and future Android alarms.'
