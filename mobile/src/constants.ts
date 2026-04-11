// AI Advisor calls are proxied through the My Frontier backend for security
// — the Anthropic API key lives in the server's .env, never in this app.

// App secret used as a lightweight scraping deterrent (obfuscation, not true auth).
// Must match APP_SECRET in the backend .env.
export const APP_SECRET = 'mfK9xRqT2pLvWnYhDcBsAeJgUiOzFk7X';

// AsyncStorage key registry — single source of truth for all stored keys.
export const STORAGE = {
  DISCLAIMER_ACCEPTED:        'disclaimerAccepted',
  ONBOARDING_COMPLETE:        'onboardingComplete',
  SAVED_NAME:                 'savedName',
  SAVED_PORTFOLIOS:           'savedPortfolios',     // JSON array of SavedPortfolio
  PORTFOLIO_RUN_COUNT:        'portfolioRunCount',   // number of times /optimize was called
  ADVISOR_HISTORY:            'advisorHistory',      // per-portfolio chat history (keyed by portfolio id)
  ADVISOR_MSGS_REMAINING:     'advisorMsgsRemaining',
  ADVISOR_MSGS_DATE:          'advisorMsgsDate',     // date string YYYY-MM-DD for daily reset
  NOTIFICATION_PREF:          'notificationPref',    // 'granted' | 'denied'
  FIRST_PORTFOLIO_TIMESTAMP:  'firstPortfolioTimestamp',
  BADGES_EARNED:              'badgesEarned',        // JSON array of badge IDs
  STRESS_TEST_DONE:           'stressTestDone',      // boolean string
  LESSONS_COMPLETE:           'lessonsComplete',     // JSON array of completed lesson IDs
  MARKET_PULSE_CACHE:         'marketPulseCache',    // cached market pulse JSON + timestamp
  IS_PREMIUM:                 'isPremium',           // boolean string — override for testing
  NEW_ONBOARDING_COMPLETE:    'newOnboardingComplete',
} as const;

// Free tier limits
export const FREE_LIMITS: {
  savedPortfolios: number;
  comparisonPortfolios: number;
  learningLessons: number;
  alexMessagesPerDay: number;
} = {
  savedPortfolios: 2,
  comparisonPortfolios: 2,
  learningLessons: 3,
  alexMessagesPerDay: 5,
};

// Free messages before requiring a rewarded ad
export const ADVISOR_FREE_MESSAGES = FREE_LIMITS.alexMessagesPerDay;

// Messages granted after watching a rewarded ad
export const ADVISOR_AD_UNLOCK_MESSAGES = 10;

// Trigger premium screen after this many portfolio runs
export const PREMIUM_TRIGGER_COUNT = 3;
