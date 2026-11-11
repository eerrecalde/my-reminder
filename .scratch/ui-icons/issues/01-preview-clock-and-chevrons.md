# 01: Preview the clock and chevrons on Android

**What to build:** Make the clock on a past Reminder occurrence easy to see and give Frequency and Today’s outcome groups a consistent way to show when they are open. Preview the History tab icon alongside them to establish the style and size for the rollout.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Add `lucide-react-native` and `react-native-svg`. Render the preview icons through a shared in-app component with a 24 dp starting size and a consistent stroke. Confirm the icons render offline on Android.
- [ ] Show a legible clock on past Reminder occurrences in History and expanded Today groups, and a matching clock on the History tab. Keep artwork size independent of its badge and tap area.
- [ ] Use a downward chevron when Frequency or a Today outcome group is closed and an upward chevron when it is open. Preserve tap areas, accessible names and expanded states.
- [ ] Run the existing navigation, outcome group and Frequency tests. Capture the past Reminder row, tab bar and both states of each expandable control on the disposable Android emulator. Check alignment, legibility and room for labels in British English and Latin American Spanish.
- [ ] Record the preview’s sizing decision. Introduce a shared 20 dp option only if an identified inline control needs it and the icon remains legible.
