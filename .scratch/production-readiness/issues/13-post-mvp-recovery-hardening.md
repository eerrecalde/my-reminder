# 13: Harden recovery beyond the private MVP

Status: needs-triage
Type: task

The private MVP prioritizes ordinary reminder delivery, recovery after restart
and permission changes, retained history, and the agreed emulator performance
target. Follow up on the remaining recovery limits before relying on stronger
interruption or concurrency guarantees.

- [ ] Move potentially lengthy recovery off the receiver thread using bounded,
  durable Android work. Ensure delivery and user actions are not held behind
  an unbounded history rebuild.
- [ ] Preserve an alarm that becomes due while recovery is running, without
  replaying missed reminders as catch-up alerts. Exercise actual Android alarm
  delivery while recovery is in progress.
- [ ] Investigate process death after an alarm is claimed and before its
  notification is posted. Design and test a durable, idempotent handoff,
  including outcome, snooze, edit, pause and reboot interactions.
- [ ] Define and test the desired behavior for a forward clock change when
  Android delivery and the time-change broadcast are delayed. Avoid assuming
  that callback handling time identifies when the clock changed.
- [ ] Verify retries after interrupted recovery and permission restoration,
  including device idle and real process interruption; distinguish those checks
  from direct calls and simulated failures.

See [long-history measurements and experiments](../../../docs/performance/long-history.md)
for the current evidence and limitations. Android job deadlines may be deferred
in device idle, so background scheduling alone does not prove timely recovery.

## Comments

- 2026-11-26 — Emiliano agreed to focus ticket 05 on the private MVP and track
  the rarer interruption and clock-change cases separately. Current recovery
  still runs on the receiver thread and holds the scheduler lock during history
  work; the agreed direct-call target does not measure concurrent delivery.
