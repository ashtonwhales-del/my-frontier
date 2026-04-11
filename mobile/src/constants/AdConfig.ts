/**
 * AdConfig.ts — Ad unit IDs and placement rules
 * Real AdMob IDs — ready for production.
 * AD_DEV_MODE = true shows placeholders. Set false before App Store build.
 */

export const ADMOB_APP_ID = 'ca-app-pub-8834917370871405~7924668226';

export const AD_UNITS = {
  BANNER_RESULTS: 'ca-app-pub-8834917370871405/1802113002',
  BANNER_BUDGET: 'ca-app-pub-8834917370871405/1802113002',
  BANNER_DEBT: 'ca-app-pub-8834917370871405/1802113002',
  REWARDED_LEARNING_TIER: 'ca-app-pub-8834917370871405/7349953152',
  REWARDED_PORTFOLIO_SPEED: 'ca-app-pub-8834917370871405/7349953152',
  REWARDED_PDF_EXPORT: 'ca-app-pub-8834917370871405/7349953152',
  INTERSTITIAL_LOADING: 'ca-app-pub-8834917370871405/3645323468',
} as const;

export const AD_RULES = {
  MIN_INTERVAL_SECONDS: 120,
  MAX_BANNERS: 1,
  AD_FREE_SCREENS: ['Welcome', 'Onboarding', 'Disclaimer', 'Categories', 'RiskTolerance'] as const,
  COMMUNITY_AD_FREQUENCY: 5,
} as const;

export const AD_DEV_MODE = true; // Set false before App Store
