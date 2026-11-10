# 01: Choose the default notification sound

**What to build:** Let people choose the app-wide sound for notification reminders using their phone's sound picker, while preserving existing reminder behaviour on upgrade.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] App settings offer a default notification sound, including Silent; people can preview sounds where the phone supports it.
- [ ] Notification reminders without a custom choice use the current default, including when an alert restarts after snooze.
- [ ] Existing installations retain their current notification sound behaviour, system settings, reminders, schedules, occurrence identities and outcomes after upgrade.
- [ ] An unavailable selected sound falls back to the applicable default and is explained in sound settings. Respect Android notification-channel controls, sound settings and Do Not Disturb.
- [ ] The setting and explanations work in British English and Latin American Spanish for Reminders and Medicines.
- [ ] Verify settings and delivery behaviour, persistence, Silent, unavailable sounds and upgrade from the previous schema; use a disposable emulator for Android checks.
