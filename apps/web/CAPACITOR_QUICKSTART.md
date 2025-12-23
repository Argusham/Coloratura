# Capacitor Quick Start Guide

Quick reference for common Capacitor tasks with Colourtura.

## 🚀 Initial Setup (One-time)

```bash
# From apps/web/
pnpm install
```

## 📱 Development Workflow

### Web Development (Recommended for most development)

```bash
pnpm dev
# Open http://localhost:3000
```

### iOS Development

```bash
# Build and open in Xcode
pnpm cap:build
pnpm cap:open:ios

# Or run directly on device/simulator
pnpm cap:run:ios
```

### Android Development

```bash
# Build and open in Android Studio
pnpm cap:build
pnpm cap:open:android

# Or run directly on device/emulator
pnpm cap:run:android
```

## 🔄 Common Commands

```bash
# After changing web code
pnpm build             # Build Next.js
pnpm cap:sync          # Copy to native projects

# Combined (recommended)
pnpm cap:build         # Build + sync in one command

# Update Capacitor plugins
pnpm cap:update

# Add new plugins
pnpm add @capacitor/camera  # Example
npx cap sync                # Sync to native
```

## 🛠️ Troubleshooting

### White screen on app launch
```bash
pnpm cap:build  # Rebuild and sync
```

### Changes not appearing
```bash
# Make sure you synced after building
pnpm build
pnpm cap:sync
```

### Build errors
```bash
# Clean and rebuild
rm -rf out/ .next/
pnpm build
pnpm cap:sync
```

### iOS pod install issues
```bash
cd ios/App
pod install
cd ../..
```

### Android Gradle issues
```bash
cd android
./gradlew clean
cd ..
```

## 📦 Adding Native Features

### Example: Add Camera Plugin

```bash
# 1. Install plugin
pnpm add @capacitor/camera

# 2. Sync to native projects
npx cap sync

# 3. Use in code
import { Camera } from '@capacitor/camera';

const photo = await Camera.getPhoto({
  quality: 90,
  allowEditing: false,
  resultType: CameraResultType.Uri
});
```

## 🔍 Debugging

### iOS
```bash
# Open Safari
Safari → Develop → [Device Name] → localhost
```

### Android
```bash
# Open Chrome
chrome://inspect
# Select your device
```

### Logs
```bash
# iOS (if using Xcode)
# View in Xcode console

# Android
adb logcat | grep -i capacitor
```

## 📝 Important Files

```
capacitor.config.ts          # Capacitor configuration
next.config.js               # Next.js config (output: 'export')
src/components/capacitor-init.tsx  # Native plugin initialization
android/app/src/main/AndroidManifest.xml  # Android permissions
ios/App/App/Info.plist       # iOS permissions
```

## 🎯 Production Build

### iOS (App Store)
```bash
pnpm cap:build
pnpm cap:open:ios
# In Xcode: Product → Archive
```

### Android (Google Play)
```bash
pnpm cap:build
pnpm cap:open:android
# In Android Studio: Build → Generate Signed Bundle
```

## 📚 Full Documentation

- [MOBILE_BUILD.md](./MOBILE_BUILD.md) - Complete build guide
- [WEB3_COMPATIBILITY.md](./WEB3_COMPATIBILITY.md) - Web3 technical details

## 🆘 Need Help?

1. Check [MOBILE_BUILD.md](./MOBILE_BUILD.md) troubleshooting section
2. Check [Capacitor Docs](https://capacitorjs.com/docs)
3. Check build logs for specific errors
