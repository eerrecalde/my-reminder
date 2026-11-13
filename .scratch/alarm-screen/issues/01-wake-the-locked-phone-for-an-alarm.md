# 01: Wake the locked phone for an Alarm

**What to build:** A scheduled Alarm wakes a dark, locked phone and opens the Alarm screen when Android allows full-screen alerts. A person can close it and answer the reminder later.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Acceptance criteria

- [ ] Schedule an Alarm about a minute ahead on the phone that showed the original behaviour. Set the phone to Silent and lock it with the display off. With full-screen access enabled, the Alarm wakes the display quietly and shows **Reminder due** and **Close** over the lock screen. The phone stays locked and reminder names and dosage instructions stay hidden on the Alarm screen.
- [ ] **Close** dismisses the Alarm screen and ends the sound session. The unanswered reminder occurrence and its notification remain available for a later response.
- [ ] With full-screen access disabled, the scheduled Alarm delivers its notification and follows the usual sound and vibration rules. While the phone is in use, Android presents the notification with actions. Verify both cases on the phone.
- [ ] Verify on the phone that Do Not Disturb can suppress the visual interruption and that regular Notification mode still uses its usual delivery flow.
- [ ] Restart and access recovery resume future Alarms without replaying the Alarm screen for missed deliveries.
- [ ] Use the scheduled delivery path in regression tests and record the phone model, Android version, and results of the physical checks.

## Comments

2026-11-13 — The disposable Android 16 Google APIs emulator (sdk_gphone64_arm64) passed all 46 instrumentation tests. An Android-scheduled Medicine Alarm woke the emulator from a dark display and showed the generic Spanish Alarm screen over the lock screen with an earlier notification still present. Close dismissed the screen, ended the sound session, and preserved the notification and unanswered occurrence. The scheduled Reminder Alarm regression also passed. A simulated recovery rebuild verified that an overdue Alarm did not post an alert.

Physical verification is pending. The original phone was unavailable over USB. Its model and Android version for this check still need to be confirmed, along with Silent mode, notification fallback, unlocked actions, Do Not Disturb, regular Notification mode, and real restart and access recovery.
