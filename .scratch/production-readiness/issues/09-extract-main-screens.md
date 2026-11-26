# 09: Extract main app screen responsibilities

Status: ready-for-agent
Completion: done

**What to build:** Clarify ownership of main app screens and state while keeping familiar reminder workflows unchanged.

**Blocked by:** None (can start immediately).

- [x] Extract cohesive screen, component and state boundaries in reviewable, behaviour-preserving slices without simply moving complexity into wrappers.
- [x] Preserve Today, history, reminder actions, navigation, permission flows, wording and appearance in both languages.
- [x] Run type checking, lint and relevant behavioural tests; inspect affected screens on a disposable emulator and follow the visual verification workflow as applicable.

## Comments

- 2026-11-26 — Extracted the History screen and its pagination and revision state in separate commits, retaining shared outcome and undo coordination with Today. Standards and specification reviews found no material issues after the history boundary was tightened.
- Type checking, lint, translation checks, all 141 JavaScript tests and the debug build passed. The create/edit integration test passed on the disposable Android 16 (API 36) emulator. Inspected the English History empty state there; existing behavioural tests cover populated history and both languages. These are emulator results, not physical-device checks. The changes were merged to main in commit `e483809`.
