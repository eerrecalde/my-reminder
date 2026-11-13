# 03: Snooze or answer from the Alarm screen

**What to build:** A person can snooze the displayed Alarm while the phone is locked, or unlock to review the reminder and record its outcome.

**Blocked by:** 01 (Wake the locked phone for an Alarm).

**Status:** ready-for-agent

## Acceptance criteria

- [ ] **Snooze 10 minutes** works on the locked Alarm screen and applies to the displayed reminder occurrence. It closes that alert and keeps the next scheduled occurrence on its original schedule.
- [ ] When snooze expires, the same reminder occurrence alerts again and can wake the locked display under the same Android access and interruption rules as a scheduled Alarm.
- [ ] While locked, the Alarm screen keeps its generic message and offers a way to unlock. Dismissing or failing authentication keeps the private details and outcome actions hidden.
- [ ] After unlocking, the screen shows the reminder name and any dosage instructions. It offers **Taken** for a Medicine or **Done** for a Reminder, and **Skip** for either. Each action records the outcome for the displayed occurrence, with the existing repeated-tap and outcome correction behaviour.
- [ ] Verify the flow for both reminder types and supported app languages, using existing Android snooze and outcome tests for the occurrence behaviour and a scheduled Alarm on a locked phone for the screen flow.
