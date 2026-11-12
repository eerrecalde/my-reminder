# 02: Add an in-app language selector

**What to build:** Let a person choose the app language in Options, independently of their phone language, and see that choice reflected throughout the app and in reminder notifications.

**Blocked by:** 01: Centralize existing translations.

**Status:** resolved

- [x] A recognizable language icon and selector appear below Reminder access, offering System default, English and Español; language names appear in their own language and System default has a visual recovery cue.
- [x] System default follows the phone language, with English as fallback for unsupported languages; explicit selections override it.
- [x] A selection applies immediately and persists across reopening the app.
- [x] App-provided text, date and time formatting, and Reminder and Medicine notification text and actions use the effective language.
- [x] A reminder scheduled before a language change uses the current language when delivered.
- [x] User-entered names and instructions, existing records and schedules are preserved.
- [x] Tests cover selection, persistence, fallback, English and Spanish, and native reminder delivery after a language change; device tests use a disposable installation.

See the app language selection spec for the full feature context.

## Comments

Implemented in commits `8da9961` and `4d0d283`, with the dropdown refinement in `a3a616d`. Verified with 114 JavaScript tests, typechecking, translation checks, a release build, and 44 instrumentation tests on the disposable Android 16 emulator. Notification language after a change was tested through direct native delivery; the suite also includes separate real alarm-delivery tests. The date and time pickers were visually checked in Spanish on an English-language emulator. Android per-app settings synchronization remains in ticket 03.
