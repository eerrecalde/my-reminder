# Android reminder MVP

Product behaviour for a fully local reminder app with medicine support. Use React Native, persistent on-device storage, and Kotlin reminder handling. Preserve existing medicines, schedules, identities, and installed-app identity. Choose the app name separately.

## Experience

- People can add a Reminder or Medicine. Both have a name, schedules, notification or alarm, snooze, skip, completion and history. Medicine has optional dosage instructions; the app does not calculate or recommend doses. Type can be changed without losing dosage text.
- Today shows the next reminder prominently, followed by today’s occurrences and their statuses, with type-appropriate wording and actions. Manage reminders individually, including edit, pause, resume and delete. Preserve already-due occurrences and their details and outcomes after changes, pause or deletion.
- Keep completion, skipped and missed history until the user confirms clearing it. Clearing history does not delete active reminders. An unanswered occurrence becomes missed when its next occurrence arrives.
- Use large labelled controls, scalable text, strong contrast and status labels independent of colour. Use Latin American Spanish for Spanish phone settings and British English otherwise, including notifications. Preserve the current look and feel.
- Settings explain reminder access, test reminders, and the limits of on-device storage and recovery. No account, cloud saving, or replacement-phone recovery is included in the MVP.

## Schedules and alerts

Both types support one or more daily times, selected weekdays with one or more times, positive whole-hour intervals from a chosen first date and time, and monthly numbered dates or the last day of the month. For days 29–31, choose the last day or skip when a date is unavailable. Support a start date and optional inclusive end date, next three occurrences, overnight previews and final reminder preview. Adding an item creates only future occurrences. Daily, weekday and monthly schedules follow local time; intervals preserve elapsed hours. A nonexistent local time moves forward by the clock-change gap; a repeated time fires once at its first occurrence.

Notification is the default and sounds and vibrates once, subject to device settings. An alarm sounds until an action stops it or its next occurrence supersedes it. Overlapping alarms share sound while retaining separate actions. Stop sound leaves the occurrence unconfirmed. Respect sound settings and Do Not Disturb; no full-screen takeover.

Snooze applies only to the current occurrence, with 5, 10 or 15 minutes, default 10. Completion and skip cancel remaining alerts for that occurrence, tolerate repeated taps, offer immediate Undo and later correction. Returning an occurrence to unconfirmed does not re-alert it. A previous-day occurrence with an outstanding alert remains accessible on Today until acted on or superseded. Restart and permission recovery resume future reminders without catch-up sound. Pausing or deleting cancels outstanding alerts and future reminders; resuming starts at the next future occurrence.

## Implementation and acceptance

- Android 8+, React Native/TypeScript screens, SQLite storage, and Kotlin scheduling and background handling; no backend. Use stable identities and persist edits immediately.
- Use exact alarms and the alarm-clock mechanism where needed, including notification mode. Rebuild after launch, restart and first unlock, clock changes and permission restoration. Explain that reminders resume only after first unlock. Save when access is unavailable and prominently show Reminders off; never silently substitute approximate reminders.
- Use a foreground service only while alarm audio plays. Preserve existing data and scheduled reminders on upgrade. Keep outcome history until explicitly cleared. Explain that phone loss, uninstalling or clearing app data may lose local data; configure backup deliberately without promising account recovery.
- Verify on real devices with locked screen, app closed, offline, idle, restart and first unlock; test permissions, muted channels, zero volume and force-stop. Verify schedules, DST, dates, snooze, duplicate actions, overlapping alarms, edits and deletion, persistence, accessibility and both languages. Record device models and Android versions.
- Deliver a signed Android build and observe at least three older testers independently adding a reminder or medicine, understanding the preview and recording an outcome. Fix blocking failures before declaring the MVP complete.
- Defer sign-in, cloud saving, replacement-phone recovery, public launch, caregiver access, refill tracking, scanning, and medical recommendations.

## Comments

Earlier account-saving decisions below are historical and now belong to deferred scope. The confirmed local MVP above is the current implementation target.

### 2026-11-06 — Refinement round 1

- Accepted optional Google sign-in: local reminders can be set up first; account saving enables replacement-phone recovery.
- Accepted recovery without catch-up sounds: today's past doses without a recorded outcome remain unconfirmed, and future reminders resume.
- Accepted preserving doses already due when schedules change; revised schedules affect only future doses, with the next reminder explicit in review.
- Refinement remains in progress. Account connection and recovery rules need further decisions following optional sign-in.

### 2026-11-06 — Refinement round 2

- Accepted explicit list selection when both the phone and account contain medicines, with a preview and replacement warning rather than automatic combination.
- Accepted sign-out stopping reminders, clearing local account data, and returning to empty local setup; warn about stopped reminders and any unsaved changes.
- Accepted Android's system upcoming-alarm indicator, including in notification mode, in exchange for stronger reminder timing during idle.
- Accepted reminders resuming only after the first unlock following restart, with the limitation explained during setup.

### 2026-11-06 — Refinement round 3

- Accepted a narrow Today exception for previous-day doses with an outstanding alert or snooze; retain access until taken, skipped, or superseded by the next dose of that medicine.
- Accepted inclusive treatment end dates using the phone's local calendar date, with the final reminder shown in review.
- Accepted a distinct “Saving needs attention” status for online saving failures, rather than describing every failure as a missing connection.
- Accepted immediate Undo and later corrections on Today, without routine per-tap confirmations or automatic re-alerting when returning a dose to unconfirmed.

### 2026-11-06 — Refinement round 4

- Accepted preserving already-due doses and their displayed medicine details after pause or deletion, while cancelling alerts and future reminders. Resume from the next future dose without catch-up alerts.
- Accepted rolling 30-day dose-record retention, with an exception for still-outstanding doses and cleanup during local use and successful syncing; medicine schedules remain until deleted.
- Accepted a shared sound session capped at two minutes from its start, without extension for joining doses; per-dose Taken/Skip and shared Stop sound have distinct effects.

### 2026-11-06 — Refinement round 5

- Accepted no past dose creation for newly added medicines, including interval schedules with a past cadence anchor.
- Accepted a prominent “Reminders off” state when required access is missing, no silent approximate-reminder fallback, and future-only recovery after access is restored.
- Accepted completion requiring recorded real-device checks and independent medicine setup, preview understanding, and dose-outcome recording by at least three older testers, with blocking failures fixed.
- All interview recommendations have been accepted. The user confirmed shared understanding of the product plan, then opened a separate discussion of the technology stack; stack choices remain provisional.

### 2026-11-06 — Stack discussion

- The user confirmed React Native as the desired screen framework.
- The user accepted a fully local, persistently stored MVP (Q20). Defer Google sign-in, cloud saving, and replacement-phone recovery until after the private test.
- Confirmed MVP stack: React Native/TypeScript screens, Room/SQLite persistence, Kotlin scheduling and background actions, and no backend or sign-in. Removed account-update types, cloud status UI, and account-recovery delivery checks from the active MVP scope.
