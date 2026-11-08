# Pill Reminder

An offline Android reminder app with medicine support, built with React Native, TypeScript and Kotlin. It supports Android 8.0 (API 26) and later. The current app name is **Pill Reminder**.

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
2. Build the APK with its JavaScript bundle from the repository root.

   ```sh
   cd android
   ./gradlew :app:assembleRelease
   cd ..
   ```

   On Windows, use `gradlew.bat` in place of `./gradlew`. This local build uses the template's debug signing key.

3. Install and open the app.

   ```sh
   adb install -r android/app/build/outputs/apk/release/app-release.apk
   adb shell am start -W -n com.pillreminder/.MainActivity
   ```

   If multiple devices are listed, add `-s <serial>` after `adb` in both commands. Check that **Pill Reminder** is visible. This APK runs independently of Metro.

## Develop and test

For live editing, run `npm start` in one terminal and `npm run android` in another with the phone connected. If the debug build cannot reach Metro over USB, run `adb reverse tcp:8081 tcp:8081` and reopen the app.

Run `npm run typecheck`, `npm run lint`, and `npm test -- --runInBand` to check the TypeScript project.

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
