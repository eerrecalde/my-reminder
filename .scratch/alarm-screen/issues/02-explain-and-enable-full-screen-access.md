# 02: Explain and enable full-screen access

**What to build:** People choosing Alarm can learn how the Alarm screen works and enable Android's full-screen access where required. People with existing Alarms get the same guidance after upgrading.

**Blocked by:** 01 (Wake the locked phone for an Alarm).

**Status:** resolved

## Acceptance criteria

- [x] Selecting Alarm for a Reminder or Medicine requests the Alarm screen experience. On a phone that requires full-screen access, setup explains what it enables and offers a route to the relevant Android setting.
- [x] Returning from Android settings reflects the current access state. Declining access still allows the reminder to be saved and its Alarm notification to be delivered. Revoking access uses the same fallback.
- [x] After upgrading, opening the app with existing Alarms explains the change and offers a way to enable access if needed. Existing records and schedules are preserved. Verify that the next scheduled Alarm can use the screen once access is available.
- [x] Notification remains the default and does not trigger this guidance. Access guidance and controls use the selected app language in British English and Latin American Spanish.
- [x] Cover setup, saving without access, and refresh on return with the existing reminder access UI test patterns.

## Comments

2026-11-13 — Setup tests verified both reminder types in British English and Latin American Spanish, including the Notification default, the Settings button, access-state changes, and saving an Alarm with access denied. App tests verified guidance on launch with a saved Alarm and refresh after granting and revoking access. Ticket 01 already verified scheduled notification fallback on the Pixel 9a when full-screen access was disabled. Ticket 02 leaves that delivery path in place.

On the disposable Android 16 Google APIs emulator (sdk_gphone64_arm64), a Reminder Alarm saved for 11:22 in the previous release was still scheduled for 11:22 after an in-place upgrade. Today showed the access guidance, its button opened Android's full-screen notification settings, and the app showed access as allowed on return. At 11:22 Android woke the sleeping, locked emulator in Silent mode and displayed the generic Alarm screen. All 120 JavaScript tests, 24 Android unit tests, and 46 Android instrumentation tests passed.
