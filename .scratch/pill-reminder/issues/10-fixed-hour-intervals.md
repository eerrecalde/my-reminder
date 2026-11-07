# 10: Schedule doses every X hours

**What to build:** Add or edit a medicine that repeats after a fixed number of elapsed hours from a chosen first-dose date and time. Preview overnight reminders before saving.

**Blocked by:** 08 — Set treatment dates and preview the final reminder

**Status:** ready-for-agent

- [ ] Accept a positive whole-hour interval and first-dose date and time. A past anchor preserves cadence while only future occurrences become reminders.
- [ ] Show the next three eligible reminders, explicitly identify overnight reminders, and show the final reminder for a treatment with an end date.
- [ ] Verify the elapsed interval stays fixed through daylight-saving and time-zone changes. A late dose outcome leaves the cadence intact.
- [ ] Verify the interval controls and review in both languages with large text and TalkBack.
