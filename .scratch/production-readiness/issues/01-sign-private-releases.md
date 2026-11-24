# 01: Sign private releases securely

Status: ready-for-agent

**What to build:** Give Emiliano a repeatable way to distribute an APK signed with a private key he controls and to sign future updates safely.

**Blocked by:** None (can start immediately).

- [ ] Release signing uses a protected keystore outside the repository and fails clearly without credentials; debug builds remain usable.
- [ ] Document key ownership, encrypted backup, restoration, certificate verification, version increments and distribution without committing secrets.
- [ ] Inspect the release APK certificate and verify that a same-key upgrade retains reminders and schedules on a disposable installation.
