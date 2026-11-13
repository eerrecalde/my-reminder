# Android reminder MVP

Product behaviour for a fully local reminder app with medicine support. Use React Native, persistent on-device storage, and Kotlin reminder handling. The app display name is My Reminders. The change to the My Reminders Android application ID starts a separate fresh installation; existing data in the previous app is not migrated. Preserve medicines, schedules, identities, and installed-app identity on subsequent upgrades.

## Experience

- People can add a Reminder or Medicine. Both have a name, schedules, notification or alarm, snooze, skip, completion and history. Medicine has optional dosage instructions; the app does not calculate or recommend doses. Type can be changed without losing dosage text.
- Today shows the next reminder prominently, followed by today’s occurrences and their statuses, with type-appropriate wording and actions. Manage reminders individually, including edit, pause, resume and delete. Preserve already-due occurrences and their details and outcomes after changes, pause or deletion.
- Keep completion, skipped and missed history until the user confirms clearing it. Clearing history does not delete active reminders. An unanswered occurrence becomes missed when its next occurrence arrives.
- Use Latin American Spanish for Spanish phone settings and British English otherwise, including notifications. Preserve the current look and feel.
- Settings explain reminder access, test reminders, and the limits of on-device storage and recovery. No account, cloud saving, or replacement-phone recovery is included in the MVP.

## Schedules and alerts

Both types support one or more daily times, selected weekdays with one or more times, positive whole-hour intervals from a chosen first date and time, and monthly numbered dates or the last day of the month. For days 29–31, choose the last day or skip when a date is unavailable. Support a start date and optional inclusive end date, next three occurrences, overnight previews and final reminder preview. Adding an item creates only future occurrences. Daily, weekday and monthly schedules follow local time; intervals preserve elapsed hours. A nonexistent local time moves forward by the clock-change gap; a repeated time fires once at its first occurrence.

Notification is the default and sounds and vibrates once, subject to device settings. An Alarm sounds until an action stops it or its next occurrence supersedes it. Overlapping Alarms share a sound session while retaining separate actions. Stop sound leaves the occurrence unconfirmed. Sound and vibration follow phone settings and Do Not Disturb.

### Alarm screen

- A due Alarm can wake the display and show the Alarm screen while the phone stays locked. Silent mode still allows this visual alert. Respect Android's Do Not Disturb rules for visual interruptions. While the phone is in use, show Android's notification with actions.
- Selecting Alarm is enough to request this experience. When Android requires full-screen access, explain it in Alarm setup and offer a link to enable it. Save the reminder if the person declines. When the app is opened after an upgrade, explain the change to people with existing Alarms and offer the same access control. Existing Alarms can show the screen at their next scheduled alert once access is available.
- When full-screen access is unavailable, deliver the Alarm notification and keep its usual sound and vibration behaviour. Android governs how the notification appears on the lock screen.
- On the locked Alarm screen, show “Reminder due”, **Close**, **Snooze 10 minutes**, and a way to unlock. After unlocking, show the reminder name and any dosage instructions and offer **Taken** for a medicine or **Done** for a general reminder, plus **Skip**. Require unlock before recording those outcomes from the Alarm screen.
- Keep the first Alarm in view when another becomes due. Indicate that another reminder is due and show it after the first is answered or snoozed. **Close** dismisses the Alarm screen and ends the shared sound session. Each unanswered reminder stays available to answer later.
- Keep the display lit for up to two minutes while the Alarm screen is visible. Let the display sleep after that. Manually waking the phone brings back the Alarm screen if the Alarm is still active. Display timeout leaves the occurrence unanswered and any permitted sound or vibration running.
- A snoozed Alarm can wake the screen again when its ten minutes are up. Restart and permission recovery resume future alerts without replaying the Alarm screen for missed deliveries.

Snooze applies only to the current occurrence, for 10 minutes. Completion and skip cancel remaining alerts for that occurrence, tolerate repeated taps, offer immediate Undo and later correction. Returning an occurrence to unconfirmed does not re-alert it. An unanswered due one-off remains accessible on Today until completed or skipped, even without an outstanding alert. A previous-day recurring occurrence with an outstanding alert remains accessible until acted on or superseded. Restart and permission recovery resume future reminders without catch-up sound. Pausing or deleting cancels outstanding alerts and future reminders; resuming starts at the next future occurrence.

## Implementation and acceptance

- Android 8+, React Native/TypeScript screens, SQLite storage, and Kotlin scheduling and background handling; no backend. Use stable identities and persist edits immediately.
- Use exact alarms and the alarm-clock mechanism where needed, including notification mode. Rebuild after launch, restart and first unlock, clock changes and permission restoration. Explain that reminders resume only after first unlock. Save when access is unavailable and prominently show Reminders off; never silently substitute approximate reminders.
- Use a foreground service only while alarm audio plays. Preserve existing data and scheduled reminders on upgrade. Keep outcome history until explicitly cleared. Explain that phone loss, uninstalling or clearing app data may lose local data; configure backup deliberately without promising account recovery.
- Verify on real devices with locked screen, app closed, offline, idle, restart and first unlock; test permissions, muted channels, zero volume and force-stop. Verify schedules, DST, dates, snooze, duplicate actions, overlapping alarms, edits and deletion, persistence and both languages. Record device models and Android versions.
- On the phone that showed the original behaviour, schedule an Alarm about one minute ahead and lock the phone in Silent. Verify that the display wakes quietly with the generic Alarm screen, that details and outcomes require unlock, and that manually waking the phone after the display sleeps brings back the still-active Alarm. Repeat with full-screen access off and verify notification delivery. Also check unlocked delivery, Do Not Disturb, overlapping Alarms, snooze redelivery, and the next Alarm after an upgrade.
- Deliver a signed Android build and observe at least three older testers independently adding a reminder or medicine, understanding the preview and recording an outcome. Fix blocking failures before declaring the MVP complete.
- Defer accessibility requirements and dedicated accessibility testing until after the MVP.
- Defer sign-in, cloud saving, replacement-phone recovery, public launch, caregiver access, refill tracking, scanning, and medical recommendations.

## Comments

Earlier account-saving decisions below are historical and now belong to deferred scope. Accessibility decisions in older task comments are also superseded by the deferral above. The confirmed local MVP above is the current implementation target.

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

### 2026-11-08 — Snooze simplification

- Use one 10-minute snooze action. A configurable duration can be considered later.
