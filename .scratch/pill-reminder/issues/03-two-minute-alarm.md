# 03: Offer an alarm for a daily reminder

**What to build:** Let the user choose Alarm for either reminder type and stop its sound while leaving the occurrence unconfirmed.

**Blocked by:** 02c — Choose Reminder or Medicine when adding an item

**Status:** ready-for-agent

**Implementation:** Complete. Physical-device checks remain in ticket 06b.

- [x] Show the selected mode in Review, persist it, and use it when the next dose is due.
- [x] Use a short-lived foreground service for alarm sound and vibration. Continue playback until the user stops it, acts on the occurrence, or the next occurrence supersedes it.
- [x] Stop sound leaves the dose unconfirmed. Respect device sound settings and Do Not Disturb.
- [x] Verify playback and stopping behaviour with automated checks and a disposable emulator. Physical-device playback, idle and sound-setting checks are collected in [06b](06b-daily-use-device-checkpoint.md).
- [x] Localise the mode and action in both supported languages and verify their accessibility.

## Comments

### 2026-11-08 — Implementation and verification

Alarm and Notification modes are saved for both types; Stop sound ends the shared session without changing occurrences. The Android 36 disposable emulator passed migration, simulated delivery, overlapping playback and Stop sound checks. English and Spanish selection labels and selected accessibility state are covered by UI tests; the English setup screen was inspected on the emulator. Physical-device playback, idle and sound-setting checks remain in ticket 06b.
