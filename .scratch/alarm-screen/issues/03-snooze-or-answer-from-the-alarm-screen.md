# 03: Snooze or answer from the Alarm screen

**What to build:** A person can snooze the displayed Alarm while the phone is locked, or unlock to review the reminder and record its outcome.

**Blocked by:** 01 (Wake the locked phone for an Alarm).

**Status:** ready-for-agent

## Acceptance criteria

- [x] **Snooze 10 minutes** works on the locked Alarm screen and applies to the displayed reminder occurrence. It closes that alert and keeps the next scheduled occurrence on its original schedule.
- [x] When snooze expires, the same reminder occurrence alerts again and can wake the locked display under the same Android access and interruption rules as a scheduled Alarm.
- [x] While locked, the Alarm screen keeps its generic message and offers a way to unlock. Dismissing or failing authentication keeps the private details and outcome actions hidden.
- [x] After unlocking, the screen shows the reminder name and any dosage instructions. It offers **Taken** for a Medicine or **Done** for a Reminder, and **Skip** for either. Each action records the outcome for the displayed occurrence, with the existing repeated-tap and outcome correction behaviour.
- [ ] Verify the flow for both reminder types and supported app languages, using existing Android snooze and outcome tests for the occurrence behaviour and a scheduled Alarm on a locked phone for the screen flow.

## Comments

2026-11-16 — The disposable Android 16 emulator (sdk_gphone64_arm64) passed all 47 instrumentation tests. Scheduled Alarms for Medicine and Reminder woke the locked display in English and Spanish. The test checked the ten-minute snooze timestamp and unchanged next occurrence, then advanced the snooze timestamp so Android could redeliver during the test. Cancelling the PIN prompt kept the screen generic. Unlocking showed the details and allowed the outcome to be recorded and undone without another alert. The Pixel 9a (Android 17) was updated in place. The physical locked-screen check and full ten-minute redelivery remain pending.
