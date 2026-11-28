# Setup links, version 1

A setup link proposes one new item. Opening it never saves or changes an item; the recipient reviews it and chooses whether to save. Anyone with the link can read its contents. Do not include real personal information in examples. The link does not verify who sent it and does not expire automatically.

The proposed production address is `https://ding-reminders.surge.sh/setup`. Domain control, hosting and Android App Links verification are pending ticket 06. For intent testing before then, use the reserved test address `https://setup-links.example.com/setup`; it is not a hosted fallback.

Append these query parameters, separated by `&`. Encode each value using UTF-8 percent encoding (for example, a space as `%20` and `:` as `%3A`); `+` also represents a space. Each parameter may occur only once. Unknown parameters, unsupported versions and invalid values are rejected.

| Parameter | Required | Value |
| --- | --- | --- |
| `v` | Yes | `1` |
| `name` | Yes | Non-blank item name |
| `date` | One-time only | Local calendar date `YYYY-MM-DD` |
| `time` | One-time only | Local 24-hour time `HH:MM` |
| `type` | No | `reminder` (default) or `medicine` |
| `mode` | No | `notification` (default) or `alarm` |
| `instructions` | No | Medicine instructions; requires explicit `type=medicine` |

For recurring schedules omit `date` and `time` and use the following fields instead. Fields for a different schedule are rejected.

| Parameter | Required | Value |
| --- | --- | --- |
| `schedule` | Yes | `daily`, `weekday`, `interval` or `monthly` |
| `start` | Yes | Local start date `YYYY-MM-DD` |
| `end` | No | Inclusive local end date `YYYY-MM-DD`, on or after `start` |
| `times` | Daily, weekday, monthly | Comma-separated distinct local 24-hour times `HH:MM` |
| `weekdays` | Weekday | Comma-separated distinct ISO weekday numbers, Monday `1` through Sunday `7` |
| `hours` | Interval | Whole hours from `1` to `2147483647` |
| `anchor` | Interval | Local reference date and time `YYYY-MM-DDTHH:MM` |
| `day` | Monthly | Day of month `1`–`31` or `last` |
| `shortMonth` | Monthly | `last` to use the last day, or `skip` to skip a short month |

Dates, times and interval anchors use the recipient's local time zone. Interval occurrences are spaced by elapsed hours from the local anchor. A past one-time date remains reviewable but must be changed to a future time before saving. A past recurring start is allowed; only future occurrences are scheduled. An ended recurring schedule needs an end date that permits a future occurrence. Temporal validity is rechecked on save.

Examples:

```text
https://ding-reminders.surge.sh/setup?v=1&name=Drink%20water&date=2099-06-30&time=09%3A15
https://ding-reminders.surge.sh/setup?v=1&type=medicine&name=Example&instructions=With%20food&date=2099-06-30&time=09%3A15&mode=alarm
https://ding-reminders.surge.sh/setup?v=1&name=Water&schedule=daily&start=2099-01-01&times=09%3A00%2C18%3A00
https://ding-reminders.surge.sh/setup?v=1&name=Exercise&schedule=weekday&start=2099-01-01&times=09%3A00&weekdays=1%2C3%2C5
https://ding-reminders.surge.sh/setup?v=1&name=Example&schedule=interval&start=2099-01-01&hours=8&anchor=2099-01-01T09%3A00
https://ding-reminders.surge.sh/setup?v=1&name=Example&schedule=monthly&start=2099-01-01&times=09%3A00&day=31&shortMonth=skip
```

### Duplicate warning

Before saving an incoming setup, names are compared after Unicode NFC normalization,
trimming, collapsing whitespace and lowercasing. Schedules compare kind, start and end
dates, and the fields relevant to that kind. Times and weekdays are unordered sets;
intervals compare their hours and anchor; monthly schedules compare their day and,
for days 29–31, short-month policy. Type, instructions, alert mode and the link itself
are not part of the match. A matching item prompts the recipient to cancel or add a
separate item.

### Hosting and Android verification

The fallback source is `web/setup.html`, ready for Surge's clean `/setup` URL. It contains English and Spanish installation guidance and deliberately does not offer an APK until a release is available for distribution. Add the verified distribution URL when one is available. Do not publish setup links for the proposed domain until its control and association have been confirmed. Surge returned “project not found” on 28 November 2026; this does not establish that the name can be claimed or that we control it.

Claim and retain `ding-reminders.surge.sh` in the owner's Surge account, or select one replacement if it cannot be claimed. If the hostname changes, update the link generator, Android intent filter, parser, examples and hosting together. Publish the contents of `web/` to that domain. Build an `assetlinks.json` file at `web/.well-known/assetlinks.json` with the `delegate_permission/common.handle_all_urls` relation, package `com.myreminders`, and the SHA-256 certificate fingerprint of the actual APK being tested. Obtain that fingerprint with `"$ANDROID_HOME/build-tools/37.0.0/apksigner" verify --print-certs path/to/app.apk`. A production association must contain the distributed APK's signing fingerprint; do not publish the debug fingerprint as a substitute. A separate test hostname must contain the test APK's fingerprint. See [Android's website association guide](https://developer.android.com/training/app-links/configure-assetlinks).

After publishing, check `https://ding-reminders.surge.sh/.well-known/assetlinks.json` returns HTTP 200 directly over HTTPS, with `Content-Type: application/json`, and contains the intended package and certificate fingerprint. Confirm `/setup` serves the fallback with a synthetic query string. On a disposable Android installation, verify domain association with Android's App Links tools and open synthetic Reminder and Medicine links through Android's ordinary URL resolution on cold launch and while the app is running; uninstall the disposable app and verify the browser opens the fallback. Do not treat an explicitly targeted intent or simulated delivery as proof of verified resolution.

If the product is renamed or moves to a new domain, retain the original domain, HTTPS hosting and its association with the same application ID and the signing certificates of distributed updates. Continue accepting its setup links in the app so existing shared messages remain usable. Keep any new host aligned across generation, handling, fallback and association too.
