# 05: Guide recipients through alert permissions

**What to build:** After reviewing a setup, a recipient can save it even if alert permissions are unavailable, and receives clear guidance about what to enable so the alert can work.

**Blocked by:** 01 — Open and review a one-time setup link.

**Status:** done

- [x] Identify missing permissions relevant to the chosen notification or Alarm mode and provide a way to reach the relevant settings or permission request.
- [x] If a required permission is declined or unavailable, retain the saved item and show a persistent indication that its alerts may not work, including after returning to the app.
- [x] When permissions are granted, the warning reflects the updated state; do not silently claim that alerts are ready while required access is missing.
- [x] Preserve existing Android Alarm screen and notification fallback behaviour, and cover both supported languages and relevant permission states using existing app-level test seams.

## Comments

- Implemented in merge commit `b54781a`. Verification passed locally: type checking, lint, translation checks, 203 JavaScript tests, Android unit tests and debug build, and a focused test on a disposable Android 16 emulator. The review screen was also inspected on the emulator.
- GitHub Actions runs were cancelled after approximately six hours; their outcome is being investigated separately.
