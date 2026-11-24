# Long-history baseline

This is an opt-in synthetic benchmark for the disposable `pill_reminder_test`
emulator only. It creates data and registers alarms in the target installation.
Never run it against a phone or an installation with data to keep. It is not a
substitute for physical-device measurements.

## Dataset

The benchmark creates 24 daily items (12 active, six paused and six deleted),
half Reminder and half Medicine. Eight use Alarm mode. Each has one 09:00
occurrence per day for 365 days, ending 90 days before the run: 8,760 stored
occurrences. The records include completed, skipped, missed, unanswered and cleared
history, with snapshots retained for inactive items. Recovery fills the gap for
active items. This is a synthetic stress sample, not a claim about a typical
family's use. The date and timezone are recorded for comparisons.

## Procedure

1. Follow the README's JDK, SDK and disposable emulator setup. Confirm the
   serial and AVD name. Build a self-contained debug and test APK with
   `(cd android && ./gradlew :app:assembleDebug :app:assembleDebugAndroidTest -PbundleTestDebug)`.
2. Confirm the AVD name, then install and prepare the **disposable** target.
   Clearing data removes all local reminders:

   ```sh
   adb -s emulator-5554 emu avd name
   adb -s emulator-5554 install -r android/app/build/outputs/apk/debug/app-debug.apk
   adb -s emulator-5554 install -r android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
   adb -s emulator-5554 shell pm clear com.myreminders
   adb -s emulator-5554 shell pm grant com.myreminders android.permission.POST_NOTIFICATIONS
   adb -s emulator-5554 shell appops set com.myreminders SCHEDULE_EXACT_ALARM allow
   adb -s emulator-5554 shell appops set com.myreminders USE_FULL_SCREEN_INTENT allow
   ```
3. Record the source commit, emulator model, API, timezone, clock, host and
   build variant. Run:

   ```sh
   adb -s emulator-5554 logcat -c
   adb -s emulator-5554 shell am instrument -w \
     -e class com.myreminders.LongHistoryBenchmark \
     -e longHistoryBenchmark true \
     -e confirmDisposableAvd pill_reminder_test \
     com.myreminders.test/androidx.test.runner.AndroidJUnitRunner
   adb -s emulator-5554 logcat -d -s LongHistoryBenchmark:I '*:S'
   ```

   Replace the serial with the confirmed disposable emulator serial. The test
   requires an emulator, explicit confirmation and an empty target database.
   The confirmation is supplied by the operator, so verify the actual AVD
   name with `adb -s emulator-5554 emu avd name` before proceeding. It leaves the
   synthetic data and scheduled alarms for inspection. After measurements run
   `adb -s emulator-5554 shell pm clear com.myreminders` on the confirmed
   disposable emulator. Android removes the app's data and scheduled alarms.
4. Log `recovery_ms`, `occurrence_read_ms`, `scheduling_ms`, occurrence and
   item counts. Recovery is a **direct call** to the recovery method, not an
   Android-delivered broadcast or process restart. The occurrence read excludes
   bridge serialization, UI layout and rendering; scheduling is a subsequent
   pass over active items, not the time to deliver an alert.
5. For a meaningful comparison, restore the same fresh dataset before each
   sample: recovery changes history and alarms. Use the same date, timezone,
   emulator configuration, build variant and method, and record several runs
   and their range or median. Capture app state/history load separately at the
   actual UI boundary; it is not measured by this benchmark yet. Profile slow
   sections before deciding which queries or operations cause any measured
   delay.

No acceptance targets have been agreed. Agree them with Emiliano using the
measurements and the expected family usage before evaluating improvements.

## Initial observation

On 24 November 2026, the `pill_reminder_test` API 36 emulator
(`sdk_gphone64_arm64`, Europe/London) on an ARM64 host ran the benchmark from
commit `02ba046` with the bundled debug build. One sample produced:

| Measurement | Result |
| --- | ---: |
| Seeded occurrences | 8,760 |
| Occurrences after recovery | 9,852 |
| Direct recovery | 8,436 ms |
| Full occurrence read after recovery | 27 ms |
| Subsequent scheduling of 12 active items | 18 ms |

This observation used the earlier dataset at `02ba046`; that version had no
missed outcomes and marked unanswered rather than completed records as cleared.
Do not compare it directly with runs of the corrected dataset above.

The target installation was cleared afterward; Android's alarm dump recorded the
removed watchdog alarms with reason `data_cleared`. This single observation does
not establish variability, a root cause or a product target. Actual Android
recovery, app state and history UI load have not been timed yet.
