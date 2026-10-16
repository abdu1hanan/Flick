# Flick — ReelCounter

A minimal, local-first Android app that counts Instagram Reels automatically using Android's AccessibilityService.

## Features

- **Floating island** — live session counter above Instagram
- **Home-screen widget** — daily total at a glance  
- **Dashboard** — today, weekly, historical stats + session breakdown  
- **100% local** — no accounts, no cloud, no analytics

---

## Requirements

- Node.js ≥ 20
- Android Studio Hedgehog 2023.1.1+ with SDK 35
- JDK 17 (Temurin recommended)
- Physical Android device (API 26+) with Instagram installed
- ADB connected

---

## Setup & Development Build

```bash
# Install JS dependencies
npm install

# Generate native Android project
npx expo prebuild --platform android --clean

# Run dev build on device
npx expo run:android
```

---

## Release APK

### 1. Generate keystore (one-time)

```bash
keytool -genkey -v \
  -keystore reelcounter.keystore \
  -alias reelcounter \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass reelcounter123 -keypass reelcounter123 \
  -dname "CN=ReelCounter, OU=Personal, O=Personal, L=Local, ST=Local, C=US"
```

### 2. Build release APK

```bash
cd android && ./gradlew assembleRelease
```

APK output: `android/app/build/outputs/apk/release/app-release.apk`

### 3. Install on device

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## After Adding Native Changes

The config plugin (`plugins/withReelCounter.ts`) handles all native file injection.  
Safe to re-run at any time:

```bash
npx expo prebuild --platform android --clean
```

---

## OEM Battery Restrictions

On some devices (Xiaomi, Huawei, OPPO, Samsung), aggressive battery optimisation may kill the AccessibilityService.

**Fix:** Go to Settings → Battery → App launch → Flick → Manage manually → Enable Auto-launch.

Exact steps vary by manufacturer and Android version.

---

## Accessibility Event Observations

> ⚠️ **TODO (Phase 3, Task 3.2):** Complete this section after physical-device calibration.

Run `adb logcat -s "ReelCounter"` with `LOG_EVENTS = true` in `ReelAccessibilityService.kt`,
then scroll through Instagram Reels and capture the event stream. Record:

- Which event types fire on reel swipe
- Which view IDs appear in the Reels surface
- Which view IDs appear in feed/stories/DMs (for negative filtering)

Update string constants in `ReelsDetector.kt` and `NavigationDetector.kt` to match.

---

## Known Limitations

1. **Detection accuracy ≈ 85–95%** — Instagram does not expose stable reel IDs via accessibility.
2. **Instagram version dependent** — View ID heuristics may need updating after major Instagram releases. Only update `REELS_VIEW_ID_SUBSTRINGS` in `ReelsDetector.kt`.
3. **Emulator insufficient** — Instagram accessibility events only work on physical devices.

---

## Project Structure

```
app/              → Expo Router screens
components/       → Reusable UI components
constants/        → Color, spacing, typography tokens
hooks/            → Data and event hooks
modules/reelcounter-native/
  src/            → TypeScript interface
  android/        → Kotlin source (copied to android/ by config plugin)
assets/native/    → XML/drawable resources (copied by config plugin)
plugins/          → Expo config plugin
types/            → Shared TypeScript types
```

---

## Privacy

All data is stored locally in a Room database on your device.  
No data is ever transmitted to any server, cloud service, or third party.  
The AccessibilityService only observes navigation events from Instagram — no content, captions, usernames, messages, or media are read or stored.
