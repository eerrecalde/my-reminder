# 05: Keep recovery and delivery reliable with long history

Status: ready-for-agent
Completion: done (private MVP scope)

**What to build:** Keep reminder recovery and delivery timely and correct as stored history grows, including after interruptions.

**Blocked by:** 04: Measure long-history recovery and establish targets.

- [x] Reduce measured long-history recovery bottlenecks and meet the agreed
  direct-call target on the documented disposable-emulator dataset.
- [x] Preserve required occurrences, outcomes, retained snapshots and future
  schedules in the tested ordinary recovery, edit, pause, delete and upgrade
  paths; do not discard history.
- [x] Verify ordinary Android delivery, process restart and future-alarm
  restoration after emulator reboot and exact-alarm permission restoration;
  distinguish these from direct calls and simulated recovery.
- [x] Document results and remaining gaps, with regression coverage for the
  MVP paths.

## Comments

- 2026-11-26 — Emiliano agreed to focus this ticket on the private MVP:
  ordinary delivery, recovery after restart and permission changes, retained
  history, and reasonable long-history performance. Receiver-thread work,
  delivery concurrent with recovery, rare clock changes and precise
  interruption races are tracked in [ticket 13](13-post-mvp-recovery-hardening.md).
  Current recovery can block the receiver thread for several seconds on the
  measured dataset; the direct-call target does not measure concurrent delivery.

- 2026-11-26 — Three fresh runs met the 5-second direct recovery target. The
  full Android suite reported no failures on retry; opt-in methods were
  exercised separately. Disposable-emulator checks
  observed real Android delivery after process restart and future alarms
  restored after a reboot and after exact-alarm access was re-enabled. See the
  [measurements and test boundaries](../../../docs/performance/long-history.md).
