# 02b: Generalise the reminder foundation

**What to build:** Align the project and its plans with the general reminder direction, and extend the existing daily medicine foundation to support both reminder types through shared scheduling, storage and notifications. Preserve existing medicines and their schedules.

**Blocked by:** 02 — Save one daily medicine and receive a notification

**Status:** ready-for-agent

- [ ] Review and update the active spec, tickets 03–12, glossary, relevant documentation, README, and project-wide text to reflect the agreed general reminder and medicine behaviour. Preserve historical decisions as history and remove conflicting active requirements; review dependencies and triage statuses as tickets become ready.
- [ ] Review project metadata and configuration, including package.json and similar files, for medicine-only names or descriptions. Update appropriate general descriptions and repository references; choose no new app name without the user's decision. Avoid changing application identifiers or installed-app identity as a routine rename, so existing data and upgrades remain intact.
- [ ] Persist a reminder type and optional medicine dosage instructions; migrate existing medicines as Medicine without losing their data, identity or scheduled reminders.
- [ ] Generalise shared daily scheduling, persistence and notification behaviour for both types, retaining existing reliability and permission behaviour.
- [ ] Use appropriate Reminder and Medicine wording in existing surfaces and both supported languages; retain the current look and accessibility.
- [ ] Verify existing medicine migration and daily notifications for both types, including app restart and rescheduling.
- [ ] Keep this stage focused on the existing daily foundation; later tickets add alarm, outcomes, history and additional schedules.
