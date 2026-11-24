# 05: Keep recovery and delivery reliable with long history

Status: ready-for-agent

**What to build:** Keep reminder recovery and delivery timely and correct as stored history grows, including after interruptions.

**Blocked by:** 04: Measure long-history recovery and establish targets.

- [ ] Reduce measured recovery and scheduling bottlenecks and move potentially lengthy receiver work off the main thread using an appropriate bounded Android strategy.
- [ ] Preserve required occurrences, outcomes, retained snapshots and future schedules through interruption, concurrency, schedule edits, pause, delete and upgrades; do not discard history.
- [ ] Compare timings against the baseline and agreed targets on the same dataset; verify prompt delivery and future scheduling on a disposable emulator and document remaining gaps.
- [ ] Add meaningful regression coverage and distinguish actual Android delivery and process restart from direct calls or simulated recovery.
