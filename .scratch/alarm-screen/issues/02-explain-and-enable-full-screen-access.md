# 02: Explain and enable full-screen access

**What to build:** People choosing Alarm can learn how the Alarm screen works and enable Android's full-screen access where required. People with existing Alarms get the same guidance after upgrading.

**Blocked by:** 01 (Wake the locked phone for an Alarm).

**Status:** ready-for-agent

## Acceptance criteria

- [ ] Selecting Alarm for a Reminder or Medicine requests the Alarm screen experience. On a phone that requires full-screen access, setup explains what it enables and offers a route to the relevant Android setting.
- [ ] Returning from Android settings reflects the current access state. Declining access still allows the reminder to be saved and its Alarm notification to be delivered. Revoking access uses the same fallback.
- [ ] After upgrading, opening the app with existing Alarms explains the change and offers a way to enable access if needed. Existing records and schedules are preserved. Verify that the next scheduled Alarm can use the screen once access is available.
- [ ] Notification remains the default and does not trigger this guidance. Access guidance and controls use the selected app language in British English and Latin American Spanish.
- [ ] Cover setup, saving without access, and refresh on return with the existing reminder access UI test patterns.
