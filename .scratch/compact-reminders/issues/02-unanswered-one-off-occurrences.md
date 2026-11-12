# 02: Keep unanswered one-off occurrences actionable

**What to build:** Keep unanswered one-off occurrences accessible on Today until resolved, and show actionable overdue reminders prominently in the compact list.

**Blocked by:** 01: Compact reminder cards.

**Status:** ready-for-agent

- [ ] An unanswered due one-off remains available on Today on later days, even without an outstanding alert, until completed or skipped; clearing history does not recreate cleared records.
- [ ] Keeping an occurrence available does not restart alerts or produce catch-up sound; existing retained occurrence behavior and preservation across edit, pause and deletion remain intact.
- [ ] Cards show Overdue for actionable due unanswered occurrences, including recurring occurrences while actionable; overdue reminders sort before other active reminders, then paused reminders, with stable ordering in each group.
- [ ] Once a later recurring occurrence arrives, an earlier unanswered occurrence becomes Missed, remains correctable in History, and does not by itself produce an overdue indicator.
- [ ] Cover Reminder and Medicine, English and Spanish, and native Today policy and application-level behavior including answered, retained and cleared cases.
- [ ] Reconcile the product specification’s previous-day visibility rule with this agreed change.

**Visual reference:** [Selected Soft cards design](../soft-cards-reference.jpg). The feature specification defines the behavior and accessibility requirements.
