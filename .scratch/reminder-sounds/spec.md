# Reminder sounds

Status: ready-for-agent

## Problem Statement

People cannot choose different sounds for notifications and alarms within My Reminders, or recognise a particular reminder by its sound. A mandatory sound choice for every reminder would add friction to setup.

## Solution

Provide separate app-wide default sounds for notifications and alarms, with an optional per-reminder choice for each alert type. Use the phone's available sounds and picker. Existing reminders retain their present sound behaviour on upgrade.

## User Stories

1. As a person using reminders, I want separate default notification and alarm sounds, so that each alert type suits its purpose.
2. As a person setting a default, I want to choose from sounds on my phone, so that I can use a familiar sound.
3. As a person choosing a sound, I want to preview it where the phone supports previewing, so that I know what it sounds like.
4. As a person creating a reminder, I want it to use the default without requiring a sound selection, so that setup remains simple.
5. As a person creating a reminder, I want an optional custom sound, so that I can recognise it.
6. As a person editing a reminder, I want to change or reset its sound, so that I can revise my choice.
7. As a person viewing an inherited choice, I want to see “Default sound”, so that I know it follows the app default.
8. As a person changing an app default, I want reminders using that default to follow the new choice, so that I do not have to edit each one.
9. As a person with a custom sound, I want it to remain selected when the app default changes, so that my preference is preserved.
10. As a person switching a reminder from notification to alarm, I want the alarm default unless I chose a custom alarm sound, so that the sound fits the alert type.
11. As a person switching back, I want my earlier choice for that alert type remembered, so that I need not select it again.
12. As a person selecting an app default or reminder sound, I want an explicit Silent choice, so that I can receive an alert without sound.
13. As a person using a silent alarm, I want vibration to continue subject to phone settings, so that silence does not disable vibration.
14. As a person whose selected sound is unavailable, I want the applicable default used, so that my alert can still be heard.
15. As a person reviewing an unavailable choice, I want an explanation in sound settings, so that I can choose another sound.
16. As a person with overlapping alarms, I want the first alarm's sound to continue for the shared sound session, so that sounds do not compete.
17. As a person changing a sound while an alert is sounding, I want the current sound session to continue uninterrupted, so that it does not change unexpectedly.
18. As a person changing a sound before a snoozed alert repeats, I want the new choice used when it starts again, so that my current preference applies.
19. As an existing user, I want my reminders and their existing sound behaviour preserved after updating, so that I do not lose alerts or need to reconfigure them.
20. As a person using a Medicine, I want the same sound choices as for a Reminder, so that both work consistently.
21. As a Spanish-speaking person, I want sound controls and explanations in Latin American Spanish, so that I can understand them.
22. As a person using British English, I want sound controls in British English, so that wording is consistent with the rest of the app.

## Implementation Decisions

- Support separate app-wide notification and alarm defaults, accessible from the app settings menu. Reminders inherit the applicable current default unless they have an explicit override for that type.
- Store distinct per-reminder choices for notification and alarm modes. Show the active mode's choice in both create and edit, keeping the control optional. Switching modes preserves each choice and uses the new mode's default if no override exists.
- Represent default, explicit silent and selected sound distinctly. Provide a way to reset an override to default. Use the phone's picker and preview where available; bundled sound packs are outside scope.
- Preserve the installed app identity, existing records, schedules, occurrence identities, outcomes, alarms and current sound behaviour through upgrades. Initial defaults must reflect existing behaviour, including existing system settings.
- A selected sound that is no longer available falls back to the applicable default; explain the unavailable selection when settings are next viewed. Respect phone sound, notification-channel and Do Not Disturb settings.
- Silent means no audio; alarm vibration remains subject to existing device settings. Keep shared sound-session and occurrence actions intact. The first alarm determines the sound for the session; later overlapping alarms do not replace it.
- Resolve the current choice when an alert starts, including after snooze; do not change audio during an active sound session. Normal notification and alarm paths need separate handling, including Android's user-controlled notification channels. Avoid promising that the app can override system channel settings.
- Do not alter scheduling, recovery, stop-sound, completion, skip, or outcome semantics beyond applying the selected sound at alert start.

## Testing Decisions

- Verify observable behaviour rather than implementation details, using existing screen tests and disposable Android instrumentation for storage, scheduling, notification and sound-session behaviour.
- Exercise defaults, overrides, resetting, mode switching and restoration, Silent, unavailable sounds, localisation, settings persistence and upgrade from the previous schema with existing reminders and occurrences retained.
- Check delivery and snooze use the current selection, and overlapping alarms preserve the first sound without changing per-occurrence actions. Verify changes do not interrupt an active session.
- Check notification channel settings, muted and unavailable sounds, vibration and Do Not Disturb on a disposable emulator; use appropriate physical-device checks at the existing project checkpoints. Distinguish simulated delivery from actual Android alarm delivery.

## Out of Scope

- Creating or bundling a bespoke sound library.
- Cloud synchronisation or transferring sound selections to another phone.
- Changing reminder schedules, alert timing, or outcome handling.

## Further Notes

Android notification-channel behaviour is controlled by the system and the user; the implementation must reconcile custom choices with those controls. The precise channel lifecycle and handling when both a chosen sound and its fallback are unavailable require implementation design without weakening the stated behaviour. Existing active product requirements continue to apply.
