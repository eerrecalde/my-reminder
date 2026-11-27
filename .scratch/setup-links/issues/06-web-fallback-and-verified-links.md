# 06: Add the web fallback and verified links

**What to build:** A setup link can open the installed Android app through verified HTTPS links, or lead someone without the app to a Surge-ready page explaining installation and how to reopen the original link.

**Blocked by:** 01 — Open and review a one-time setup link.

**Status:** ready-for-agent

- [ ] Provide a static fallback page with clear installation guidance and instructions to reopen the original message link; support a release APK link when one is available without implying that an APK is already published.
- [ ] Prepare the Android app and site association for a Surge HTTPS subdomain; verify the association file is available at the required path without redirects and matches the relevant signing certificate on a hosted test address.
- [ ] Verify an installed disposable Android app opens the setup link on cold launch and while running, and an uninstalled device reaches the fallback page. Record the device or emulator and Android version and distinguish actual Android resolution from simulated delivery.
- [ ] Document the chosen or provisional hostname, signing and hosting requirements, and the need to retain the original domain and association after an app rename. Do not expose real Reminder or Medicine details in test links or logs.
- [ ] Keep production APK distribution, Play Store publication and automatic continuation through installation as separate release work.
