# 03: Show accurate access status for Alarm alerts

Status: ready-for-agent
Completion: done

**What to build:** Give people accurate, actionable information when Android channel settings affect an Alarm.

**Blocked by:** None (can start immediately).

- [x] Reproduce and document the effects of blocked and reduced-importance Alarm channels on notification presentation, full-screen display and sound before deciding warning wording.
- [x] Show an appropriate warning and settings route when needed, allow saving and refresh status after return in both languages for Reminder and Medicine.
- [x] Verify blocked and restored behaviour with native and UI coverage, respecting Android settings and the existing Alarm screen, fallback and locked-screen privacy decisions.

## Investigation

- 2026-11-24 — On the disposable Android 16 emulator, direct delivery with the Alarm alerts channel at importance 4 showed the notification and Alarm screen and played the separate sound session. With the channel blocked (importance 0), the occurrence notification and Alarm screen were absent while the sound session continued playing. Restoring importance 4 restored both visual surfaces. With the channel set to Silent (importance 2), the notification remained, the Alarm screen did not appear, and the sound session continued playing. These observations are direct-delivery experiments, not proof of actual Android alarm delivery or behaviour on other devices. The empty disposable installation was reset after the experiment to restore its original channel defaults.
- 2026-11-25 — Added per-item warnings and settings routes for blocked or reduced Alarm channels, including reduced legacy reminder-channel importance, in English and Spanish. Saving remains possible and access status refreshes on return. The separate full-screen-access fallback is not claimed when the Alarm notification is blocked.
- On the disposable Android 16 emulator, actual AlarmManager delivery confirmed that blocking Alarm alerts suppressed the occurrence notification and Alarm screen while the separate sound session played; restoring the channel restored the visual alert. Native UI tests verified the settings route and refresh for Reminder and Medicine in both languages. Reduced importance was investigated by direct delivery; native classification of that state is not independently covered by an automated integration test. JavaScript tests cover warning copy and routes for both reduced states and saving both types in Alarm mode through a mocked native boundary.
- TypeScript, lint, translation checks, all 134 JavaScript tests, Android unit tests, and all 65 disposable-emulator instrumentation tests passed. The 507.836-second instrumentation run includes actual timed Alarm and display-sleep checks. An earlier run failed existing channel integration tests after a navigation race left settings on the wrong channel; waiting for the destination page and channel identity corrected the clean rerun. The final warning was visually checked on the emulator. Physical-device testing remains the separately planned checkpoint.
