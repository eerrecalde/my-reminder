# 07: Edit, pause, resume, and delete medicines

**What to build:** Manage medicines individually. Changes to future reminders preserve the doses already due on Today, including their displayed medicine names, instructions, and outcomes.

**Blocked by:** 06 — Handle overlapping alarm doses in one sound session

**Status:** ready-for-agent

- [ ] Edit a medicine and preview the next reminder. Moving a 9 am schedule to 10 am at 9:05 preserves the 9 am occurrence and makes the 10 am dose a separate occurrence.
- [ ] Pause or delete a medicine to remove its future reminders and cancel outstanding alerts and snoozes without interrupting another medicine’s active alarm.
- [ ] Already-due doses retain their displayed details and outcomes after pause or deletion. The user can still record or correct their outcomes on Today.
- [ ] Resume a paused medicine at its next future occurrence without catch-up alerts. Verify edits and pause state persist offline through process termination and restart.
- [ ] Verify the management flows and review in both languages with large text and TalkBack.
