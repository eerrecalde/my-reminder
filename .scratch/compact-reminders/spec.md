# Compact reminders and past schedules

Status: ready-for-agent

## Problem Statement

The Reminders screen devotes most of its space to three large buttons per reminder. This makes it hard to scan multiple reminders, especially as ended schedules accumulate. People need a compact overview without sacrificing readable information or easy-to-use actions, including for older people.

## Solution

Use the selected “Soft cards” design: compact cream cards with a subtle border, readable reminder details, and a single horizontal row of large, labeled icon actions. Keep active and paused reminders prominent, show actionable overdue occurrences first, and place ended schedules in a collapsed Past section. Unanswered one-off occurrences remain accessible on Today until resolved, even when their alert is no longer outstanding.

## User Stories

1. As a person managing reminders, I want several reminders visible at once, so that I can scan them without excessive scrolling.
2. As a person managing reminders, I want each reminder's name and schedule visible without expansion, so that I can identify it quickly.
3. As a person managing medicine, I want my instructions visible on the card, so that I can review them without an extra tap.
4. As a person with a complex schedule, I want a readable summary of the schedule and its times, so that I can distinguish it from other reminders.
5. As a person with a long name or instructions, I want the card to grow and text to wrap, so that important information is not cut off.
6. As a person managing a reminder, I want a visible, labeled edit action, so that I can change it easily.
7. As a person managing a reminder, I want a visible, labeled pause or resume action, so that I can suspend or restart it easily.
8. As a person managing a reminder, I want a visible red, labeled delete action, so that I can find it easily.
9. As a person deleting a reminder, I want to confirm deletion, so that accidental taps do not immediately remove it.
10. As a person with limited dexterity, I want large, non-overlapping action targets, so that I can tap them reliably.
11. As a person unfamiliar with icons, I want action labels as well as symbols, so that I understand each action.
12. As a person using assistive technology, I want actions to have clear accessible names, so that I can operate them.
13. As a person with an unanswered one-off occurrence, I want it shown as overdue after its scheduled time, so that I know it still needs attention.
14. As a person with an older unanswered one-off occurrence, I want it to stay on Today until resolved, so that I can still record its outcome.
15. As a person with an overdue reminder, I want it near the top of the list, so that it is easy to find.
16. As a person with an ongoing reminder, I want it in the main list, so that upcoming schedules remain prominent.
17. As a person with a paused reminder, I want it in the main list and marked Paused, so that I can find and resume it.
18. As a person with paused reminders, I want them after active reminders, so that scheduled items are easier to scan.
19. As a person with an ended schedule and an unanswered one-off occurrence, I want it in the main list until resolved, so that it is not hidden prematurely.
20. As a person whose schedule has ended, I want its reminder in a collapsed Past section once no actionable occurrence remains, so that older items do not clutter the main list.
21. As a person looking for an ended reminder, I want to expand Past and see its items, so that I can review them.
22. As a person managing an ended reminder, I want to edit or delete it, so that I can reuse it or remove it.
23. As a person editing an ended reminder into the future, I want it returned to the main list, so that I can manage its upcoming schedule.
24. As a person reviewing an ended schedule, I do not need a pause action, so that its available actions remain meaningful.
25. As a person with an ongoing recurring reminder, I want an overdue indicator while an occurrence remains actionable, so that I notice it needs a response.
26. As a person with a missed recurring occurrence, I want it available in History after the next occurrence arrives, so that I can review or correct it.
27. As a person using the app in English or Spanish, I want consistent localized names and actions, so that the screen remains understandable.
28. As a person editing, pausing or deleting a reminder, I want already-due occurrence details and outcomes preserved, so that my history remains accurate.

## Implementation Decisions

- Retain the app’s cream-and-green visual language and use the chosen Soft cards treatment: subtle borders, compact details, and a divider above horizontally arranged labeled actions. Use red for Delete and a restrained amber indicator labeled Overdue.
- Cards show the reminder name, a readable schedule summary and medicine instructions when present, without per-card expansion. Support all existing one-off, daily, weekday, interval and monthly schedules, multiple times, and relevant date ranges without hiding essential information.
- Use existing icon support for edit, pause/resume and delete. Actions must have at least 48 × 48 dp touch targets, visible labels, clear accessibility names and readable contrast; do not shrink targets or truncate important information to fit the layout.
- Order actionable overdue items first, then other active items, then paused items. Keep paused items visibly labeled and offer Resume. The ordering within each group should be stable.
- Define Past in terms of schedules with no future occurrence and no actionable unanswered occurrence, not completion outcomes. Collapse it initially; show its count. Its items offer Edit and Delete, not Pause. Rescheduling into the future returns an item to the main list.
- Treat a due, unanswered one-off occurrence as actionable until a completion or skip outcome is recorded, including on later days without an outstanding alert. Keep it available on Today and show its reminder as overdue. Do not restart alerts or produce catch-up sound merely because it remains visible. Preserve existing handling for cleared history and retained occurrences; avoid recreating explicitly cleared records.
- For recurring reminders, an unanswered occurrence becomes Missed when the next occurrence arrives and remains correctable in History. An older missed occurrence alone does not make its reminder overdue.
- Preserve due occurrences and their recorded details across editing, pause and deletion; preserve existing confirmation, scheduling, local data and notification behavior except for the explicitly agreed Today visibility change. Support both Reminder and Medicine and both supported languages.
- Classification must use schedule rules and local-time semantics already used by the app, including inclusive end dates, multiple times and daylight-saving transitions. A paused future schedule remains in the main list.

## Testing Decisions

- Test externally observable behaviour rather than layout implementation details. Prefer the existing application-level React Native test seam for screen content, grouping, ordering, action labels, localization and interactions, using the existing reminder repository boundary.
- Exercise the existing native Today policy seam for the changed cross-day visibility rule and its boundaries: unanswered and answered one-offs, an alert no longer outstanding, retained or cleared records, and recurring occurrences superseded by their next occurrence. Follow existing native policy and repository test patterns where persistence or lifecycle state matters.
- Cover one-off and recurring schedules, ended and future schedules, pause/resume, editing a Past reminder into the future, deletion confirmation, and retained due occurrences. Include both Reminder and Medicine, English and Spanish, and representative complex schedules.
- Verify the selected card design on a disposable Android emulator, including long text, larger text settings and 48 dp touch targets; do not use a populated device installation for destructive tests.

## Out of Scope

- Per-card expandable details, an alternative open-list design, or replacing the existing scheduling model.
- New cloud sync, account features, dose recommendations, catch-up alarms, automatic outcomes, or changes to History retention and correction rules.
- A general accessibility redesign beyond the readable labels, touch targets, contrast and names required for this screen.

## Further Notes

The agreed Today visibility change broadens the prior rule that retains previous-day occurrences only under particular alert or retention conditions. It is intentional and should be reconciled with the existing product specification when implemented. “Past” means schedule ended, not that a medicine was taken or an occurrence was completed. The visual is a concept; final layout should be checked on device rather than treating the mockup as a pixel specification.

Visual reference: [Soft cards design](design-reference.html), the first variant in the interactive mockup. It illustrates the agreed visual direction; the spec governs behavior and accessibility. The mockup is a design reference and its sample controls do not operate on real reminders.

Standalone visual reference: [Selected Soft cards design](soft-cards-reference.jpg).
