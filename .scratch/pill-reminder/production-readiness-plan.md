# Private family release: production readiness plan

Source: the local production readiness handoff, reviewed at `191646d`. The handoff is intentionally excluded from version control. Agreed with Emiliano on 24 November 2026.

## Goal and boundaries

Prepare a secure, reliable Android app for private distribution to family. No family member has an existing installation, so there is no installed data or signing identity to migrate. Public launch is outside this plan. Emiliano is conducting physical-device testing separately; do not claim it is complete or make it a prerequisite for starting the other work.

The handoff contains inspection findings, not proof that every suspected failure occurs. Recheck current code and reproduce or measure each relevant issue before choosing a fix. Preserve the domain language in `GLOSSARY.md` and the Alarm screen and privacy decisions in `docs/adr/0001-alarm-screen-on-android.md`.

## 1. Secure release signing

**Outcome:** A distributable APK is signed with Emiliano's protected release key, rather than the publicly available debug key.

- Create a release keystore outside the repository. Keep credentials and an encrypted backup in a password manager or another secure location Emiliano controls; document restoration and key ownership without recording secrets in the repo.
- Configure release builds to load credentials from a suitable local secret source and fail clearly when they are missing. Keep debug builds usable.
- Document the release build, certificate verification, version increments, distribution, backup and recovery process.
- Verify the release APK certificate and missing-credential failure. On disposable installations, verify a same-key upgrade retains reminders and schedules.

**Done when:** The release build and documented recovery process are usable, the APK uses the intended key, and the checks above pass. No debug-signed family installation needs migration.

## 2. Detect disabled reminder channels

**Outcome:** A person can see when Android has blocked the selected channel for a reminder and reach the relevant settings without the app overriding their choice.

- Reproduce blocked and restored selected channels on a disposable emulator. Cover Reminder and Medicine, notification and Alarm modes, default/custom/silent sounds, and English and Spanish as applicable.
- Inspect the separate Alarm channel, including how blocked or reduced importance affects notification presentation, full-screen display and sound. Base any warnings on observed behavior.
- Allow the reminder to be saved; show an actionable warning identifying affected reminders and refresh the status after returning from settings. Do not silently treat suppressed delivery as successful or bypass a user's channel settings.
- Add meaningful native and UI coverage, distinguishing direct scheduler calls from Android-delivered alarms. Preserve the existing Alarm screen decision.

**Done when:** Blocked and restored channel scenarios are verified, warnings and settings navigation work in both languages, and Android's settings remain under the person's control.

## 3. Measure and bound recovery and history work

**Outcome:** Recovery and history remain correct and responsive as a database grows, with measured evidence for the changes.

- Establish a baseline on a disposable emulator using a documented realistic dataset with long history, many active and inactive reminders, deleted and paused items, and a long gap. Measure recovery, scheduling and state/history loading. Agree acceptable thresholds from the measurements and product needs rather than inventing them in advance.
- Reduce repeated full-table scans and per-occurrence queries with suitable indexed queries and batching. Bound history presentation where needed, without discarding required history or changing retained snapshots and outcomes.
- Move potentially lengthy receiver work off the main thread using an Android-appropriate bounded strategy; preserve prompt delivery, completion, locking and interrupted recovery.
- Compare the same dataset and measurements after changes. Test long history, interrupted and concurrent recovery/delivery, schedule edits, pause, deletion and upgrades; verify delivery and future scheduling on the emulator.

**Done when:** Baseline and final dataset sizes and timings are recorded, agreed thresholds are met or remaining gaps are explicitly assessed, and the correctness scenarios pass.

## 4. Decompose UI modules

**Outcome:** `App.tsx` and `src/MedicineSetup.tsx` have clearer, reviewable responsibilities without changing the product behavior.

- Identify cohesive screen, component and state boundaries; extract in small slices, clarifying ownership and reducing duplication rather than introducing pass-through wrappers.
- Preserve Reminder and Medicine language, navigation, permissions, English and Spanish, and the existing visual design.
- Run type checking, lint and relevant behavioral tests for each slice. Inspect affected screens on a disposable emulator and follow visual-completion-proof where applicable.
- Investigate the existing [create/edit integration-test gap](issues/16-reliable-create-edit-integration-test.md): diagnose the intermittent interaction, then establish a reliable real UI-to-native path without retries or sleeps that conceal failures. Schedule it with the relevant reliability slice.

**Done when:** The intended UI boundaries are extracted in reviewable changes, relevant checks pass, and the integration gap is resolved or explicitly assessed before family distribution.

## 5. Quality gates and focused security review

**Outcome:** Changes have repeatable checks, and the security review's actual coverage and unresolved findings are visible.

- Inspect existing GitHub settings and external checks, then add appropriately scoped GitHub Actions checks for TypeScript, lint, Jest, translation consistency, Android unit tests and a non-secret Android build. Keep release signing secrets out of routine and untrusted CI.
- Exclude generated Android reports from source lint. Verify the workflow in its real environment and demonstrate that failures surface.
- Review dependencies and vulnerabilities, Android permissions and exported components, notification privacy, logging and local-data handling. Record concrete findings, fixes and deliberate deferrals; do not equate a vulnerability scan with a complete security review.
- Assess Gradle deprecations and plan dependency upgrades separately where appropriate. Document the toolchain and intentionally deferred checks.

**Done when:** The gate runs in GitHub, relevant failures are visible, and security findings and any deferrals are documented and assessed.

## Sequence and release decision

Start with signing and notification reliability. Then measure and improve recovery, followed by UI decomposition. Introduce quality gates and security-review work in focused slices alongside these priorities. Investigations and independent preparation may proceed in parallel where useful; avoid combining unrelated changes into one large delivery.

For every code change, follow repository guidance: use a feature branch, perform appropriate checks and review, commit and push it, merge to `main` with a merge commit, push `main`, and verify both remote branches contain the intended commits. Before Android builds or tests, follow the README's local toolchain setup and use disposable emulator installations for destructive test scenarios.

Before sharing with family, complete signing and notification-channel fixes, pass relevant automated checks, and address or explicitly assess the remaining audit areas. Record measurement results, security findings and any accepted deferrals. Emiliano's physical-device testing informs the release decision as it progresses.
