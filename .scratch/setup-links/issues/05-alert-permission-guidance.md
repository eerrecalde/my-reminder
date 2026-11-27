# 05: Guide recipients through alert permissions

**What to build:** After reviewing a setup, a recipient can save it even if alert permissions are unavailable, and receives clear guidance about what to enable so the alert can work.

**Blocked by:** 01 — Open and review a one-time setup link.

**Status:** ready-for-agent

- [ ] Identify missing permissions relevant to the chosen notification or Alarm mode and provide a way to reach the relevant settings or permission request.
- [ ] If a required permission is declined or unavailable, retain the saved item and show a persistent indication that its alerts may not work, including after returning to the app.
- [ ] When permissions are granted, the warning reflects the updated state; do not silently claim that alerts are ready while required access is missing.
- [ ] Preserve existing Android Alarm screen and notification fallback behaviour, and cover both supported languages and relevant permission states using existing app-level test seams.
