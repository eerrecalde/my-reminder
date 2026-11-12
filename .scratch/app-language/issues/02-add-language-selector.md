# 02: Add an in-app language selector

**What to build:** Let a person choose the app language in Options, independently of their phone language, and see that choice reflected throughout the app and in reminder notifications.

**Blocked by:** 01: Centralize existing translations.

**Status:** ready-for-agent

- [ ] A recognizable language icon and selector appear below Reminder access, offering System default, English and Español; language names appear in their own language and System default has a visual recovery cue.
- [ ] System default follows the phone language, with English as fallback for unsupported languages; explicit selections override it.
- [ ] A selection applies immediately and persists across reopening the app.
- [ ] App-provided text, date and time formatting, and Reminder and Medicine notification text and actions use the effective language.
- [ ] A reminder scheduled before a language change uses the current language when delivered.
- [ ] User-entered names and instructions, existing records and schedules are preserved.
- [ ] Tests cover selection, persistence, fallback, English and Spanish, and native reminder delivery after a language change; device tests use a disposable installation.

See the app language selection spec for the full feature context.
