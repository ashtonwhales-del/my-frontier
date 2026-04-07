/**
 * purchaseService.ts
 *
 * RevenueCat subscription management for My Frontier Premium.
 *
 * Uses the try/require pattern (same as AdMob) so the app compiles and runs in
 * Expo Go / CI even before `react-native-purchases` is installed.
 *
 * SETUP: Follow REVENUECAT_SETUP.md, then replace the key below and run
 *   npm install react-native-purchases
 *   eas build --profile development --platform ios
 */

// ── RevenueCat API key ────────────────────────────────────────────────────────
// Replace with your real Public iOS key from RevenueCat dashboard → API Keys.
// Format: appl_XXXXXXXXXXXXXXXXXXXX
const REVENUECAT_API_KEY = 'appl_REPLACE_WITH_YOUR_KEY';

// ── Detect native module availability (matches AdMob pattern) ─────────────────
let _Purchases: any = null;
try {
  _Purchases = require('react-native-purchases').default;
} catch {
  // react-native-purchases not installed yet — all functions fall back gracefully
}

// ── Entitlement identifier (must match RevenueCat dashboard) ─────────────────
const PREMIUM_ENTITLEMENT_ID = 'premium';

// ── Product identifier (must match App Store Connect + RevenueCat Products) ───
const MONTHLY_PRODUCT_ID = 'monthly_499';

/**
 * Call once at app startup (App.tsx useEffect).
 * Safe to call in Expo Go — silently no-ops if SDK is not installed.
 */
export function initializePurchases(): void {
  if (!_Purchases) return;
  try {
    _Purchases.configure({ apiKey: REVENUECAT_API_KEY });
  } catch (err) {
    if (__DEV__) console.warn('[purchases] configure failed:', err);
  }
}

/**
 * Attempt to purchase My Frontier Premium (monthly_499).
 * Returns true if the purchase succeeded and the premium entitlement is active.
 * Throws with a user-facing message string on failure.
 */
export async function purchasePremium(): Promise<boolean> {
  if (!_Purchases) {
    // SDK not installed — simulate success in dev, surface actionable message in prod
    if (__DEV__) {
      console.warn('[purchases] SDK not installed. Run: npm install react-native-purchases');
      return false;
    }
    throw new Error('Purchases are not available on this device.');
  }

  try {
    // Fetch the current offering
    const offerings = await _Purchases.getOfferings();
    const currentOffering = offerings?.current;

    if (!currentOffering) {
      throw new Error('No offerings available. Please try again later.');
    }

    // Find the monthly package
    const monthlyPackage = currentOffering.availablePackages.find(
      (pkg: any) => pkg.product?.productIdentifier === MONTHLY_PRODUCT_ID,
    ) ?? currentOffering.monthly;

    if (!monthlyPackage) {
      throw new Error('Monthly plan not found. Please try again later.');
    }

    const { customerInfo } = await _Purchases.purchasePackage(monthlyPackage);
    return !!customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];
  } catch (err: any) {
    // User cancelled — don't surface an error
    if (err?.userCancelled) return false;
    throw new Error(err?.message ?? 'Purchase failed. Please try again.');
  }
}

/**
 * Restore previous purchases (required by App Store guidelines).
 * Returns true if an active premium entitlement was found.
 * Throws with a user-facing message string on failure.
 */
export async function restorePurchases(): Promise<boolean> {
  if (!_Purchases) {
    if (__DEV__) console.warn('[purchases] SDK not installed.');
    return false;
  }

  try {
    const customerInfo = await _Purchases.restorePurchases();
    return !!customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];
  } catch (err: any) {
    throw new Error(err?.message ?? 'Restore failed. Please try again.');
  }
}

/**
 * Check whether the current user has an active premium entitlement.
 * Fast path: uses RevenueCat's cached customer info.
 */
export async function checkPremiumStatus(): Promise<boolean> {
  if (!_Purchases) return false;

  try {
    const customerInfo = await _Purchases.getCustomerInfo();
    return !!customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];
  } catch {
    return false;
  }
}
