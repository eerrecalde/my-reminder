# 01: Localize the Ding app name

**What to build:** People can find the existing app on Android as **Ding Reminders** in English or **Ding Recordatorios** in Spanish and see the corresponding name inside the app. The renamed release installs as an update to My Reminders and retains their data and schedules.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] On a disposable Android emulator, verify that the launcher displays the exact English and Spanish names when the app follows the phone language, with English as the default fallback.
- [ ] Where the tested launcher supports app-name search, try **Ding** and the local descriptor **Reminders** or **Recordatorios** and record which queries find the app.
- [ ] Verify the exact name in the shared app header and on the native Alarm screen in both languages, including an explicit app language different from the phone language. Check that the full Spanish name fits alongside the header actions on a compact screen.
- [ ] Reuse the existing translations and Android resource generation, and run the translation consistency check. Update current installation and verification guidance to use the new names.
- [ ] Preserve the Android application ID, signing identity and setup link addresses. On a disposable installation, install the renamed build as an update and confirm that an existing scheduled Reminder, a scheduled Medicine and the saved language preference are still present.

See the [Ding app name and bell logo spec](../spec.md).
