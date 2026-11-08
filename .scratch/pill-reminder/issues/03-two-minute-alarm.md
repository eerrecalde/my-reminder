# 03: Offer an alarm for a daily reminder

**What to build:** Let the user choose Alarm for either reminder type and stop its sound while leaving the occurrence unconfirmed.

**Blocked by:** 02c — Choose Reminder or Medicine when adding an item

**Status:** ready-for-agent

- [ ] Show the selected mode in Review, persist it, and use it when the next dose is due.
- [ ] Use a short-lived foreground service for alarm sound and vibration. Continue playback until the user stops it, acts on the occurrence, or the next occurrence supersedes it.
- [ ] Stop sound leaves the dose unconfirmed. Respect device sound settings and Do Not Disturb.
- [ ] Verify playback and stopping behaviour on a real device with the screen locked, app closed, and device idle. Check muted channels and zero volume.
- [ ] Localise the mode and action in both supported languages and verify their accessibility.
