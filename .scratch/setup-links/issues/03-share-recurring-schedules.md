# 03: Share recurring schedules

**What to build:** A caregiver can share every existing recurring schedule type, and a recipient can review, edit and save it using a setup link.

**Blocked by:** 01 — Open and review a one-time setup link; 02 — Share a prepared setup.

**Status:** ready-for-agent

- [x] Sharing and receiving cover daily, selected weekdays, intervals and monthly schedules, including all supported times, dates, interval anchors and monthly short-month policies.
- [x] The documented versioned link format specifies readable, editable values for each supported schedule, and malformed or unsupported values produce a clear error rather than a partial setup.
- [x] Dates, times and interval anchors are interpreted in the recipient's local time zone.
- [x] A schedule that started in the past begins at its next future occurrence without catch-up alerts; an already-ended recurring schedule requires a corrected end date before saving. Recheck validity at save time.
- [x] Review, editing, saving and an optional caregiver copy preserve the intended schedule for Reminders and Medicines; cover representative cases through the app-level flow and relevant schedule tests.

## Comments

- Implemented recurring version 1 links for daily, weekday, interval and monthly schedules, including local anchors and save-time expiry checks. The contract is in `docs/setup-links.md`.
- Verification: TypeScript, lint, translations, JavaScript suite, Android unit tests and debug build; focused create/edit scheduling instrumentation on the disposable Android 36 emulator. A synthetic weekday link was inspected in the emulator via an explicit app intent. The test host is not verified or hosted; ticket 06 covers production links.
