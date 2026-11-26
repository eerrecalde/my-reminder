# Long-history UI measurement

This opt-in experiment measures the existing app on the synthetic dataset in
[long-history.md](long-history.md). It uses the same disposable emulator and
leaves its data and alarms in place. Never run it on a phone or an installation
containing data to keep.

After building both APKs and running the seed/recovery benchmark in that
document, **before clearing its dataset**, confirm the AVD name and run:

```sh
adb -s emulator-5554 emu avd name
adb -s emulator-5554 logcat -c
adb -s emulator-5554 shell am instrument -w \
  -e class com.myreminders.LongHistoryUiBenchmark \
  -e longHistoryUiBenchmark true \
  -e confirmDisposableAvd pill_reminder_test \
  com.myreminders.test/androidx.test.runner.AndroidJUnitRunner
adb -s emulator-5554 logcat -d -s LongHistoryUiBenchmark:I '*:S'
```

Replace the example serial with the verified `pill_reminder_test` serial. The
confirmation argument is supplied by the operator; it does not independently
verify the AVD name. The scenario checks for the 24 named benchmark items and
at least 8,760 occurrence rows before starting. That check does not establish
the outcome mix, active states or whether recovery has run; reseed and run the
native benchmark as directed before comparing results. It temporarily selects English
and restores the app language if the process survives. A process crash prevents
that restoration; the required disposable-app data clear also resets the app's
language preference. The dataset is synthetic and must be cleared after
measurement using the cleanup procedure in the baseline document. Clear logcat
before each run as shown, and check the instrumentation result as well as the
logs so an older successful measurement cannot be mistaken for the current run.

The logged values are:

- `reminders_first_row_ms`: Activity launch request, selecting Reminders, and
  waiting for a visible benchmark row. This includes the app state refresh and
  native-to-JavaScript bridge, as well as navigation and layout.
- `history_first_row_ms`: clicking History until a benchmark history row is
  visible after the History tab is selected.
- `history_idle_ms`: clicking History until that row is visible and Android's
  UI automation reports 500 ms of idle, with a 20-second idle timeout.

These are warm-process Activity measurements: instrumentation has already
started the target process and the dataset preflight has opened the database.
They do not measure a cold process start, Android boot recovery, all history
rows being rendered, or actual alarm delivery. Accessibility-tree traversal,
250 ms polling, the idle check, and debug-build overhead affect the numbers;
an idle UI and first visible row do not prove the whole history is rendered.
The app also refreshes periodically, so record run conditions and any timeouts.
Use the same host, emulator, date, timezone, app build and procedure each time,
and reseed the same dataset between samples because recovery mutates it. Do not
infer a bottleneck or acceptance target from a single run.

## Initial observation

On 24 November 2026, the confirmed `pill_reminder_test` API 36
`sdk_gphone64_arm64` emulator (Europe/London, ARM64 host) used the bundled debug
app with the corrected synthetic dataset: 8,760 seeded occurrence records,
9,852 after a direct recovery call, and 12 active items out of 24. The UI
measurement used the warm-process test above, with its test source uncommitted
on top of the then-current branch.

The first Reminders benchmark row became visible **17,243 ms** after the
Activity launch request. After the test clicked History, the app process crashed before
the test could record a History first-row or idle time. Android reported a
`java.lang.OutOfMemoryError` on the main thread in React Native Fabric's
`MountItemDispatcher.drainConcurrentItemQueue` while dispatching mount items.
The reported target footprint and growth limit were 201,326,592 bytes; the
error reported less than one percent of the heap free after GC. Instrumentation
reported `Process crashed`, rather than an `OK` result. The first-row time is a
single observation and includes navigation, preflight-warmed database state and
accessibility polling. This is evidence from one synthetic debug-build emulator
run, not a physical-device result or a full diagnosis of memory use. No History
render-completion time or product target has been established.

Afterward, the AVD name was reconfirmed and `pm clear com.myreminders` returned
`Success` on that disposable installation, removing the synthetic data and
registered alarms.

## Repeated observations, 25 November 2026

The same three fresh datasets and environment described in the
[repeated native baseline](long-history.md#repeated-baseline-25-november-2026)
were measured with the bundled debug build. The first run began with the
emulator locked and was unlocked during the test; its 100,357 ms Reminders
time is invalid for comparison. The next two unlocked runs reported 6,982 ms
and 13,139 ms to the first Reminders row. Neither produced a History timing:
both exhausted the 192 MiB process heap during accessibility-related work after
History was selected. The first run also exhausted the heap during benchmark
accessibility traversal. The instrumentation itself may contribute to memory
pressure, so these failures do not establish the uninstrumented app's memory
limit. The earlier observation also recorded an out-of-memory error during
Fabric mounting. History currently constructs rows within a `ScrollView`, a
code-inspection lead rather than a measured allocation breakdown.

The two valid Reminders timings show substantial variation; they are not a
cold-start measurement. The subsequently agreed targets are in the
[comparison procedure](long-history.md#agreed-targets-and-comparison).

## Check without accessibility polling

On 25 November 2026 the same disposable emulator and dataset were reseeded,
then the app was opened outside the instrumentation test. After a tap on the
History tab during loading, a screenshot still showed Today. The process then
crashed with an out-of-memory error in React Native Fabric view preallocation;
no accessibility-tree polling was used in this check. A later tap landed on
the launcher after the app had died. History selection was not confirmed, so
this is evidence of a memory failure in the loaded app, not a History timing
or proof that the first tap selected History. The installation was cleared
afterwards. A successful History timing remains unavailable until the failure
is addressed; investigate its allocations as part of ticket 06.

## Virtualized History, 26 November 2026

On the `pill_reminder_test` API 36 ARM64 emulator, a bundled debug build with
History rendered as a virtualized list and snoozes read in one batch was measured
three times using the same
benchmark and a freshly seeded dataset each time. The emulator ran headless
with software graphics, in Europe/London. Each sample seeded 8,760 records and
contained 9,852 after direct recovery; 12 of 24 items were active. Times are
milliseconds:

| Run | Direct recovery | Occurrence read | Scheduling | Reminders first row | History first row | History idle |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 3,360 | 24 | 16 | 1,172 | 403 | 980 |
| 2 | 3,707 | 27 | 21 | 1,195 | 373 | 977 |
| 3 | 3,187 | 24 | 20 | 1,099 | 378 | 960 |

All instrumented runs completed without an out-of-memory failure and met the
agreed first-row and direct-recovery limits. Earlier unlocked Reminders samples
were 6,982 and 13,139 ms, and the History measurement crashed before a first
row. Recovery changes from ticket 05 also landed since those baselines, so the
Reminders improvement cannot be attributed to list virtualization alone. The
headless graphics configuration may also differ from the original run. This is
not a cold-start or physical-device measurement, and first-row and idle times
do not prove every history row has been rendered.

This change bounds mounted History rows but still loads and serializes the full
history on each app refresh, although snoozes now use a single read. Larger datasets may require a paginated native query; these measurements do not
establish an upper supported history size. Clearing history continues to mark
stored records as cleared rather than deleting the occurrences.

A separate manual check on the final seeded build scrolled from 25 November
to 23 November and displayed older Reminder and Medicine rows with their
outcomes and instructions. It did not inspect every row or verify the oldest
record. The synthetic data was cleared afterwards.

The existing direct-delivery snooze test failed at the first snooze assertion
when run immediately after clearing the installation; it passed after the app
was opened and stopped to initialize its state. The cause of the first failure
was not established. This is a direct-delivery test, not an Android-delivered
alarm or process-restart check.
