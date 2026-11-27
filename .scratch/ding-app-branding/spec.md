# Ding app name and bell logo

Status: ready-for-agent

## Problem Statement

People using My Reminders need a short name they can remember and find on an Android phone. The current English name also appears on Spanish-language phones, where someone may look for the app by typing “recordatorios.” The app serves people who set everyday Reminders as well as people who schedule Medicines.

## Solution

Use **Ding Reminders** in English and **Ding Recordatorios** in Spanish. Use a simple bell as the app’s logo, so the Android launcher icon and the places inside the app that show its brand are recognisable together. Deliver the rename as an update to the existing Android app.

## User Stories

1. As an English-speaking user, I want to see **Ding Reminders** in the Android app drawer, so that I can recognise the app when I look for it.
2. As a Spanish-speaking user, I want to see **Ding Recordatorios** in the Android app drawer, so that I can recognise what the app does in my language.
3. As a person using Android app search, I want the launcher label to contain both **Ding** and the local word for reminders, so that I can look for either term where my launcher supports name searches.
4. As a person helping a family member find the app, I want **Ding** to be common to both names, so that I can refer to the same app in either language.
5. As a person setting everyday Reminders, I want a name and logo that feel relevant to my tasks and appointments, so that I know the app is for me.
6. As a person using Medicines, I want the app to stay recognisable after the rename, so that I can continue using it for my existing schedules.
7. As a person scanning a crowded app drawer, I want a legible bell icon, so that I can recognise the app at a glance.
8. As a person who chooses English or Español in the app, I want the name shown inside the app to follow that preference, so that it matches the surrounding interface.
9. As a person viewing the Alarm screen, I want the same name and bell branding I see elsewhere in the app, so that I recognise which app is alerting me.
10. As a person using System default on a phone with an unsupported language, I want a consistent English fallback, so that I can still identify the app by name.
11. As a person updating My Reminders, I want the renamed release to replace the existing installation and retain my Reminders, Medicines, schedules and settings, so that I can continue where I left off.

## Implementation Decisions

- Set the Android application and launcher activity display labels to **Ding Reminders** in English and **Ding Recordatorios** in Spanish. Let Android resolve its launcher label through the existing locale resources, with English as the default. Preserve the current language selector and Android per-app language integration.
- Reuse the existing translation source and Android resource generation. Use the existing effective app language for the brand text in the shared in-app header and the native Alarm screen, including an explicit app language that differs from the phone language.
- Use one simple bell mark for the Android launcher icon, shared in-app header and native Alarm screen brand. Provide the artwork in the existing launcher icon variants and keep the bell legible at small sizes and under adaptive icon masks. Use the same mark in English and Spanish.
- Preserve the application's existing Android ID, signing identity, local storage, release upgrade path and setup link addresses. Update current installation and verification guidance to reflect the new names.

## Testing Decisions

- Use the installed app on a disposable Android emulator as the main test boundary. Check the exact launcher labels on English and Spanish with the app language set to System default. Try launcher searches for **Ding** and the local descriptor where app-name search is available, and record which queries the tested launcher matches.
- Open the normal in-app header and trigger the native Alarm screen in both supported languages. Check the localized name and bell, including an explicit app language different from the phone language. Check English fallback on an unsupported system language.
- Review launcher and in-app screenshots at device scale for a recognisable bell, the full Spanish name inside the app and comfortable spacing around existing header actions. Include the round or adaptive launcher icon and a compact screen.
- Verify an in-place update on a disposable installation containing a scheduled Reminder and Medicine. Check that their schedules and the language preference remain available after the update.
- Follow existing Android language preference and Alarm screen instrumentation patterns and the project's translation consistency check. Verify what a person sees and what survives the update through existing entry points.

## Out of Scope

- Google Play publication and public brand or trademark clearance.
- Changes to functional icons, system notification icons, alert sounds, scheduling, or Alarm screen privacy and behavior.
- New languages, setup link rebranding, and changes to signing or distribution infrastructure.

## Further Notes

The agreed distribution context is private Android use. The built-in launcher search available to each person depends on their launcher. The spelling, capitalization and language pairing are agreed. The simple bell is the agreed logo direction, with detailed artwork to be developed during implementation.
