# UX design review — general reminders

## Direction

The user liked the [general-reminder-first concept](ux-direction.png) on 9 November 2026. Warm cream and sage, a compact replaceable leaf illustration, generous readable text, and Today / Reminders / History navigation are the starting direction. Medicine is an optional type, not the app's identity. The images are visual concepts, not specifications for schedule choices, icons, or controls. The detailed proposal below was approved on 9 November 2026. Use normal device dimensions and scrolling where content exceeds the viewport; the tall mockup proportions are illustrative.

## Navigation and screens

- **Today:** Compact date and leaf header; prominent Reminders off banner linking to Reminder access when required access is missing. Show outstanding unconfirmed occurrences first, the next upcoming reminder, then today's upcoming and compact completed/skipped items. Each occurrence has its name, scheduled time and written status. Include the previous-day occurrence while its alert remains outstanding. For an empty account show “No reminders added yet” and Add reminder; for a crowded day use a scrolling list, wrapping long names and retaining time, status and actions. Provide access to Reminder access from Today.
- **Reminders:** This tab is the home for Manage. List both types together, with type, schedule and paused status; Add reminder is prominent. Each item exposes Edit, Pause/Resume and Delete, with delete confirmation. On an empty list show an explanation and Add reminder. Due occurrences remain visible on Today after pause or deletion.
- **Setup:** Select Reminder or Medicine, then name and optional medicine instructions, schedule, alert mode and review. Keep the existing daily, selected weekdays, positive whole-hour interval and monthly options, including start/end dates, short-month choice where applicable, next three occurrences and final occurrence preview. Notification is the default; alarm is an alternative. Save even if required access is unavailable and show Reminders off. Preserve type and dosage text on edits and allow back/cancel.
- **History:** Group occurrences by date, newest first, with name, time and written Done/Taken, Skipped or Missed status. Compact rows expand or otherwise expose correction actions and Mark unconfirmed; immediate Undo remains available after changes. Empty state: “No history yet.” Clear history requires confirmation and does not delete active reminders. Long names wrap; the list scrolls.
- **Reminder access:** Show notification and exact alarm permission status and actions to open the relevant system controls, plus Send a test reminder. Explain first-unlock recovery after restart and local-only storage, including possible loss on uninstall, app-data clearing or phone loss. Offer a clear route back. A disabled state must be apparent in words, not just colour.

## Status and actions

| Meaning | British English | Latin American Spanish |
| --- | --- | --- |
| General occurrence awaiting outcome | Unconfirmed reminder | Recordatorio sin confirmar |
| Medicine occurrence awaiting outcome | Unconfirmed dose | Dosis sin confirmar |
| General completion | Done | Hecho |
| Medicine completion | Taken | Tomado |
| Skipped | Skipped | Omitido |
| Next occurrence arrived without an outcome | Missed | No confirmado a tiempo |
| Alert deferred | Snoozed | Pospuesto |
| Access unavailable | Reminders off | Recordatorios desactivados |

Use written labels as well as colour or icon. Each action's accessible name includes the action, reminder name and scheduled time; preserve heading and alert semantics. Long translations and names wrap rather than truncate essential status or controls. This is a design requirement, not a claim that dedicated accessibility testing has been completed.

For an unconfirmed occurrence, make Done (or Taken for medicine) and Skip readily available, with Snooze 10 minutes when an alert is outstanding. Completion and skip offer immediate Undo and later correction. Returning to unconfirmed does not re-alert. A shared Stop sound action ends sound without recording an outcome; do not label it Done or Taken. Overlapping alarms retain separate occurrence actions. Snooze applies to the current occurrence only.

## Behaviour and constraints to preserve

- Edits preserve already-due occurrences and their original details; future scheduling follows the edit. Pausing or deleting cancels outstanding alerts and future reminders while retaining due occurrences and history. Resuming starts with the next future occurrence.
- Unconfirmed means no outcome has been recorded; it does not mean the person failed to take a medicine. Missed begins only when the next occurrence arrives without an outcome.
- Notifications sound and vibrate once subject to device settings. Alarms continue until stopped or superseded and can show the [Alarm screen](spec.md#alarm-screen) over the lock screen. Restore future reminders after restart and first unlock or permission recovery without catch-up sound.
- Support both British English and Latin American Spanish, general reminders and medicines, empty and crowded lists, and long names throughout. Keep the app and stored data local; do not imply account backup or replacement-phone recovery.

## Approved review decisions

The user approved the proposed grouping and management location, setup and access layouts, status/action hierarchy, and supporting edge-state direction. Content can scroll on shorter screens. The concept's “every 3 days” example is not a supported schedule and must not be implemented.

[Edge-state concept](ux-edge-states.png): illustrates an empty state, a crowded Spanish view, a long name, management, setup and missing access. Use **Tomado** for the medicine action and show upcoming entries as upcoming. Follow the written behaviour above.
