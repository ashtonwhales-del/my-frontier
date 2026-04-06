import { AD_UNIT_IDS } from '../../config/ads';

// react-native-google-mobile-ads is a native module — unavailable in Expo Go.
// This file uses a try/require pattern so the app never crashes in Expo Go,
// and automatically uses the real AdMob SDK in a dev build or production build.
let RNGMAModule: any = null;
try {
  RNGMAModule = require('react-native-google-mobile-ads');
} catch {
  // Running in Expo Go — native module not available
}

/**
 * Loads and shows a rewarded ad. Calls onRewarded() when the user earns the
 * reward. In Expo Go (no native module), immediately grants the reward so the
 * unlock flow still works during development. Fails silently on load errors.
 */
export function showRewardedAd(onRewarded: () => void): void {
  if (!RNGMAModule) {
    // Expo Go stub — immediately grant reward so unlock flow works in testing
    console.log('[RewardedAd] Native module unavailable (Expo Go) — granting reward immediately');
    onRewarded();
    return;
  }

  const { RewardedAd, RewardedAdEventType } = RNGMAModule;
  try {
    const ad = RewardedAd.createForAdRequest(AD_UNIT_IDS.rewarded, {
      requestNonPersonalizedAdsOnly: false,
    });
    const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      unsubscribeLoaded();
      ad.show().catch((err: unknown) => {
        console.warn('[RewardedAd] show() failed:', err);
      });
    });
    ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      onRewarded();
    });
    ad.addAdEventListener('error' as typeof RewardedAdEventType, (err: unknown) => {
      console.warn('[RewardedAd] Failed to load:', err);
    });
    ad.load();
  } catch (err) {
    console.warn('[RewardedAd] Unexpected error:', err);
  }
}
