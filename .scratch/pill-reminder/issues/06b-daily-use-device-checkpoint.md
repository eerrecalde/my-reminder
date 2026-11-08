# 06b: Check daily reminders on a physical Android device

**What to build:** Validate the combined daily reminder experience on a physical phone after the alarm, outcome, snooze and shared-sound work. Routine implementation checks for tickets 02c–06 use automated tests and a disposable emulator; this checkpoint collects the hardware checks once those features work together.

**Blocked by:** 03 — Offer an alarm for a daily reminder, 04 — See today’s reminders and record outcomes, 05 — Snooze an occurrence and find it after midnight, 06 — Handle overlapping alarms in one sound session

**Status:** ready-for-agent

- [ ] Record the phone model, Android version, build and results. Use a disposable app installation; protect any existing local data.
- [ ] Verify both reminder types, notification and alarm delivery with the screen locked, app normally closed and offline; check restart and first unlock, and record device-idle results. Distinguish normal closure from force-stop.
- [ ] Verify audible sound and vibration, muted channels and zero volume; stop sound, snooze, completion, skip, overlapping alarms and closely spaced occurrences.
- [ ] Check notification and exact-alarm permission denial and restoration, both languages. Record failures and create follow-up work before proceeding to ticket 07.

This checkpoint does not replace the broader private-test acceptance in ticket 12.
