# 06b: Check daily reminders on a physical Android device

**What to build:** Validate the combined daily reminder experience on a physical phone after the alarm, outcome, snooze and shared-sound work. Routine implementation checks for tickets 02c–06 use automated tests and a disposable emulator; this checkpoint collects the hardware checks once those features work together.

**Blocked by:** 03 — Offer an alarm for a daily reminder, 04 — See today’s reminders and record outcomes, 05 — Snooze an occurrence and find it after midnight, 06 — Handle overlapping alarms in one sound session

**Status:** ready-for-agent

**Deferred:** The remaining checks are carried forward to ticket 15 at the user's request. This checkpoint is incomplete but no longer blocks ticket 07.

- [ ] Record the phone model, Android version, build and results. Use a disposable app installation; protect any existing local data.
- [ ] Verify both reminder types, notification and alarm delivery with the screen locked, app normally closed and offline; check restart and first unlock, and record device-idle results. Distinguish normal closure from force-stop.
- [ ] Verify audible sound and vibration, muted channels and zero volume; stop sound, snooze, completion, skip, overlapping alarms and closely spaced occurrences.
- [ ] Check notification and exact-alarm permission denial and restoration, both languages. Record failures and create follow-up work before proceeding to ticket 07.

This checkpoint does not replace the broader private-test acceptance in ticket 15.

## Comments

2026-11-09: Checkpoint in progress on Pixel 9a, Android 17. Release 1.0 built from `61e9ef8d2a464d5a0e5bc1627a541ce2070cb60d` (APK SHA-256 `39ed6653073f04d3b2c898426b8ecb0f85ab116ea247c71c67f7f1be5379b187`). On 8 November, Android delivered a Reminder alarm with the lock screen showing; snooze scheduled a second alert, and the user confirmed sound and vibration on that alert after a real phone restart and first unlock. The app had been sent to the home screen, not force-stopped. The user confirmed all existing reminders were disposable; test data was cleared.

On 9 November, debug instrumentation on the physical phone passed Android-delivered snoozes for both types and modes, and outcome action checks for both types. Notification text and outcome tests passed with English and with the app set to `es-MX`; the text/recovery test invokes delivery and recovery directly, so it is not evidence of an actual restart or scheduled delivery. The snooze test also passed with airplane mode on, but forced device idle changed to inactive during the run, so idle delivery remains unverified. With no reminders saved, notification and exact-alarm permission denial and restoration showed the expected off/on status in English and Spanish; recovery of existing scheduled reminders after permission changes remains to be checked.

The initial overlap and supersession instrumentation tests did not find an active sound session while the phone was silent and its active Do Not Disturb policy excluded reminders. After the user disabled the mode, the overlap test passed: Android delivered simultaneous and closely spaced alarms for both types, completion and skip affected separate occurrences, and Stop sound stopped playback without recording outcomes. The supersession test passed on repeat; its first occurrence was delivered directly and its second by Android. An intermediate run was interrupted by a user action and is not a product failure.

The release app's scheduled Reminder notification arrived at 09:30 while airplane mode was on, the lock screen was showing, and the screen was off. Android remained in QUICK_DOZE_DELAY, not deep idle, despite attempts to force idle with simulated unplugging. Deep-idle delivery, zero-volume and muted-channel checks, the remaining real scheduled type/mode combinations, and recovery of saved schedules after permission changes remain outstanding. Test data was cleared, the release app restored, and airplane mode, simulated battery state, forced idle, app locale and silent ringer restored. The user turned Do Not Disturb off for the test and can re-enable their prior mode.

Later on 9 November, the user re-enabled sleep. A scheduled Medicine alarm at 09:45 and a Medicine notification at 09:55 were delivered by Android offline with the lock screen showing. The phone remained in QUICK_DOZE_DELAY for the alarm. Android entered forced deep idle after the next scheduled alarm was moved to the following day, but delivery while deeply idle remains unverified. Denying and restoring exact-alarm access restored the saved Medicine's next-day Android alarm; revoking and granting notification permission left that alarm registered. At 09:55 Android reported notification volume zero in silent ringer mode, and the user confirmed the notification was silent. Android did not accept setting the notification stream to zero independently of silent mode, so this does not establish alarm behaviour at zero volume in normal ringer mode.

With the Reminders channel set to Silent, the physical-device snooze instrumentation test passed for both types and modes, and the user reported no audible ringing during the test. The first occurrence in each case was delivered directly; Android delivered the accelerated snooze. The disposable records were cleared, the release build and its reminder permissions restored, the app language returned to system default, airplane mode disabled and the 15-second screen timeout restored. Do Not Disturb was turned off by the user for testing. Outstanding: delivery in deep idle, real scheduled offline Reminder alarm coverage, and alarm output at zero volume in normal ringer mode. No product failure has been established by these checks.
