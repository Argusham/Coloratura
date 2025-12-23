# Colourtura Mobile Build Guide

This guide provides step-by-step instructions for building and deploying the Colourtura React PWA as native iOS and Android apps using Capacitor.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Building for Production](#building-for-production)
- [Platform-Specific Instructions](#platform-specific-instructions)
- [Web3 Compatibility](#web3-compatibility)
- [Troubleshooting](#troubleshooting)
- [Known Limitations](#known-limitations)
- [React Native Migration Considerations](#react-native-migration-considerations)

## Overview

Colourtura is now configured to run as:
- **Web App**: Traditional Next.js web application
- **iOS App**: Native iOS app using Capacitor WebView
- **Android App**: Native Android app using Capacitor WebView

### Technology Stack

- **Framework**: Next.js 14 (Static Export)
- **Mobile Wrapper**: Capacitor 8.0
- **Web3**: Wagmi + Viem + RainbowKit
- **Blockchain**: Celo (Mainnet & Alfajores Testnet)
- **Build System**: PNPM + Turborepo

## Prerequisites

### For All Platforms

1. **Node.js** >= 18.0.0
2. **PNPM** >= 8.10.0
3. **Capacitor CLI** (installed as dev dependency)

### For iOS Development

1. **macOS** (required for iOS development)
2. **Xcode** >= 15.0
   - Install from App Store
   - Install Command Line Tools: `xcode-select --install`
3. **CocoaPods** (usually installed with Xcode)
   - If not: `sudo gem install cocoapods`
4. **iOS Simulator** or physical iOS device

### For Android Development

1. **Android Studio** (latest version)
2. **Android SDK** (API level 33 or higher recommended)
3. **Java Development Kit (JDK)** >= 17
4. **Android Emulator** or physical Android device

## Project Structure

```
apps/web/
├── src/                          # Next.js source code
│   ├── app/                      # Next.js App Router
│   ├── components/               # React components
│   │   └── capacitor-init.tsx    # Native plugin initialization
│   ├── hooks/                    # React hooks (including Web3)
│   └── lib/                      # Utilities and services
├── public/                       # Static assets
│   └── manifest.json             # PWA manifest
├── android/                      # Android native project
│   └── app/src/main/
│       ├── AndroidManifest.xml   # Android permissions & config
│       └── java/com/colourtura/app/
│           └── MainActivity.java # Android WebView config
├── ios/                          # iOS native project
│   └── App/App/
│       ├── Info.plist            # iOS permissions & config
│       └── AppDelegate.swift     # iOS app lifecycle
├── out/                          # Static export output (generated)
├── capacitor.config.ts           # Capacitor configuration
├── next.config.js                # Next.js configuration
└── package.json                  # Dependencies and scripts
```

## Development Workflow

### 1. Install Dependencies

From the root of the monorepo:

```bash
pnpm install
```

### 2. Web Development

Develop as a normal Next.js app:

```bash
# From apps/web/
pnpm dev
```

Open http://localhost:3000 in your browser.

### 3. Test Mobile Features

To test native features (haptics, status bar, etc.):

#### For iOS:

```bash
# From apps/web/
pnpm cap:build    # Build Next.js and sync with Capacitor
pnpm cap:open:ios # Open in Xcode
```

Then in Xcode:
1. Select a simulator or device
2. Click the Run button (⌘R)

#### For Android:

```bash
# From apps/web/
pnpm cap:build        # Build Next.js and sync with Capacitor
pnpm cap:open:android # Open in Android Studio
```

Then in Android Studio:
1. Select an emulator or device
2. Click the Run button (▶)

### 4. Live Reload During Development

For live reload on device/simulator:

```bash
# Terminal 1: Start Next.js dev server
pnpm dev

# Terminal 2: Run on device with dev server
pnpm cap:run:ios      # iOS
pnpm cap:run:android  # Android
```

**Note**: Update `capacitor.config.ts` to point to your dev server:

```typescript
server: {
  url: 'http://192.168.1.XXX:3000', // Your local IP
  cleartext: true
}
```

**IMPORTANT**: Remove `server.url` before production builds!

## Building for Production

### 1. Build the Web App

```bash
# From apps/web/
pnpm build
```

This generates a static export in the `out/` directory.

### 2. Sync with Capacitor

```bash
pnpm cap:sync
```

This copies the build to native projects and updates plugins.

### 3. Build Native Apps

#### iOS Production Build

```bash
pnpm cap:open:ios
```

In Xcode:
1. Select **Any iOS Device (arm64)**
2. Product → Archive
3. Follow App Store distribution workflow

#### Android Production Build

```bash
pnpm cap:open:android
```

In Android Studio:
1. Build → Generate Signed Bundle / APK
2. Choose Android App Bundle
3. Follow Google Play distribution workflow

## Platform-Specific Instructions

### iOS Configuration

#### App Icons

Add app icons in Xcode:
1. Open `ios/App/App/Assets.xcassets/AppIcon.appiconset`
2. Add icons in all required sizes (1024x1024 for App Store)

#### Splash Screen

1. Open `ios/App/App/Assets.xcassets/Splash.imageset`
2. Add splash screen images

#### Signing & Capabilities

In Xcode:
1. Select project → Signing & Capabilities
2. Select your team
3. Configure bundle identifier: `com.colourtura.app`

#### Info.plist Configuration

Already configured for Web3:
- ✅ App Transport Security (allows HTTP for Web3 providers)
- ✅ WKAppBoundDomains (Celo & WalletConnect)
- ✅ Camera permission (for QR code scanning)

### Android Configuration

#### App Icons

Replace icons in:
- `android/app/src/main/res/mipmap-*/ic_launcher.png`
- Use Android Studio's Image Asset tool

#### Splash Screen

Replace splash in:
- `android/app/src/main/res/drawable/splash.png`

#### Signing Configuration

Create `android/app/keystore.properties`:

```properties
storeFile=../my-release-key.keystore
storePassword=your_password
keyAlias=my-key-alias
keyPassword=your_password
```

#### AndroidManifest.xml Configuration

Already configured for Web3:
- ✅ Internet permission
- ✅ Network state access
- ✅ Hardware acceleration
- ✅ Cleartext traffic (for development)
- ✅ Wake lock & vibrate

#### MainActivity.java Configuration

Already configured with:
- ✅ JavaScript enabled
- ✅ DOM storage (required for Web3 wallets)
- ✅ Mixed content allowed
- ✅ Database enabled
- ✅ Hardware acceleration

## Web3 Compatibility

### Supported Features ✅

1. **Wallet Connections**
   - Injected wallets (MetaMask, MiniPay, etc.)
   - WalletConnect v2
   - RainbowKit UI

2. **Blockchain Interactions**
   - Smart contract calls
   - Transaction signing
   - Event listening
   - The Graph queries

3. **Celo-Specific**
   - MiniPay integration
   - cUSD payments
   - Celo Mainnet & Alfajores Testnet

### Potential Issues ⚠️

#### 1. MetaMask Mobile App

**Issue**: MetaMask SDK may expect React Native async storage.

**Warning in Build**:
```
Module not found: Can't resolve '@react-native-async-storage/async-storage'
```

**Impact**: Minimal - this is just a warning and doesn't affect browser-based MetaMask.

**Solution**: Use WalletConnect or MiniPay as primary options on mobile.

#### 2. Deep Linking

**Status**: Configured but not fully tested.

**Configuration**:
- Android: URL scheme configured in AndroidManifest
- iOS: URL types configured in Info.plist

**Testing Needed**: Verify wallet return flows after signing.

#### 3. Biometric Authentication

**Status**: Not implemented yet.

**Recommendation**: Consider adding @capacitor/biometric for enhanced security.

#### 4. Push Notifications

**Status**: Not implemented yet.

**Recommendation**: Add @capacitor/push-notifications for game event notifications.

### Testing Web3 Features

#### On Simulator/Emulator

1. **Install MetaMask Browser Extension** (doesn't work - no extensions in mobile browsers)
2. **Use WalletConnect**:
   - Click "Connect Wallet" in app
   - Scan QR code with MetaMask mobile app on physical device
   - Approve connection

#### On Physical Device

1. **Install MiniPay** (Celo's mobile wallet)
2. **Use Injected Provider**:
   - Open Colourtura in MiniPay browser
   - Connect wallet directly

## Troubleshooting

### Build Errors

#### "Failed to fetch font 'Inter' from Google Fonts"

**Solution**: Already fixed - using system fonts instead of Google Fonts.

#### "Could not find the android platform"

**Solution**: Install platform package:
```bash
pnpm add @capacitor/android @capacitor/ios
```

#### "sync could not run--missing out directory"

**Solution**: Run build first:
```bash
pnpm build
```

### Runtime Errors

#### White Screen on Launch

**Causes**:
1. Build output not synced
2. JavaScript errors
3. Content Security Policy issues

**Solution**:
```bash
pnpm cap:build  # Rebuild and sync
```

Enable debugging:
- **iOS**: Safari → Develop → [Simulator] → localhost
- **Android**: Chrome → chrome://inspect → Select device

#### Wallet Connection Fails

**Causes**:
1. window.ethereum not available
2. Network restrictions
3. Mixed content (HTTP/HTTPS)

**Solution**:
1. Check MainActivity.java has `setMixedContentMode(ALWAYS_ALLOW)`
2. Check Info.plist has `NSAllowsArbitraryLoads`
3. Test on physical device instead of simulator

#### App Crashes on Startup

**Check**:
1. Android logcat: `adb logcat`
2. iOS console: Xcode → Window → Devices and Simulators

### Performance Issues

#### Slow Canvas Rendering

**Cause**: Hardware acceleration disabled.

**Solution**: Already enabled in MainActivity.java:
```java
webSettings.setLayerType(View.LAYER_TYPE_HARDWARE, null);
```

#### Memory Leaks

**Check**: Use React DevTools Profiler to identify component issues.

## Known Limitations

### Capacitor WebView Limitations

1. **No Native Camera API**
   - QR scanning requires web-based solution
   - Consider @capacitor/camera plugin if needed

2. **Limited Offline Support**
   - Service workers work but have limitations
   - Consider native caching strategies

3. **WebView Performance**
   - Slightly slower than native
   - Complex animations may stutter

4. **Web3 Provider Compatibility**
   - Some wallet SDKs expect React Native
   - WalletConnect is most reliable

### Next.js Static Export Limitations

1. **No Server-Side Rendering**
   - All pages pre-rendered at build time
   - No dynamic API routes

2. **No Image Optimization**
   - Next.js Image component disabled
   - Use standard `<img>` tags

3. **No Incremental Static Regeneration**
   - Full rebuild required for updates

## React Native Migration Considerations

### When to Migrate to React Native

Consider migrating if you encounter:

1. **Critical Web3 Issues**
   - Wallet providers not working in WebView
   - Transaction signing failures
   - Provider detection issues

2. **Performance Problems**
   - Canvas game rendering too slow
   - UI interactions feel sluggish
   - Memory issues

3. **Feature Requirements**
   - Need native camera for QR scanning
   - Require biometric authentication
   - Need background processing

### Migration Path

If Capacitor doesn't meet requirements:

1. **Evaluate**: Test current Capacitor build thoroughly
2. **Document Issues**: List specific blockers
3. **Prototype**: Create React Native POC
4. **Compare**:
   - Development velocity
   - Web3 compatibility
   - Performance benchmarks
   - Maintenance burden

### Recommended React Native Stack

If migration is needed:

```
- Framework: React Native + Expo
- Web3: wagmi/viem with React Native polyfills
- Navigation: React Navigation
- UI: React Native Paper or Tamagui
- State: Same as web (TanStack Query)
```

## NPM Scripts Reference

```json
{
  "build": "next build",
  "cap:build": "next build && npx cap sync",
  "cap:sync": "npx cap sync",
  "cap:open:ios": "npx cap open ios",
  "cap:open:android": "npx cap open android",
  "cap:run:ios": "npx cap run ios",
  "cap:run:android": "npx cap run android",
  "cap:update": "npx cap update"
}
```

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Wagmi Documentation](https://wagmi.sh)
- [Celo Developer Docs](https://docs.celo.org)
- [WalletConnect v2](https://docs.walletconnect.com)

## Support

For issues specific to:
- **Capacitor**: Check [Capacitor GitHub](https://github.com/ionic-team/capacitor)
- **Next.js**: Check [Next.js GitHub](https://github.com/vercel/next.js)
- **Web3**: Check [Wagmi GitHub](https://github.com/wevm/wagmi)

---

**Last Updated**: December 2025
**Capacitor Version**: 8.0.0
**Next.js Version**: 14.2.33
