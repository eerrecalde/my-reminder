# 12: Run the private Android test

**What to build:** Deliver a signed installable Android build with installation and local-storage recovery limitations. Record phone models and Android versions while testing locked screen, normal app closure, offline, idle, restart and first unlock, permission denial and restoration, muted channels, zero volume and force-stop. Verify schedules, DST, end dates, snooze, repeated actions, overlapping alarms, edits, deletion, history and persistence. Check large text, TalkBack and both languages. Fix and test the interrupted-registration edge deferred from ticket 02 on a real device. Observe at least three older testers independently adding a reminder or medicine, understanding its preview and recording an outcome; fix blocking failures.

**Blocked by:** 09 — Schedule reminders on selected weekdays, 10 — Schedule reminders every X hours, 11 — Schedule monthly reminders

**Status:** ready-for-agent

- [ ] Implement and verify the behaviour above against the [spec](../spec.md).
