# Reminder access navigation

Status: ready-for-agent

## Problem Statement

A person reviewing Reminder access can feel trapped: the main navigation is hidden and the only exit is a Cancel button at the bottom of a potentially long screen. Cancel also suggests that changes will be discarded, although settings are applied as they are changed.

## Solution

Provide a clearly visible Back control that remains at the top of Reminder access while its content scrolls. Back returns to the screen from which the person entered, preserving changes already applied. Android's system Back behaves the same way.

## User Stories

1. As a person reviewing Reminder access, I want an obvious way to leave, so that I do not feel trapped.
2. As a person scrolling through access options, I want Back to remain visible, so that I can leave without scrolling to the bottom.
3. As a person who opened Reminder access, I want Back to return me to the screen I came from, so that I can resume what I was doing.
4. As a person using Android's Back gesture or button, I want it to have the same result as the on-screen Back control, so that navigation is predictable.
5. As a person changing language or sound settings, I want those changes to remain in effect when I go back, so that leaving does not undo my work.
6. As a person returning from Android permission settings, I want to see refreshed access information and then be able to go back, so that I can understand the current state and resume using the app.
7. As a person using a screen reader, I want Back to have a clear, localized accessible name, so that I can identify and use it.
8. As a person navigating the main destinations, I want the existing bottom navigation to remain available, so that I can reach Today, Reminders and History directly.
9. As a person setting up a reminder, I want the existing step-by-step Back behavior to remain unchanged, so that the setup flow continues to work as expected.

## Implementation Decisions

- Treat Today, Reminders and History as peer destinations using the existing bottom navigation; do not add Back controls to those tabs.
- Remember the originating screen when entering Reminder access, and return to it from both the on-screen control and Android system Back. Current entry points are on Today; support the origin explicitly for future entry points.
- Place the on-screen Back control outside the scrolling content so that it stays visible. Give it an accessible, localized name consistent with existing navigation.
- Remove the bottom Cancel action. Leaving does not undo language, sound, permission, or other changes already applied; do not add a save or discard step.
- Preserve the refresh of access information when the app returns from Android settings and when leaving the screen.
- Keep the reminder setup flow and its existing Back behavior unchanged.

## Testing Decisions

- Test observable behavior through the app screen, using the existing app-level test and repository-mock seam. Prefer this existing seam to introducing a new one; do not assert internal state or implementation details.
- Cover entry to Reminder access, on-screen Back and Android system Back, the return destination, persistence of applied settings, and refreshed access information after returning from Android settings. Verify accessible names in supported languages.
- Use the existing app navigation and Reminder access tests as prior art. Check on a device or emulator that Back remains visible while scrolling and that the system gesture or button behaves as expected.

## Out of Scope

- Adding Back controls to the main tabs or defining tab history behavior.
- Changing the reminder setup flow or adding unsaved-change confirmation.
- Changing permission, sound, language, or reminder behavior beyond the navigation and refresh described above.
- A dedicated Home control or an architecture decision record.

## Further Notes

Back means return to the originating screen; it is not a shortcut that always goes to Today. The existing Alarm screen decision is unaffected.
