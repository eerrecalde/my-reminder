# 07: Make reminder create and edit integration testing reliable

Status: ready-for-agent

**What to build:** Reliably verify that someone can create and edit a reminder through the real app and Android boundary.

**Blocked by:** None (can start immediately).

- [ ] Diagnose the previously intermittent UI interaction with reproducible evidence and choose an appropriate test approach.
- [ ] Exercise create and edit through the real UI and native integration, verifying the persisted schedule and registered alarm.
- [ ] Demonstrate repeated reliable runs on a disposable emulator, clean up test-owned data and alarms, and avoid fixed sleeps or retries that conceal failures.
- [ ] Reconcile the existing create/edit integration follow-up when the work is complete, without representing mocked tests as end-to-end coverage.
