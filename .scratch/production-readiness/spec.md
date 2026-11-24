# Private family release readiness

Status: ready-for-agent

## Problem Statement

Emiliano wants to share My Reminders with family and needs confidence that releases can be trusted, reminders remain dependable, and the app can be maintained safely. The current release build uses a public debug signing key. The app may not reveal that a reminder's selected Android notification channel is blocked, and recovery and history work may grow with stored data. Large UI modules make changes harder to maintain. Automated checks and the security review are not yet sufficiently repeatable or complete.

The handoff identifies some risks by inspection rather than measurement or reproduction. The goal is to investigate and resolve them for private distribution, with evidence and explicit decisions about any remaining gaps.

## Solution

Produce securely signed private releases; help people understand and resolve blocked reminder channels; measure and improve recovery and history performance without losing data or changing reminder semantics; simplify UI ownership in small behaviour-preserving changes; and establish repeatable quality checks and a focused security review. Emiliano continues physical-device testing alongside the work.

## User Stories

1. As Emiliano, I want a release signed with a private key I control, so that family members can trust subsequent updates come from me.
2. As Emiliano, I want signing credentials kept outside the repository, so that publishing source code does not expose them.
3. As Emiliano, I want an encrypted backup of the signing key, so that a lost development machine does not prevent future updates.
4. As Emiliano, I want documented key restoration, so that I can recover the ability to sign a release.
5. As Emiliano, I want a clear failure if release credentials are missing, so that I do not distribute an incorrectly signed build.
6. As a developer, I want debug builds to remain straightforward, so that routine development does not need release credentials.
7. As Emiliano, I want to verify an APK's signing certificate, so that I know which key signed it.
8. As Emiliano, I want a repeatable distribution and versioning process, so that family members can receive updates.
9. As a family member, I want a same-key update to retain my reminders and schedules, so that installing an update does not interrupt my routine.
10. As a person using a Reminder, I want to know when its selected notification channel is blocked, so that I understand why its alert may not appear.
11. As a person using a Medicine, I want the same warning for its selected channel, so that I can make an informed decision about my reminders.
12. As a person setting up a reminder, I want to save it even when access is blocked, so that I can adjust Android settings later.
13. As a person with several reminders, I want the warning to identify affected reminders, so that I know which ones need attention.
14. As a person using the app, I want a route to the relevant Android settings, so that I can change the channel if I choose.
15. As a person returning from settings, I want the warning to reflect the current channel state, so that I know whether the change took effect.
16. As a person who muted a channel deliberately, I want the app to respect my choice, so that it does not bypass my device settings.
17. As a person using Alarm mode, I want accurate information about channel restrictions, so that I understand any effect on notification display, the Alarm screen or sound.
18. As a person using a custom, default or silent sound, I want the access status to reflect the selected channel, so that the warning applies to my actual reminder.
19. As an English or Spanish speaker, I want the warning and action in my language, so that I can understand them.
20. As a person using an Alarm on a locked phone, I want its screen to remain generic, so that private reminder details stay hidden.
21. As a person with a long reminder history, I want the app to load and recover reliably, so that earlier use does not make future reminders unreliable.
22. As a person returning after a long gap, I want required occurrences and future schedules recovered correctly, so that my history and next alerts remain meaningful.
23. As a person who edited a schedule, I want already-due occurrences to retain their identity and details, so that my history remains accurate.
24. As a person who paused or deleted a reminder, I want its retained occurrences and outcomes preserved, so that I can still review the past.
25. As a person who recorded an outcome, I want it preserved during recovery and updates, so that the app does not change what I recorded.
26. As a person who cleared history, I want it to stay cleared, so that recovery does not recreate it unexpectedly.
27. As a person with overlapping reminders, I want concurrent delivery and recovery to keep their occurrences distinct, so that one does not overwrite another.
28. As a person whose recovery was interrupted, I want it to resume safely, so that work is neither lost nor incorrectly repeated.
29. As a person using an Alarm, I want alert delivery and future scheduling to remain timely while history is processed, so that the app remains dependable.
30. As Emiliano, I want before-and-after timings on a representative dataset, so that performance improvements and any remaining limits are evidence-based.
31. As a developer, I want cohesive UI components and clear state ownership, so that changes can be made and reviewed safely.
32. As a person using the app, I want UI restructuring to preserve appearance, navigation, wording and permission flows, so that familiar tasks continue to work.
33. As a developer, I want a reliable test of creating and editing through the real app and Android boundary, so that integration failures are caught.
34. As a developer, I want repeatable checks on changes, so that type, lint, translation, test and build failures are visible early.
35. As Emiliano, I want routine CI to build without release secrets, so that untrusted changes do not receive signing credentials.
36. As Emiliano, I want security findings and deliberate deferrals recorded, so that the family release decision is informed by actual review coverage.
37. As Emiliano, I want focused independently reviewable changes, so that I can assess progress and risks throughout the work.

## Implementation Decisions

- Scope is private Android distribution to family. There are no family installations or data to migrate today. Preserve the existing installed-app identity and upgrade behaviour for subsequent releases.
- Use Emiliano's release keystore outside version control; keep its password and an encrypted backup in a password manager or another secure location Emiliano controls. Release builds require valid credentials; debug builds remain usable. Document ownership, restoration, certificate verification, versioning and distribution without recording secrets.
- Reproduce selected-channel suppression before changing the native scheduling and access-status interfaces. Include the separate Alarm channel and determine the actual effects of blocked or reduced importance before specifying warnings. Never bypass user-controlled channel settings.
- Expose affected reminders and an actionable route to relevant Android settings in the existing permission experience. Allow saving while access is blocked and refresh status on returning. Support Reminder and Medicine, both modes, applicable sound choices and both supported languages.
- Preserve the existing Alarm screen decision: Android controls full-screen interruptions; a notification fallback applies when full-screen access is unavailable; locked-screen details remain generic; display wake time is limited to two minutes. Stopping a sound session does not record an outcome.
- Profile a documented realistic long-lived dataset before deciding performance thresholds. Improve data access with appropriate indexing and batching, avoid repeated full-history and per-occurrence work, and bound history presentation where appropriate. Do not discard required occurrences, outcomes, schedules or retained snapshots.
- Move potentially lengthy receiver recovery work off the main thread with an Android-appropriate bounded execution strategy. Preserve prompt delivery, scheduling, locking, concurrency and recovery after interruptions. Choose and verify the strategy based on measured behaviour.
- Decompose large UI responsibilities in small behaviour-preserving slices, clarifying ownership and avoiding pass-through abstractions. Preserve both languages, design, navigation and permission flows.
- Investigate the intermittent create/edit integration interaction before choosing a test approach. Do not mask failures with fixed sleeps or automatic click retries.
- Check existing GitHub settings and external checks, then add a workflow for TypeScript, lint, JavaScript tests, translations, Android unit tests and a non-secret Android build. Exclude generated reports from source lint and keep release secrets out of routine and untrusted CI.
- Review dependencies, vulnerabilities, permissions, exported components, notification privacy, logging and local-data handling. Document findings and deliberate deferrals. Assess Gradle deprecations and dependency upgrades separately where appropriate.
- Start with signing and notification reliability, then measured recovery improvements and UI decomposition. Introduce quality gates and security review in focused slices alongside these priorities. Follow the repository's feature-branch, review, merge and remote-verification workflow for code changes.

## Testing Decisions

- Good tests assert externally observable behaviour and preserved data, not internal implementation details. Prefer existing seams and the highest practical boundary; introduce a new seam only when existing ones cannot reliably exercise the behaviour.
- Exercise real app and Android delivery on a disposable emulator where practical. Use existing UI tests for warning, settings return and language behaviour, and native instrumentation for selected-channel state, delivery, scheduling, recovery and storage. Clearly distinguish direct calls and simulated recovery from actual Android delivery or process restart.
- Use existing UI permission-refresh and setup tests, native sound/channel and alarm-delivery tests, recovery tests, and database upgrade tests as prior art. Cover blocked and restored channels, both reminder types and modes, relevant sound choices, both languages, and user-controlled settings.
- Verify missing release credentials fail, inspect the actual release certificate, and test a same-key upgrade with retained reminders and schedules on disposable installations. Verify CI in GitHub and demonstrate failures are surfaced.
- Measure the same representative dataset before and after recovery changes, recording its size and timings. Test long history, interrupted and concurrent recovery, schedule edits, pause, delete, upgrade, retained outcomes and timely scheduling. Agree targets from observed results and product needs.
- Diagnose and repeatedly verify the real UI-to-native create/edit path, including persisted schedule and registered alarm, with test-owned data and cleanup. Use disposable installations for instrumentation and alarm tests.
- Run type checking, lint and relevant behavioural tests for UI slices and inspect affected screens on a disposable emulator. Follow the visual verification workflow when applicable. Before Android builds or tests, use the documented local JDK and SDK setup.

## Out of Scope

- Public launch, app-store policy assessment and distribution infrastructure beyond the private family release.
- Migration of existing family installations: none exist. This does not remove the requirement to preserve data on future upgrades.
- Replacing Emiliano's ongoing physical-device testing or representing it as complete.
- Cloud accounts, backup or cross-device recovery of reminder data, and medical dose recommendations.
- Bulk dependency or Gradle upgrades without a specific assessed need; claims of exhaustive security or penetration testing.

## Further Notes

Before family distribution, release signing and notification-channel fixes must be complete, relevant automated checks must pass, and remaining audit areas must be addressed or explicitly assessed. Record performance results, security findings and accepted deferrals. Physical-device findings inform the release decision as they emerge.

The agreed plan and audit handoff contain the working sequence and original evidence. Review current code and results before implementation because the original observations may become stale.
