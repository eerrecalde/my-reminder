# 03: Synchronize Android's per-app language setting

**What to build:** Let a person change the app language either in Options or in Android's per-app language settings on supported Android versions, with the app and reminders consistently reflecting the same preference.

**Blocked by:** 02: Add an in-app language selector.

**Status:** ready-for-agent

- [ ] On supported Android versions, changes in Android's per-app language settings are reflected in the app selector and its effective language.
- [ ] Changes in the app selector are reflected in Android's per-app language setting, including returning to System default.
- [ ] Screens, date and time formatting, and Reminder and Medicine notifications use the resulting effective language, including for already scheduled reminders.
- [ ] Language selection continues to work on supported Android versions without the system per-app language interface.
- [ ] Tests verify both directions of synchronization and preservation of existing reminder data and schedules.

See the app language selection spec for the full feature context.
