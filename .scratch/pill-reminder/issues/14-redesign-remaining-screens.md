# 14: Redesign remaining screens

**Status:** ready-for-agent

**Blocked by:** 13 — Redesign Today and navigation

**Design:** [Approved UX handoff](../ux-design-review.md)

Apply the approved visual system to reminder management, the existing setup flow, History, and reminder access. Preserve existing features and behavior, including alarm and outcome distinctions.

- [x] Implement the approved screens and keep all existing actions discoverable.
- [ ] Verify the full flows, accessibility, empty and crowded states, long names, and both supported languages.

## Comments

### Verification — 10 November 2026

- Android 16 on the disposable `pill_reminder_test` emulator: 26 instrumentation tests passed, including scheduled delivery. All 46 JavaScript tests and the type check passed.
- Checked reminder setup and editing, pause and resume, the disabled-access state, history correction and Undo, and confirmed that clearing synthetic history retained reminders. Inspected empty and populated English and Spanish layouts, including synthetic Reminder and Medicine records and long names.
- Inspected contextual history action labels in the Android accessibility tree. This was not a full TalkBack, focus-order, contrast, or touch-target audit; not every flow was manually exercised in both languages. The verification checkbox remains open until the remaining scope is checked or explicitly deferred. Synthetic test data was removed.
- Merged as `b483536` on `main`; feature branch ends at `5dee712`.
