# Reliable create and edit integration test

Status: needs-triage

## Problem

The existing JavaScript save test mocks the native repository, leaving the complete create and edit path across the React Native and Android boundary unverified. A draft emulator test using Android accessibility actions passed once but intermittently remained on the Reminders screen after clicking Add reminder. The cause is not confirmed; possible areas to investigate include screen synchronization, accessibility node selection and event delivery.

## Desired outcome

- Diagnose the intermittent interaction with reproducible evidence before choosing a fix.
- Add a reliable disposable-emulator test that creates and edits a reminder through the real UI and native module, and verifies the persisted schedule and registered alarm.
- Evaluate React Native-aware end-to-end tooling against improving the current Android instrumentation approach. Avoid fixed sleeps or automatic click retries that conceal failures.
- Verify repeated runs and clean up test-owned data and alarms.

## Comments

- Deferred at the user's request after the test audit. The draft was not retained because it was unreliable. The existing mocked save tests remain in place.
