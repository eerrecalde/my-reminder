# 01: Localize the Ding app name

**What to build:** People can find the existing app on Android as **Ding Reminders** in English or **Ding Recordatorios** in Spanish and see the corresponding name inside the app. The renamed release installs as an update to My Reminders and retains their data and schedules.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] On a disposable Android emulator, verify that the launcher displays the exact English and Spanish names when the app follows the phone language, with English as the default fallback.
- [x] Where the tested launcher supports app-name search, try **Ding** and the local descriptor **Reminders** or **Recordatorios** and record which queries find the app.
- [x] Verify the exact name in the shared app header and on the native Alarm screen in both languages, including an explicit app language different from the phone language. Check that the full Spanish name fits alongside the header actions on a compact screen.
- [x] Reuse the existing translations and Android resource generation, and run the translation consistency check. Update current installation and verification guidance to use the new names.
- [x] Preserve the Android application ID, signing identity and setup link addresses. On a disposable installation, install the renamed build as an update and confirm that an existing scheduled Reminder, a scheduled Medicine and the saved language preference are still present.

See the [Ding app name and bell logo spec](../spec.md).

## Comments

27 November 2026: Verified on the disposable `pill_reminder_test` emulator (Android 16, Pixel Launcher). With System default, the launcher showed Ding Reminders in English, Ding Recordatorios in Spanish and Ding Reminders with French first and English next in the system language list. Launcher searches for Ding and Reminders in English, and Ding and Recordatorios in Spanish, each found the app. The shared header and native Alarm screen showed both exact names; checked an explicit English app language against a Spanish phone language and an explicit Spanish app language against an English phone language. On a 320 dp wide screen the full Spanish header fitted beside settings and back actions. Alarm screen checks used direct test delivery, not a real scheduled delivery.

Built the previous `main` version with the debug key, created one scheduled Reminder and one scheduled Medicine with a Spanish language preference on the disposable installation, and installed the renamed debug APK over it. Both records, IDs, registered alarm times and tokens, and the language preference survived; both records and their next times were visible in the updated app. The application ID, signing configuration and setup links were unchanged. Translation consistency, TypeScript, lint, JavaScript tests, Android debug build and the existing language-preference instrumentation passed.
