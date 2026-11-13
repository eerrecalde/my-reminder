# Wake the locked phone for Alarm reminders

Status: ready-for-agent

## Problem Statement

An Alarm reminder came due while the phone was in Silent mode and the display was off. The phone stayed dark. After pressing the power button, the person saw a regular reminder notification on the lock screen. Someone who chooses Alarm needs an immediate visual alert when sound and vibration are unavailable.

## Solution

When an Alarm comes due and Android allows full-screen alerts, wake the display and show a dedicated Alarm screen over the lock screen. While locked, show a generic message with controls to close, snooze, or unlock. Unlocking reveals the reminder details and actions for recording an outcome. The display can stay awake for up to two minutes, and an active Alarm is visible again when the person wakes the phone manually. While the phone is in use or full-screen access is unavailable, use Android's notification. Sound and vibration follow the existing rules, and Android's Do Not Disturb settings govern visual interruptions.

## User Stories

1. As a person using My Reminders, I want to select Alarm during reminder setup, so that I can request a more prominent alert for a time-sensitive reminder.
2. As a person creating a routine reminder, I want Notification to remain the default, so that routine reminders fit into the usual notification flow.
3. As a person with a locked phone and a dark display, I want an Alarm to wake the display, so that I can notice it without picking up the phone.
4. As a person who has put my phone in Silent mode, I want the Alarm screen to appear quietly, so that I can see the alert while keeping the phone quiet.
5. As a person using Do Not Disturb, I want the visual alert to follow Android's rules, so that I can control interruptions.
6. As a person already using my phone, I want the Alarm to appear as an Android notification with actions, so that I can respond from what I'm doing.
7. As a person choosing Alarm on a phone that requires full-screen access, I want an explanation and a route to enable it, so that I know how to get the Alarm screen.
8. As a person who declines or later turns off full-screen access, I want my Alarm reminder to be saved and delivered by notification with its usual sound and vibration behaviour, so that the reminder still works.
9. As a person with existing Alarms, I want an explanation when I open the upgraded app and a way to enable access, so that my next scheduled Alarm can use the new screen.
10. As a person who leaves my phone where others can see it, I want the locked Alarm screen to show only that a reminder is due, so that reminder names and dosage instructions stay private.
11. As a person looking at a locked Alarm screen, I want to snooze it for ten minutes without unlocking, so that I can defer the alert quickly.
12. As a person who snoozes an Alarm, I want the visual alert to return when snooze ends, so that I get another chance to respond to the same occurrence.
13. As a person who wants to silence an Alarm, I want **Close** to dismiss the screen and stop the shared sound session, so that I can answer the reminder later.
14. As a person managing a medicine reminder, I want to unlock to read the name and dosage instructions and choose **Taken** or **Skip**, so that I can identify the dose occurrence before recording an outcome.
15. As a person managing a general reminder, I want to unlock to read its name and choose **Done** or **Skip**, so that I can identify the reminder occurrence before recording an outcome.
16. As a person with two Alarms due together, I want the first to stay in view and an indication that another is due, so that I can respond without the screen switching underneath me.
17. As a person with overlapping Alarms, I want the next one to come into view after I answer or snooze the first, so that I can handle their outcomes independently.
18. As a person who closes overlapping Alarms, I want each unanswered reminder to remain available, so that I can answer them separately later.
19. As a person across the room from a silent phone, I want the Alarm screen to stay lit long enough to notice, so that a short display timeout does not immediately hide the alert.
20. As a person who is away from my phone, I want the display to be allowed to sleep after two minutes, so that an unattended Alarm does not keep it lit indefinitely.
21. As a person returning after the display has gone dark, I want to see the Alarm screen when I wake the phone if the Alarm is still active, so that I can respond to it then.
22. As a person who restarts the phone or restores reminder access, I want future Alarms to resume without a full-screen alert for missed deliveries, so that old occurrences do not interrupt me as new Alarms.
23. As a person using My Reminders in British English or Latin American Spanish, I want the Alarm screen and access instructions in my selected app language, so that I can read and act on them.

## Implementation Decisions

- Use Android's full-screen notification support for Alarm mode. Reuse the shared reminder occurrence delivery path for scheduled and snoozed Alarms. Keep regular Notification mode on its existing delivery path and let Android present the heads-up notification while the phone is in use.
- Use the existing Alarm choice as the in-app request for this presentation. Explain access in Alarm setup when Android requires it, and after an upgrade for people with existing Alarms. Link to Android's full-screen access settings and reflect the current access state when the person returns. Full-screen access is optional for saving and delivering the Alarm notification.
- Keep visual presentation independent of the sound session. Phone Silent can suppress sound and vibration while the screen appears. Retain the existing sound, vibration, notification-channel, and Do Not Disturb behaviour. Android controls visual suppression and how fallback notifications appear.
- Use the Alarm screen above the lock screen without unlocking the phone automatically. Show **Reminder due**, **Close**, **Snooze 10 minutes**, and a way to unlock. Once unlocked, reveal the name and any dosage instructions, and offer the existing type-specific outcome actions. Route those actions through the existing occurrence handling, including its repeat-action and outcome correction rules.
- Keep snooze and outcome actions scoped to the displayed occurrence. Show overlapping Alarms one at a time in delivery order. Indicate when another is waiting and advance after an outcome or snooze. Close the screen and end the shared sound session when the person chooses **Close**. Preserve the unanswered occurrences and their notifications for later response.
- Limit the Alarm screen's keep-awake period to two minutes while visible. Allow normal display sleep afterwards. Resume the screen on manual wake if an Alarm is still active. Display sleep leaves the occurrence unanswered and any permitted sound or vibration running.
- Reuse existing occurrence identities and scheduling. A snoozed Alarm returns after ten minutes for the same occurrence. Restart and access recovery continue to restore future reminders without replaying missed full-screen alerts.
- Localise the Alarm screen and access copy in British English and Latin American Spanish.

## Testing Decisions

- Use an actual scheduled reminder as the primary test entry point. Assert what Android displays, what actions the person can take, and what happens to the occurrence and sound session. The existing immediate **Test reminder** notification does not exercise the locked, display-off delivery path.
- On the phone that showed the original behaviour, schedule an Alarm about one minute ahead, set the phone to Silent, and lock it with the display off. Verify that it wakes quietly with a generic Alarm screen, that **Close** and snooze are available while locked, and that details and outcome actions become available after unlock. Allow the display to sleep after the keep-awake period, then wake it manually and verify that the still-active Alarm returns.
- Repeat with full-screen access off and verify the notification fallback. With sound enabled, check that fallback retains the usual sound and vibration. Check unlocked delivery, Do Not Disturb with visual interruptions suppressed, and Notification mode on the same device. Record the device model and Android version.
- Extend the existing Android reminder delivery, snooze, sound session, and recovery instrumentation where it can assert public behaviour. Cover a snoozed Alarm returning for the same occurrence, overlap and action order, **Close** leaving occurrences unanswered, the next scheduled Alarm after an upgrade, and recovery with no replay of missed visual alerts.
- Use the existing reminder setup and access UI tests for the explanation, save-without-access flow, and refresh after returning from system settings. Cover both supported app languages and both reminder types. Use the real phone check for Android's actual lock screen and display behaviour.

## Out of Scope

- Changes to Notification mode, reminder schedules, sound selection, snooze duration, or outcome semantics.
- Overriding Android's Silent mode, Do Not Disturb, or notification controls.
- A new in-app toggle for full-screen Alarms, a configurable display duration, or changes to the existing **Test reminder** button.
- Public Google Play launch or automatic eligibility for full-screen access.

## Further Notes

- This spec implements the agreed exception for Alarm mode to the original MVP decision about full-screen presentation. See the [product spec](../pill-reminder/spec.md#alarm-screen) and [Android design decision](../../docs/adr/0001-alarm-screen-on-android.md).
- Android 14 and later let people revoke full-screen access. Android documents the expected behaviour for locked, unlocked, screen-off, and always-on displays. [Android full-screen alert limits](https://source.android.com/docs/core/permissions/fsi-limits)
