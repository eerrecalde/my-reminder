# 12: Make the test workflow faster

Status: ready-for-agent
Completion: done

**What to build:** Give developers fast feedback on everyday changes while retaining meaningful Android delivery and release confidence.

**Blocked by:** None (can start immediately).

- [x] Measure and document the current duration of fast checks, Android unit tests and the full disposable-emulator instrumentation suite; identify the slowest tests and why they take time.
- [x] Define and document which checks run for every change, how to select relevant emulator tests for Android changes, and when the full emulator suite is required, including release checkpoints and significant cross-cutting changes.
- [x] Provide a reliable, documented way to run focused emulator tests that preserves the existing disposable-device safeguards and reports failures or incomplete runs. Keep the full suite available.
- [x] Improve avoidable delays where evidence supports it, without replacing real Alarm delivery, display-sleep or other device-level coverage with simulated checks, hiding failures, or weakening the required release checks.
- [x] Verify the documented fast and focused commands, a failing-test result, and the full emulator workflow; record timings and any remaining limitations. Keep unit tests, instrumentation tests and physical-device checks clearly distinguished.

## Comments

- 2026-11-25 — The current CI workflow already runs fast checks, Android unit tests and a debug build on pushes and pull requests; emulator instrumentation is separate. During ticket 03, Android unit tests took about 14 seconds including Gradle startup, while the full 65-test emulator run took 507.836 seconds and included real timed Alarm and display-sleep checks. Selective routine runs and deliberate full-suite checkpoints should shorten feedback without implying that simulated delivery proves Android delivery.
- 2026-11-26 — Completed in merge 4279e98. The [routine Android test guidance](../../../README.md#routine-android-tests) records timings, focused and full runs, the failing-test check, and the intermittent language-test failure observed before the passing full run. Physical-device checks remain separate.
