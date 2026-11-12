# App language selection

Status: ready-for-agent

## Problem Statement

A person whose phone is set to English cannot choose to use My Reminders in Spanish. Language handling is spread across the app and native Android reminder resources, making additional languages harder to maintain consistently.

## Solution

Let people choose the app language in Options, independently of the phone language, while following the phone language by default. Keep the interface and reminder notifications consistent with the current choice. Maintain translations in one source file per language so that adding languages is straightforward.

## User Stories

1. As a person using My Reminders, I want the app to follow my phone language by default, so that it feels familiar without configuration.
2. As a person with an English-language phone, I want to select Español, so that I can use the app in Spanish.
3. As a person who prefers English, I want to select English, so that I can use it regardless of my phone language.
4. As a person changing my preference, I want a System default option, so that the app follows my phone language again.
5. As a person looking in Options, I want language selection below Reminder access, so that I can find it.
6. As a person who accidentally selects an unfamiliar language, I want a recognizable language icon, so that I can find the selector again.
7. As a person choosing a language, I want language names displayed in their own language, so that I can recognize them.
8. As a person who cannot read the current language, I want System default to be identifiable by an icon, so that I can recover my preferred setting.
9. As a person changing language, I want the choice applied immediately, so that I need not save separately.
10. As a person returning to the app, I want my selection remembered, so that I need not choose again.
11. As a person using Android's per-app language settings, I want changes there and in the app to agree, so that the language is consistent wherever I change it.
12. As a person using Spanish, I want the app's labels and messages in understandable neutral Spanish, so that I can navigate it comfortably.
13. As a person receiving a Reminder or Medicine notification, I want its app-provided text and actions in my current language, so that I can understand it.
14. As a person who changes language after scheduling a Reminder or Medicine, I want future notifications to use my current language, so that they match the app.
15. As a person recording a Reminder or Medicine, I want my own names and instructions preserved exactly, so that a language change does not alter my entries.
16. As a person using a future language, I want missing text to fall back to English, so that the app remains understandable and usable.
17. As a maintainer, I want missing translations identified before release, so that supported languages are complete.
18. As a maintainer, I want one source file per language, so that adding and reviewing translations is straightforward.
19. As a person viewing dates and times, I want formatting appropriate to the selected language, so that schedules are easy to understand.
20. As a person with existing Reminders and Medicines, I want changing language to preserve their data and schedules, so that my reminders continue as expected.

## Implementation Decisions

- Centralize app-provided translatable text in one source file per language, with English as the complete fallback and neutral Spanish for the MVP. Generate native Android notification resources from the same sources; do not maintain a separate hand-translated notification source.
- Centralize language selection and propagate the effective language to React Native screens, date and time formatting, and native reminder delivery. Remove scattered English-versus-Spanish branching as part of the refactor.
- Offer System default, English and Español below Reminder access, with a recognizable language icon and a visual cue for System default. Display language names in their own language. Apply changes immediately and persist them.
- Integrate with Android per-app language preferences where supported, so changes made in either location agree. System default follows the phone's language; unsupported languages fall back to English.
- Resolve notification text using the current effective language when a scheduled reminder is delivered, including actions and both Reminder and Medicine variants. Preserve existing schedules and records.
- Preserve user-entered names and instructions verbatim. Format dates and times using the effective locale. Account for plural forms and future language-specific layout needs rather than assuming all languages follow English grammar.
- Make missing translations fall back to English at runtime and provide a completeness check before release. Adding a language may also require registration, locale configuration and review; do not promise that a file alone covers every platform requirement.

## Testing Decisions

- Test observable behavior at the highest practical boundary, rather than implementation details. Follow existing app and screen tests for UI behavior and Android tests for native behavior.
- Exercise selection, immediate screen updates, persistence, system default, English fallback, language names and integration with Android settings where supported. Cover Reminder and Medicine and both English and Spanish.
- Exercise native reminder delivery after changing language after scheduling, including notification text and actions. Distinguish direct delivery tests from actual Android alarm delivery; use a disposable installation for device tests.
- Verify generated native resources and translation completeness through their observable outputs. Check that personal text, existing data and schedules remain intact.

## Out of Scope

- Translating user-entered names or instructions.
- Adding languages beyond English and Spanish in this MVP.
- Country-specific Spanish variants or automatic translation services.
- Changes to reminder scheduling or medicine advice beyond what is needed to display the current language.

## Further Notes

Android may refresh the current screen when applying a language change. A new language still requires translation review and testing, including plural rules, date formatting and layout.
