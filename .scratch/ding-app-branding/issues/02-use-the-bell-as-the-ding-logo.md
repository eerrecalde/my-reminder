# 02: Use the bell as the Ding logo

**What to build:** People can recognise the app by the same simple bell in the Android launcher, the shared app header and the native Alarm screen.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Use the same bell mark across the existing launcher icon variants, the shared app header and the native Alarm screen in both languages.
- [x] On a disposable Android emulator, capture the launcher and both in-app surfaces. Confirm the bell is recognisable at launcher size, including under round and adaptive icon masks.
- [x] Check the bell and name together on a compact screen in English and Spanish. Confirm the name is legible and the existing header actions have room.
- [x] Keep the initial artwork change to branding surfaces. Preserve functional icons, system notification icons, alert sounds and the Alarm screen's existing privacy and behavior.

See the [Ding app name and bell logo spec](../spec.md).

## Comments

27 November 2026: The initial bell branding was checked on the disposable Android 16 `pill_reminder_test` emulator. Captures covered the round adaptive launcher icon, the shared header and the locked Alarm screen. English and Spanish were checked at 320 dp width, including the header's settings and back actions. The Alarm display-sleep test and Spanish scheduled Alarm delivery test passed; the locked screen kept reminder details private. TypeScript, lint, all 144 JavaScript tests, translation checks and the Android unit tests and debug build passed.

After that review, the user requested further changes: a different bell design, a matching notification icon, gold accents and the shorter name **Ding**. Those changes intentionally supersede the original restriction on changing the notification icon and the longer names in the spec. A separate debug preview was installed alongside the existing app on the user's phone; this was not an in-place release upgrade.
