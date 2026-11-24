# 02: Warn when a reminder's notification channel is blocked

Status: ready-for-agent

**What to build:** Help people identify and resolve blocked notification channels for their reminders without overriding their Android settings.

**Blocked by:** None (can start immediately).

- [ ] Reproduce blocked and restored selected channels, including applicable default, custom and silent sounds, before implementing the warning.
- [ ] Identify affected Reminder and Medicine items, allow saving, offer relevant Android settings, and refresh status on return in English and Spanish.
- [ ] Verify warning and delivery behaviour with meaningful UI and native tests on disposable installations; distinguish direct calls from Android-delivered alarms and respect user-controlled channel settings.

## Comments

- 2026-11-24 — On the disposable Android 16 emulator, the existing scheduled-alarm test for a silent sound passed with its sound channel enabled, failed to find the notification with that channel blocked, and passed again after restoring the channel. The channel was restored afterward.
- For the legacy/default channel, a direct-delivery test passed before blocking and failed while blocked. One immediate run after restoration failed, and a subsequent run passed. A separate scheduled-alarm experiment failed before reaching its notification assertion, so it does not establish notification presentation. Both channels were restored to importance 4.
- Custom-sound reproduction, a conclusive default-channel Android-delivery check, warning implementation and coverage remain outstanding. These experiments do not establish Alarm-mode channel effects; ticket 03 tracks those separately.
- 2026-11-24 follow-up — On the disposable Android 16 emulator, actual `AlarmManager` delivery for a readable custom sound produced a notification and occurrence when enabled, an occurrence without a notification while its channel was blocked, and a notification again after restoring it. For the legacy channel, an actual scheduled occurrence was recorded without a notification while blocked. Immediately after restoration the first injected test alarm was also recorded without a notification; a subsequent one delivered. Source inspection identified stale access-recovery state as the trigger, and a control that directly called rebuild after restoration and before registering the next alarm delivered successfully. That control simulates app-resume reconciliation; it is not an Android process restart. The diagnostic's direct alarm insertion while access state was stale does not by itself establish ordinary user-visible loss. Channels were restored and test-owned data and alarms cleaned up.
- Added per-reminder selected-channel warnings and Android channel settings routes without overriding settings or creating channels solely to inspect them. A focused Android UI/native integration test passed for legacy, silent and custom sound channels on the disposable emulator, with Reminder and Medicine items and English and Spanish; it blocked and restored each channel and verified the displayed names, route and refreshed status. JavaScript UI tests also cover both languages, an affected paused item, and saving both types while a selected channel is blocked; those save tests mock the native boundary. Changes still require review, a current screenshot of the final access layout, and full Android suite verification before closure. Alarm-alert channel behavior remains in ticket 03.
