# 10: Add repeatable quality gates

Status: ready-for-agent

**What to build:** Make meaningful checks run and report failures consistently for changes to the app without exposing release credentials.

**Blocked by:** None (can start immediately).

- [ ] Inspect existing GitHub settings and external checks, then add appropriately scoped checks for TypeScript, lint, JavaScript tests, translations, Android unit tests and a non-secret Android build.
- [ ] Exclude generated Android reports from source lint and keep release secrets out of routine and untrusted CI.
- [ ] Verify the workflow in GitHub, demonstrate that failures surface, and document the toolchain and intentionally deferred checks.
