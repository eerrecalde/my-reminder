# 04: Measure long-history recovery and establish targets

Status: ready-for-agent
Completion: done

**What to build:** Give the team a repeatable, evidence-based understanding of how a long-lived installation performs.

**Blocked by:** None (can start immediately).

- [x] Create a documented representative disposable-emulator dataset with long history, many active and inactive reminders, paused and deleted items, and a long gap.
- [x] Record dataset sizes and baseline timings for recovery, scheduling and app state/history loading; identify observed bottlenecks.
- [x] Establish acceptable targets with Emiliano from the measurements and product needs, and document a reproducible comparison procedure.

## Comments

- 2026-11-25 — Emiliano agreed targets of 5 seconds for direct recovery and 3 seconds for each screen's first row, with no out-of-memory failure, evaluated over repeated runs on the documented emulator. The [comparison procedure](../../../docs/performance/long-history.md#agreed-targets-and-comparison) defines the measurement boundaries. A check without accessibility polling also crashed in Fabric view creation; History selection was not confirmed, so no History timing was obtained. Tickets 05 and 06 address the observed failures and further profiling.

- 2026-11-25 — Three freshly seeded runs recorded direct recovery at 8,184, 7,794 and 7,675 ms; subsequent full reads and scheduling were much shorter. Two unlocked UI runs showed Reminders at 6,982 and 13,139 ms and failed with out-of-memory errors while measuring History. The accessibility measurement may contribute to memory pressure. See [baseline](../../../docs/performance/long-history.md#repeated-baseline-25-november-2026) and [UI results](../../../docs/performance/long-history-ui.md#repeated-observations-25-november-2026). Profiling, a less intrusive History measurement and targets agreed with Emiliano remain outstanding.

- 2026-11-24 — A disposable Android 16 emulator run of the corrected synthetic dataset seeded 8,760 occurrences across 24 items, then measured direct recovery at 9,371 ms. Details, setup and cleanup are in [the native benchmark](../../../docs/performance/long-history.md).
- In a separate warm-process UI run on that dataset, the first Reminders row appeared after 17,243 ms; opening History then crashed the app with an out-of-memory error before a History timing could be recorded. See [the UI measurement](../../../docs/performance/long-history-ui.md) for conditions and limits. This is one synthetic debug-build emulator observation, not a physical-device result or a complete diagnosis.
- Repeated baselines, profiling and targets agreed with Emiliano remain outstanding. Tickets 05 and 06 remain blocked on this ticket's measurements and targets.
