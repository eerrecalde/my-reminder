# 13: Redesign Today and navigation

**Status:** resolved

**Design:** [Approved UX handoff](../ux-design-review.md)

Implement the approved visual foundation, Today screen, and navigation while preserving existing functionality. Use a replaceable bundled header illustration that can be changed in a future release. Group attention, upcoming, and earlier items as approved; keep completed and skipped outcomes distinct and compact. Ensure existing reminder actions remain accessible and that status is conveyed in words as well as color.

- [x] Apply the approved designs and shared visual components.
- [x] Verify existing actions, accessibility labels, long names, multiple reminders, empty states, and both supported languages within the MVP scope.

## Comments

### Verification — 10 November 2026

- On the disposable `pill_reminder_test` emulator (Android 16), checked a crowded Today list containing six test reminders, including Reminder and Medicine, long names, upcoming items, and completed and skipped occurrences. Names and statuses wrapped and remained available by scrolling in British English and Latin American Spanish. The test records were removed afterward.
- Verified a Reminder completion and immediate Undo in Spanish on the emulator. Existing automated tests cover completion and Undo, snoozing, both reminder types, and both supported languages.
- Inspected Android's accessibility tree for occurrence action names and navigation. Fixed decorative characters leaking into the tab names; automated checks now cover the English and Spanish tab labels.
- This was an accessibility-label and layout check, not a full TalkBack, focus-order, touch-target, or contrast audit. Dedicated accessibility testing has not been completed; keep the acceptance criterion open until its intended scope is confirmed or tested.

### Completion — 10 November 2026

- The user selected collapsed status groups for earlier occurrences. Done, Taken, Skipped and Missed remain distinct; groups expand to show each occurrence and its correction actions.
- Automated checks cover group counts, expansion, mixed reminder types, saved details, corrections, and both languages. Emulator checks cover crowded lists and long names.
- The active MVP specification defers dedicated accessibility requirements and testing. The earlier note calling for a full accessibility audit before completion is superseded by that scope; the app retains written statuses and contextual action labels.
