/**
 * AdConfig.ts — Ad unit IDs and placement rules
 * TEST IDs for development. Replace with real AdMob IDs before App Store.
 */

export const AD_UNITS = {
  BANNER_RESULTS: 'ca-app-pub-3940256099942544/2934735716',
  BANNER_BUDGET: 'ca-app-pub-3940256099942544/2934735716',
  BANNER_DEBT: 'ca-app-pub-3940256099942544/2934735716',
  REWARDED_LEARNING_TIER: 'ca-app-pub-3940256099942544/5224354917',
  REWARDED_PORTFOLIO_SPEED: 'ca-app-pub-3940256099942544/5224354917',
  REWARDED_PDF_EXPORT: 'ca-app-pub-3940256099942544/5224354917',
  INTERSTITIAL_LOADING: 'ca-app-pub-3940256099942544/4411468910',
} as const;

export const AD_RULES = {
  MIN_INTERVAL_SECONDS: 120,
  MAX_BANNERS: 1,
  AD_FREE_SCREENS: ['Welcome', 'Onboarding', 'Disclaimer', 'Categories', 'RiskTolerance'] as const,
  COMMUNITY_AD_FREQUENCY: 5,
} as const;

export const AD_DEV_MODE = true; // Set false before App Store
