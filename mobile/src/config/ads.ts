/**
 * AdMob unit IDs — environment-aware.
 *
 * __DEV__ (Expo Go / Metro) → Google test IDs (safe to ship in source)
 * Production build          → Real unit IDs from your AdMob account
 *
 * AdMob App ID lives in app.json under expo.plugins["react-native-google-mobile-ads"].
 * Real unit IDs live here only — never hard-code them elsewhere.
 *
 * To find or create unit IDs: https://apps.admob.google.com
 */

// ── Google-provided test IDs (used automatically in __DEV__ mode) ────────────
const TEST_IDS = {
  banner:        'ca-app-pub-3940256099942544/2934735716',
  interstitial:  'ca-app-pub-3940256099942544/4411468910',
  rewarded:      'ca-app-pub-3940256099942544/1712485313',
  native:        'ca-app-pub-3940256099942544/2247696110',
};

// ── Real production unit IDs ─────────────────────────────────────────────────
// Replace each string with the real AdMob unit ID from your account once live.
const PROD_IDS = {
  banner:       'ca-app-pub-8834917370871405/1802113002',
  interstitial: 'ca-app-pub-8834917370871405/REPLACE_INTERSTITIAL_ID', // Replace with real AdMob unit ID from console.admob.google.com after app is live
  rewarded:     'ca-app-pub-8834917370871405/7349953152',
  native:       'ca-app-pub-8834917370871405/REPLACE_NATIVE_ID',        // Replace with real AdMob unit ID from console.admob.google.com after app is live
};

export const AD_UNIT_IDS = __DEV__ ? TEST_IDS : PROD_IDS;

// AdMob App ID (also set in app.json for native build)
// Same ID for iOS and Android — update if you create separate AdMob apps per platform.
export const ADMOB_APP_ID = 'ca-app-pub-8834917370871405~7924668226';
