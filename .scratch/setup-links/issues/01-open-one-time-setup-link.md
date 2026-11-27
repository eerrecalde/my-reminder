# 01: Open and review a one-time setup link

**What to build:** A recipient can open a self-contained setup link for one one-time Reminder or Medicine, review its details, optionally edit them, and explicitly save a new scheduled item. A link alone never creates or changes an item. Document a versioned, human-readable link format for future external producers.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [x] A valid Android HTTPS setup link reaches the review when the app is launched or already running. Define the setup path and a test address aligned with shared link generation and the fallback plan. The proposed production hostname is `ding-reminders.surge.sh`, with availability and domain verification covered by ticket 06.
- [x] The read-only review displays the name, one-time local date and time, effective type, optional Medicine instructions and alert mode, with a prominent save action and a separate edit action. Edits return to review before saving.
- [x] Saving creates a new scheduled item through the existing save flow; opening, cancelling or editing the link does not create or change an item. Test both Reminder and Medicine and both supported app languages.
- [x] Omitted type defaults to Reminder and omitted mode to notification. Medicine instructions require an explicit Medicine type. Optional details can be omitted.
- [x] Malformed, incomplete or unsupported links, including unknown versions and parameters, show a clear error suitable for sharing with the caregiver; no partial setup is opened and sender identity is not claimed to be verified.
- [x] A valid past one-time schedule prompts for a future local date and time; validity is checked again at save time. Links do not expire automatically.
- [x] Document the versioned parameter contract, supported values, URL encoding and examples, including a readable date, without real personal data. Include tests for representative valid and invalid links and existing data preservation.

## Comments

- Implemented and merged in `37a92b0`; the version 1 contract is documented in `docs/setup-links.md`.
- Verification passed: 166 JavaScript tests, type checking, lint, translation checks, Android unit tests and debug build. The focused Android save-flow test passed on the disposable Android 36 emulator with animations disabled after two earlier scroll failures.
- Cold and running app link delivery was checked on the disposable emulator. Android resolved the test hostname after supported links were enabled for the app; the test hostname is not hosted or verified. Production hostname control, verified App Links and the web fallback remain in ticket 06.
