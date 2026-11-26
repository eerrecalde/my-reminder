# 01: Make Reminder access easy to leave

**What to build:** Give people a clear, persistent way to leave Reminder access and return to the screen they came from, while retaining settings and permission changes they have already made.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] A localized, accessible Back control remains visible at the top of Reminder access while its content scrolls.
- [ ] On-screen Back and Android system Back return to the screen that opened Reminder access, including after returning from Android permission settings.
- [ ] Language, sound, permission and other changes already applied remain in effect when leaving; no save or discard step is introduced.
- [ ] The bottom Cancel action is removed, and access information continues to refresh after returning from Android settings and when leaving.
- [ ] Today, Reminders and History retain their existing bottom navigation, and reminder setup retains its existing Back behavior.
- [ ] App-level behavior tests cover both Back controls, the return destination, persistence of applied changes, access refresh and localized accessibility. Verify the persistent control and system Back on a device or emulator.

See the accompanying spec for context and scope.
