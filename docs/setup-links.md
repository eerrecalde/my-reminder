# Setup links, version 1

A setup link proposes one new item. Opening it never saves or changes an item; the recipient reviews it and chooses whether to save. Anyone with the link can read its contents. Do not include real personal information in examples. The link does not verify who sent it and does not expire automatically.

The proposed production address is `https://ding-reminders.surge.sh/setup`. Domain control, hosting and Android App Links verification are pending ticket 06. For intent testing before then, use the reserved test address `https://setup-links.example.com/setup`; it is not a hosted fallback.

Append these query parameters, separated by `&`. Encode each value using UTF-8 percent encoding (for example, a space as `%20` and `:` as `%3A`); `+` also represents a space. Each parameter may occur only once. Unknown parameters, unsupported versions and invalid values are rejected.

| Parameter | Required | Value |
| --- | --- | --- |
| `v` | Yes | `1` |
| `name` | Yes | Non-blank item name |
| `date` | Yes | Local calendar date `YYYY-MM-DD` |
| `time` | Yes | Local 24-hour time `HH:MM` |
| `type` | No | `reminder` (default) or `medicine` |
| `mode` | No | `notification` (default) or `alarm` |
| `instructions` | No | Medicine instructions; requires explicit `type=medicine` |

Dates and times use the recipient's local time zone. A past date remains reviewable but must be changed to a future time before saving. Version 1 currently supports only one-time schedules; other schedules are reserved for later work.

Examples:

```text
https://ding-reminders.surge.sh/setup?v=1&name=Drink%20water&date=2099-06-30&time=09%3A15
https://ding-reminders.surge.sh/setup?v=1&type=medicine&name=Example&instructions=With%20food&date=2099-06-30&time=09%3A15&mode=alarm
```
