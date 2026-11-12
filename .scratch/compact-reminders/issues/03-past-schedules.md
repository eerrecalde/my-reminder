# 03: Group ended schedules in Past

**What to build:** Move ended schedules without actionable unanswered occurrences into a collapsed Past section, keeping current reminders prominent and past reminders manageable.

**Blocked by:** 02: Keep unanswered one-off occurrences actionable.

**Status:** ready-for-agent

- [ ] Past starts collapsed, displays its count, and expands to show reminders with no future occurrence and no actionable unanswered occurrence, regardless of completed outcome.
- [ ] An ended one-off with an actionable unanswered occurrence stays in the main list until resolved; paused reminders with future schedules remain visible in the main list.
- [ ] Past reminders offer Edit and Delete, with confirmation for deletion, and no Pause action; editing into a future schedule returns the item to the main list.
- [ ] Classification follows existing schedule rules and local time, including inclusive end dates, multiple times and daylight-saving transitions across one-off, daily, weekday, interval and monthly schedules.
- [ ] Tests exercise grouping, expansion, action behavior, rescheduling and preserved due occurrences for both Reminder and Medicine in English and Spanish.

**Visual reference:** [Selected Soft cards design](../soft-cards-reference.jpg). The feature specification defines the behavior and accessibility requirements.
