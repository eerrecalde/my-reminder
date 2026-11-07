# 06: Handle overlapping alarm doses in one sound session

**What to build:** Play a single sound session for overlapping alarm doses while keeping separate actions for each dose.

**Blocked by:** 05 — Snooze a dose and find it after midnight

**Status:** ready-for-agent

- [ ] An alarm dose arriving during playback joins the active sound session without extending the two-minute limit from its start.
- [ ] Taken or Skip affects only the selected dose. Playback continues for other active alarm doses and ends when none remain.
- [ ] Stop sound silences the whole session and leaves unresolved doses unconfirmed. A later reminder or explicit snooze can start a new session.
- [ ] Verify simultaneous alarm doses, closely spaced doses during device idle, and the session timeout on a real device.
