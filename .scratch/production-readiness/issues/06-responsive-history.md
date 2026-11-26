# 06: Keep history and app refresh responsive

Status: ready-for-agent
Completion: partial

**What to build:** Let people open and review a long reminder history without unnecessary work slowing the app, while retaining the details they expect.

**Blocked by:** 04: Measure long-history recovery and establish targets.

- [ ] Address measured state and history loading bottlenecks with appropriate queries, batching and bounded presentation as needed.
- [x] Preserve required history, outcomes and retained details, and ensure cleared history stays cleared.
- [x] Compare timings against the same baseline dataset and agreed targets; verify representative long-history behaviour and document remaining gaps.

## Comments

- 2026-11-26 — Virtualized History rows. Three freshly seeded emulator runs met the agreed first-row and direct-recovery limits without an out-of-memory failure. Existing app tests and 21 repository instrumentation tests passed, including history clearing and retained data. See [measurements and remaining scaling limits](../../../docs/performance/long-history-ui.md#virtualized-history-26-november-2026). These measurements are not physical-device results.

- 2026-11-26 — Review found that state refresh still reads all occurrences and serializes full history every 30 seconds. The agreed dataset meets its targets, but the spec also calls for avoiding repeated full-history work; native history paging or another correct bounded approach remains to be implemented and verified. The snooze test failed immediately after data clear, then passed after opening the app; the cause remains unconfirmed.
