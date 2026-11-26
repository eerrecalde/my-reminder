# 01: Sign private releases securely

Status: ready-for-agent
Completion: done

**What to build:** Give Emiliano a repeatable way to distribute an APK signed with a private key he controls and to sign future updates safely.

**Blocked by:** None (can start immediately).

- [x] Release signing uses a protected keystore outside the repository and fails clearly without credentials; debug builds remain usable.
- [x] Document key ownership, encrypted backup, restoration, certificate verification, version increments and distribution without committing secrets.
- [x] Inspect the release APK certificate and verify that a same-key upgrade retains reminders and schedules on a disposable installation.

## Comments

- 2026-11-26 — The signing configuration and documentation were added in `bb1604d`. A release build without credentials failed with the documented signing error; `:app:assembleDebug` succeeded without release credentials.
- A disposable-key release APK verified against its keystore certificate. On the disposable Android 16 emulator, a daily Reminder and its registered Android alarm were present before and after installing a same-key version 2 APK over version 1. This checked registration and retention, not subsequent alarm delivery.
- Emiliano created the permanent key outside the repository and reported that the original and the LastPass-restored backup opened successfully and had matching certificate fingerprints. The permanent-key APK was built and its signature and certificate match verified. The APK has application ID `com.myreminders`, version code 1 and version name 1.0.
- The signed APK installed on Emiliano's Pixel 9a (Android 17) after he authorised removal of old debug-signed copies from its Private Space and work profile. Emiliano reported that his initial phone test worked. This does not complete the separate physical-device checkpoint or security review.
