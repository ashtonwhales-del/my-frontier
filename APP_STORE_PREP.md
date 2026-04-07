# My Frontier — App Store Submission Checklist

## App Information

| Field | Value |
|-------|-------|
| App Name | My Frontier |
| Subtitle | ETF Portfolio Optimizer |
| Bundle ID | com.myfrontier.app |
| Primary Category | Finance |
| Secondary Category | Utilities |
| Age Rating | 4+ (no mature content) |
| Price | Free (with in-app purchase) |

---

## App Store Description (4,000 character max)

```
My Frontier — Your Personal ETF Portfolio Optimizer

Investing always felt like it was designed for Wall Street. Until now.

My Frontier uses the Efficient Frontier — the same Nobel Prize-winning mathematical model used by professional fund managers — and makes it available to anyone. In minutes, you get a personalized ETF portfolio built from 10 years of real market data, optimized for your exact risk tolerance and investment goals.

HOW IT WORKS

1. Pick your interests. Choose from 99 ETF categories — AI & Technology, Clean Energy, Real Estate, Healthcare, Quantum Computing, and many more. The sectors you believe in become the building blocks of your portfolio.

2. We run the math. Our optimizer downloads 10 years of real market data from Yahoo Finance, runs mean-variance optimization, and builds the best risk-adjusted allocation it can find. The same algorithm institutional investors use.

3. Get your portfolio. You receive a fully personalized ETF allocation with a Frontier Score, projected growth to age 59.5, and plain-English explanations of every holding — no jargon, no complexity.

KEY FEATURES

• 99 investment categories — from classic broad market funds to emerging sectors like Quantum Computing, Genomics, and Blockchain
• Frontier Score — a 0–10 rating grading your portfolio's risk-adjusted return (A through F)
• Portfolio projections — see realistic estimates of what your money could grow to over 10, 20, and 30+ years
• Risk Switcher — tap any risk level (1–5) to instantly recalculate your portfolio without re-entering your preferences
• Plain-English ETF explanations — every holding explained as if a smart friend is telling you what it does and why you'd want it
• Stress Test — see how your portfolio would have performed in the 2008 financial crisis, COVID crash, and dot-com bust
• PDF Export — share your portfolio as a professional report
• Wealth Tracker — manually log your portfolio's value over time and watch your progress
• Alex AI Guide — an AI assistant that knows your specific portfolio and answers your questions in plain English

WHAT IS THE EFFICIENT FRONTIER?

The Efficient Frontier is a concept in modern portfolio theory, developed by Nobel Prize-winner Harry Markowitz. It identifies the portfolio that achieves the highest expected return for any given level of risk — or equivalently, the lowest risk for any given return. That's the math running behind every portfolio My Frontier builds.

THE FINE PRINT

My Frontier is for educational purposes only. Nothing in this app constitutes financial advice. All projections are estimates based on historical data and do not guarantee future results. All investing involves risk, including the possible loss of principal. ETF data is sourced from Yahoo Finance. Always consult a licensed financial advisor before making investment decisions.
```

**Character count:** ~2,500 (well within 4,000 limit — leaves room for localization)

---

## Keywords (100 characters max)

```
ETF,portfolio,investing,stocks,finance,optimizer,beginner,wealth,retirement,diversification
```
**Character count:** 91 ✓

---

## What's New — Version 1.0

```
First release of My Frontier — the smart ETF portfolio optimizer built for everyday investors.

Build a personalized ETF portfolio in minutes using the same math used by professional fund managers. Pick your sectors, set your risk level, and get a fully optimized allocation with projections, grade, and plain-English explanations.
```

---

## Support & Legal URLs

| Field | Status |
|-------|--------|
| Privacy Policy URL | ⬜ Needs live URL — host at myfrontier.app/privacy |
| Support URL | ⬜ Needs live URL — host at myfrontier.app/support or use a mailto: |

**Options for quick hosting:**
- Create a free GitHub Pages site with a simple privacy policy HTML file
- Use Carrd (free tier) for a one-page site with privacy + support content
- Typedream or Notion for a public privacy policy page

---

## Screenshots Required

| Device | Resolution | Count |
|--------|-----------|-------|
| iPhone 6.9" (iPhone 16 Pro Max) | 1320 × 2868 px | 3–10 |
| iPhone 6.5" (iPhone 14 Plus) | 1242 × 2688 px | 3–10 |
| iPad 13" Pro (if supporting iPad) | 2064 × 2752 px | 3–10 |

### Recommended Screenshot Sequence

1. **Welcome screen** — "Investing, finally made simple." hero shot
2. **Categories screen** — grid showing all sector options with colorful cards
3. **Results screen** — portfolio allocation showing Frontier Score A/B and ETF cards
4. **Projections** — the "What your money could become" growth chart with large numbers
5. **Stress Test modal** — shows resilience during historical crashes
6. **Alex AI** — conversation interface showing plain-English portfolio answers

### Screenshot Tips

- Use iPhone Simulator (Xcode) with "Slow Animations" off
- Or use a real device with `expo run:ios` — build the production app
- Frame screenshots in a nice device mockup using [Previewed.app](https://previewed.app) (free tier)
- Add headline text overlay for context: "Meet your portfolio optimizer"

---

## App Review Notes

```
This app uses the Efficient Frontier mathematical model (Harry Markowitz, 1952) to suggest
ETF portfolio allocations based on user-selected investment categories and risk tolerance.

The app:
- Does NOT execute trades or connect to brokerage accounts
- Does NOT handle real money or financial transactions
- Does NOT collect personal financial information
- DOES display "Not financial advice" disclaimers throughout all result screens
- Fetches public market data from Yahoo Finance (no auth required)
- Uses Google AdMob for advertising (banner and rewarded video ads)
- Uses the Anthropic Claude API for an AI chat assistant (portfolio questions only)

The AI assistant ("Alex") is configured to never give specific buy/sell advice, always
recommends consulting a licensed financial advisor, and is limited to educational responses
about the user's portfolio allocation.
```

---

## In-App Purchase Configuration

| Item | Type | Price |
|------|------|-------|
| My Frontier Premium | Auto-renewable subscription | $4.99/month |

**Features behind the paywall:**
- Auto-Invest brokerage integration (when live)
- Unlimited portfolio saves
- Priority recalculation (no ads during optimization)
- PDF export history
- Advanced stress test scenarios

**To configure in App Store Connect:**
1. App Store Connect → My Apps → My Frontier → In-App Purchases
2. Create new Auto-Renewable Subscription
3. Product ID: `com.myfrontier.app.premium_monthly`
4. Price: $4.99/month
5. Set up subscription group: "My Frontier Premium"

---

## Pre-Submission Checklist

### Required
- [ ] App icon 1024 × 1024 px PNG (no alpha channel, no rounded corners — Apple applies them)
- [ ] Privacy Policy URL live and accessible
- [ ] Support URL live and accessible
- [ ] Screenshots captured and uploaded for all required device sizes
- [ ] App tested on a real iPhone (not just simulator) — portfolio calculation verified end-to-end
- [ ] "Not financial advice" disclaimer visible on the Results screen
- [ ] No placeholder text remaining (search for "REPLACE" in codebase)
- [ ] All navigation flows tested: Welcome → Disclaimer → Onboarding → Categories → Risk → Investment → Results
- [ ] AdMob interstitial and native ad unit IDs replaced (currently placeholder in ads.ts)

### Nice to Have
- [ ] App Preview video (30 seconds showing key flows — dramatically improves conversion)
- [ ] Promotional text (170 characters, appears above description, can be updated without new build)
- [ ] Localization for Spanish (large US investor demographic)

### AdMob Remaining Tasks
- [ ] Create Interstitial unit in AdMob console → paste into `PROD_IDS.interstitial` in `mobile/src/config/ads.ts`
- [ ] Create Native unit in AdMob console → paste into `PROD_IDS.native` in `mobile/src/config/ads.ts`

---

## EAS Build Commands (Pre-Submission)

```bash
# Install EAS CLI (one-time)
npm install -g eas-cli
eas login

# Build production iOS (submits to App Store)
eas build --profile production --platform ios

# Or submit directly to App Store from EAS
eas submit --platform ios
```

**EAS profile for production** (add to `mobile/eas.json` if not present):
```json
{
  "build": {
    "production": {
      "autoIncrement": true
    }
  }
}
```

---

*Last updated: 2026-04-06 — Phase 10 launch prep*
