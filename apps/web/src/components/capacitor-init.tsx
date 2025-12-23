'use client';

import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapacitorApp } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * CapacitorInit Component
 * Initializes Capacitor native plugins when the app loads
 * Handles status bar, splash screen, app lifecycle, and haptic feedback
 */
export function CapacitorInit() {
  useEffect(() => {
    const initializeCapacitor = async () => {
      try {
        // Check if running in native app (not browser)
        const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform();

        if (!isNative) {
          console.log('Running in browser - Capacitor plugins disabled');
          return;
        }

        console.log('Initializing Capacitor native features...');

        // Initialize Status Bar
        try {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#0A0A0A' });
          console.log('Status bar configured');
        } catch (error) {
          console.warn('Status bar initialization failed:', error);
        }

        // Hide Splash Screen after app is ready
        try {
          await SplashScreen.hide();
          console.log('Splash screen hidden');
        } catch (error) {
          console.warn('Splash screen hide failed:', error);
        }

        // Set up app lifecycle listeners
        try {
          // Handle app state changes
          CapacitorApp.addListener('appStateChange', ({ isActive }) => {
            console.log('App state changed. Is active:', isActive);
            if (isActive) {
              // App came to foreground
              console.log('App resumed');
            } else {
              // App went to background
              console.log('App paused');
            }
          });

          // Handle deep links
          CapacitorApp.addListener('appUrlOpen', (data) => {
            console.log('App opened with URL:', data.url);
            // Handle deep linking here if needed
            // Example: navigate to a specific route based on the URL
          });

          // Handle back button (Android)
          CapacitorApp.addListener('backButton', ({ canGoBack }) => {
            if (!canGoBack) {
              CapacitorApp.exitApp();
            } else {
              window.history.back();
            }
          });

          console.log('App lifecycle listeners configured');
        } catch (error) {
          console.warn('App lifecycle setup failed:', error);
        }

        // Test haptics (optional - remove if too intrusive)
        try {
          // Gentle vibration on app load
          await Haptics.impact({ style: ImpactStyle.Light });
          console.log('Haptics initialized');
        } catch (error) {
          console.warn('Haptics initialization failed:', error);
        }

      } catch (error) {
        console.error('Capacitor initialization error:', error);
      }
    };

    initializeCapacitor();

    // Cleanup listeners on unmount
    return () => {
      if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
        CapacitorApp.removeAllListeners();
      }
    };
  }, []);

  // This component doesn't render anything
  return null;
}

/**
 * Utility function to trigger haptic feedback
 * Can be called from anywhere in the app
 */
export const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Medium) => {
  try {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
  }
};

/**
 * Utility function to check if running in native app
 */
export const isNativeApp = (): boolean => {
  return typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform() === true;
};
