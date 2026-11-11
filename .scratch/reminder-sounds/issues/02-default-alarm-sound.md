# 02: Choose the default alarm sound

**What to build:** Let people choose a separate app-wide alarm sound using their phone's sound picker, without changing the sound of an active session.

**Blocked by:** 01: Choose the default notification sound.

**Status:** ready-for-agent

**Completion:** complete

- [x] App settings offer a default alarm sound, including Silent; people can preview sounds where the phone supports it.
- [x] Alarm reminders without a custom choice use the current alarm default when an alert starts, including after snooze. A change does not interrupt an active sound session.
- [x] Silent produces no audio while vibration remains subject to existing phone settings. Respect sound and Do Not Disturb settings.
- [x] Existing alarms retain their current sound behaviour on upgrade; reminders, schedules, occurrence identities and outcomes are preserved.
- [x] An unavailable selected sound falls back to the applicable default and is explained in sound settings.
- [x] The setting and explanations work in British English and Latin American Spanish for Reminders and Medicines.
- [x] Verify selection, persistence, delivery, snooze, Silent, vibration, unavailable sounds and upgrade behaviour using appropriate screen and disposable Android tests.

## Comments

2026-11-11: Implemented and verified on the disposable Android 36 emulator. The suite includes actual Android-scheduled notification delivery; snooze redelivery and the added sound-session checks use direct delivery calls. Physical-device listening remains for the existing device checkpoints.
