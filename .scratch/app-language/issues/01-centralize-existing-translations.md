# 01: Centralize existing translations

**What to build:** Keep the current phone-language-based English and Spanish experience while making one file per language the source for app text and generated Android notification resources. This prepares future translations without changing reminder behavior.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] English and neutral Spanish app-provided text is maintained in one source file per language, including Reminder and Medicine notification text and actions.
- [x] Android notification resources are generated from those sources, and existing screens and notifications continue to follow the phone language.
- [x] Missing text falls back to English, and a translation completeness check identifies missing entries before release.
- [x] Existing Reminder and Medicine data, schedules, and user-entered text are preserved.
- [x] Tests verify observable English and Spanish behavior and generated resources, using existing app and Android test patterns.

See the app language selection spec for the full feature context.

## Comments

Implemented and merged into `main` in merge commit `707aca49f5f4bbcaeea2699c9474f08754e055ba`. Verified with the JavaScript suite, Android unit tests, release build, and 42 instrumentation tests on the disposable Android 36 emulator.
