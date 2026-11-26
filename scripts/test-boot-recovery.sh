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
"$adb" -s "$ANDROID_SERIAL" shell appops set --uid com.myreminders SCHEDULE_EXACT_ALARM allow
trap '"$adb" -s "$ANDROID_SERIAL" shell appops set com.myreminders SCHEDULE_EXACT_ALARM allow >/dev/null || true; "$adb" -s "$ANDROID_SERIAL" shell appops set --uid com.myreminders SCHEDULE_EXACT_ALARM allow >/dev/null || true; "$adb" -s "$ANDROID_SERIAL" shell pm clear com.myreminders >/dev/null || true' EXIT
run_test() {
  local result
  result="$("$adb" -s "$ANDROID_SERIAL" shell am instrument -w -e bootRecoveryTest true -e class "com.myreminders.BootRecoveryTest#$1" com.myreminders.test/androidx.test.runner.AndroidJUnitRunner)"
  echo "$result"
  [[ "$result" == *'OK (1 test)'* ]] || return 1
}
run_test prepare
"$adb" -s "$ANDROID_SERIAL" reboot
"$adb" -s "$ANDROID_SERIAL" wait-for-device
for attempt in {1..120}; do
  [[ "$("$adb" -s "$ANDROID_SERIAL" shell getprop sys.boot_completed | tr -d '\r')" == 1 ]] && break
  sleep 1
done
[[ "$("$adb" -s "$ANDROID_SERIAL" shell getprop sys.boot_completed | tr -d '\r')" == 1 ]] || { echo 'Emulator did not complete boot.' >&2; exit 1; }
"$adb" -s "$ANDROID_SERIAL" shell input keyevent 82
for attempt in {1..60}; do
  alarm_count="$("$adb" -s "$ANDROID_SERIAL" shell dumpsys alarm | awk '/Past-due non-wakeup alarms/{exit} /tag=\*walarm\*:com\.myreminders\/\.ReminderReceiver/{n++} END{print n+0}')"
  (( alarm_count >= 2 )) && break
  sleep 1
done
(( alarm_count >= 2 )) || { echo 'Fewer than two future Android reminder alarms were restored.' >&2; exit 1; }
run_test verify
echo 'Observed a real emulator reboot and two restored future Android alarms.'
run_test preparePermissionChange
"$adb" -s "$ANDROID_SERIAL" shell appops set --uid com.myreminders SCHEDULE_EXACT_ALARM deny
access="$("$adb" -s "$ANDROID_SERIAL" shell appops get com.myreminders SCHEDULE_EXACT_ALARM)"
[[ "$access" == *'Uid mode: SCHEDULE_EXACT_ALARM: deny'* ]] || { echo 'Exact-alarm access was not denied for the app UID.' >&2; exit 1; }
for attempt in {1..10}; do
  alarm_count="$("$adb" -s "$ANDROID_SERIAL" shell dumpsys alarm | awk '/Past-due non-wakeup alarms/{exit} /tag=\*walarm\*:com\.myreminders\/\.ReminderReceiver/{n++} END{print n+0}')"
  (( alarm_count == 0 )) && break
  sleep 1
done
(( alarm_count == 0 )) || { echo 'Exact alarms were not removed after access was revoked.' >&2; exit 1; }
"$adb" -s "$ANDROID_SERIAL" shell appops set --uid com.myreminders SCHEDULE_EXACT_ALARM allow
for attempt in {1..60}; do
  alarm_count="$("$adb" -s "$ANDROID_SERIAL" shell dumpsys alarm | awk '/Past-due non-wakeup alarms/{exit} /tag=\*walarm\*:com\.myreminders\/\.ReminderReceiver/{n++} END{print n+0}')"
  (( alarm_count >= 2 )) && break
  sleep 1
done
(( alarm_count >= 2 )) || { echo 'Fewer than two future Android reminder alarms were restored after access was granted.' >&2; exit 1; }
run_test verifyPermissionChange
echo 'Observed future Android alarms restored after exact-alarm access was re-enabled.'
