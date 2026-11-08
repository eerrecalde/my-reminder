# 12: Run the private Android test

**What to build:** Deliver a signed installable Android build and verify that older testers can set up a medicine and record a dose independently.

**Blocked by:** 09 — Schedule doses on selected weekdays, 10 — Schedule doses every X hours, 11 — Schedule monthly doses

**Status:** ready-for-agent

- [ ] Provide installation instructions and a plain-language Settings explanation of on-device storage and recovery limits after phone loss, uninstalling, or clearing app data. Deliberately configure Android system backup and describe the recovery limits accurately.
- [ ] Record real-device results with phone models and Android versions. Cover locked screen, normal app closure, offline use, deep idle, restart and first unlock, notification and exact-alarm permission denial and revocation/restoration, muted channels, zero volume, and force-stop. Verify audible sound and vibration subject to device settings. Distinguish force-stop from normal closure.
- [ ] Verify all four schedule types, overnight intervals, leap years, short months, clock changes, inclusive treatment end dates, and no catch-up alerts.
- [ ] Verify snooze, repeated actions, simultaneous medicines, closely spaced doses while idle, edits and deletions, and the two-minute alarm timeout. Check offline durability through app closure, process termination, and restart, including duplicate prevention.
- [ ] Check large system text, TalkBack, and British English and Latin American Spanish layouts, including Spanish notifications.
- [ ] Fix and test the interrupted-registration edge deferred from ticket 02: if the process stops after Android accepts an alarm but before the app records acceptance, a valid delayed reminder can be left unconfirmed without sounding. Preserve future-only recovery without catch-up sounds or duplicate reminders. Verify the fix on a real device before the private test is complete.
- [ ] Observe at least three older testers independently adding a medicine, understanding its preview, and recording an outcome. Fix any failures that prevent those tasks before marking the MVP complete.
