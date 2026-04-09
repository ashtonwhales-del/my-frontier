import { Alert } from 'react-native';
import { AD_UNIT_IDS } from '../../config/ads';
import { DEV_MODE } from '../../services/premiumService';

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
  if (DEV_MODE) {
    // DEV_MODE: show visible placeholder so dev can see the ad flow
    Alert.alert(
      'Ad Would Play Here',
      'In production this shows a full-screen ad before building your portfolio.',
      [{ text: 'OK', onPress: onClosed }],
    );
    return;
  }

  if (!RNGMAModule) {
    // Expo Go: show visible placeholder
    Alert.alert(
      'Ad Would Play Here',
      'In production this shows a full-screen ad. Tap OK to continue.',
      [{ text: 'OK', onPress: onClosed }],
    );
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
