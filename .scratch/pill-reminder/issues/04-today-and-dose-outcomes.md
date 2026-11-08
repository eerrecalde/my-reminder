# 04: See today’s reminders and record outcomes

**What to build:** Show upcoming and due occurrences for both types with type-appropriate labels. Record completion or skip from Today and notifications; provide immediate Undo and later correction. Persist outcomes offline, tolerate repeated actions, cancel remaining alerts, and never shift the schedule. After restart show past due occurrences without catch-up sound. An unanswered occurrence becomes missed when the next occurrence arrives. Keep history of completed, skipped and missed occurrences until the user confirms clearing it; clearing history must not delete active reminders. Verify both languages.

**Blocked by:** 02c — Choose Reminder or Medicine when adding an item

**Status:** ready-for-agent

**Implementation:** Complete. Physical-device checks remain in [06b](06b-daily-use-device-checkpoint.md).

- [x] Implement and verify the behaviour above against the [spec](../spec.md), with physical-device checks deferred to 06b.

## Comments

Accessibility checks described in older comments are deferred beyond the MVP and do not block this ticket.

### 2026-11-08 — Implementation and emulator verification

Implemented Today and notification outcomes, Undo and correction, missed occurrences, and confirmed history clearing. Android 36 disposable emulator: 14 instrumentation tests passed, including schema upgrades, simulated recovery, notification actions, repeated actions and preserving the next alarm. TypeScript tests and Android unit tests passed. Inspected the English and Spanish screens at 1.5× text size and checked accessible action labels; TalkBack was enabled, but its spoken output was not verified because this emulator was running without audio. Physical-device delivery remains at the later checkpoints. Leave the ticket open until TalkBack speech and navigation are verified.

### 2026-11-08 — TalkBack check deferred

The user agreed to defer the unverified spoken TalkBack and navigation check to the physical-device checkpoint in ticket 06b. The check has not yet passed and must be completed there.
