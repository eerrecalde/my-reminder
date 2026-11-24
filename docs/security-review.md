# Focused private-distribution security review

Reviewed 24 November 2026 against the source and the locally available merged release manifest. This is a focused source and configuration review for private family distribution, not a penetration test or a complete vulnerability assessment. Revisit it when dependencies, release configuration or Android integration change.

## Findings and follow-up

| Finding | Risk and disposition |
| --- | --- |
| Release signing | The reviewed baseline signed release builds with the public debug key in `android/app/build.gradle`. Anyone with that key could sign an APK purporting to be this app. Do not distribute that build. Production-readiness ticket 01 owns private signing, certificate verification and update testing. |
| Dependency advisories not assessed | `npm audit --json` could not reach the npm registry from the sandbox. An escalated request was rejected because it would send the dependency metadata to the registry. No conclusion about npm vulnerabilities can be drawn. With permission to send the dependency metadata, run `npm audit` against the committed lockfile, assess applicability and fixes, and repeat before release. This does not cover Gradle dependencies; assess their resolved runtime dependency graph and advisories separately. |
| Notification privacy | `ReminderScheduler.notifyOccurrence` places the reminder name and, for Medicine, instructions in notifications. Android notification and lock-screen settings govern their visibility. The Alarm screen itself renders generic content while locked (`AlarmActivity`), but that is not a guarantee that a separate notification hides its content. People who need privacy should configure device notification visibility. Changing notification content needs a product decision and regression checks for reminder usability. |
| Local data | `MedicineRepository` stores names, instructions, schedules and outcomes in an app-private SQLite database, without application-level encryption. Preferences use `MODE_PRIVATE`, and the manifest disables Android backup. Device compromise, an unlocked device or privileged access can expose data; loss or removal of the installation can lose it. App-level encryption and recovery are outside this review's scope. |
| Exported recovery receiver | `RecoveryReceiver` is exported to receive system events and only acts on a fixed action allowlist; it does not consume external extras. It invokes recovery on the receiver thread. The impact of repeated externally delivered allowed actions and bounded recovery execution needs investigation alongside tickets 04–05. No claim is made that every listed system action can be spoofed on every supported Android version. |

## Reviewed controls and limits

- The app manifest requests internet, vibration, foreground media playback, notifications, full-screen intent, exact alarms and boot completion. The reviewed merged release manifest has cleartext traffic disabled. Internet permission remains present; the source search was not a network traffic test.
- The Alarm screen, reminder/action receivers and sound service are not exported. The launcher activity and recovery receiver are exported. The merged release manifest also includes AndroidX's exported `ProfileInstallReceiver`, guarded by `android.permission.DUMP`, and its non-exported startup provider. This inspection is not proof that every dependency component or platform version is free of issues.
- Reminder and action pending intents found in the scheduler and sound service use explicit component intents and `FLAG_IMMUTABLE`. This is a source inspection, not an adversarial runtime test.
- A search of app Kotlin and TypeScript source for `Log.`, `console.`, `printStackTrace` and `println` found no explicit logging calls. It does not establish what frameworks or the operating system may log.
- The release manifest examined was an existing local build artifact; check the merged manifest of the actual distributable after subsequent build changes. No physical-device privacy or attacker testing was performed for this review.

## Gradle and upgrades

With the README's JDK 17 and Android SDK, `cd android && ./gradlew help --warning-mode all` succeeded on Gradle 9.4.1. It reported app Groovy property-assignment deprecations slated for Gradle 10, the `android.builtInKotlin=false` and `android.newDsl=false` opt-outs slated for removal in Android Gradle Plugin 10, and obsolete variant APIs. It also reported deprecated assignments in `react-native-safe-area-context` and `react-native-svg`. The configuration-only `help` task cannot reveal every warning emitted by a full build.

Treat a Gradle/Android Gradle Plugin or React Native dependency upgrade as a separate focused compatibility change: check upstream support, remove local deprecated syntax where appropriate, and run the full Android and JavaScript checks. Do not perform an unreviewed bulk upgrade solely to silence warnings.
