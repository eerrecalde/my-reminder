# 03: Offer a two-minute alarm for a daily dose

**What to build:** Let the user choose Alarm in the daily medicine setup and stop its sound while leaving the dose unconfirmed.

**Blocked by:** 02 — Save one daily medicine and receive a notification

**Status:** ready-for-agent

- [ ] Show the selected mode in Review, persist it, and use it when the next dose is due.
- [ ] Use a short-lived foreground service for alarm sound and vibration. End playback and the service within two minutes and leave the dose unconfirmed after timeout.
- [ ] Stop sound leaves the dose unconfirmed. Respect device sound settings and Do Not Disturb.
- [ ] Verify bounded playback on a real device with the screen locked, app closed, and device idle. Check muted channels and zero volume.
- [ ] Localise the mode and action in both supported languages and verify their accessibility.
