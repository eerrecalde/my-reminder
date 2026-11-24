# 07: Make reminder create and edit integration testing reliable

Status: ready-for-agent

**What to build:** Reliably verify that someone can create and edit a reminder through the real app and Android boundary.

**Blocked by:** None (can start immediately).

- [ ] Diagnose the previously intermittent UI interaction with reproducible evidence and choose an appropriate test approach.
- [ ] Exercise create and edit through the real UI and native integration, verifying the persisted schedule and registered alarm.
- [ ] Demonstrate repeated reliable runs on a disposable emulator, clean up test-owned data and alarms, and avoid fixed sleeps or retries that conceal failures.
- [ ] Reconcile the existing create/edit integration follow-up when the work is complete, without representing mocked tests as end-to-end coverage.

## Comments

- 2026-11-24 — On the disposable Android 36 `pill_reminder_test` emulator, an accessibility test that clicked Add reminder immediately after navigating to Reminders failed with `ACTION_CLICK` returning false. Both Today and Reminders expose an Add reminder control. A later unsynchronised scroll also targeted the end-date picker instead of the time picker. Waiting for the selected Reminders tab, selected frequency and completed scroll before selecting the current clickable accessibility node allowed the flow to proceed. The earlier draft was discarded, so its exact cause cannot be proven from this reproduction.
- Added `CreateEditIntegrationTest` using the real React Native UI, native time picker and repository. The test creates a daily Reminder with a selected future time and edits it to another time. It checks the exact stored times, retained identity, registered alarm and independently calculated next trigger against Android's next alarm clock. It uses state-based waits and single click actions, rather than retries or fixed sleeps; its `finally` block removes test-owned records, cancels their alarms and restores the device clock format. It requires an empty disposable installation and enabled reminder permissions.
- The strengthened test passed six consecutive runs on `emulator-5554` using the bundled debug app. This is UI-to-native integration coverage, not an actual alarm-delivery or process-restart test. Android instrumentation uses existing device tooling and can inspect the native alarm, but accessibility selectors and Android picker details require maintenance and explicit synchronization. React Native-aware end-to-end tooling could offer better JavaScript and UI synchronization, but adds a framework and device setup and would still need native assertions for the registered alarm. The existing approach was chosen after repeated runs; reassess if it becomes unreliable. Re-run the full suite with this new test before closing the ticket.
