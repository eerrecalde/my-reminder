# Android pill reminder MVP

Product behaviour and the fully local MVP scope confirmed on 2026-11-06. Use React Native with persistent on-device storage and Kotlin reminder handling. Defer sign-in, cloud saving, and replacement-phone recovery until after the private test.

## Summary

Build a React Native app that older people can set up independently. Medicines, dose outcomes, and reminders work entirely offline without an account or backend. Store data persistently on the phone so it survives app closure, process termination, and phone restarts.

Deliver an installable Android build for a small private test. Build in working stages, with all four schedule types included in the completed MVP.

## User experience

- **Today:** show the next medicine prominently, followed by today’s doses and their due, taken, skipped, or unconfirmed status.
- **Medicines:** add, edit, pause, resume, and delete medicines individually.
- **Settings:** reminder permissions, a test-reminder action, and a plain-language explanation of on-device storage and recovery limitations.
- Use large labelled controls, scalable text, strong contrast, and status labels that do not rely on colour.
- Use Latin American Spanish for any Spanish phone setting; otherwise use British English. Apply this to notifications too.

Adding a medicine follows three steps:

1. **Medicine:** required name and optional dose instructions, such as “1 tablet.”
2. **Schedule:** frequency, relevant dates/times, and notification or alarm.
3. **Review:** a plain-language summary and the next three reminder dates/times.

Start defaults to today. An optional end date supports short treatments; include all scheduled doses on that end date, evaluated using the phone's local calendar date, and show the final reminder in the review. The app records instructions without calculating or recommending doses.

## Scheduling and alert behaviour

| Schedule | Settings and behaviour |
|---|---|
| Every day | One or more clock times. |
| Selected days | Weekday buttons plus one or more times. Selecting one day covers weekly reminders. |
| Every X hours | Positive whole-hour interval and first-dose date/time. Preserve elapsed intervals from that starting point. |
| Monthly | Numbered day or “Last day of month,” plus a time. For days 29–31, ask whether unavailable dates should use the month’s last day or skip that month. |

- Daily, weekday, and monthly reminders follow the phone’s local time zone. Interval reminders preserve elapsed hours.
- Preview overnight reminders explicitly. Recording a late dose never shifts the timetable.
- During daylight saving changes, a nonexistent clock time moves forward by the clock-change gap; a repeated time produces one reminder at its first occurrence.
- Changes to schedules affect only doses scheduled after the edit. Preserve doses already due, including their taken, skipped, or unconfirmed state and the ability to record an outcome. Show the next reminder explicitly in the review: moving an unconfirmed 9 am schedule to 10 am at 9:05 preserves the 9 am dose and creates a separate 10 am dose. Pausing or deleting a medicine cancels its outstanding alerts.
- When reminders resume after the phone was off, show today's past doses without a recorded outcome as unconfirmed. Do not sound catch-up alerts or automatically mark these doses taken or skipped; continue with the next future reminder.
- Newly added medicines create no past dose occurrences. Adding a daily 9 am medicine at noon starts reminders tomorrow at 9 am. An interval schedule may have a past starting point to preserve its cadence, but only future occurrences become reminders.
- Pausing or deleting a medicine preserves doses already due on Today, including their medicine names, instructions, and outcomes, and allows outcome corrections. Cancel their outstanding alerts and remove future reminders. Resuming starts at the next future dose without catch-up alerts.

Each medicine supports:

- **Notification, default:** one notification sound and vibration.
- **Alarm:** sound and vibration for up to two minutes, then leave the dose visibly unconfirmed. No automatic repeat unless snoozed.
- Actions: **Taken**, **Remind me in 10 minutes**, and **Skip this dose**. Alarm mode also offers **Stop sound**, which leaves the dose unconfirmed.
- Taken and Skip do not require confirmation on every tap. Offer an immediate Undo and allow later outcome corrections on Today. Returning a dose to unconfirmed does not automatically sound another alert.
- Snoozing changes only that alert. Taken/skipped actions cancel its remaining alerts and tolerate repeated taps.
- An older outstanding alert stops when the next scheduled dose for that medicine becomes due.
- Overlapping alarm doses share one sound session while retaining separate dose actions. A dose arriving during playback joins the session without extending its two-minute limit. Taken or Skip affects only that dose; playback continues for other active alarm doses. Stop sound silences the whole shared session, leaving unresolved doses unconfirmed. A later reminder or explicit snooze can start a new session.
- Respect device sound settings. Full-screen takeover and overriding Do Not Disturb are outside the MVP.

Show today's status only; defer history and reports. As a narrow exception, a previous-day dose with an outstanding alert or snooze remains accessible on Today, labelled with its date (for example, “Yesterday”), until taken, skipped, or superseded by the medicine's next scheduled dose.

## Implementation and local storage

- Use React Native with TypeScript and a standard Android native project. Target Android 8+ phones with Google Play services.
- Keep scheduling, local persistence, notification actions, and bounded alarm playback in a Kotlin component, exposed through a typed interface to the screens.
- Use Room/SQLite for persistent medicines and dose states. React Native and background handlers use the same repository through a small typed storage interface. Commit edits locally immediately; in-memory state alone is not durable storage. Do not add cloud dependencies or an account-update queue to the MVP.
- Use Android exact alarms, scheduling the next occurrence per medicine and scheduling its successor when it fires. Prefer timely delivery during device idle over hiding the system's upcoming-alarm indicator: use Android's alarm-clock mechanism where needed, including for notification-mode reminders. Rebuild scheduling after app launch, restart and first unlock, clock changes, and permission restoration. Android alarms can operate outside the app's lifetime. [Android alarm documentation](https://developer.android.com/develop/background-work/services/alarms)
- After a restart, reminders resume only after the first device unlock. Explain this during setup; reminders before that unlock are outside the MVP. [Android Direct Boot documentation](https://developer.android.com/privacy-and-security/direct-boot)
- Request notification and exact-alarm access through a guided setup. If required access is missing or revoked, save medicines but show a prominent “Reminders off” message on Today with an action to enable them. Do not silently substitute less precise reminders. When access is restored, resume future reminders without catch-up sounds.
- Use a short-lived foreground service only while persistent alarm audio is playing; stop it within two minutes. Validate this on real devices in the first milestone.
- Core data types: `Medicine`, a four-variant `Schedule`, and `DoseOccurrence`. Give medicines and occurrences stable identities so retries cannot create duplicate reminders or dose records.

- Keep a rolling 30 days of local dose records, plus any older dose with a still-outstanding alert. Clean up older dose records during local use; this does not add a history screen. Keep medicine schedules until the medicine is deleted.
- Explain that the MVP provides no guaranteed recovery after phone loss, uninstalling, or clearing app data. Android system backup must be configured deliberately and must not be presented as tested account recovery. [Android backup documentation](https://developer.android.com/identity/data/autobackup)

## Delivery and acceptance

Build and verify these stages:

1. **Reminder foundation:** one daily medicine, durable storage, permission setup, notification and two-minute alarm.
2. **Daily use:** Today screen, medicine management, dose actions, and both languages.
3. **Scheduling:** selected weekdays, fixed intervals, monthly rules, treatment dates, and previews.
4. **Private test:** signed Android build, installation instructions including local-storage limitations, recorded real-device checks, and observed usability sessions with at least three older testers.

Required checks:

- Real-device reminders with the screen locked, app closed, internet disconnected, device idle, and after restart and unlock.
- Permission denial/revocation, muted channels, zero volume, and Android force-stop. Clearly distinguish force-stop from normal app closure.
- All schedule types, overnight intervals, leap years, short months, clock changes, and treatment end dates.
- Snooze, duplicate actions, simultaneous medicines, closely spaced doses during device idle, edits/deletions, and two-minute alarm timeout.
- Medicines, edits, and dose outcomes surviving app closure, process termination, and phone restarts without a connection. Repeated actions must not create duplicate reminders or dose records.
- Large system text, TalkBack, and Spanish layouts.
- Record tested phone models and Android versions. Complete the real-device reminder checks and observe at least three older testers, each independently adding a medicine, understanding its preview, and recording a dose outcome. Fix failures that prevent these tasks before declaring the MVP complete.

Defer Google sign-in, cloud saving, replacement-phone recovery, public Play Store launch, caregiver access, history/reports, refill tracking, scanning, and medical recommendations.

## Deferred account-saving design

Account saving is outside MVP implementation and acceptance. The earlier proposal used Firebase Authentication with Google and Firestore on Spark without a custom server; revisit the provider and integration after the private test.

Retain the earlier product decisions as input to that later work: optional sign-in, explicit list selection instead of automatically combining existing local and account medicines, acknowledged saving statuses that distinguish offline and account failures, sign-out warnings before stopping reminders and clearing account data, and permission-guided restoration without catch-up sounds. One reminder phone per person remains the proposed boundary for that future feature.

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
