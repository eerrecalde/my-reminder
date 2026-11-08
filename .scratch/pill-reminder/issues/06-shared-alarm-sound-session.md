# 06: Handle overlapping alarms in one sound session

**What to build:** Overlapping alarms share sound while keeping separate occurrence actions. An occurrence joins the active session; playback continues until stopped, acted on, or superseded by the next occurrence. Completion or skip affects only that occurrence and playback continues for other active alarms. Stop sound silences the session, leaving unresolved occurrences unconfirmed. Verify simultaneous and closely spaced alarms on a disposable emulator. Physical-device verification is collected in [06b](06b-daily-use-device-checkpoint.md).

**Blocked by:** 05 — Snooze an occurrence and find it after midnight

**Status:** ready-for-agent

- [ ] Implement and verify the behaviour above against the [spec](../spec.md).
