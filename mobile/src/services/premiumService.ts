/**
 * premiumService.ts
 * Free vs Premium gating. Checks RevenueCat status first, then falls back
 * to local AsyncStorage override (useful for testing before SDK is installed).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE, FREE_LIMITS } from '../constants';

// ── DEV MODE ──────────────────────────────────────────────────────────────────
// SET TO FALSE BEFORE APP STORE SUBMISSION
export const DEV_MODE = true;

// Budget-specific limits (not in FREE_LIMITS to avoid changing the union type used by canUseFeature)
export const BUDGET_FREE_LIMITS = {
  budgetMonthsHistory: DEV_MODE ? Infinity : 1,
  netWorthSnapshots: DEV_MODE ? Infinity : 3,
  debtPayoffPlanner: DEV_MODE ? true : false,
  subscriptionAudit: DEV_MODE ? true : false,
  savingsStreakHistory: DEV_MODE ? true : false,
};

export { FREE_LIMITS };

// --------------------------------------------------------------------------
// Check premium status — DEV_MODE bypasses all checks
// --------------------------------------------------------------------------
export async function isPremium(): Promise<boolean> {
  if (DEV_MODE) return true;

  // 1. Try RevenueCat SDK
  try {
    const Purchases = require('react-native-purchases').default;
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo?.entitlements?.active?.['premium'] !== undefined;
  } catch {
    // SDK not installed or not configured yet
  }

  // 2. Local override for testing
  const override = await AsyncStorage.getItem(STORAGE.IS_PREMIUM);
  return override === 'true';
}

// --------------------------------------------------------------------------
// Feature gate — returns true if user can use the feature, false → show paywall
// --------------------------------------------------------------------------
export async function canUseFeature(
  feature: 'savedPortfolios' | 'comparisonPortfolios' | 'learningLessons' | 'alexMessagesPerDay',
  currentCount: number,
): Promise<boolean> {
  if (DEV_MODE) return true;
  const premium = await isPremium();
  if (premium) return true;
  return currentCount < FREE_LIMITS[feature];
}

// --------------------------------------------------------------------------
// Saved portfolio gate — check before saving
// --------------------------------------------------------------------------
export async function canSavePortfolio(existingCount: number): Promise<boolean> {
  return canUseFeature('savedPortfolios', existingCount);
}

// --------------------------------------------------------------------------
// Comparison gate — check before comparing
// --------------------------------------------------------------------------
export async function canComparePortfolio(existingCount: number): Promise<boolean> {
  return canUseFeature('comparisonPortfolios', existingCount);
}

// --------------------------------------------------------------------------
// Learning gate — check before opening a lesson by index (0-based)
// --------------------------------------------------------------------------
export async function canAccessLesson(lessonIndex: number): Promise<boolean> {
  if (DEV_MODE) return true;
  const premium = await isPremium();
  if (premium) return true;
  return lessonIndex < FREE_LIMITS.learningLessons;
}

// --------------------------------------------------------------------------
// Daily Alex message gate — tracks date, resets at midnight
// --------------------------------------------------------------------------
export async function canSendAlexMessage(): Promise<{ allowed: boolean; remaining: number }> {
  if (DEV_MODE) return { allowed: true, remaining: 999 };
  const premium = await isPremium();
  if (premium) return { allowed: true, remaining: 999 as number };

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const [storedDate, storedCount] = await Promise.all([
    AsyncStorage.getItem(STORAGE.ADVISOR_MSGS_DATE),
    AsyncStorage.getItem(STORAGE.ADVISOR_MSGS_REMAINING),
  ]);

  if (storedDate !== today) {
    // New day — reset counter
    await Promise.all([
      AsyncStorage.setItem(STORAGE.ADVISOR_MSGS_DATE, today),
      AsyncStorage.setItem(STORAGE.ADVISOR_MSGS_REMAINING, String(FREE_LIMITS.alexMessagesPerDay)),
    ]);
    return { allowed: true, remaining: FREE_LIMITS.alexMessagesPerDay };
  }

  const remaining = storedCount !== null ? parseInt(storedCount, 10) : FREE_LIMITS.alexMessagesPerDay;
  return { allowed: remaining > 0, remaining };
}

export async function decrementAlexMessages(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const [storedDate, storedCount] = await Promise.all([
    AsyncStorage.getItem(STORAGE.ADVISOR_MSGS_DATE),
    AsyncStorage.getItem(STORAGE.ADVISOR_MSGS_REMAINING),
  ]);

  let remaining = FREE_LIMITS.alexMessagesPerDay;
  if (storedDate === today && storedCount !== null) {
    remaining = Math.max(0, parseInt(storedCount, 10) - 1);
  } else {
    remaining = FREE_LIMITS.alexMessagesPerDay - 1;
  }
  await Promise.all([
    AsyncStorage.setItem(STORAGE.ADVISOR_MSGS_DATE, today),
    AsyncStorage.setItem(STORAGE.ADVISOR_MSGS_REMAINING, String(remaining)),
  ]);
  return remaining;
}
