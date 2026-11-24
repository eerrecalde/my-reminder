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
