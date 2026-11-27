# 02: Share a prepared setup

**What to build:** A caregiver can prepare a one-time Reminder or Medicine and share a setup link via the phone's sharing options, without needing to save an item on their own phone. They can also save an independent copy to test the alert.

**Blocked by:** 01 — Open and review a one-time setup link.

**Status:** ready-for-agent

- [x] Sharing a valid one-time setup produces a self-contained link that opens the recipient review with the intended details, including type, instructions and notification or Alarm mode when chosen.
- [x] The share action does not save or schedule an item for the caregiver, including if sharing is cancelled.
- [x] The caregiver can separately save an independent copy with the same schedule; it continues alerting on their phone until changed or removed and does not monitor or update the recipient's item.
- [x] The link uses the same HTTPS host and setup path accepted by the recipient app, follows the documented format and correctly encodes names and other text. Both app languages use the same host. Confirm the production host with ticket 06 before using it for real shares.
- [x] Exercise sharing and optional saving through the existing setup and save flow with observable behaviour tests.

## Comments

- Implemented sharing for one-time setups using the reserved test host. The review warns that links are not ready for real sharing; ticket 06 must confirm and configure the production host. Saving a caregiver copy remains a separate action.
- Verification: setup-flow tests cover both languages, Reminder/Alarm and Medicine/notification, URL encoding, cancelled sharing, independent saving and generated links reopened for review. The focused create/edit scheduling test passed on the disposable Android 36 emulator; the sharing review screen was visually checked there.
