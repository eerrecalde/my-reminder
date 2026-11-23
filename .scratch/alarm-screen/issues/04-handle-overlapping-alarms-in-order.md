# 04: Handle overlapping Alarms in order

**What to build:** People with multiple Alarms due together can handle each occurrence in delivery order and close the shared alert when they want to answer later.

**Blocked by:** 03 (Snooze or answer from the Alarm screen).

**Status:** resolved

## Acceptance criteria

- [x] When a second Alarm comes due while the first is displayed, the first stays in view and the screen indicates that another reminder is due. The locked view keeps both reminders' details private.
- [x] Answering or snoozing the displayed occurrence advances to the next one. The action affects only the occurrence the person saw when they acted.
- [x] **Close** dismisses the Alarm screen and ends the shared sound session. Each unanswered occurrence and its notification remain available for separate responses later.
- [x] Verify with overlapping scheduled Alarms. Reuse the existing Android overlap and shared sound session coverage to check that each outcome, snooze, and notification follows its own occurrence.

## Answer

Implemented in `c06ac28` and merged to `main` in `4aa6d78`. On 23 November 2026, the guarded `pill_reminder_test` emulator workflow passed all 52 Android instrumentation tests, including the English and Spanish privacy-and-snooze checks, answer advancement, close preservation, and simultaneous-delivery cases for overlapping scheduled Alarms. The workflow now installs the bundled release APK so its instrumentation suite runs without Metro.
