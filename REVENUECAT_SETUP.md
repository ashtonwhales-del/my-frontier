# RevenueCat Setup — My Frontier

RevenueCat handles all subscription billing, receipt validation, and entitlement management so
My Frontier never has to touch payment cards or App Store receipts directly.

---

## Prerequisites

- Apple Developer account with an active paid membership ($99/year)
- App already created in App Store Connect (bundle ID: `com.myfrontier.app`)
- EAS build working (`eas build --platform ios`)

---

## Step 1: Create a RevenueCat Account

1. Go to [app.revenuecat.com](https://app.revenuecat.com) → Sign up (free)
2. Create a new **Project** — name it "My Frontier"
3. Add an **iOS App**:
   - App name: `My Frontier`
   - Bundle ID: `com.myfrontier.app`
   - App Store Connect API Key: generate one in App Store Connect → Users & Access → Integrations → In-App Purchase

---

## Step 2: Create the Product in App Store Connect

1. App Store Connect → My Apps → My Frontier → In-App Purchases → **+**
2. Type: **Auto-Renewable Subscription**
3. Reference name: `My Frontier Premium Monthly`
4. Product ID: `monthly_499`
5. Subscription Group: Create new → "My Frontier Premium"
6. Duration: 1 Month
7. Price: $4.99/month (Tier 5)
8. Add a localization (English): display name "My Frontier Premium", description "Full access to all My Frontier Pro features"
9. Free Trial: 7 days
10. Save and submit for review (Apple reviews IAPs alongside the first app build)

---

## Step 3: Add the Product to RevenueCat

1. RevenueCat dashboard → My Frontier project → **Products** → **+**
2. Product identifier: `monthly_499`
3. Platform: iOS
4. Save

---

## Step 4: Create an Entitlement

1. RevenueCat dashboard → **Entitlements** → **+**
2. Identifier: `premium`
3. Display name: `My Frontier Premium`
4. Attach the product: select `monthly_499`
5. Save

---

## Step 5: Create an Offering

1. RevenueCat dashboard → **Offerings** → **+**
2. Identifier: `default`
3. Display name: `Default`
4. Add package → **Monthly** → select `monthly_499`
5. Set as **Current Offering**
6. Save

---

## Step 6: Install the SDK

```bash
cd W:\MyFrontier\mobile

# Install React Native Purchases
npm install react-native-purchases

# For iOS — install CocoaPods dependency
npx pod-install
```

After install, add to `mobile/app.json` under `expo.plugins`:

```json
["react-native-purchases", {}]
```

⚠️ A new **EAS build** is required after adding the native module. Run:
```bash
eas build --profile development --platform ios
```

---

## Step 7: Get Your RevenueCat API Key

1. RevenueCat dashboard → My Frontier project → **API Keys**
2. Copy the **Public (iOS)** API key — it starts with `appl_`
3. Add it to `W:\MyFrontier\mobile\src\services\purchaseService.ts`:
   ```ts
   const REVENUECAT_API_KEY = 'appl_REPLACE_WITH_YOUR_KEY';
   ```

---

## Step 8: Verify the Integration

After a new EAS dev build is installed:

1. Launch the app on a real device (Simulator cannot make purchases)
2. Navigate to Premium screen
3. Tap "Start 7-Day Free Trial"
4. Use a **Sandbox test account** (create in App Store Connect → Sandbox Testers)
5. Complete the sandbox purchase
6. RevenueCat dashboard → **Customer Lookup** → enter your test Apple ID → confirm entitlement `premium` is active

---

## Step 9: Production Checklist

- [ ] App Store Connect IAP approved (submitted with first app binary)
- [ ] RevenueCat SDK key confirmed (`appl_...` — not the test key)
- [ ] `react-native-purchases` in `package.json` and `app.json` plugins
- [ ] Production EAS build created: `eas build --profile production --platform ios`
- [ ] `checkPremiumStatus()` called on every screen that gates premium features
- [ ] "Restore Purchases" button visible on PremiumScreen ✓

---

## Product ID Quick Reference

| Product ID | Price | Duration | Entitlement |
|-----------|-------|----------|-------------|
| `monthly_499` | $4.99 | 1 month (7-day free trial) | `premium` |

---

*Last updated: 2026-04-06 — Phase 11 pre-launch*
