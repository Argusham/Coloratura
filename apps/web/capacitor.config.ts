import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.colourtura.app',
  appName: 'Colourtura',
  webDir: 'out',
  server: {
    // Allow localhost connections for development
    androidScheme: 'https',
    // Enable cleartext traffic for local development (can be disabled in production)
    cleartext: true,
  },
  // iOS specific configuration
  ios: {
    contentInset: 'automatic',
  },
  // Android specific configuration
  android: {
    // Allow mixed content for Web3 providers
    allowMixedContent: true,
    // Capture back button for navigation
    captureInput: true,
    // Enable WebView debugging in development
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    // Status bar configuration
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0A0A0A',
    },
    // Splash screen configuration
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0A0A0A',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;
