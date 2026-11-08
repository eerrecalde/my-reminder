# 02: Save one daily medicine and receive a notification

**What to build:** Add a daily medicine through Medicine, Schedule, and Review. Save it on the phone and receive a notification with sound and vibration, subject to device settings. Guide the user through reminder access and show whether reminders are enabled.

**Blocked by:** 01 — Scaffold and run the Android app

**Status:** ready-for-agent

- [ ] Require a medicine name, accept optional dose instructions, and let the user select one or more daily times. Default to Notification and preview the next three occurrences in plain language.
- [ ] Persist the medicine in Room/SQLite. The TypeScript screens and Kotlin background handlers use the same local repository through a typed interface, with stable medicine and dose occurrence identities.
- [ ] Provide guided notification and exact-alarm access, a test reminder, and an explanation that reminders resume after the first unlock following restart. Saving works when access is denied or revoked, and Today prominently shows “Reminders off” with an enable action.
- [ ] Use exact alarms and schedule the next occurrence per medicine. Use Android’s alarm-clock mechanism where needed for timely delivery during idle, including in Notification mode. When exact-alarm access is unavailable, show “Reminders off”.
- [ ] Rebuild future scheduling on launch, restart and first unlock, clock changes, and access restoration. Verify that recovery produces no catch-up sounds or duplicate reminders. Daily reminders follow the phone’s local time zone and the spec’s daylight-saving rules.
- [ ] Verify on a real device while offline, locked, idle, and with the app closed, and after restart and first unlock. Check that the saved medicine survives process termination and restart.
- [ ] Use British English or Latin American Spanish according to the phone’s language, including notifications. Use large labelled controls, scalable text, strong contrast, and accessible status labels.

## Comments

### 2026-11-08 — Device and implementation checks

- Google Pixel 9a, Android 17: a test medicine saved successfully, produced its scheduled notification with the app closed, the screen off and airplane mode enabled, and scheduled the following day's exact alarm. After a restart and first unlock, the medicine and today's unconfirmed dose were visible and the future alarm was rebuilt. The temporary test data was removed afterwards.
- The user confirmed hearing the test reminder. Vibration was not confirmed and the user elected to check it later. Deep idle could not be forced: Android remained in `QUICK_DOZE_DELAY` even with simulated unplugging, so delivery in deep idle is not yet verified. Phone connectivity, idle and battery-test settings were restored.
- Automated checks cover local-time and daylight-saving calculations, duplicate claims, recovery policy, medicine entry and the Spanish schedule labels. Full TalkBack/large-text and Spanish notification checks, notification permission revocation on device, and a deep-idle test remain outstanding.
- A second Pixel check saved a temporary medicine with access denied, showed “Reminders off” after exact-alarm revocation, and rebuilt one future exact alarm when access was restored. The test entry was removed.
- There is a narrow registration ambiguity if a process stops after Android accepts an alarm but before the app records that acceptance: future-only recovery may leave that due dose unconfirmed without sounding. This trades a possible missed delayed reminder for the specified no-catch-up behaviour; it requires further reliability work before the ticket can be declared complete.
