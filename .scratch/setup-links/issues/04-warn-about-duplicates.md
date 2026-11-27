# 04: Warn about duplicate setups

**What to build:** A recipient is warned before adding a setup that matches an existing item's name and schedule, and chooses whether to cancel or add another.

**Blocked by:** 01 — Open and review a one-time setup link.

**Status:** ready-for-agent

- [ ] Before saving a proposed item whose name and schedule match an existing item, show a clear warning with cancel and add-anyway choices.
- [ ] Cancelling does not create or modify an item; adding anyway creates a separate item without changing the existing one.
- [ ] Match on name and schedule, not link identity; define and consistently apply name and schedule normalisation. Different schedules are not treated as duplicates solely because their names match.
- [ ] Cover reopening the same link and independently generated matching links through observable app behaviour, including Reminder and Medicine wording in both supported languages.
- [ ] Apply the same matching behaviour to all supported schedule types as they become available.
