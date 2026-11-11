# 03: Choose a notification sound for a reminder

**What to build:** Allow an optional notification sound for an individual Reminder or Medicine when creating or editing it, while keeping the default choice simple.

**Blocked by:** 01: Choose the default notification sound.

**Status:** ready-for-agent

**Completion:** complete

- [x] Creating and editing a notification reminder offers an optional sound choice labelled “Default sound” when inherited, with preview where the phone supports it.
- [x] A custom sound or explicit Silent applies to that reminder; resetting restores inheritance of the current app default. Changing the default does not change an explicit choice.
- [x] The choice persists across app restarts and applies when an alert starts, including after snooze; ordinary reminder details, schedules and outcomes remain intact.
- [x] An unavailable custom sound falls back to the current notification default and is explained when the setting is viewed.
- [x] Respect system notification-channel settings, sound settings and Do Not Disturb. Both Reminder and Medicine flows work in British English and Latin American Spanish.
- [x] Verify create, edit, reset, persistence, upgrade and delivery using screen and disposable Android tests, including retained existing records and scheduled occurrences.

## Comments

2026-11-11: Implemented and verified on the disposable Android 36 emulator. The suite includes actual Android-scheduled notification delivery; snooze redelivery and the added sound-session checks use direct delivery calls. Physical-device listening remains for the existing device checkpoints.
