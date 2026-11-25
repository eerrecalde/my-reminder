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

## Agreed targets and comparison

On 25 November 2026 Emiliano agreed these targets for the documented dataset
on this disposable emulator:

- Direct recovery within **5,000 ms**.
- The first Reminders row within **3,000 ms** from the Activity launch
  request, and the first History row within **3,000 ms** from selecting
  History, using the UI benchmark boundaries described in
  [long-history-ui.md](long-history-ui.md). Neither screen may run out of
  memory.

For each comparison use at least three freshly seeded runs with the same
date, timezone, emulator configuration and build variant, and record every
result. Each run should meet the relevant limit; a crash, timeout or missing
row is a failure, not an omitted sample. Preserve the counts and all required
data and schedules; timing alone is insufficient. Compare direct recovery,
the separate read and scheduling measurements, and UI values with the baseline
below. Do not subtract the separate measurements from recovery or treat them
as Android-delivered timings. Repeat the same UI method after changes; if its
accessibility polling fails, report that failure and use an additional less
intrusive check to help distinguish instrumentation overhead. Document changes
in method and device conditions instead of presenting incomparable results as
improvements. These emulator targets do not establish physical-device
performance; the planned device checkpoint remains separate.

## Repeated baseline, 25 November 2026

On commit `4279e98`, the bundled debug build ran three freshly seeded samples
on the confirmed `pill_reminder_test` Android 16 (API 36) ARM64 emulator on
an ARM64 host, in Europe/London. Each sample started with 24 items and 8,760
occurrences and ended with 12 active items and 9,852 occurrences. The UI
benchmark followed each recovery, then the installation was cleared before
the next seed. After the last run, `pm clear` returned `Success`.

| Sample | Direct recovery | Full occurrence read | Subsequent scheduling |
| --- | ---: | ---: | ---: |
| 1 | 8,184 ms | 23 ms | 16 ms |
| 2 | 7,794 ms | 25 ms | 21 ms |
| 3 | 7,675 ms | 23 ms | 20 ms |
| Median | 7,794 ms | 23 ms | 20 ms |

These are direct-call, warm-process measurements, not Android broadcast or
restart timings. The read and scheduling figures are separate subsequent
operations and cannot be subtracted from recovery to attribute its cost.
Recovery repeatedly reads all occurrences when processing inactive items and
also reconciles each active item's gap; these are code-inspection leads, not
quantified causes. See [UI results](long-history-ui.md) for the separate
observed memory failure.

## Recovery optimization in progress, 25 November 2026

On the same disposable API 36 ARM64 emulator and dataset, a fresh baseline
run took 8,003 ms. Temporary phase timing measured 2,699 ms for inactive-item
cleanup and 5,127 ms for active-item reconciliation (7,836 ms total). These
phase observations are one instrumented sample, not a detailed profile.

After batching recovered occurrences and reducing inactive cleanup, three
fresh runs measured 3,160, 2,967 and 3,011 ms for direct recovery; full reads
took 23, 24 and 24 ms and subsequent scheduling 19, 17 and 18 ms. Each began
with 8,760 occurrences and ended with 9,852 occurrences and 12 active items
with registered alarms. These samples meet the direct-call target but do not
establish timely delivery while recovery is running. The receiver execution
strategy and real process-interruption and Android-delivery checks remain open.

The full Android 16 instrumentation run on the partial feature branch ran 67
tests with one failure: `AlarmChannelDeliveryTest` recorded the enabled alarm
occurrence without its expected notification. A subsequent focused feature
run passed; the same focused test then failed with the same assertion on an
independent checkout of baseline `a76b0dd`. This reproduces the failure without
the optimization but does not establish its cause. The full run did pass its
actual Android schedule and snooze delivery tests; those were not long-history
or simultaneous-recovery delivery tests. The partial-batch test simulates a
committed partial recovery; it does not kill or restart the process.

Follow-up diagnostic runs reproduced the missing notification once in three
fresh focused runs. Temporary logging showed the failure arrived while
`recovery_pending` was true and took the recovery path; the two passing runs
arrived with recovery clear and claimed the injected alarm. The test inserted
the alarm directly, bypassing the app's access reconciliation. As a control,
three runs explicitly set recovery pending, reconciled it before inserting
the alarm, and passed all enabled, blocked and restored channel checks. The
test now models that setup; these observations do not establish an ordinary
user-visible delivery failure or prove recovery safe under concurrency.

On the disposable Android 16 `pill_reminder_test` emulator, the opt-in
`ANDROID_SERIAL=emulator-5554 ./scripts/test-restart-delivery.sh` check
prepared a Reminder and a Medicine with 150-day gaps and a near-future alarm.
Instrumentation ended the original target process; Android then started a new
process for the alarm broadcast. Before starting instrumentation again, the
script observed both notifications and two future Android alarm clocks. It
then verified the stored occurrences and future alarm records. The script
clears the disposable installation and its alarms. This is an actual process
restart and Android delivery, but it is not the 24-item benchmark dataset, a
process death during recovery, or delivery concurrent with full recovery.

A separate exploratory CPU sample attached Android `simpleperf` to the
debuggable benchmark process immediately after it started, with `-e cpu-clock
-g --duration 8`. It recorded 17,267 samples with none reported lost. Its
largest individual native symbol was `fdatasync` (4.67% of sampled CPU), and
SQLite execution and parsing, Android runtime and garbage-collection symbols
also appeared. The recording includes startup and seeding as well as recovery,
and CPU samples do not measure time blocked on I/O. It therefore does not
attribute recovery wall time to any particular operation. Repeat with phase
boundaries or tracing before choosing an optimization. The profiled benchmark
passed; the disposable installation was cleared afterwards.

## Initial observation

On 24 November 2026, the `pill_reminder_test` API 36 emulator
(`sdk_gphone64_arm64`, Europe/London) on an ARM64 host ran an uncommitted
earlier version of the benchmark on top of commit `02ba046` with the bundled
debug build. That commit alone does not contain the benchmark. One sample produced:

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
not establish variability, a root cause or a product target. That run did not
time actual Android recovery or UI loading.

## Corrected dataset observation

On 24 November 2026 at 16:29 GMT, the same Android 16 (API 36)
`pill_reminder_test` ARM64 emulator in Europe/London ran the corrected
dataset using the bundled debug build. The explicit opt-in guard passed.
One sample produced:

| Measurement | Result |
| --- | ---: |
| Seeded occurrences | 8,760 |
| Occurrences after recovery | 9,852 |
| Direct recovery | 9,371 ms |
| Full occurrence read after recovery | 23 ms |
| Subsequent scheduling of 12 active items | 19 ms |

These are single-sample observations, not proof of the cause of the recovery
time or Android-delivered recovery performance. The synthetic data and alarms
were left temporarily on the confirmed disposable emulator for separate UI
measurement; after measurement, `pm clear com.myreminders` returned Success on
the confirmed disposable emulator. A separate [UI measurement](long-history-ui.md)
recorded the first Reminders row and an out-of-memory crash on History. Repeated
samples, profiling, a History load time and agreed targets remain outstanding.
