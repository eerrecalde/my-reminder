# Shareable setup links

Status: ready-for-agent

## Problem Statement

A caregiver may need to help an older person set up a Reminder or Medicine without being physically present or asking them to enter a schedule themselves. The details may arrive through email or WhatsApp, and retyping them on a phone creates effort and opportunities for mistakes. A future assistant or other external tool could also prepare the same information, but the app currently cannot receive a link containing a proposed setup.

## Solution

Let a caregiver prepare one Reminder or Medicine and share a self-contained setup link. The recipient opens it to review the proposed details and explicitly saves it, with an option to edit first. The link uses readable parameters that a knowledgeable sender can change, and the format is documented so future tools can produce it. A web fallback offers installation guidance when the Android app is not installed.

## User Stories

1. As a caregiver, I want to prepare a Reminder for another person, so that they do not have to enter its details themselves.
2. As a caregiver, I want to prepare a Medicine with dosage instructions, so that the recipient can review the information I provide.
3. As a caregiver, I want to share a setup link through email, so that a recipient can open it from a message.
4. As a caregiver, I want to share a setup link through WhatsApp or another sharing app, so that I can use the recipient's preferred channel.
5. As a caregiver, I want to share a setup without saving it on my own phone, so that I do not receive unwanted alerts.
6. As a caregiver, I want to save an independent copy on my own phone, so that I can hear and test its alert.
7. As a caregiver, I want to know that my saved copy continues on its own schedule until I change or remove it, so that I can manage its alerts.
8. As a caregiver, I want to choose notification or Alarm mode, so that the recipient receives the intended kind of alert.
9. As a caregiver, I want to include the schedules the app supports, so that a shared setup can match the recipient's routine.
10. As a caregiver, I want link parameters to be understandable and editable, so that I can adjust a date or other supported detail without a special tool.
11. As a recipient, I want to open a setup link on my Android phone, so that the proposed details appear in the app.
12. As a recipient, I want to see a simple read-only review, so that I can check the proposal without navigating a form first.
13. As a recipient, I want to see the name, schedule, dosage instructions when present, and alert mode, so that I can decide whether the proposal is correct.
14. As a recipient, I want an obvious save action, so that I can start the Reminder with little effort.
15. As a recipient, I want a separate edit action, so that I can correct any supported detail before saving.
16. As a recipient, I want to review my edits before saving, so that I can check the final setup.
17. As a recipient, I want no Reminder created until I explicitly save it, so that opening a link alone does not change my schedule.
18. As a recipient, I want a shared setup to create a new item, so that it cannot silently change an existing Reminder or Medicine.
19. As a recipient, I want a warning when the same name and schedule already exist, so that I can avoid accidental duplicates.
20. As a recipient, I want to cancel or add a duplicate anyway, so that I remain in control.
21. As a recipient, I want dates and times interpreted in my local time zone, so that a 9:00 reminder occurs at 9:00 on my clock.
22. As a recipient, I want to correct a one-time date that has passed, so that I can save a useful future alert.
23. As a recipient, I want a recurring schedule that started in the past to begin at its next future occurrence, so that I do not get catch-up alerts.
24. As a recipient, I want to correct an expired recurring end date, so that the resulting schedule has future alerts.
25. As a recipient, I want to see a clear error for a malformed, incomplete, or unsupported link, so that I can show it to the caregiver.
26. As a caregiver, I want optional details to be optional in the link, so that simple setups remain simple.
27. As a caregiver, I want omitted type and alert mode to default to Reminder and notification, so that common links require fewer parameters.
28. As a caregiver, I want an error if dosage instructions are supplied without an explicit Medicine type, so that the type is not silently misinterpreted.
29. As a recipient, I want to know what permissions are needed for alerts, so that I can enable them or ask for help.
30. As a recipient, I want my setup saved even if I decline a required permission, with a persistent indication that alerts may not work, so that I do not lose the details.
31. As a recipient without the app, I want the link to open installation guidance, so that a caregiver can help me install it and reopen the original link.
32. As a recipient, I want a previously shared link to remain usable without automatic expiry, so that I can return to the message later.
33. As a recipient, I want the app not to claim a sender's identity is verified, so that I am not given false assurance about its origin.
34. As an external tool or future assistant, I want a documented versioned link format, so that I can generate compatible setups.
35. As a recipient using either supported app language, I want the review, errors and permission guidance in my selected language, so that I can understand the flow.
36. As a user of existing reminders, I want my local data and scheduled alerts preserved, so that adding link support does not disrupt them.

## Implementation Decisions

- A **Setup link** describes exactly one proposed new **Reminder** or **Medicine**. It is self-contained, contains no automatically enforced expiration, and is never a remote update mechanism. The recipient must confirm before a new item is saved.
- Add a caregiver sharing action to the existing setup flow. Sharing does not itself save an item; the caregiver may separately save an independent copy with the same schedule. A copy has no connection to the recipient's copy and does not report whether they heard or responded to an alert.
- Register and handle incoming Android HTTPS links on both app launch and while the app is running. Parse, validate and route the proposal to a read-only review, with a prominent save action and a separate edit action that uses the existing setup flow. Review edited details again before saving as a new item through the existing scheduling path.
- Use a documented, versioned, human-readable parameter format covering all currently supported schedules, dates, times, interval anchors, monthly policies, type, name, optional dosage instructions, and alert mode. Choose and document exact parameter names, encoding, required fields, allowed values and examples during implementation. The format must be usable by external producers and make common dates straightforward to edit. Reject unknown versions and parameters, malformed values, and missing required information with a clear error; never silently ignore unsupported information or display a partial setup.
- Omitted type means Reminder and omitted alert mode means notification. Medicine requires an explicit type when dosage instructions are supplied. Optional fields may be omitted; do not invent medication instructions or recommend doses. Display the effective type and mode on review.
- Interpret all dates, times and interval anchors in the recipient's local time zone. For a valid one-time proposal in the past, request a future date and time before saving. For a recurring proposal with a past start, schedule the next future occurrence without catch-up alerts. If its end date has passed, require a corrected end date before saving. Recheck temporal validity at save time.
- Warn about an existing item with the same name and schedule and offer cancellation or adding another. Match on the schedule rather than link identity; specify normalisation consistently in implementation and test observable results.
- Guide the recipient to permissions required by the selected mode. If permission is declined, retain the saved item and persistently indicate that alerts may not work. Preserve the existing Alarm screen decision, including Android's full-screen alert restrictions and fallback.
- Use a Surge-hosted HTTPS subdomain based on the app's current name, subject to availability. Host a static fallback with installation guidance and a link to the release APK when one is available; recipients reopen the original link after installation. Verify that the Android association file is served at the required path over HTTPS without redirects and matches the app's signing certificate. Retain the original address after a future rename so shared links remain usable. The exact hostname and release distribution setup remain to be selected; do not imply a release APK or public deployment already exists.
- Link data is visible to anyone with access to the link and may be exposed to services handling it. Do not assert the identity of its sender. Avoid requiring an account or a server-side record for each setup.
- Preserve existing app identity and data; keep Reminder and Medicine wording consistent in British English and Latin American Spanish. No app rename is part of this feature.

## Testing Decisions

- Good tests assert observable behaviour at the highest practical seam, including what the recipient sees, what they can choose and what gets saved, rather than internal parsing or component structure. Use the existing app-level setup/save boundary as the main seam; use narrower tests only where needed to cover meaningful parameter and schedule cases.
- Extend the existing app save and setup-flow test patterns to cover link arrival, review, edit, confirmation, new-item save, both types and languages, sharing without saving, and the optional independent caregiver save. Exercise defaults, URL encoding, all existing schedule types, local time, past and expired schedules, validation errors, duplicate choices, and permission denial without loss of data.
- Use representative malformed, missing, unknown and unsupported inputs, including dosage without explicit Medicine type. Check a valid link does not create anything before confirmation and does not modify an existing item.
- Verify Android link resolution for cold and running app states and the installed/not-installed website behavior separately on a disposable emulator or disposable installation. Check the deployed association file and signing fingerprint; distinguish actual Android delivery from simulated intent handling. Verify the fallback page and installation instructions with a real hosted test address when available.
- Prior art includes existing app-level scheduled-save tests, setup/review tests for both languages and schedule types, schedule calculations, past-schedule tests and the repository's routine Android emulator workflow. Preserve the existing Alarm-screen tests and constraints.

## Out of Scope

- Gemini or other assistant integration itself; remote creation APIs and background creation without recipient confirmation.
- Remote updates, synchronisation or monitoring whether the recipient heard or responded to an alert.
- Multiple Reminders or Medicines in one link, authenticated sender identity, and server-side storage of each proposal.
- Automatic deferred deep linking through installation, app renaming, and publishing to Google Play. Production APK distribution and public hosting setup are separate release tasks; the fallback must be ready to point to an available installer.

## Further Notes

The precise Surge hostname is not selected, and hosting capability, app signing and Android developer verification requirements need to be checked when preparing distribution. Link contents can disclose medicine details, so keep examples and logs free of real personal information. Manual edits to parameter values still need normal URL encoding. A future domain change must retain the old domain and its app association for existing links.
