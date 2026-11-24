# Reliable create and edit integration test

Status: needs-triage
Completion: done

## Problem

The existing JavaScript save test mocks the native repository, leaving the complete create and edit path across the React Native and Android boundary unverified. A draft emulator test using Android accessibility actions passed once but intermittently remained on the Reminders screen after clicking Add reminder. The cause is not confirmed; possible areas to investigate include screen synchronization, accessibility node selection and event delivery.

## Desired outcome

- Diagnose the intermittent interaction with reproducible evidence before choosing a fix.
- Add a reliable disposable-emulator test that creates and edits a reminder through the real UI and native module, and verifies the persisted schedule and registered alarm.
- Evaluate React Native-aware end-to-end tooling against improving the current Android instrumentation approach. Avoid fixed sleeps or automatic click retries that conceal failures.
- Verify repeated runs and clean up test-owned data and alarms.

## Comments

- Deferred at the user's request after the test audit. The draft was not retained because it was unreliable. The existing mocked save tests remain in place.
- 2026-11-24 — Follow-up is tracked in [production readiness ticket 07](../../production-readiness/issues/07-reliable-create-edit-integration.md). A new real UI-to-native instrumentation test creates and edits the daily time, checking the exact chosen times and independently calculated next triggers against Android's next alarm clock. The strengthened test passed six consecutive disposable-emulator runs and the full 58-test Android suite. The original discarded draft's cause cannot be established; ticket 07 records the reproduced synchronization failures. The existing JavaScript save tests still mock the native repository.
