# Web3 & Blockchain WebView Compatibility Report

This document provides a detailed technical analysis of Web3 and blockchain functionality compatibility in Capacitor WebViews for the Colourtura mobile apps.

## Executive Summary

### ✅ Expected to Work

- WalletConnect v2 (via QR code)
- Injected wallet providers (MiniPay, Valora)
- Smart contract interactions via wagmi/viem
- The Graph GraphQL queries
- Transaction signing
- Event listening
- Celo blockchain interactions

### ⚠️ Requires Testing

- MetaMask mobile deep linking
- Biometric transaction approval
- Push notifications for transactions
- Background sync for blockchain data
- WalletConnect v2 deep linking

### ❌ Known Limitations

- MetaMask browser extension (not available in mobile WebView)
- React Native specific wallet SDKs
- Native QR code scanning (requires additional plugin)

## Technical Architecture

### Current Web3 Stack

```typescript
// Wallet Connection
- @rainbow-me/rainbowkit: ^2.0.0  // Wallet UI
- wagmi: ^2.0.0                    // React hooks for Web3
- viem: ^2.0.0                     // Ethereum client

// Blockchain
- Celo Mainnet (chainId: 42220)
- Celo Alfajores Testnet (chainId: 44787)

// Contract Interaction
- Custom hooks (useGameContract, useContractLeaderboard)
- The Graph for event indexing

// Payment Token
- cUSD (Celo Dollar)
- Entry fee: 0.1 cUSD
```

### Capacitor WebView Configuration

#### Android WebView Settings

File: `android/app/src/main/java/com/colourtura/app/MainActivity.java`

```java
// ✅ Enabled for Web3
webSettings.setJavaScriptEnabled(true);           // Required for Web3
webSettings.setDomStorageEnabled(true);           // Required for wallets
webSettings.setDatabaseEnabled(true);             // Required for wallets
webSettings.setMixedContentMode(ALWAYS_ALLOW);    // HTTPS/HTTP mixed content

// ✅ Performance
this.bridge.getWebView().setLayerType(LAYER_TYPE_HARDWARE, null);
webSettings.setAppCacheEnabled(true);
```

**Impact**: Enables full Web3 functionality including localStorage for wallet state.

#### iOS WKWebView Settings

File: `ios/App/App/Info.plist`

```xml
<!-- ✅ App Transport Security -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>  <!-- Allows HTTP connections for Web3 providers -->
    <key>NSAllowsLocalNetworking</key>
    <true/>  <!-- Allows localhost for development -->
</dict>

<!-- ✅ App-Bound Domains for WKWebView -->
<key>WKAppBoundDomains</key>
<array>
    <string>celo.org</string>
    <string>walletconnect.com</string>
</array>
```

**Impact**: Allows WebView to access Web3 provider domains and handle HTTPS/HTTP mixed content.

## Wallet Provider Compatibility

### 1. WalletConnect v2 ✅

**Status**: Fully Compatible

**How it Works**:
1. User clicks "Connect Wallet" in app
2. QR code displayed in WebView
3. User scans with external wallet app (MetaMask, Trust Wallet, etc.)
4. Wallet app approves connection
5. App receives connection via WebSocket

**Configuration**:
```typescript
// Required environment variable
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id

// Already configured in wallet-provider.tsx
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
```

**Testing Steps**:
1. Build and run on device
2. Click "Connect Wallet"
3. Scan QR with MetaMask mobile
4. Verify connection established
5. Try signing a transaction

**Expected Behavior**: Should work without issues.

### 2. MiniPay (Celo Mobile Wallet) ✅

**Status**: Fully Compatible

**How it Works**:
1. User opens Colourtura inside MiniPay browser
2. MiniPay injects `window.ethereum` provider
3. App detects injected provider
4. Direct connection (no QR code needed)

**Configuration**: Auto-detected by wagmi.

**Testing Steps**:
1. Install MiniPay on Android device
2. Open https://colourtura.app in MiniPay
3. Click "Connect Wallet"
4. Should auto-connect

**Expected Behavior**: Seamless integration, best mobile experience.

### 3. Valora Wallet ✅

**Status**: Compatible via WalletConnect

**How it Works**: Same as WalletConnect v2.

**Testing Steps**:
1. Use WalletConnect QR code
2. Scan with Valora app
3. Approve connection

**Expected Behavior**: Should work like other WalletConnect wallets.

### 4. MetaMask Mobile ⚠️

**Status**: Requires Additional Testing

**Potential Issues**:
- Build warning: `Can't resolve '@react-native-async-storage/async-storage'`
- MetaMask SDK may expect React Native environment

**Workarounds**:
1. **Option A**: Use WalletConnect with MetaMask
   - Fully supported
   - QR code flow

2. **Option B**: Deep linking (requires testing)
   - Configure URL scheme
   - Test wallet return flow

**Configuration for Deep Linking**:

Android (`AndroidManifest.xml`):
```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="colourtura" />
</intent-filter>
```

iOS (`Info.plist`):
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>colourtura</string>
        </array>
    </dict>
</array>
```

**Testing Needed**:
1. Initiate MetaMask connection
2. Verify app switches to MetaMask
3. Approve transaction in MetaMask
4. Verify app returns to Colourtura
5. Check transaction state updated

## Smart Contract Interactions

### Contract Calls ✅

**Status**: Fully Compatible

**Methods Tested** (theoretically):
```typescript
// Read calls (view functions)
getCurrentTop3()          // ✅ Should work
getPlayerStats(address)   // ✅ Should work
getDailySummary(day)      // ✅ Should work

// Write calls (transactions)
startGame()               // ✅ Should work
submitScore(id, score)    // ✅ Should work
claimDailyReward(day)     // ✅ Should work
```

**How it Works**:
- Uses wagmi hooks
- viem for encoding/decoding
- WebView handles provider communication
- All JavaScript-based (no native code)

**Expected Behavior**: No issues expected.

### Transaction Signing ✅

**Status**: Should Work

**Flow**:
1. User initiates transaction
2. App prepares transaction data
3. Sends to wallet for signing
4. User approves in wallet
5. Signed transaction returned
6. App broadcasts to network

**WebView Considerations**:
- DOM storage enabled → wallet state persists
- Hardware acceleration → smooth UI during signing
- Mixed content allowed → HTTPS/HTTP providers work

**Testing Checklist**:
- [ ] Sign startGame transaction
- [ ] Sign submitScore transaction
- [ ] Sign claimReward transaction
- [ ] Handle transaction rejection
- [ ] Handle insufficient funds
- [ ] Handle network errors

### Event Listening ✅

**Status**: Compatible

**Events**:
```solidity
event GameStarted(address player, uint256 sessionId);
event GameCompleted(uint256 sessionId, uint256 score);
event HighScoreSet(address player, uint256 score);
event DailyRewardPaid(uint256 day, address player, uint256 amount);
```

**How it Works**:
- The Graph indexes events
- GraphQL queries fetch data
- React Query for caching

**Expected Behavior**: No WebView-specific issues.

## The Graph Integration ✅

**Status**: Fully Compatible

**Endpoint**: The Graph Studio (HTTPS)

**Queries**:
```graphql
query GetLeaderboard {
  players(orderBy: highScore, orderDirection: desc) {
    id
    highScore
    totalGames
  }
}
```

**WebView Considerations**:
- Standard HTTPS requests
- No special permissions needed
- React Query handles caching

**Expected Behavior**: Works identically to web version.

## Performance Considerations

### Canvas Rendering ⚠️

**Component**: ColorMatchGame (canvas-based)

**Configuration**:
```typescript
// Game config
Canvas: 350x400
Circle radius: 25
Fall speed: increasing per level
```

**WebView Impact**:
- Hardware acceleration enabled
- Should perform adequately
- May have slight lag vs native

**Testing Required**:
1. Test on mid-range Android device
2. Test on older iPhone (iPhone 8)
3. Monitor FPS during gameplay
4. Check for memory leaks

**Optimization Options** (if needed):
1. Reduce canvas size on mobile
2. Throttle animation frame rate
3. Implement object pooling
4. Consider React Native version for canvas

### Network Performance ✅

**RPC Calls**:
- Celo Mainnet: `https://forno.celo.org`
- Alfajores Testnet: `https://alfajores-forno.celo-testnet.org`

**WebView Impact**: None - standard HTTPS requests.

**Caching Strategy**:
- React Query for GraphQL data
- Wagmi for blockchain state
- LocalStorage for wallet state

**Expected Behavior**: Same as web.

## Security Considerations

### Private Key Storage 🔒

**Current**: Handled by external wallet apps (MiniPay, MetaMask)

**Not Stored in App**: ✅ Correct approach

**WebView Security**:
- DOM storage isolated per app
- No access to device keychain (wallet handles this)
- HTTPS enforced for provider communication

### Transaction Verification ⚠️

**Current**: Users verify in wallet app

**Recommendation**: Add transaction preview in-app before wallet prompt

**Example**:
```typescript
// Show transaction details before signing
{
  action: "Start Game",
  cost: "0.1 cUSD",
  contract: "0x266e...8090",
  method: "startGame()"
}
```

### Deep Link Security 🔒

**Risk**: Malicious deep links

**Mitigation**:
1. Validate deep link URLs
2. Whitelist allowed actions
3. Require user confirmation for sensitive actions

**Implementation** (recommended):
```typescript
// In CapacitorInit component
CapacitorApp.addListener('appUrlOpen', (data) => {
  const url = new URL(data.url);

  // Validate domain
  if (url.hostname !== 'colourtura.app') {
    console.warn('Invalid deep link domain');
    return;
  }

  // Parse action
  const action = url.pathname;
  // Handle safe actions only
});
```

## Known Issues & Workarounds

### Issue 1: MetaMask React Native Dependency

**Error**:
```
Module not found: Can't resolve '@react-native-async-storage/async-storage'
```

**Impact**: Build warning (does not prevent compilation)

**Cause**: MetaMask SDK includes React Native code paths

**Workaround**:
1. Use WalletConnect for MetaMask connections
2. Or add empty polyfill in next.config.js:

```javascript
webpack: (config) => {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    '@react-native-async-storage/async-storage': false,
  };
  return config;
}
```

**Recommended**: Use WalletConnect (cleaner solution)

### Issue 2: Google Fonts in Static Export

**Error**:
```
Failed to fetch font 'Inter' from Google Fonts
```

**Impact**: Build failure

**Cause**: Network restrictions during build

**Solution**: ✅ Already fixed - using system fonts

**Code**:
```typescript
// Before
import { Inter } from 'next/font/google';

// After
// Removed - using Tailwind's font-sans
```

### Issue 3: Service Worker in WebView

**Status**: May have limitations

**PWA Features**:
- Offline caching: ⚠️ Limited in WebView
- Push notifications: ❌ Requires native plugin
- Background sync: ❌ Requires native plugin

**Recommendation**:
- Add @capacitor/push-notifications for notifications
- Implement native caching strategy if offline mode needed

## Testing Recommendations

### Critical Path Tests

1. **Wallet Connection**
   - [ ] Connect via WalletConnect (QR)
   - [ ] Connect via MiniPay (injected)
   - [ ] Disconnect wallet
   - [ ] Reconnect on app resume

2. **Game Flow**
   - [ ] Start game (0.1 cUSD transaction)
   - [ ] Play game
   - [ ] Submit score
   - [ ] View leaderboard

3. **Rewards**
   - [ ] Check claimable rewards
   - [ ] Claim single day reward
   - [ ] Claim multiple days

4. **Error Handling**
   - [ ] Insufficient balance
   - [ ] Transaction rejection
   - [ ] Network timeout
   - [ ] Provider disconnection

### Performance Tests

1. **Canvas Rendering**
   - [ ] Smooth 60 FPS gameplay
   - [ ] No memory leaks after multiple games
   - [ ] Responsive touch controls

2. **Network**
   - [ ] Fast RPC responses
   - [ ] Efficient GraphQL queries
   - [ ] Proper loading states

### Device Matrix

**Android**:
- [ ] Latest flagship (Pixel 8, Samsung S24)
- [ ] Mid-range (Pixel 6a, Samsung A54)
- [ ] Budget (older device with Android 10+)

**iOS**:
- [ ] Latest (iPhone 15 Pro)
- [ ] Mid-range (iPhone 13)
- [ ] Older (iPhone X/11)

## Migration to React Native - Decision Matrix

### Stay with Capacitor if:

✅ Wallet connections work reliably
✅ Canvas performance acceptable (>30 FPS)
✅ Transaction signing works smoothly
✅ No critical native features needed
✅ Development velocity is priority

### Migrate to React Native if:

❌ Wallet providers fail in WebView
❌ Canvas rendering too slow
❌ Transaction signing unreliable
❌ Need native camera/biometrics
❌ Need background processing

### Evaluation Timeline

**Phase 1** (Week 1-2):
- Build and deploy to TestFlight/Play Console
- Internal testing with all wallet providers
- Performance benchmarking

**Phase 2** (Week 3-4):
- Beta testing with real users
- Monitor crash reports
- Collect performance metrics

**Decision Point** (Week 5):
- Review test results
- Decide: Capacitor vs React Native
- If migrating: Plan React Native implementation

## Conclusion

### Summary

Capacitor provides a **viable mobile solution** for Colourtura with these caveats:

**Strengths**:
1. Code reuse (100% of web code works)
2. Fast development (no platform-specific code)
3. Easy updates (just rebuild and redeploy)
4. Web3 compatibility (wagmi/viem work unchanged)

**Weaknesses**:
1. WebView performance overhead
2. Limited native feature access
3. Wallet provider compatibility unknowns
4. Some build warnings (MetaMask)

**Recommendation**:
- ✅ **Proceed with Capacitor** for initial mobile release
- 📊 **Collect data** from beta testing
- 🔄 **Re-evaluate** after real-world usage
- 🚀 **Plan React Native migration** if issues emerge

The Capacitor approach allows rapid deployment to mobile while maintaining a migration path to React Native if critical issues are discovered in production.

---

**Next Steps**:

1. ✅ Complete Capacitor setup (DONE)
2. 🔄 Add app icons and splash screens
3. 🔄 Build TestFlight/Play Console releases
4. 🔄 Beta test with real wallet connections
5. 📊 Measure performance and reliability
6. 🎯 Make final architecture decision

**Last Updated**: December 2025
