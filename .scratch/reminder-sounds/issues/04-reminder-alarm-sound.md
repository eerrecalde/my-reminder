# 04: Choose an alarm sound for a reminder

**What to build:** Allow an optional alarm sound per Reminder or Medicine, preserving separate notification and alarm choices and the shared sound-session behaviour.

**Blocked by:** 02: Choose the default alarm sound; 03: Choose a notification sound for a reminder.

**Status:** ready-for-agent

- [ ] Creating and editing an alarm reminder offers an optional sound choice, including Silent and reset to “Default sound”; preview is available where supported by the phone.
- [ ] Notification and alarm choices are remembered separately when switching modes; a mode without an override follows its current default.
- [ ] A custom choice persists, remains independent of default changes, and falls back to the alarm default with an explanation if unavailable. Silent alarms retain vibration subject to phone settings.
- [ ] When alarms overlap, the first alarm's sound continues for the shared sound session; later alarms do not replace it. Stop sound and per-occurrence actions retain their existing behaviour.
- [ ] A change takes effect when the next alert starts, including after snooze, without interrupting an active session. Respect device sound and Do Not Disturb settings.
- [ ] Both Reminder and Medicine flows work in British English and Latin American Spanish; upgrade preserves existing records, schedules, occurrences and outcomes.
- [ ] Verify mode switching, persistence, fallback, overlapping alarms, snooze, Silent and upgrade using screen and disposable Android tests. Distinguish simulated delivery from actual Android alarm delivery.
