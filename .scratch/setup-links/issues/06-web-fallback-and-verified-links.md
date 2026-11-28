# 06: Add the web fallback and verified links

**What to build:** A setup link can open the installed Android app through verified HTTPS links, or lead someone without the app to a Surge-ready page explaining installation and how to reopen the original link.

**Blocked by:** 01 — Open and review a one-time setup link.

**Status:** done

- [x] Check availability and control of the proposed `ding-reminders.surge.sh` hostname before using it in real setup links. If unavailable, choose a single replacement and keep link generation, Android handling and the fallback aligned to it. Use one hostname across English and Spanish.
- [x] Serve the static fallback at the shared setup URL. Use **Ding Reminders** in English copy and **Ding Recordatorios** in Spanish copy. Give installation guidance and tell recipients to reopen the original message link. Add the release APK link when one is available for distribution.
- [x] On the hosted verification address, confirm `/.well-known/assetlinks.json` is served as `application/json` directly over HTTPS and associates `com.myreminders` with the SHA-256 signing-certificate fingerprint of the APK under test. Use the distributed APK's fingerprint on the production host. [Android website association documentation](https://developer.android.com/training/app-links/configure-assetlinks)
- [x] Verify an installed disposable Android app opens the setup link on cold launch and while running, and an uninstalled device reaches the fallback page. Record the device or emulator and Android version and distinguish actual Android resolution from simulated delivery.
- [x] Document the chosen hostname, signing and hosting requirements, and how to keep the original domain and association working after a future rename. Use synthetic Reminder and Medicine details in test links and logs.
- [x] Keep production APK distribution, Play Store publication and automatic continuation through installation as separate release work.

## Comments

- Claimed and published `ding-reminders.surge.sh`, including the release-certificate association. On the disposable Android 16 `pill_reminder_test` emulator, Android verified the host and resolved synthetic links to the installed app on cold launch and while running. After uninstalling the app, Chrome opened and the user confirmed the fallback page appeared. See `docs/setup-links.md` for verification and hosting details. Production APK distribution remains separate.
