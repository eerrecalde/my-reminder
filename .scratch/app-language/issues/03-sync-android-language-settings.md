# 03: Synchronize Android's per-app language setting

**What to build:** Let a person change the app language either in Options or in Android's per-app language settings on supported Android versions, with the app and reminders consistently reflecting the same preference.

**Blocked by:** 02: Add an in-app language selector.

**Status:** resolved

- [x] On supported Android versions, changes in Android's per-app language settings are reflected in the app selector and its effective language.
- [x] Changes in the app selector are reflected in Android's per-app language setting, including returning to System default.
- [x] Screens, date and time formatting, and Reminder and Medicine notifications use the resulting effective language, including for already scheduled reminders.
- [x] Language selection continues to work on supported Android versions without the system per-app language interface.
- [x] Tests verify both directions of synchronization and preservation of existing reminder data and schedules.

See the app language selection spec for the full feature context.

## Comments

Implemented in commit `3db3871` and merged to `main` in `f12b64c`. Verified with 114 JavaScript tests, typechecking, lint, and 45 instrumentation tests on the disposable Android emulator. Notification language after changing the Android setting was also verified through direct native delivery; the suite includes separate real alarm-delivery tests. The pre-Android 13 preference path remains in place but was not separately exercised on an older emulator.
