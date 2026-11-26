# 06: Keep history and app refresh responsive

Status: ready-for-agent
Completion: done

**What to build:** Let people open and review a long reminder history without unnecessary work slowing the app, while retaining the details they expect.

**Blocked by:** 04: Measure long-history recovery and establish targets.

- [x] Address measured state and history loading bottlenecks with appropriate queries, batching and bounded presentation as needed.
- [x] Preserve required history, outcomes and retained details, and ensure cleared history stays cleared.
- [x] Compare timings against the same baseline dataset and agreed targets; verify representative long-history behaviour and document remaining gaps.

## Comments

- 2026-11-26 — Virtualized History rows. Three freshly seeded emulator runs met the agreed first-row and direct-recovery limits without an out-of-memory failure. Existing app tests and 21 repository instrumentation tests passed, including history clearing and retained data. See [measurements and remaining scaling limits](../../../docs/performance/long-history-ui.md#virtualized-history-26-november-2026). These measurements are not physical-device results.
