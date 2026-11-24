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
