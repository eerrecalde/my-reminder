# 03: Share recurring schedules

**What to build:** A caregiver can share every existing recurring schedule type, and a recipient can review, edit and save it using a setup link.

**Blocked by:** 01 — Open and review a one-time setup link; 02 — Share a prepared setup.

**Status:** ready-for-agent

- [ ] Sharing and receiving cover daily, selected weekdays, intervals and monthly schedules, including all supported times, dates, interval anchors and monthly short-month policies.
- [ ] The documented versioned link format specifies readable, editable values for each supported schedule, and malformed or unsupported values produce a clear error rather than a partial setup.
- [ ] Dates, times and interval anchors are interpreted in the recipient's local time zone.
- [ ] A schedule that started in the past begins at its next future occurrence without catch-up alerts; an already-ended recurring schedule requires a corrected end date before saving. Recheck validity at save time.
- [ ] Review, editing, saving and an optional caregiver copy preserve the intended schedule for Reminders and Medicines; cover representative cases through the app-level flow and relevant schedule tests.
