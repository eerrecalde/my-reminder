# Pill Reminder

An offline Android reminder app with medicine support, built with React Native, TypeScript and Kotlin. It supports Android 8.0 (API 26) and later. The current app name is **Pill Reminder**.

## Local setup

- Install Node.js 22.13+ (22.x), 24.3+ (24.x), or 26+, npm, and JDK 17. Set `JAVA_HOME` to the JDK.
- In Android Studio's SDK Manager, install Android SDK Platform 37.0 (Android 17), Build-Tools 37.0.0 and 36.0.0, Platform-Tools, NDK (Side by side) 27.1.12297006, and CMake 3.22.1. Accept the SDK licences in the SDK Manager.
- Set `ANDROID_HOME` to the SDK path shown in Android Studio and add `$ANDROID_HOME/platform-tools` to your `PATH`. On macOS, the usual SDK path is `$HOME/Library/Android/sdk`.
- Run `npm ci` from the repository root.

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
