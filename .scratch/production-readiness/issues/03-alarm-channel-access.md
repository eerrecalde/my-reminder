# 03: Show accurate access status for Alarm alerts

Status: ready-for-agent

**What to build:** Give people accurate, actionable information when Android channel settings affect an Alarm.

**Blocked by:** None (can start immediately).

- [ ] Reproduce and document the effects of blocked and reduced-importance Alarm channels on notification presentation, full-screen display and sound before deciding warning wording.
- [ ] Show an appropriate warning and settings route when needed, allow saving and refresh status after return in both languages for Reminder and Medicine.
- [ ] Verify blocked and restored behaviour with native and UI coverage, respecting Android settings and the existing Alarm screen, fallback and locked-screen privacy decisions.

## Investigation

- 2026-11-24 — On the disposable Android 16 emulator, direct delivery with the Alarm alerts channel at importance 4 showed the notification and Alarm screen and played the separate sound session. With the channel blocked (importance 0), the occurrence notification and Alarm screen were absent while the sound session continued playing. Restoring importance 4 restored both visual surfaces. With the channel set to Silent (importance 2), the notification remained, the Alarm screen did not appear, and the sound session continued playing. These observations are direct-delivery experiments, not proof of actual Android alarm delivery or behaviour on other devices. The empty disposable installation was reset after the experiment to restore its original channel defaults.
