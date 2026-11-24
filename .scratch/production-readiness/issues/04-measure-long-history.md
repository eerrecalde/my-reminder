# 04: Measure long-history recovery and establish targets

Status: ready-for-agent

**What to build:** Give the team a repeatable, evidence-based understanding of how a long-lived installation performs.

**Blocked by:** None (can start immediately).

- [ ] Create a documented representative disposable-emulator dataset with long history, many active and inactive reminders, paused and deleted items, and a long gap.
- [ ] Record dataset sizes and baseline timings for recovery, scheduling and app state/history loading; identify observed bottlenecks.
- [ ] Establish acceptable targets with Emiliano from the measurements and product needs, and document a reproducible comparison procedure.

## Comments

- 2026-11-24 — A disposable Android 16 emulator run of the corrected synthetic dataset seeded 8,760 occurrences across 24 items, then measured direct recovery at 9,371 ms. Details, setup and cleanup are in [the native benchmark](../../../docs/performance/long-history.md).
- In a separate warm-process UI run on that dataset, the first Reminders row appeared after 17,243 ms; opening History then crashed the app with an out-of-memory error before a History timing could be recorded. See [the UI measurement](../../../docs/performance/long-history-ui.md) for conditions and limits. This is one synthetic debug-build emulator observation, not a physical-device result or a complete diagnosis.
- Repeated baselines, profiling and targets agreed with Emiliano remain outstanding. Tickets 05 and 06 remain blocked on this ticket's measurements and targets.
