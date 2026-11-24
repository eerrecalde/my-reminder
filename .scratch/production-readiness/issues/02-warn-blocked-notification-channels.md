# 02: Warn when a reminder's notification channel is blocked

Status: ready-for-agent

**What to build:** Help people identify and resolve blocked notification channels for their reminders without overriding their Android settings.

**Blocked by:** None (can start immediately).

- [ ] Reproduce blocked and restored selected channels, including applicable default, custom and silent sounds, before implementing the warning.
- [ ] Identify affected Reminder and Medicine items, allow saving, offer relevant Android settings, and refresh status on return in English and Spanish.
- [ ] Verify warning and delivery behaviour with meaningful UI and native tests on disposable installations; distinguish direct calls from Android-delivered alarms and respect user-controlled channel settings.
