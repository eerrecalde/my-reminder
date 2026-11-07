# 04: See today’s doses and record outcomes

**What to build:** Show the next medicine prominently and list today’s doses with their status. Let the user record a dose outcome from Today or the notification, undo it immediately, and correct it later on Today.

**Blocked by:** 02 — Save one daily medicine and receive a notification

**Status:** ready-for-agent

- [ ] Today distinguishes due, taken, skipped, and unconfirmed doses using readable labels. After restart and unlock, past doses from today with no recorded outcome appear as unconfirmed, with no catch-up sound.
- [ ] Taken and Skip work from Today and the notification without routine confirmation. Each offers immediate Undo, and Today supports later corrections, including returning a dose to unconfirmed.
- [ ] Taken and Skip cancel the dose’s remaining alerts. Repeated taps do not create duplicates, and returning a dose to unconfirmed does not sound another alert.
- [ ] Recorded outcomes survive app closure, process termination, and restart offline. Recording an outcome late leaves the schedule intact.
- [ ] Verify Today, reminder actions, and status labels in both languages with large text and TalkBack.
