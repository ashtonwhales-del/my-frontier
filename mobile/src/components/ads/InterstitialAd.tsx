import { AD_UNIT_IDS } from '../../config/ads';

// react-native-google-mobile-ads is a native module — unavailable in Expo Go.
let RNGMAModule: any = null;
try {
  RNGMAModule = require('react-native-google-mobile-ads');
} catch {
  // Running in Expo Go — native module not available
}

/**
 * Loads and shows an interstitial ad. Calls onClosed() when the user
 * dismisses the ad, or immediately if the ad fails to load / running in Expo Go.
 */
export function showInterstitialAd(onClosed: () => void): void {
  if (!RNGMAModule) {
    // Expo Go stub — immediately call onClosed so the app is never blocked
    console.log('[InterstitialAd] Native module unavailable (Expo Go) — skipping ad');
    onClosed();
    return;
  }

  const { InterstitialAd, AdEventType } = RNGMAModule;
  try {
    const ad = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial, {
      requestNonPersonalizedAdsOnly: false,
    });
    const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      unsubscribeLoaded();
      ad.show().catch((err: unknown) => {
        console.warn('[InterstitialAd] show() failed:', err);
        onClosed();
      });
    });
    ad.addAdEventListener(AdEventType.CLOSED, () => { onClosed(); });
    ad.addAdEventListener(AdEventType.ERROR, (err: unknown) => {
      console.warn('[InterstitialAd] Failed to load:', err);
      onClosed();
    });
    ad.load();
  } catch (err) {
    console.warn('[InterstitialAd] Unexpected error:', err);
    onClosed();
  }
}
