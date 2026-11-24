# 10: Add repeatable quality gates

Status: ready-for-agent

**What to build:** Make meaningful checks run and report failures consistently for changes to the app without exposing release credentials.

**Blocked by:** None (can start immediately).

- [x] Inspect existing GitHub settings and external checks, then add appropriately scoped checks for TypeScript, lint, JavaScript tests, translations, Android unit tests and a non-secret Android build.
- [x] Exclude generated Android reports from source lint and keep release secrets out of routine and untrusted CI.
- [x] Verify the workflow in GitHub, demonstrate that failures surface, and document the toolchain and intentionally deferred checks.

## Comments

24 November 2026: GitHub Actions was enabled; no workflows, rulesets, branch protection or existing checks were found on main. The [quality workflow run](https://github.com/eerrecalde/my-reminder/actions/runs/45385220126) passed both jobs. Earlier runs surfaced Android SDK setup failures, which were corrected. Local lint probes confirmed that generated build output is ignored and invalid source causes a failure. README documents the toolchain and deferred emulator, physical-device and release checks.
