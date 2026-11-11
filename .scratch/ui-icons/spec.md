# Consistent in-app icons

Status: ready-for-agent

## Problem Statement

The clock beside a past Reminder occurrence is hard to see. Frequency and outcome groups use different arrows to show whether they’re open. The app currently mixes text glyphs with hand-drawn icons, and their visible size varies even when the surrounding space is similar.

## Solution

Use one icon family throughout the React Native screens, with a shared default size and a compact option for controls that need it. Start with an Android preview of the past Reminder clock, the History tab, the Frequency dropdown and Today’s expandable outcome groups. Use the preview to validate legibility and spacing before applying the same treatment to the remaining in-app icons.

## User Stories

1. As a person reviewing History, I want a clearly visible clock next to a past Reminder occurrence, so that I can recognise the row at a glance.
2. As a person checking Today, I want the same clock on Reminder occurrences and the next scheduled card, so that I recognise the symbol across screens.
3. As a person using Reminders and Medicines, I want distinct symbols alongside the written type labels, so that I can tell them apart quickly.
4. As a person moving between Today, Reminders and History, I want the three tabs to have visually balanced icons, so that I can scan the navigation easily.
5. As a person choosing a Frequency, I want the dropdown chevron to show whether the options are open, so that I know what tapping it will do.
6. As a person reviewing earlier outcomes, I want the group chevrons to follow the same open and closed convention as Frequency, so that I can expand groups with confidence.
7. As a person setting up a Reminder or Medicine, I want rows that open a picker or another screen to have a different cue from rows that expand in place, so that I can anticipate where the action leads.
8. As a person scanning a dense row, I want the label and icon to fit comfortably, so that I can read the control at a glance.
9. As a person tapping a control with a compact icon, I want the whole existing control to stay tappable, so that I can operate it without precise aim.
10. As a person reviewing outcomes, I want the written Done, Taken, Skipped and Missed labels to stay visible, so that I can understand the status from the text.
11. As a person changing a schedule, I want checked and selected options to be clear, so that I can review my choices before saving.
12. As a person using a screen reader, I want controls to retain their names and states, so that I can identify tabs, choices and expanded groups.
13. As a person using British English or Latin American Spanish, I want icons and text to fit together in my language, so that translated labels remain readable.
14. As a person using My Reminders offline, I want icons to appear without a connection, so that the screens look consistent wherever I use the app.

## Implementation Decisions

- Start the preview with Lucide for React Native and its local SVG renderer. Use one shared in-app icon component for size and stroke defaults. Use the app’s existing colours and bundle icons with the app.
- Use 24 dp as the starting artwork size, including the past Reminder clock and the History tab. Keep badge size and touch target size independent of artwork size. Introduce a shared 20 dp compact option only if the Android preview shows a specific inline control needs it and the icon remains legible.
- Use a consistent chevron for controls that expand in place, pointing down when closed and up when open. Use a right-facing chevron where a row opens a picker or another screen. Preserve the existing action labels, roles, state announcements and tap areas. Hide decorative artwork from accessibility services when the parent already conveys its meaning.
- Keep the written type and outcome labels. Use a clock for a Reminder occurrence and a distinct symbol for a Medicine. Use the same clock on the next scheduled card.
- After the preview, apply the shared treatment to the remaining app-authored icons, including tabs, menus, back and add actions, status and warning symbols, and selection indicators. Preserve the approved screen structure and the meaning of each control.

## Testing Decisions

- Check legibility and layout through the normal Android app screens on the disposable emulator. Capture the past Reminder clock in context, the navigation tabs, and both states of the Frequency dropdown and Today’s outcome groups. Review the screenshots at device scale before applying the treatment across the app. Check that outlines are visible, alignment is consistent, and the icons leave room for labels.
- Exercise both Reminder and Medicine flows in British English and Latin American Spanish. Include a long label, a populated History, selected and unselected tabs, and open and closed controls. Check the remaining updated controls on the screens where they are used.
- Reuse the existing app and schedule setup tests. The app tests for navigation labels and expansion of earlier outcomes and the setup tests for choosing a Frequency are the closest precedents. Add focused coverage only for behaviour gaps, such as a control losing its accessible name or expanded state. Test the interaction and exposed state through the screen, and use the emulator for icon appearance.
- Run the project’s standard React Native checks and verify that the Android build renders the bundled icons offline.

## Out of Scope

- Logos, brand artwork, illustrations, Android launcher assets and system notification icons.
- Changes to screen structure, copy, scheduling, alarms, reminder data or outcome behaviour.
- A full accessibility audit.

## Further Notes

- Lucide and the 24 dp default are starting proposals from the discussion. Use the first Android preview to validate them. The compact size is conditional on a demonstrated layout need.
