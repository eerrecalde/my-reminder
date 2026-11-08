# Coding standards

## Scope and product behaviour

- Implement the requested ticket's acceptance criteria; leave work assigned to later tickets for those tickets unless the user changes the scope. The active product requirements are in `.scratch/pill-reminder/spec.md`; its comments record historical decisions.
- Keep the installed app identity and existing local data when changing product wording. Changes to identifiers or app name need an explicit product decision.
- Changes to storage must migrate existing records without changing their identities or schedules. Test upgrades from the previous schema, including retained alarm and occurrence records.
- For shared reminder behaviour, check both Reminder and Medicine, British English and Latin American Spanish. Keep notification text consistent with the selected type. Accessibility work is deferred for the MVP; where labels are changed, keep their wording consistent with the selected type.

## Android verification

- Use automated checks and the disposable emulator for routine Android changes; follow the [emulator test workflow](README.md#routine-android-tests). Physical-device checks are grouped at the checkpoints in tickets 06b and 12; retain any additional device checks explicitly required by a ticket or by the user.

- Use a disposable emulator or a disposable app installation for instrumentation and alarm tests. A `connectedDebugAndroidTest` run has uninstalled the target app on a physical phone; uninstalling can erase its locally stored reminders. Never use it on an installation containing data the user wants to keep.
- Before testing on a physical phone, establish whether the installation is disposable. Preserve existing app data and alarms; use test-owned records and clean up their notifications, alarms and records. Tests that rebuild scheduling must not operate on a populated installation.
- Distinguish a simulated recovery or a direct delivery call from an actual process restart and Android alarm delivery in verification reports. Record the device and Android version for device checks.
- The Android toolchain may be installed outside the usual SDK and JDK paths. Check existing local toolchains and environment settings before concluding that a build or device check is blocked. Setup and build instructions are in [README.md](README.md).
