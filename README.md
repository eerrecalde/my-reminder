# My Reminders

An offline Android reminder app with medicine support, built with React Native, TypeScript and Kotlin. It supports Android 8.0 (API 26) and later. The current app name is **My Reminders**.

My Reminders uses a new Android application ID and installs separately from the previous app. It starts with no reminders; the old app and its reminders remain on the device until removed separately.

## Local setup

- Install Node.js 22.13+ (22.x), 24.3+ (24.x), or 26+, npm, and JDK 17. Set `JAVA_HOME` to the JDK.
- In Android Studio's SDK Manager, install Android SDK Platform 37.0 (Android 17), Build-Tools 37.0.0 and 36.0.0, Platform-Tools, NDK (Side by side) 27.1.12297006, and CMake 3.22.1. Accept the SDK licences in the SDK Manager.
- Set `ANDROID_HOME` to the SDK path shown in Android Studio and add `$ANDROID_HOME/platform-tools` to your `PATH`. On macOS, the usual SDK path is `$HOME/Library/Android/sdk`.
- Run `npm ci` from the repository root.

On Emiliano's Mac, the existing JDK 17 is at `~/Library/Android/jdk17`. For Android builds and tests in a shell where `JAVA_HOME` is not already set, use:

```sh
export JAVA_HOME="$HOME/Library/Android/jdk17"
export ANDROID_HOME="$HOME/Library/Android/sdk"
```

See the [React Native environment guide](https://reactnative.dev/docs/set-up-your-environment) for platform-specific setup. Use the SDK versions listed above for this repository.

## Build and check on a phone

1. Enable Developer options and USB debugging on an Android 8.0+ phone. Connect it with a USB data cable, unlock it, and accept the debugging prompt. Run `adb devices` and check that the phone is listed as `device`.
2. Set up release signing as described below, then build the APK with its JavaScript bundle from the repository root.

   ```sh
   cd android
   ./gradlew :app:assembleRelease
   cd ..
   ```

   On Windows, use `gradlew.bat` in place of `./gradlew`. A release build fails if its signing credentials are missing or its keystore is inside the repository. Debug builds do not require these credentials.

3. Install and open the app.

   ```sh
   adb install -r android/app/build/outputs/apk/release/app-release.apk
   adb shell am start -W -n com.myreminders/.MainActivity
   ```

   If multiple devices are listed, add `-s <serial>` after `adb` in both commands. Check that **My Reminders** is visible. This APK runs independently of Metro.

## Private release signing and distribution

Emiliano owns the release key. Keep the keystore outside this repository, restrict access to it and store its passwords and alias in a password manager. Generate a dedicated key once with JDK 17, for example `keytool -genkeypair -v -keystore /secure/path/my-reminders.keystore -alias my-reminders -keyalg RSA -keysize 4096 -validity 10000`; keytool prompts for passwords and identity. Do not use the checked-in debug key or a disposable test key for family releases. Keep an encrypted backup of the keystore, its passwords and alias in a separate secure location under Emiliano's control. Test restoration to another protected location and compare the restored certificate fingerprint with the original using `keytool -list -v -keystore /secure/path/my-reminders.keystore -alias my-reminders`.

In the build shell set `MY_REMINDERS_KEYSTORE` to the absolute path of the keystore and `MY_REMINDERS_KEY_ALIAS` to its alias. Supply `MY_REMINDERS_STORE_PASSWORD` and `MY_REMINDERS_KEY_PASSWORD` securely (for example, read them without echo into shell variables, then export them); do not put passwords in command history, project files, logs or CI. Run the release build above. Clear these environment variables afterwards. If a build fails, do not distribute an APK left over from an earlier build.

Before distributing, verify the actual APK with `"$ANDROID_HOME/build-tools/37.0.0/apksigner" verify --verbose --print-certs android/app/build/outputs/apk/release/app-release.apk` and compare its SHA-256 certificate fingerprint with the recorded release-key fingerprint. Keep that fingerprint alongside the encrypted backup, separately from the passwords. Share the verified APK privately with family. Increase `versionCode` in `android/app/build.gradle` for each distributed update and update `versionName` as appropriate. Subsequent APKs must keep the same application ID and signing key to install as updates and retain reminders and schedules. A lost key prevents ordinary same-key updates; restore it from the encrypted backup. A build signed with the debug key or a different key cannot update an installation signed with the release key.

## Develop and test

For live editing, run `npm start` in one terminal and `npm run android` in another with the phone connected. If the debug build cannot reach Metro over USB, run `adb reverse tcp:8081 tcp:8081` and reopen the app.

Run `npm run typecheck`, `npm run lint`, and `npm test -- --runInBand` to check the TypeScript project.
Jest runs in the `Europe/London` time zone so the daylight-saving schedule tests run consistently on every host.

GitHub Actions runs TypeScript, ESLint, Jest and translation checks on pushes and pull requests. A separate job uses Node 22, JDK 17 and the SDK components listed above to run Android unit tests and assemble a debug APK. These checks need no release signing credentials. Emulator instrumentation, physical-device checks and release signing verification remain separate from routine CI; see the sections below and the release instructions.

Translations are maintained in `src/translations/en.json` and `src/translations/es.json`. After changing them, run `npm run translations:generate` to update Android resources and `npm run translations:check` to check completeness and generated output. Release builds also run this check. English is the fallback for missing text.

## Routine Android tests

Use a disposable Android emulator for day-to-day Android changes. The emulator tests can install or replace the app and change its permissions, alarms and data; reserve the `pill_reminder_test` virtual device for disposable test data. Never run the instrumentation suite against a phone containing data to keep.

Create an Android 36 Google APIs virtual device named `pill_reminder_test` in Android Studio's Device Manager (use an ARM64 image on Apple Silicon). With the SDK and JDK configured as above, start it and identify its serial:

```sh
"$ANDROID_HOME/emulator/emulator" -avd pill_reminder_test
"$ANDROID_HOME/platform-tools/adb" devices -l
```

In another terminal, run the test script with the emulator serial shown by `adb`:

```sh
ANDROID_SERIAL=emulator-5554 ./scripts/test-android-emulator.sh
```

The script checks both the serial and virtual-device name, builds the app and test APKs, installs them on that emulator only, enables reminder permissions there, and runs instrumentation. It reports a failed or incomplete test as an error. The recovery test requires the test installation to have no saved reminders. A disposable emulator can be reset using Device Manager if necessary; resetting deletes its data.

The emulator is suitable for routine UI, storage, permission, scheduling and recovery checks, but simulated delivery and recovery are not proof of real phone behaviour. Physical-device checks are grouped at the [daily-use checkpoint](.scratch/pill-reminder/issues/06b-daily-use-device-checkpoint.md) and the [private-test checkpoint](.scratch/pill-reminder/issues/12-private-android-test.md).
