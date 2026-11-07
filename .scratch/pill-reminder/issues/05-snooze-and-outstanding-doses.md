# 05: Snooze a dose and find it after midnight

**What to build:** Remind the user again in 10 minutes for the selected dose in either reminder mode. Keep a previous-day dose with an outstanding alert or snooze accessible on Today.

**Blocked by:** 03 — Offer a two-minute alarm for a daily dose, 04 — See today’s doses and record outcomes

**Status:** ready-for-agent

- [ ] Expose Taken, Remind me in 10 minutes, and Skip this dose in both modes. Alarm mode also offers Stop sound. Keep per-dose outcome, Undo, and correction behaviour consistent.
- [ ] Snoozing changes only that dose’s alert. Taken or Skip cancels its remaining alerts. Repeated actions do not create duplicate alerts or dose records.
- [ ] A previous-day outstanding dose appears on Today with its date. Taking or skipping it, or reaching the same medicine’s next scheduled dose, clears the older outstanding alert and removes the previous-day dose from Today.
- [ ] Clean up dose records older than the rolling 30-day window during local use. Retain older doses while their alerts are outstanding and keep medicine schedules until deletion.
- [ ] Verify snoozing across midnight and superseding a snooze with the same medicine’s next dose. Verify both languages and accessible action labels.
