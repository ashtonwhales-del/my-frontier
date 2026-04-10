# CLAUDE.md — MyFrontier Project Map

> **Read this file first every session.** It is the single source of truth for project
> structure, constraints, known fixes, and operational context. Update it after every
> major change so the next session never starts blind.

---

## Project Identity

**Product name:** My Frontier (marketed as "FrontierFi" internally)
**What it is:** A React Native / Expo mobile app backed by a Python FastAPI server.
Users answer a questionnaire (risk tolerance, categories, investment amount, age) and
receive a personalized ETF portfolio allocation with projections to age 59.5.
**Stack:** Python 3.14 · FastAPI · Riskfolio-Lib · yfinance · React Native 0.81 · Expo SDK 54

---

## Repository Layout — Every File, One Line

```
W:\MyFrontier\
│
├── CLAUDE.md                     ← THIS FILE — project map, read every session
├── README.md                     ← Public-facing product description
├── SECURITY.md                   ← SSL pinning TODO and security notes
├── .env                          ← Secrets: ANTHROPIC_API_KEY, APP_SECRET, ENV
│
├── optimizer.py                  ← Core library: ETF universe, price download,
│                                    mean-variance optimization, scoring, CLI run()
├── api.py                        ← FastAPI server: /health /categories /optimize /advisor
├── etf_universe_extra.json       ← 82 extra ETF categories merged at runtime;
│                                    also contains _audit key (sector counts, flagged ERs)
├── requirements.txt              ← Python deps: yfinance pandas numpy riskfolio-lib
│                                    cvxpy fastapi uvicorn curl_cffi python-dotenv
│
├── results.txt                   ← CLI output written by optimizer.py run()
├── price_cache.pkl               ← 24-hour local price cache (auto-created, safe to delete)
├── logs/
│   └── api.log                   ← Rotating daily log; only metadata (no PII/portfolio data)
│
└── mobile/                       ← React Native / Expo app
    ├── App.tsx                   ← Root component; navigation stack entry point
    ├── index.ts                  ← Expo registerRootComponent call
    ├── app.json                  ← Expo config (name, slug, icon, splash)
    ├── package.json              ← JS deps (Expo ~54, RN 0.81, @react-navigation/stack ^7)
    ├── tsconfig.json             ← TypeScript config
    │
    └── src/
        ├── api.ts                ← ALL fetch calls to backend; BASE_URL lives here ⚠️
        ├── constants.ts          ← APP_SECRET, STORAGE keys, ad/advisor message limits
        ├── theme.ts              ← Colors, spacing, radius, shadow design tokens
        ├── types.ts              ← Shared TypeScript types (RootStackParamList, etc.)
        │
        ├── screens/
        │   ├── WelcomeScreen.tsx         ← First screen; navigates to Disclaimer
        │   ├── DisclaimerScreen.tsx      ← Must-accept legal disclaimer
        │   ├── OnboardingScreen.tsx      ← Collects investor name
        │   ├── CategoriesScreen.tsx      ← Fetches /categories; user picks sectors ⚠️
        │   ├── RiskToleranceScreen.tsx   ← 1–5 risk picker with plain-English labels
        │   ├── InvestmentScreen.tsx      ← Lump sum + weekly contribution inputs
        │   ├── ResultsScreen.tsx         ← Calls /optimize; renders portfolio + grades
        │   ├── AdvisorScreen.tsx         ← Proxied Claude AI chat via /advisor
        │   ├── WealthTrackerScreen.tsx   ← Manual portfolio value tracker
        │   ├── PremiumScreen.tsx         ← Upsell screen (rewarded ads gate)
        │   ├── AboutScreen.tsx           ← App info
        │   ├── PrivacyPolicyScreen.tsx   ← Privacy policy
        │   └── TermsScreen.tsx           ← Terms of service
        │
        ├── components/
        │   ├── StepProgressBar.tsx       ← 4-step progress indicator (Categories→Results)
        │   ├── PortfolioScoreCard.tsx    ← Smart Score / grade / diversification display
        │   ├── SkeletonLoader.tsx        ← Loading placeholder animation
        │   ├── StressTestModal.tsx       ← Hypothetical drawdown scenario modal
        │   ├── AdBanner.tsx              ← Banner ad wrapper
        │   ├── LoadingAd.tsx             ← Ad shown during /optimize wait
        │   ├── ErrorBoundary.tsx         ← React error boundary (catches render crashes)
        │   ├── ads/
        │   │   ├── InterstitialAd.tsx    ← Full-screen ad
        │   │   ├── NativeAdCard.tsx      ← In-feed native ad card
        │   │   ├── RewardedAd.tsx        ← Rewarded video ad (unlocks advisor messages)
        │   │   └── RewardedFeature.tsx   ← Wrapper that gates a feature behind rewarded ad
        │   └── results/                  ← Sub-components split from ResultsScreen (285 lines)
        │       ├── ETFDescriptions.ts    ← ETF_DESCRIPTIONS (~120 tickers) + ETF_ROLE dicts
        │       ├── ScoreCard.tsx         ← 2×2 metric grid card + gradeColor helper
        │       ├── ETFBreakdown.tsx      ← HoldingCard (expandable ETF row)
        │       ├── WhatThisMeans.tsx     ← WhatThisMeansSection + BreakdownBar + classifier sets
        │       ├── ProjectionsSection.tsx← Horizon rows with midpoint headline + range labels
        │       ├── RiskSwitcher.tsx      ← 5-pill risk level switcher
        │       └── pdfExport.ts          ← buildShareText() + generatePortfolioHTML()
        │
        ├── config/
        │   └── ads.ts                    ← AdMob unit IDs; __DEV__ → test IDs, prod → real IDs
        │
        └── services/
            └── brokerageService.ts       ← Brokerage deep-link / OAuth placeholder
```

---

## File Size Rule — 300-Line Hard Limit

**No single file in `mobile/src` should exceed 300 lines.**

When a file approaches 250–300 lines:
1. Identify self-contained pieces (pure data constants, sub-components, utility functions).
2. Extract each piece into a focused file under `components/<feature>/` or a `utils/` sibling.
3. Import it back with a named or default import — no behaviour change for the consumer.
4. Run `npx tsc --noEmit` to confirm zero errors before committing.

This rule exists because the read-limit for large files wastes context and makes every
future edit risky. `ResultsScreen.tsx` was the first example (split from 1,200 lines →
285 lines on 2026-04-06). Apply the same pattern to any file that grows past 250 lines.

---

## Backend — Start Command

```bash
# ALWAYS use this. Never run `python api.py` directly — api.py has NO uvicorn.run()
# call at the bottom (intentional: avoids double-start conflicts).
python -m uvicorn api:app --host 0.0.0.0 --port 8000
```

**Startup sequence:**
1. `api.py` imports `optimizer as opt` at module level (line ~121)
2. The `lifespan()` async context manager runs: imports optimizer again as a smoke-test,
   validates `etf_universe_extra.json` is valid JSON if present
3. FastAPI registers middleware (CORS → AppSecret → Timeout → Logging)
4. "Application startup complete." — server is ready

**If startup silently exits:** you ran `python api.py` instead of uvicorn. There is no
`if __name__ == "__main__"` block.

---

## Network / Backend Configuration ⚠️

**Production backend:** Render free tier — `https://my-frontier-api.onrender.com`
**Local development:** Wi-Fi LAN — `http://192.168.1.60:8000`

`mobile/src/api.ts` reads `process.env.EXPO_PUBLIC_API_URL` with a hardcoded fallback of
`https://my-frontier-api.onrender.com`. To use local backend during dev, set `.env`:

```
W:\MyFrontier\mobile\.env  →  EXPO_PUBLIC_API_URL=http://<local-IP>:8000
```

**Current machine IP:** `192.168.1.60`
**Production URL:** `https://my-frontier-api.onrender.com` (Render free, migrated from Railway 2026-04-09)

⚠️ Render free tier spins down after 15 min of inactivity — first request after cold start takes ~30s.
The app's `withRetry` wrapper handles this automatically.

### How to find your current IP (after a router reboot / DHCP reassignment)

```bash
# Windows — run in any terminal
ipconfig

# Look for the Wi-Fi adapter section:
#   Wireless LAN adapter Wi-Fi:
#      IPv4 Address. . . . . . . . : 192.168.1.XX   ← this is your IP
```

Steps:
1. Run `ipconfig` → find "IPv4 Address" under the Wi-Fi adapter
2. Update `EXPO_PUBLIC_API_URL=http://<new-IP>:8000` in `mobile/.env`
3. Restart Expo dev server: Ctrl-C → `npx expo start`
4. Update the startup checklist curl URL below if needed

---

## API Endpoints

| Method | Path | Auth | Rate limit | Purpose |
|--------|------|------|------------|---------|
| GET | `/health` | None | 60/min | Load balancer probe; exempt from X-App-Secret |
| GET | `/categories` | X-App-Secret | 60/min | Returns list of ETF category names |
| POST | `/optimize` | X-App-Secret | 3/5 min | Runs full portfolio optimization |
| POST | `/advisor` | X-App-Secret | 10/min | Legacy — now delegates to `/alex` |
| POST | `/alex` | X-App-Secret | 10/min | Alex AI guide — personalized portfolio chat |

**X-App-Secret:** lightweight scraping deterrent; value in `.env` as `APP_SECRET` and
mirrored in `mobile/src/constants.ts` as `APP_SECRET`. Not true auth — do not rely on
it for security.

**Timeout middleware:** 120 seconds hard cap on all requests (portfolio calc can take
30–90 s on first run with a cold cache).

---

## Portfolio Constraints — Complete List

These are enforced in `optimizer.py`. Do not relax them without understanding the
downstream effects on scoring and the mobile UI.

| Constraint | Value | Where enforced | Plain-English reason |
|-----------|-------|----------------|----------------------|
| Max weight per ETF | **10%** | `weight_bounds=(0.0, 0.10)` in `optimize_portfolio()` + final hard-cap pass after `filter_and_renormalize` | Halved from 20% — prevents any single fund taking an outsized position |
| Broad-market floor | **30% combined** | `enforce_portfolio_constraints()` | VTI + SPY + QQQ + VB + IJR + SCHA must total ≥ 30% so no portfolio is purely speculative |
| Broad-market floor — risk-differentiated | Conservative: VTI 10%, SPY 10%, QQQ 4%; Moderate: VTI 9%, SPY 9%, QQQ 7%; Aggressive: VTI 5%, SPY 8%, QQQ 10% | `_anchor_targets` dict in `enforce_portfolio_constraints()` | All targets ≤ 10% cap; each profile sums to exactly 30% |
| Minimum allocation | **2%** (1% post-constraint pass) | `filter_and_renormalize()` | Drops hairline weights that aren't actionable |
| Minimum ETF count | **10** | `enforce_portfolio_constraints()` + `pad_prices_to_minimum()` | Ensures diversification; pads with `FALLBACK_UNIVERSE` if needed |
| Min price history | **3 trading years** (252×3 = 756 obs) | `_download_tickers_raw()` | Covariance matrix needs at least 3 years to be stable |
| Volatility hard cap | **20% annual** | `max_risk = 0.20` in `optimize_portfolio()` | Keeps portfolio swings legible for retail investors |
| Return cap (projections) | **15% annual** | `min(0.15, proj_return)` in `run()` and `api.py:/optimize` | Avoids misleading future-value projections |
| Max universe size | **60 tickers** | `build_universe()` step-3 loop | Keeps Yahoo Finance download fast; batched at 40/request |
| Max ETF expense ratio | **2.25%** | Enforced in `etf_universe_extra.json` curation | ETFs above this threshold are removed/replaced during universe audits |
| Risk-free rate | **0.045** (4.5%) | `risk_free_rate=0.045` passed to `optimize_portfolio()` and `compute_performance_from_weights()` | Current T-bill yield; using 0.0 inflated Sharpe ratios |

---

## Scoring System — Smart Score & Grades

**Formula (both `optimizer.py` and `api.py` — must stay in sync):**
```python
smart = max(0.0, min(10.0, 10.0 * (1.0 - math.exp(-1.5 * max(0.0, perf.sharpe)))))
```

The ×1.5 exponent was added in Phase 1 to fix grade clustering at C.
The old formula used `-1 * sharpe` which required Sharpe ≥ 1.39 for an A grade —
impossible for any 20%-capped diversified portfolio.

**Grade thresholds (both files — must stay in sync):**

| Grade | Smart Score | Approx. Sharpe (rf=0.045) | Meaning |
|-------|-------------|--------------------------|---------|
| A | ≥ 7.5 AND div ≥ 6.0 | ≥ 0.93 | Genuinely excellent risk-adjusted return |
| B | ≥ 6.0 | ≥ 0.67 | Above average |
| C | ≥ 4.5 | ≥ 0.40 | Average — typical ETF portfolio benchmark |
| D | ≥ 2.5 | ≥ 0.19 | Below average |
| F | < 2.5 | < 0.19 | Genuinely poor (barely beats cash at 4.5% RF) |

**Diversification score:** `1 / Σ(weight²)` — effective number of ETFs (inverse HHI).
Capped at 10. An A grade requires this ≥ 6.0 in addition to smart ≥ 7.5.

**⚠️ The smart score formula and grade thresholds appear in TWO places:**
- `optimizer.py` lines ~1306–1319 (used by CLI `run()`)
- `api.py` lines ~420–430 (used by `/optimize` endpoint)
Always update both when changing scoring logic.

---

## ETF Universe — File Locations & Load Order

```
1. optimizer.py  →  SECTOR_TO_ETFS dict (16 built-in categories, ~300 tickers)
                     loaded at module import time
2. etf_universe_extra.json  →  82 additional categories merged by _load_raw_universe()
                                "_audit" key at top is metadata — ignored by the loader
3. Combined into UNIVERSE_TO_ETFS  →  98 categories, 409 unique tickers (as of 2026-04-05)
```

**Key constants in optimizer.py:**
```python
BROAD_MARKET_CORE  = ["VTI", "QQQ", "SPY"]          # always injected first
SMALL_CAP_CORE     = ["VB", "IJR", "SCHA"]           # always injected second
ALL_CORE_ETFS      = BROAD_MARKET_CORE + SMALL_CAP_CORE
FALLBACK_UNIVERSE  = [20 liquid ETFs used to pad thin portfolios]
DELISTED_TICKERS   = {"RXP","SXP","FBGX","BOAT","ASEA","AWAY","TRVL"}  # skipped at build time
```

**Adding a new ETF category:** Add it to `etf_universe_extra.json` (preferred) or
`SECTOR_TO_ETFS` in `optimizer.py`. Also add an emoji to `CATEGORY_ICONS` in
`CategoriesScreen.tsx` or it shows a fallback 📊.

**Adding a delisted ticker:** Add to `DELISTED_TICKERS` set in `optimizer.py`. This is
the correct fix when logs show `PARTIAL HIT — N/M tickers cached, downloading 1 missing`
followed by `Saved N tickers` (unchanged count = the missing ticker returned nothing).

---

## Price Cache

- **Location:** `W:\MyFrontier\price_cache.pkl`
- **TTL:** 24 hours; stale cache triggers full re-download automatically
- **Safe to delete:** Yes — next request rebuilds it. Delete when:
  - Tickers are added/removed from the universe
  - A delisted ticker is added to `DELISTED_TICKERS`
  - Cache is suspected corrupt (pickle errors in logs)
- **Log patterns to know:**
  - `[cache] HIT` — all requested tickers found, no download
  - `[cache] PARTIAL HIT — 59/60 tickers cached` — one ticker missing; if count stays
    59 after download, the missing ticker is invalid → add to `DELISTED_TICKERS`
  - `[cache] MISS` — full re-download (expected after delete or first run)

---

## Known Issues Fixed (Phase 1 — 2026-04-05)

| # | Issue | Fix |
|---|-------|-----|
| 1 | Smart Score clustering at C for all portfolios | Formula: `e^(-sharpe)` → `e^(-1.5×sharpe)`; added F grade |
| 2 | Natural Gas sector had only 2 ETFs (UNG, FCG) | Added FTXN (First Trust Nasdaq Oil & Gas, ER ~0.60%) |
| 3 | Shipping sector: BDRY (ER 3.0%) + BWET (ER 2.85%) above 2.25% threshold; BOAT invalid | Replaced all three with IYT + XTN + FTXR |
| 4 | ASEA (Global X SE Asia) delisted Nov 2022 | Replaced with EPHE in Southeast Asia; added to DELISTED_TICKERS |
| 5 | AWAY (ETFMG Travel Tech) liquidated Mar 2022 | Removed from Airlines & Travel; added to DELISTED_TICKERS |
| 6 | TRVL / BOAT — no recognized active ETF tickers | Added to DELISTED_TICKERS |
| 7 | `59/60 tickers cached` log — BOAT causing persistent miss | BOAT added to DELISTED_TICKERS; stale cache deleted |
| 8 | Risk-free rate was 0.0 — inflated all Sharpe ratios | Changed to 0.045 in both `optimizer.py` and `api.py` (2 call sites) |
| 9 | Mobile app showing "Could not reach API at 192.168.1.93:8000" | Updated BASE_URL in `mobile/src/api.ts` to current IP 192.168.1.60 |
| 10 | No console.log of fetch URL for debugging | Added `console.log('[fetchCategories] Calling:', url)` in `api.ts` |

---

## Environment Variables (`.env`)

```
ANTHROPIC_API_KEY=...   # Required for /advisor endpoint; 503 returned if missing
APP_SECRET=...          # Must match APP_SECRET in mobile/src/constants.ts
ENV=development         # Set to "production" to restrict CORS to myfrontierapp.com
```

The `.env` file is not checked into version control.

---

## Optimizer Data Flow (detailed)

```
prompt_user_inputs()        ← CLI only; API gets params from POST body
        ↓
build_universe(categories)
  · prepends ALL_CORE_ETFS (VTI/QQQ/SPY/VB/IJR/SCHA)
  · adds TIER_1_ETFS (top 15 per category) for selected categories
  · fills remaining tickers up to 60-ticker cap
  · skips DELISTED_TICKERS at every step
        ↓
remove_leveraged_etfs()     ← regex on yfinance name/description metadata
        ↓
download_10y_prices()       ← cache check → batch yfinance download (40/batch)
                               drops tickers with < 756 observations
        ↓
filter_correlated_etfs()    ← drops higher-ER duplicate when pairwise correlation ≥ 0.85
                               core anchors never dropped; runs BEFORE pad step
        ↓
pad_prices_to_minimum()     ← pads to MIN_PORTFOLIO_ETFS=10 using FALLBACK_UNIVERSE
                               runs AFTER filter so padding is not undone by correlation filter
        ↓
[API only: trim to top-80 by estimated Sharpe if > 80 tickers pass filter]
        ↓
optimize_portfolio(prices, risk_tolerance, risk_free_rate=0.045)
  · RT 1–2: rp.Portfolio.optimization(obj='MinRisk')  — minimise variance
  · RT 3–5: rp.Portfolio.optimization(obj='Sharpe')   — maximise Sharpe ratio
  · Fallback chain: primary obj → MinRisk → EqualWeight
  · Solver hard constraint: port.upperlng = 0.10 (10% per-ETF cap)
  · rf passed as daily: rf_daily = (1 + 0.045)^(1/252) − 1 ≈ 0.0001745
        ↓
filter_and_renormalize()    ← drops weights < 2%; renormalizes
        ↓
enforce_portfolio_constraints()
  · raises each anchor to its risk-profile minimum
  · ensures combined anchor weight ≥ 30%
  · hard-caps any single ETF at 20%
        ↓
compute_performance_from_weights()
  · expected_return = w·μ   (μ from mean_historical_return, freq=252, compounding)
  · volatility = √(wᵀΣw)   (Σ from sample_cov, freq=252 — already annualised)
  · sharpe = (return − 0.045) / volatility
        ↓
smart score → grade → projections → output
```

---

## Math Verification Checklist

Run this mentally before touching optimizer.py or api.py math:

- [ ] `compute_mu(prices)` — uses `(1 + rets.mean())^252 − 1` (compounding annualisation)
- [ ] `compute_cov(prices)` — uses `rets.cov() * 252` (daily cov scaled to annual; do NOT multiply again)
- [ ] Riskfolio rf is **daily**: `rf_daily = (1 + 0.045)^(1/252) − 1 ≈ 0.0001745`
  — Riskfolio's internal mu is daily; passing annual rf (0.045) makes the problem infeasible
- [ ] `compute_performance_from_weights()` uses **annualised** mu and cov + annual rf=0.045 — consistent
- [ ] `per_etf_metrics()` uses `(1 + rets.mean())^252 − 1` and `std × √252` — consistent
- [ ] Risk-free rate is `0.045` in ALL annual-unit call sites (optimizer.py + api.py main path +
  api.py fallback path) — grep for `risk_free_rate` to confirm
- [ ] Smart score formula is identical in optimizer.py and api.py
- [ ] Grade thresholds are identical in optimizer.py and api.py

---

## React Native / Mobile Notes

- **Expo SDK 54, React Native 0.81.5, @react-navigation/stack ^7**
- **No Expo Router** — uses classic stack navigation from `App.tsx`
- **Navigation param types** defined in `src/types.ts` → `RootStackParamList`
- **All backend calls** go through `src/api.ts` — never call `fetch()` directly
  in a screen component
- **`fetchWithTimeout`** wraps every call with `AbortController` (default 30 s,
  optimize uses 120 s)
- **`withRetry`** retries once after 2 seconds on any failure
- **`assertConnected()`** uses NetInfo to check connectivity before every request
- **`sanitizeOnboardingData()`** validates and clamps all user inputs before POST

---

## Startup Checklist (new session or after reboot)

```bash
# 1. Verify IP hasn't changed
ipconfig
# Look for IPv4 under Wi-Fi adapter. If different from .env → update mobile/.env only.

# 2. Start backend
cd W:\MyFrontier
python -m uvicorn api:app --host 0.0.0.0 --port 8000

# 3. Confirm healthy
curl http://192.168.1.60:8000/health
# Expected: {"status":"ok","version":"1.0.0","timestamp":"..."}

# 4. Start mobile (separate terminal)
cd W:\MyFrontier\mobile
npx expo start
# Use Expo Go for quick iteration (AdMob will show placeholder stubs)
# Use dev build (see below) for full AdMob + native module testing
```

---

## Files You Should NOT Need to Re-Read Each Session

The following are stable and well-understood:

| File | Why stable |
|------|-----------|
| `requirements.txt` | Pinned deps; only changes when new packages are added |
| `mobile/tsconfig.json` | Boilerplate TypeScript config |
| `mobile/app.json` | Static Expo metadata |
| `mobile/src/theme.ts` | Design tokens; changes only for UI redesign |
| Screen files other than Categories/Results | Self-contained; rarely touched |
| `logs/api.log` | Runtime output; read only to debug specific incidents |

**Files to re-read when context is stale:**

| File | What changes |
|------|-------------|
| `optimizer.py` | Universe constants, scoring formula, math |
| `api.py` | Endpoints, scoring formula, rate limits |
| `etf_universe_extra.json` | ETF lists, audit metadata |
| `mobile/src/api.ts` | BASE_URL (IP changes), endpoint wrappers |
| `mobile/src/constants.ts` | APP_SECRET, feature flag values |
| `mobile/src/types.ts` | Navigation param types, shared interfaces |

---

## Phase 2 Changes — Copy & UX Text (2026-04-05)

| File | What changed |
|------|-------------|
| `mobile/src/screens/ResultsScreen.tsx` | Rewrote all 32 `ETF_DESCRIPTIONS` and 22 `ETF_ROLE` entries — plain language, no jargon |
| `mobile/src/screens/ResultsScreen.tsx` | Rewrote `WhatThisMeansSection` — grade-aware hook, qualitative tradeoff, actionable tip, 4-bar breakdown |
| `mobile/src/screens/ResultsScreen.tsx` | Deleted dead helper functions `portfolioTypeLabel` and `portfolioExpectation` |
| `mobile/src/components/StressTestModal.tsx` | Rewrote intro + all 3 scenario descriptions to feel premium and educational |
| `mobile/src/components/ads/RewardedFeature.tsx` | Rewrote subheading + locked body copy |

---

## Phase 3 Changes — UI Polish (2026-04-05)

| File | What changed |
|------|-------------|
| `mobile/src/screens/ResultsScreen.tsx` | `ProjectionsSection` redesigned: each horizon is now a row with a **large green optimistic value**, a relative progress bar, and muted conservative estimate. Disclaimer updated. |
| `mobile/src/screens/WealthTrackerScreen.tsx` | Portfolio cards now: **48px grade letter** as the dominant visual, tap → opens `PortfolioDetailModal`. Separate 📊 icon button toggles chart comparison. Added `PortfolioDetailModal` (full-screen modal with grade hero, 3-stat row, ETF weight bars). |
| `mobile/src/screens/WelcomeScreen.tsx` | New tagline: "Built on the same math Wall Street uses…". Added **3-step explainer** (Pick → Math → Portfolio) between hero and form card. Returning user: "Recalculate" demoted to small underlined text link; primary CTA changed to "Build a New Portfolio →". |

---

## Phase 4 Changes — Infrastructure (2026-04-05)

| File | What changed |
|------|-------------|
| `mobile/.env` | Created. Contains `EXPO_PUBLIC_API_URL`. **Edit this when IP changes — nothing else.** |
| `mobile/src/api.ts` | `BASE_URL` now reads `process.env.EXPO_PUBLIC_API_URL` with hardcoded fallback |
| `mobile/src/api.ts` | `callAdvisor` now delegates to `callAlex`; new `callAlex` function hits `/alex` |
| `mobile/.gitignore` | Added `.env` to ignore list (contains local IP, not a secret but environment-specific) |
| `mobile/app.json` | Added `expo-dev-client` plugin; replaced test AdMob App IDs with real ones |
| `mobile/src/config/ads.ts` | Created. Exports `AD_UNIT_IDS` — `__DEV__` → Google test IDs, production → real IDs |
| `mobile/src/components/AdBanner.tsx` | Now uses `AD_UNIT_IDS` from config; renders real `BannerAd` in dev/prod builds, placeholder in Expo Go |
| `mobile/src/components/ads/RewardedAd.tsx` | Real AdMob SDK wired via `try/require` pattern; falls back to instant-grant in Expo Go |
| `mobile/src/components/ads/InterstitialAd.tsx` | Real AdMob SDK wired via `try/require` pattern; falls back to instant-close in Expo Go |
| `api.py` | Added `/alex` endpoint with updated system prompt (≤100 words, no buy/sell advice) |
| `api.py` | Added `/alex` to `_RATE_CONFIG` (10 req/min, same as `/advisor`) |

---

## Expo Dev Client & EAS Build

**Why needed:** Expo Go cannot load native modules (AdMob, etc.). A dev build is required
for full AdMob functionality and for App Store submission.

```bash
# Install EAS CLI (one-time)
npm install -g eas-cli

# Log in to your Expo account (one-time)
eas login

# Build iOS dev client — run on device, not simulator
eas build --profile development --platform ios

# Build Android dev client
eas build --profile development --platform android
```

**After the build is installed on device:**
- Start the dev server: `npx expo start --dev-client`
- Scan QR code — opens your custom dev build (not Expo Go)
- AdMob ads will render for real

**⚠️ AdMob requires a real dev build.** Ads show placeholder stubs in Expo Go.
The EAS build is the mandatory step before App Store submission.

---

## AdMob Configuration

**App ID** (in `mobile/app.json` under `expo.plugins`):
- Both iOS and Android: `ca-app-pub-8834917370871405~7924668226`

**Unit IDs** (in `mobile/src/config/ads.ts`):
- Banner: `ca-app-pub-8834917370871405/1802113002`
- Rewarded: `ca-app-pub-8834917370871405/7349953152`
- Interstitial: placeholder — create unit in AdMob console, then update `PROD_IDS.interstitial` in `ads.ts`
- Native: placeholder — same process

**Rules:**
- App ID goes in `app.json` (needed at native build time)
- Unit IDs go in `ads.ts` only — never hard-code them elsewhere
- `__DEV__` automatically uses Google test IDs, so test builds never accidentally hit production quota

---

## Alex AI

Alex is a fully-wired AI assistant powered by the Anthropic API.

**Frontend:** `mobile/src/screens/AdvisorScreen.tsx` — complete chat UI, message history,
reward-gate for extra messages. Accessible via the 🤖 floating button on ResultsScreen.

**Backend:** `POST /alex` — accepts `{messages, portfolio, user_name}`, returns `{reply}`.
System prompt: plain-English guide, no buy/sell advice, ≤100 words per response, portfolio-aware.

**Call chain:**
```
AdvisorScreen → callAdvisor() → callAlex() → POST /alex → Anthropic claude-haiku → reply
```

**Requires:** `ANTHROPIC_API_KEY` in `W:\MyFrontier\.env`. Returns 503 if missing.

---

## Remaining Manual Steps (post Phase 4)

| Step | What to do |
|------|-----------|
| EAS account | Create account at expo.dev, run `eas login`, run `eas build` |
| Interstitial AdMob unit | Create unit in AdMob console → paste ID into `PROD_IDS.interstitial` in `ads.ts` |
| Native AdMob unit | Create unit in AdMob console → paste ID into `PROD_IDS.native` in `ads.ts` |
| Separate iOS/Android AdMob apps | Optional: create separate AdMob apps per platform → update `app.json` `iosAppId`/`androidAppId` |
| App Store submission | Requires EAS production build + Apple Developer account |

---

## Phase 5 Changes — Audit & Critical Fixes (2026-04-05)

| File | What changed |
|------|-------------|
| `optimizer.py` | Added `_KNOWN_ER` dict (~40 ETFs with expense ratios) used by correlation filter |
| `optimizer.py` | Added `filter_correlated_etfs(prices, threshold=0.85)` — drops higher-ER duplicate when pairwise return correlation exceeds threshold; core anchors (VTI/SPY/etc.) are never dropped |
| `optimizer.py` | `optimize_portfolio()`: `weight_bounds` changed from `(0.0, 0.20)` → `(0.0, 0.10)` |
| `optimizer.py` | `optimize_portfolio()`: Added final hard-cap pass AFTER `filter_and_renormalize` — the authoritative 10% enforcement that prevents renormalization from pushing weights above the cap |
| `optimizer.py` | `enforce_portfolio_constraints()`: `max_single` changed from `0.20` → `0.10`; all `_anchor_targets` updated to respect the 10% cap; each profile sums to exactly 30% |
| `optimizer.py` | `run()`: `filter_correlated_etfs()` called after `download_10y_prices` and before `optimize_portfolio` |
| `api.py` | `filter_correlated_etfs()` called after `pad_prices_to_minimum` in `/optimize` endpoint |
| `mobile/src/api.ts` | `callAlex()`: added `console.log('[Alex] calling:', url)` before the fetch |
| `mobile/src/screens/AdvisorScreen.tsx` | Replaced generic catch block with specific error routing: 503 → API key missing message; 429 → rate limit message; "No internet" → connectivity message; generic → server error with detail |
| `mobile/src/screens/ResultsScreen.tsx` | Added `RiskSwitcher` component — 5-pill row below Frontier Score card; tapping a pill re-runs `/optimize` in-place with new risk level and loading indicator |

### Correlation filter log format
```
[corr-filter] Dropped SGOL (corr=0.99 with IAU, ER=0.17% vs 0.09%)
[corr-filter] 3 duplicate(s) removed — 12/15 tickers kept (threshold=85%)
```

### 10% cap — how it works (3-layer defense)
1. **Solver bounds**: `port.upperlng = 0.10` — Riskfolio-Lib's Portfolio solver enforces this at optimization time
2. **Constraint pass**: `enforce_portfolio_constraints()` step 3 clips any weight > 10% and redistributes excess
3. **Final hard cap**: After `filter_and_renormalize()` renormalizes (which can push weights above 10% if < 10 ETFs share the budget), a `.clip(upper=0.10)` pass with renormalization ensures the final output is always ≤ 10%

---

## Phase 6 Changes — Riskfolio-Lib Migration (2026-04-05)

| File | What changed |
|------|-------------|
| `optimizer.py` | Removed `from pypfopt import expected_returns, risk_models` and `from pypfopt.efficient_frontier import EfficientFrontier` |
| `optimizer.py` | Added `import riskfolio as rp` at top level |
| `optimizer.py` | Added `compute_mu(prices)` — annualised expected returns via `(1+rets.mean())^252−1` |
| `optimizer.py` | Added `compute_cov(prices)` — annualised sample covariance via `rets.cov() * 252` |
| `optimizer.py` | Rewrote `optimize_portfolio()` — uses `rp.Portfolio` with `port.upperlng=0.10` (solver-level 10% cap); `rf` converted to daily units before passing to Riskfolio; fallback chain: MaxSharpe → MinRisk → EqualWeight |
| `optimizer.py` | Modified `run()` — now accepts `(categories=None, *, risk_tolerance=3, ...)` for programmatic calls; adds `pad_prices_to_minimum()` call (mirrors API); always returns a `Dict` with `weights`, `performance`, `scores`, `categories` |
| `api.py` | Replaced `opt.expected_returns.mean_historical_return(prices[top20])` with `opt.compute_mu(prices[top20])` |
| `api.py` | Replaced `opt.risk_models.sample_cov(prices[top20])` with `opt.compute_cov(prices[top20])` |
| `requirements.txt` | Removed `PyPortfolioOpt`, `ecos`; added `riskfolio-lib` |

### Riskfolio-Lib API notes (v7.2.1)
- `port.upperlng = 0.10` → per-asset upper bound (10% cap enforced by solver)
- `port.lowerlng = 0.0` → no short selling at per-asset level
- `port.sht = False` → disables short selling globally
- `rf` parameter in `port.optimization()` must be in **daily** units
  — passing annual rf (0.045) makes the Sharpe problem infeasible (treats 4.5% daily as benchmark)
  — correct: `rf_daily = (1 + 0.045)^(1/252) − 1 ≈ 0.0001745`
- `method_mu='hist', method_cov='hist'` → historical estimates (matches previous pypfopt behaviour)
- Fallback chain needed because Sharpe optimization can return `None` on degenerate data

### `run()` — new dual-mode signature
```python
# Programmatic (returns dict):
result = run(['AI & Technology', 'Healthcare & Biotech'], risk_tolerance=3)
weights = result['weights']  # {ticker: float}

# Interactive CLI (prompts user, still returns dict):
result = run()
```

---

## Phase 7 Changes — ETF Universe Expansion & Pipeline Fix (2026-04-05)

| File | What changed |
|------|-------------|
| `optimizer.py` | `SECTOR_TO_ETFS`: All 16 categories trimmed to exactly 8 ETFs each (was 6–31) — kept lowest-ER, most-liquid representatives per category |
| `optimizer.py` | `run()`: Swapped order of `filter_correlated_etfs` and `pad_prices_to_minimum` — filter now runs BEFORE pad so padding is not undone by correlation pruning |
| `api.py` | `/optimize` endpoint: Same order fix — `filter_correlated_etfs` now runs BEFORE `pad_prices_to_minimum` |
| `etf_universe_extra.json` | `_audit._note` and `_audit._methodology` updated to document the SECTOR_TO_ETFS trim pass; added `_audit._sector_to_etfs_trim` entry |

### Why the filter→pad order matters
`filter_correlated_etfs` can remove 10+ tickers when two closely-related categories (e.g.
AI + Healthcare) are both highly correlated with VTI/QQQ. Previously, `pad_prices_to_minimum`
ran first (guaranteeing ≥10), then `filter_correlated_etfs` ran and undid the guarantee —
leaving as few as 9 ETFs, which caused the equal-weight fallback to assign 1/9 ≈ 11.1% per ETF,
violating the 10% cap. Running filter first → pad second ensures the pool is always ≥ 10 after
both operations.

---

---

## Phase 8 Changes — ResultsScreen Split (2026-04-06)

| File | What changed |
|------|-------------|
| `mobile/src/screens/ResultsScreen.tsx` | Split from 1,200 lines → **285 lines**. Now only contains imports, `savePortfolioToStorage`, state/lifecycle, and the render tree. |
| `mobile/src/components/results/ETFDescriptions.ts` | `ETF_DESCRIPTIONS` (~120 tickers, plain-English, no jargon) + `ETF_ROLE` dict. Add new ETF descriptions here — never in ResultsScreen. |
| `mobile/src/components/results/ScoreCard.tsx` | 2×2 metric grid card (Smart Score, Risk %, Expected Return, Diversification) + `gradeColor()` helper. |
| `mobile/src/components/results/ETFBreakdown.tsx` | `HoldingCard` — expandable ETF row showing weight, dollar amounts, description, allocation bar. |
| `mobile/src/components/results/WhatThisMeans.tsx` | `WhatThisMeansSection` + `BreakdownBar` + ticker-classification sets (`BOND_TICKERS`, `SMALL_CAP_TICKERS`, `BROAD_MARKET_TICKERS`). |
| `mobile/src/components/results/ProjectionsSection.tsx` | Horizon rows: midpoint headline in green, optimistic/conservative labeled below. Accepts `projections`, `profile`, `performance` props. |
| `mobile/src/components/results/RiskSwitcher.tsx` | 5-pill risk level switcher (Very Safe → Very Risky) with recalculating spinner. |
| `mobile/src/components/results/pdfExport.ts` | `buildShareText()` for native Share sheet + `generatePortfolioHTML()` for PDF export. |
| `mobile/src/components/AdBanner.tsx` | Pre-existing bug fixed: `placement="results-bottom"` → `placement="banner"` (was never a valid AdMob placement key). |
| `CLAUDE.md` | Added **300-line hard limit** rule for all `mobile/src` files. Added `results/` sub-directory to repository layout. |

*Last updated: 2026-04-06 — Phase 8 ResultsScreen split complete.*

---

## Phase 9 Changes — Polish Sprint (2026-04-06)

| File | What changed |
|------|-------------|
| `mobile/src/components/results/ETFDescriptions.ts` | Rewrote **all** `ETF_DESCRIPTIONS` entries with a strict 3-part format: (1) what it owns, (2) top 5 holdings by company name (never ticker), (3) why a beginner would want it. Added `ARKQ`, `ROBT`, `QTEC`, `IGV` descriptions + `ETF_ROLE` entries. |
| `mobile/src/components/results/ProjectionsSection.tsx` | Changed projection intro from `/month` (derived from weekly×52/12) to `/week` (direct from `profile.weekly_contribution`). Label now reads "per week". |
| `mobile/src/screens/ResultsScreen.tsx` | "Set Up Auto-Invest →" button now navigates to `PremiumScreen` instead of showing an Alert. Comment added: `// Auto-Invest locked behind premium`. |
| `mobile/src/screens/ResultsScreen.tsx` | Loading state replaced with new `LoadingCalculation` full-screen dark overlay component. `SkeletonResults` removed from loading path. |
| `mobile/src/components/LoadingCalculation.tsx` | **Created.** Full-screen dark loading overlay with spinning animation, rotating tip messages (6 tips, 4-second intervals with fade), animated dot progress indicator, and `AdBanner` at bottom for ad impressions during wait. |
| `optimizer.py` | Added `"Quantum Computing"` to `SECTOR_TO_ETFS` with 6 ETFs: QTUM, QTEC, ARKQ, BOTZ, ROBT, IGV. |
| `etf_universe_extra.json` | Added `"Quantum Computing": ["QTUM", "QTEC", "ARKQ", "BOTZ", "ROBT", "IGV"]`. |
| `mobile/src/screens/CategoriesScreen.tsx` | Added `'Quantum Computing': '🔬'` to `CATEGORY_ICONS` and `'Quantum Computing': '#7C3AED'` to `CATEGORY_ACCENTS`. |
| `mobile/src/screens/OnboardingScreen.tsx` | Rewrote all 3 slides: Slide 1 — "Investing, finally made simple." + Efficient Frontier copy; Slide 2 — "How we build your portfolio" with emoji steps (🎯🧮📊); Slide 3 — "Built for real people, not Wall Street." with 4 promise bullets. CTA changed to "Build My Portfolio →". |

---

## Phase 10 Changes — Final Polish, Ad Monetization & Launch Prep (2026-04-06)

### System Audit Results
- **17 SECTOR_TO_ETFS categories**, 132 tickers — no category under 3 ETFs, none over 10 ✓
- **99 UNIVERSE_TO_ETFS categories** (17 built-in + 82 from extra JSON), **321 unique ETFs** ✓
- **7 delisted tickers** blocked in `DELISTED_TICKERS` ✓
- `npx tsc --noEmit` — **zero errors** ✓

### Task 3 — UI Audit Results (all clean)
- No "underlying index" or "tracks the" in `ETFDescriptions.ts` ✓
- "Ask Alex" FAB already commented out in `ResultsScreen.tsx` ✓
- `WhatThisMeans.tsx` already contains grade `console.log` diagnostic ✓
- `ProjectionsSection.tsx` already uses `profile.weekly_contribution` directly ✓

| File | What changed |
|------|-------------|
| `mobile/src/components/LoadingCalculation.tsx` | **Rewired to rewarded video.** At 3-second mark: triggers `showRewardedAd()` automatically on native builds (5–10× higher CPM than banner). Shows "Watch a short video to support My Frontier — it keeps the app free!" prompt. On reward earned: shows "✅ Thanks for supporting us! 🎉". In Expo Go (no native module): falls back to `AdBanner` as before. Module-level `_hasNativeModule` flag avoids try/require on every render. |
| `api.py` | `/health` endpoint now returns `categories` (99), `etfs_in_universe` (321), `cache_status` (warm/cold/stale/corrupt), and `timestamp`. Used for Railway health checks and deployment monitoring. |
| `APP_STORE_PREP.md` | **Created.** Full App Store submission checklist: app metadata, 4,000-char description, keyword string, What's New copy, screenshot specs and sequence, App Review notes, In-App Purchase configuration, pre-submission checklist, EAS production build commands. |
| `MARKETING.md` | **Created.** Full marketing plan: target audience profiles, TikTok/Reels script templates, Reddit strategy with target subreddits, Twitter cadence, Product Hunt launch plan, free tools stack, weekly launch timeline, ASO guidance, revenue targets with eCPM estimates. |

### `/health` response shape (v2)
```json
{
  "status": "ok",
  "version": "1.0.0",
  "categories": 99,
  "etfs_in_universe": 321,
  "cache_status": "warm",
  "timestamp": "2026-04-06T..."
}
```
`cache_status` values: `"warm"` (< 24h), `"stale"` (≥ 24h), `"cold"` (no file), `"corrupt"` (pickle error).

### Rewarded ad flow in `LoadingCalculation`
```
t=0s  → Loading starts, spinner shows, tips start rotating
t=3s  → Native: showRewardedAd() called → AdMob full-screen video overlay
       → Expo Go: banner fallback renders at bottom
User watches video → onRewarded() → adPhase = 'rewarded' → "Thanks! 🎉" shown
Loading finishes   → ResultsScreen replaces LoadingCalculation
```

*Last updated: 2026-04-06 — Phase 10 complete. App is launch-ready.*

---

## Phase 11 Changes — Pre-Launch (2026-04-06)

| File | What changed |
|------|-------------|
| `optimizer.py` | `SECTOR_TO_ETFS` 17 categories sorted alphabetically (AI & Technology → Small & Mid Cap). ETF lists inside each category unchanged. |
| `etf_universe_extra.json` | All 83 category keys (including Quantum Computing) sorted alphabetically. `_audit` key preserved at top. |
| `mobile/src/screens/CategoriesScreen.tsx` | API response sorted client-side: `setCategories([...cats].sort((a, b) => a.localeCompare(b)))` — categories always display A→Z regardless of server order. |
| `mobile/src/screens/CategoriesScreen.tsx` | Removed hardcoded IP from error alert — replaced with generic connection error message. |
| `docs/privacy-policy.html` | **Created.** Full privacy policy: effective April 2026, sections for AdMob advertising, Alex/Anthropic API, no personal data collected, children's privacy, contact email `support.myfrontier@gmail.com`. Dark navy design matching app theme. |
| `docs/support.html` | **Created.** Support page: FAQ (6 questions covering free tier, financial advice, portfolio building, re-runs, cancellation, restore), contact email. |
| `docs/index.html` | **Created.** Redirect page → `privacy-policy.html`. Used as GitHub Pages root. |
| `mobile/assets/icon-concept.html` | **Created.** SVG mountain icon at 3 sizes (1024, 180, 60 px): navy sky, 3-layer mountains in brand blue/indigo, gold horizon line, gold peak diamond. Includes App Store export requirements and color palette. |
| `REVENUECAT_SETUP.md` | **Created.** 9-step RevenueCat setup: account creation, App Store Connect IAP, entitlements, offerings, SDK install, API key, sandbox verification, production checklist. Product ID: `monthly_499`, entitlement: `premium`. |
| `mobile/src/services/purchaseService.ts` | **Created.** `initializePurchases`, `purchasePremium`, `restorePurchases`, `checkPremiumStatus` — all use try/require pattern for SDK absence. Graceful Expo Go fallback. |
| `mobile/App.tsx` | Added `initializePurchases()` call at startup useEffect — safe no-op until SDK is installed. |
| `mobile/src/screens/PremiumScreen.tsx` | Replaced placeholder `handleTrial` Alert with real `purchasePremium()` call + `ActivityIndicator` loading state. Added "Restore Purchases" button wired to `restorePurchases()` with loading state. Both buttons disabled while either is loading. |
| `mobile/app.json` | Updated description to "Smart ETF portfolio optimizer built on Efficient Frontier mathematics. Built for first-time investors." Added `ios.buildNumber: "1"`. Added `privacyPolicyUrl` and `supportUrl` to `expo.extra`. Deduplicated keywords array. |
| `GITHUB_PAGES_SETUP.md` | **Created.** 5-step guide: push docs/, enable GitHub Pages (main branch, /docs folder), verify URLs live, add to App Store Connect, update workflow. |

### Pre-Launch Audit Results (Phase 11)
- All 17 SECTOR_TO_ETFS categories sorted alphabetically ✓
- All 83 etf_universe_extra.json categories sorted alphabetically ✓
- Hardcoded IP removed from CategoriesScreen error alert ✓
- "Not financial advice" present on all result-bearing screens ✓
- `__DEV__` gates confirmed in `ads.ts` — production never uses test IDs ✓
- `REPLACE` tokens in purchaseService.ts and ads.ts are intentional documented steps ✓
- `npx tsc --noEmit` — **zero errors** ✓

### Remaining Manual Steps Before App Store Submission

| Step | File / Location | Notes |
|------|----------------|-------|
| GitHub Pages | `github.com/ashtonwhales-del/my-frontier` → Settings → Pages → main/docs | Follow GITHUB_PAGES_SETUP.md |
| RevenueCat key | `purchaseService.ts` line 17 | Follow REVENUECAT_SETUP.md |
| Install RevenueCat SDK | `npm install react-native-purchases` then `eas build` | After RevenueCat account created |
| AdMob Interstitial unit | `ads.ts` → `PROD_IDS.interstitial` | Create unit in AdMob console |
| AdMob Native unit | `ads.ts` → `PROD_IDS.native` | Create unit in AdMob console |
| App icon PNG | `mobile/assets/icon.png` | Follow icon-concept.html export instructions — 1024×1024 PNG, no alpha |
| EAS production build | `eas build --profile production --platform ios` | After all above steps complete |

*Last updated: 2026-04-08 — Phase 11 complete. Ready for GitHub Pages + RevenueCat setup.*

---

## Phase 12 Changes — Full Engagement Suite (2026-04-08)

### Pricing
- Monthly: **$2.99/month** | Yearly: **$24.99/year (save 30%)**

### New Files Created
| File | Purpose |
|------|---------|
| `GEMINI_SETUP.md` | Gemini API key setup guide |
| `mobile/src/services/badgeService.ts` | Badge award logic (8 free + 5 premium badges) |
| `mobile/src/services/premiumService.ts` | Free vs premium gating (daily Alex limits, lesson gates) |
| `mobile/src/components/results/DNAPersonality.tsx` | Portfolio personality pill (6 types) |
| `mobile/src/components/MarketPulse.tsx` | Market sentiment widget (SPY/QQQ/AGG) |
| `mobile/src/components/results/ETFDetailModal.tsx` | ETF detail bottom sheet (long-press) |
| `mobile/src/components/results/HistoricalChart.tsx` | 10-year history chart (premium, react-native-svg) |
| `mobile/src/components/results/ShareCard.tsx` | Shareable dark portfolio card (react-native-view-shot) |
| `mobile/src/screens/LearningData.ts` | 12 lesson content + 4 game definitions |
| `mobile/src/screens/LearningScreen.tsx` | Learning Center (3 tiers, lesson modal, games) |
| `mobile/src/screens/CompareScreen.tsx` | Portfolio comparison (8-metric table, winner badge) |

### Modified Files
| File | What changed |
|------|-------------|
| `api.py` | `/alex` → Gemini primary + Anthropic fallback; added `/market-pulse`, `/historical`, `/leaderboard/submit`, `/leaderboard/rank` |
| `requirements.txt` | Added `google-generativeai>=0.7.0` |
| `mobile/src/screens/PremiumScreen.tsx` | Pricing updated; feature list updated |
| `mobile/src/screens/AdvisorScreen.tsx` | Daily 5/day limit with midnight reset; suggested questions; unlock via ad or premium; dual-mode header |
| `mobile/src/screens/ResultsScreen.tsx` | Alex FAB re-enabled; ETFDetailModal on long-press; ShareCard + HistoricalChart added; badge awards on save |
| `mobile/src/screens/WelcomeScreen.tsx` | MarketPulse widget added; Learning Center button added |
| `mobile/src/screens/WealthTrackerScreen.tsx` | Compare button added to header |
| `mobile/src/components/results/ScoreCard.tsx` | DNA personality pill + anonymous leaderboard rank |
| `mobile/src/types.ts` | Added `MarketPulseData`, `HistoricalPoint`, `LeaderboardRank`; added `Learning` + `Compare` routes |
| `mobile/src/constants.ts` | Added `FREE_LIMITS`, new STORAGE keys (`ADVISOR_MSGS_DATE`, `BADGES_EARNED`, etc.) |
| `mobile/src/api.ts` | Added `fetchMarketPulse`, `fetchHistorical`, `submitLeaderboard` |
| `mobile/App.tsx` | Added `Learning` and `Compare` stack screens |

### New API Endpoints
| Endpoint | Description |
|----------|-------------|
| `POST /alex` | Gemini 1.5 Flash (free), Anthropic fallback |
| `GET /market-pulse` | SPY/QQQ/AGG daily changes, 4-hour server cache |
| `POST /historical` | 10-year monthly portfolio vs SPY ($10K normalized) |
| `POST /leaderboard/submit` | Anonymous weekly score submission |
| `GET /leaderboard/rank` | Leaderboard stats for current week |

### Free vs Premium Limits (Phase 12)
| Feature | Free | Premium |
|---------|------|---------|
| Saved portfolios | 2 | Unlimited |
| Compare portfolios | 2 | Unlimited |
| Learning lessons | 3 (beginner) | 12 + 4 games |
| Alex messages | 5/day (resets midnight) | Unlimited |
| Historical chart | Locked | ✓ |
| Ads | Yes | No |

*Last updated: 2026-04-08 — Phase 12 complete.*

---

## Phases 13+14 Changes — Design System + Budget Hub (2026-04-09)

### Scoring fixes (optimizer.py + api.py — both files updated)
- Smart score exponent: `1.5` → `1.8` (A grade now requires Sharpe ~1.3, not ~0.92)
- Grade thresholds: A≥9.0 / B≥7.5 / C≥6.0 / D≥4.5 / F<4.5 (tightened across the board)
- Diversification score: replaced `1/HHI` with 3-component formula (count 3.5 + HHI 4.0 + correlation 2.5 = max 10; typical well-diversified portfolio scores 6.5–8.5)

### Alex key + health fixes (api.py)
- Startup log: `Gemini key loaded: YES / NO - CHECK ENV`
- `/health` returns `gemini: "configured"` or `"MISSING"`
- `/alex` 503 message references RAILWAY_ENV_CHECKLIST.md
- `RAILWAY_ENV_CHECKLIST.md` created — Railway deployment checklist

### New files created

| File | Purpose |
|------|---------|
| `mobile/src/theme/colors.ts` | All color tokens (Colors export + legacy aliases) |
| `mobile/src/theme/typography.ts` | NumberScale/HeadingScale/BodyScale/LabelStyle |
| `mobile/src/theme/spacing.ts` | Spacing/Radius/Shadow + legacy aliases |
| `mobile/src/theme/index.ts` | Barrel re-export of all theme files |
| `mobile/src/theme.ts` | Updated: re-exports from theme/ with merged shadow (sm+md+card+blueGlow+goldGlow) |
| `mobile/src/components/ui/Card.tsx` | Card component: bgCard, border, Radius.lg, optional glow prop |
| `mobile/src/components/ui/GradientButton.tsx` | h:56, Radius.xl, blue/gold, animated press scale, loading spinner |
| `mobile/src/components/ui/StatBadge.tsx` | Pill badge: positive/negative/gold/blue/neutral variants |
| `mobile/src/components/ui/BottomNav.tsx` | 5-tab nav bar: active=brandBlue+top line, h:60+safeArea |
| `mobile/src/components/ui/EmptyState.tsx` | Centered icon/title/subtitle + optional CTA |
| `mobile/src/components/ui/LoadingSkeleton.tsx` | Shimmer animation, card/row/chart variants |
| `mobile/src/components/ui/SectionHeader.tsx` | LabelStyle title + optional action link |
| `mobile/src/utils/animations.ts` | pressScale/fadeIn/slideUp/numberRoll/pulse/staggerChildren |
| `mobile/src/screens/BudgetScreen.tsx` | Monthly budget: income card (goldGlow), 10-category grid, investing CTA (blueGlow), spending DNA pill, AsyncStorage persistence |
| `mobile/src/screens/BudgetModals.tsx` | Income entry + category amount modals extracted from BudgetScreen |
| `mobile/src/screens/NetWorthScreen.tsx` | Net worth hero, assets/liabilities cards, monthly snapshots, line chart |
| `mobile/src/screens/DebtPayoffScreen.tsx` | Screen wrapper for DebtPayoff component |
| `mobile/src/screens/SubscriptionAuditScreen.tsx` | Screen wrapper for SubscriptionAudit component |
| `mobile/src/components/budget/RuleAnalyzer.tsx` | 50/30/20 progress bars with gap message |
| `mobile/src/components/budget/SavingsStreak.tsx` | Flame streak tracker, auto-awards badges at 3/6/12 months |
| `mobile/src/components/budget/SubscriptionAudit.tsx` | Premium: subscription list, cancel impact, lock overlay |
| `mobile/src/components/budget/DebtPayoff.tsx` | Premium: Avalanche vs Snowball, debt-free date, bridge CTA, lock overlay |
| `DESIGN_SYSTEM.md` | Complete dark theme design system spec |
| `BUDGET_SPEC.md` | Budget Hub feature spec |
| `RAILWAY_ENV_CHECKLIST.md` | Railway environment variable setup guide |

### Modified files

| File | What changed |
|------|-------------|
| `mobile/App.tsx` | Dark mode forced (StatusBar light, bgPrimary cardStyle), Budget/NetWorth/DebtPayoff/SubscriptionAudit screens added |
| `mobile/src/types.ts` | Added BudgetContext interface, Budget/NetWorth/DebtPayoff/SubscriptionAudit routes, Advisor accepts optional portfolio+budgetContext |
| `mobile/src/api.ts` | callAdvisor/callAlex accept `OptimizeResponse | null` for budget-mode Alex |
| `mobile/src/screens/AdvisorScreen.tsx` | Budget context support: budget greeting, BUDGET_SUGGESTED questions, optional portfolio |
| `mobile/src/services/premiumService.ts` | Added BUDGET_FREE_LIMITS: budgetMonthsHistory:1, netWorthSnapshots:3, etc. |
| `optimizer.py` | Exponent 1.5→1.8, grade thresholds tightened, HHI 3-component diversification score |
| `api.py` | Exponent 1.5→1.8, grade thresholds tightened, HHI diversification, startup Gemini log, /health gemini field |

### Budget navigation
Budget tab accessible via `navigation.navigate('Budget')` from WelcomeScreen (add a 💰 button).
Budget stack: Budget → NetWorth → DebtPayoff → SubscriptionAudit
Alex from Budget: `navigation.navigate('Advisor', { budgetContext: { monthlyIncome, totalExpenses, surplus, spendingDNA } })`

### Alex budget context
When navigating to Advisor from BudgetScreen, pass `budgetContext` param.
Advisor shows budget-aware greeting and BUDGET_SUGGESTED questions instead of portfolio ones.
Portfolio param is now optional in Advisor — both budget-mode and portfolio-mode work.

*Last updated: 2026-04-09 — Phases 13+14 complete.*

---

## Backend Migration — Railway → Render (2026-04-09)

| Item | Detail |
|------|--------|
| Old URL | `https://web-production-3f67e.up.railway.app` (Railway — cancel to stop charges) |
| New URL | `https://my-frontier-api.onrender.com` (Render free tier) |
| `mobile/src/api.ts` fallback | Updated to Render URL |
| `render.yaml` | Created — Render deploy config (auto-detected by Render) |
| `RENDER_SETUP.md` | Step-by-step Render deploy guide |

**Render free tier caveat:** spins down after 15 min idle → ~30s cold start on first request.
The existing `withRetry` in `api.ts` handles this gracefully — no code changes needed.

*Last updated: 2026-04-09 — Backend migrated to Render.*

---

## Phase 15 Changes — Home Dashboard Redesign + Profile + Alex Fix (2026-04-09)

### Alex fix
- Root cause: `mobile/.env` still pointed to Railway URL (`web-production-3f67e.up.railway.app`)
- Fix: Updated to `https://my-frontier-api.onrender.com`
- api.py: detailed Gemini error logging (type, message, key prefix) for faster debugging
- api.py: improved /alex error message includes actual Gemini error reason, not a generic 503

### New files
| File | Purpose |
|------|---------|
| `mobile/src/screens/WelcomeScreen.tsx` | Rewritten as financial dashboard (167 lines, down from 478) |
| `mobile/src/components/home/HomeWidgets.tsx` | HomeMarketPulse + DashboardGrid + RecentPortfolios split out |
| `mobile/src/screens/ProfileScreen.tsx` | New account screen: avatar, stats, settings, premium, danger zone |

### Modified files
| File | What changed |
|------|-------------|
| `mobile/src/components/ui/BottomNav.tsx` | Full redesign: Ionicons (26px), active tab shows label + 3px blue top line, inactive shows icon only |
| `mobile/.env` | Fixed URL: Railway → Render |
| `mobile/src/types.ts` | Added `Profile` route to RootStackParamList |
| `mobile/src/components/TabShell.tsx` | Profile tab routes to `Profile` screen (was `Premium`) |
| `mobile/App.tsx` | Added ProfileScreen to stack navigator |
| `api.py` | Better Gemini error logging; improved /alex 503 error detail |
| Various tsx/ts | Removed all UI-visible em-dashes, replaced with proper sentences |

### Home dashboard layout (new WelcomeScreen)
1. Header: "MY FRONTIER" gold small-caps + notification bell
2. Time-aware greeting: "Good morning, Pdawg"
3. Market Pulse card: SPY/QQQ/AGG rows with colored StatBadge %, clean sentiment sentence
4. Dashboard 2x2 grid: Portfolio, Budget, Learn, Achievements (all tappable)
5. "Build New Portfolio →" blue gradient button
6. Recent portfolio horizontal scroll strip
7. Disclaimer footer

### Profile screen layout
- Avatar circle (initials, 72px blue) + username + PRO badge if premium
- Stats row: Portfolios Built, Best Grade, Badges Earned (gold numbers)
- Account card: Risk Preference, Display Name, Privacy Policy, Terms, About
- Premium card: upgrade CTA (or Pro confirmation if premium)
- Danger zone: Send Feedback + Reset App Data

*Last updated: 2026-04-09 — Phase 15 complete.*

---

## Phase 16 Changes — Dev Mode, Ticker Tape, Category Funnel, Ads, Help System (2026-04-09)

### DEV_MODE
- `premiumService.ts`: `DEV_MODE = true` (exported) — all premium checks return true, all limits=Infinity
- All feature gates (`isPremium`, `canUseFeature`, `canAccessLesson`, `canSendAlexMessage`) check DEV_MODE first
- `BUDGET_FREE_LIMITS` uses DEV_MODE to set Infinity/true values
- AdBanner skips rendering when DEV_MODE=true or premium
- **SET TO FALSE BEFORE APP STORE SUBMISSION**

### New files created
| File | Purpose |
|------|---------|
| `PHASE16_FEATURES.md` | Phase 16 feature spec |
| `PHASE16_ADS.md` | Ad strategy with unit IDs |
| `mobile/src/components/MarketTicker.tsx` | Auto-scrolling ticker tape (17 tickers, 36px, Animated.loop) |
| `mobile/src/components/HelpSystem.tsx` | Floating ? FAB + context-sensitive bottom sheet (6 screen contexts) |
| `mobile/src/components/categories/StyleSelector.tsx` | Step 1: 4 investment style cards (Safe/Balanced/Aggressive/Custom) |
| `mobile/src/components/categories/CategoryPicker.tsx` | Step 2: Filtered category chips by style, search for custom |
| `mobile/src/components/categories/ContributionStep.tsx` | Step 3: Weekly contribution input, budget sync, 30yr projection |

### Modified files
| File | What changed |
|------|-------------|
| `mobile/src/services/premiumService.ts` | DEV_MODE exported, all gates check DEV_MODE first, BUDGET_FREE_LIMITS dynamic |
| `api.py` | /market-pulse expanded to 17 tickers (SPY/QQQ/DIA/IWM/VTI/AGG/GLD/SLV/USO/BTC-USD/ETH-USD/AAPL/MSFT/NVDA/TSLA/AMZN), 5min cache; /alex trimmed context (grade+return+risk+top3 only), 20s Gemini timeout; /historical 15s yfinance timeout with mock curve fallback |
| `mobile/src/api.ts` | callAlex: 20s timeout, retry once, fallback message |
| `mobile/src/types.ts` | Added TickerQuote interface, tickers field on MarketPulseData |
| `mobile/src/screens/CategoriesScreen.tsx` | Rewritten as 3-step funnel orchestrator (79 lines, down from 458) |
| `mobile/src/screens/WelcomeScreen.tsx` | MarketTicker + HelpFAB added |
| `mobile/src/screens/ResultsScreen.tsx` | MarketTicker + HelpFAB added |
| `mobile/src/screens/BudgetScreen.tsx` | AdBanner + HelpFAB added |
| `mobile/src/screens/LearningScreen.tsx` | AdBanner between tiers, games functional for premium |
| `mobile/src/screens/CompareScreen.tsx` | DEV_MODE unlocks all, AdBanner added |
| `mobile/src/components/AdBanner.tsx` | Skips rendering when DEV_MODE or premium |

### Market Ticker Tape
- 17 symbols: SPY QQQ DIA IWM VTI AGG GLD SLV USO BTC-USD ETH-USD AAPL MSFT NVDA TSLA AMZN
- Backend returns price + change_pct per ticker, cached 5 minutes
- Auto-scrolls left via Animated.loop, 25-second full cycle
- Appears at top of WelcomeScreen and ResultsScreen

### Category Selector 3-Step Funnel
1. **StyleSelector**: 4 cards (Play It Safe / Balanced Growth / Aggressive Growth / I Know What I Want)
2. **CategoryPicker**: Pre-filtered categories by style (12 each), custom shows all 98 with search
3. **ContributionStep**: Weekly amount input with quick-pick buttons ($25/$50/$100/$250/$500), budget sync (auto-fills from BudgetScreen surplus), live 30yr projection

### Ad Placements
- BudgetScreen: sticky banner bottom
- LearningScreen: banner between beginner and intermediate tiers
- CompareScreen: banner between portfolio cards
- All ads skip when DEV_MODE=true or premium

### Help System
- Floating ? FAB (bottom-left, blue circle) on 6 screens: home, results, budget, advisor, learning, compare
- Context-sensitive bottom sheet with numbered tips
- One-time tooltip "Tap ? for help" on first visit (AsyncStorage tracked)

*Last updated: 2026-04-09 — Phase 16 complete.*

---

## Phase 17 Changes — Fix Everything + Home Redesign (2026-04-09)

### Alex AI Fix (TASK 0)
- **Root cause**: `request_options={"timeout": 20}` in Gemini call was killing requests prematurely; frontend 20s timeout too short for Render cold starts
- **api.py fixes**: Removed `request_options` timeout wrapper from `_call_alex_gemini()` (let Gemini respond naturally, typically 3-8s); added Gemini startup test at boot that logs PASSED/FAILED; trimmed conversation to last 6 messages to avoid token limits; added detailed `repr(exc)` logging for every failure path; improved /alex endpoint flow with explicit logging at each decision point
- **api.ts fixes**: Increased frontend timeout from 20s to 45s (covers Render cold start); added error text logging from response; retry after 3s instead of 2s; returns descriptive error messages (503=key missing, 429=rate limit, timeout=server waking up) instead of generic fallback

### Historical Chart Fix (TASK 1)
- Mock fallback now always returns data (never 500) with realistic noise via `hash(month)` for chart variety
- Each mock call logs the reason (yfinance_timeout, empty_or_no_spy, no_valid_tickers, exception_*)
- Response includes `"estimated": true` and `"label"` field so frontend can display "Estimated performance"

### Market Ticker Fix (TASK 2)
- Removed MarketTicker import and component from ResultsScreen (was cluttering results)
- Ticker tape stays on WelcomeScreen only

### Home Screen Redesign (TASK 3)
- **Removed**: HomeMarketPulse card, DashboardGrid 2x2, RecentPortfolios strip
- **Added**: PortfolioSnapshot (best portfolio with large grade letter, or "Build your first portfolio" empty state), WeeklyInsight (daily rotating investing tip from 20 insights, seeded by day-of-year), QuickStats (3-card row: Portfolios/Best Score/Badges with gold numbers), LearningProgress (progress bar with completed/total and continue link)
- **Layout order**: MarketTicker > Header > Greeting > PortfolioSnapshot > AdBanner > WeeklyInsight > QuickStats > Build Portfolio CTA > Open Budget button > LearningProgress > Disclaimer

### Category Selector Fix (TASK 4)
- **CategoryPicker**: Shows "RECOMMENDED FOR YOU" section with pre-selected chips (tap to deselect); dashed "+ Add more sectors (N available)" button expands to show all remaining 98 categories with search; no maximum category limit
- **ContributionStep**: Fixed input bug with controlled input pattern (`inputValue` string state separate from `weeklyAmount` number state); `handleBlur` cleans up display; budget sync now shows two option cards ("Use my budget" vs "Custom amount") when budget data exists; live 30yr projection shows weekly amount in label

### New Ad Placements (TASK 5)
- WelcomeScreen: banner between PortfolioSnapshot and WeeklyInsight
- ResultsScreen: second banner between WhatThisMeans and Projections
- ProfileScreen: banner at bottom
- ContributionStep: banner above Build My Portfolio button
- Created `RewardedMessageButton.tsx` for AdvisorScreen limit unlock

### New File
| File | Purpose |
|------|---------|
| `mobile/src/components/ads/RewardedMessageButton.tsx` | Rewarded ad button that grants +5 Alex messages |

### Modified Files
| File | What changed |
|------|-------------|
| `api.py` | Gemini startup test, removed request_options timeout, detailed logging, mock historical with noise+reasons |
| `mobile/src/api.ts` | callAlex 45s timeout, error text logging, descriptive fallback messages |
| `mobile/src/screens/WelcomeScreen.tsx` | Full redesign with PortfolioSnapshot/WeeklyInsight/QuickStats/LearningProgress |
| `mobile/src/components/home/HomeWidgets.tsx` | Replaced HomeMarketPulse/DashboardGrid/RecentPortfolios with PortfolioSnapshot/WeeklyInsight/QuickStats/LearningProgress |
| `mobile/src/screens/ResultsScreen.tsx` | Removed MarketTicker, added second AdBanner |
| `mobile/src/components/categories/CategoryPicker.tsx` | Recommended chips + expandable add more with search |
| `mobile/src/components/categories/ContributionStep.tsx` | Controlled input fix, budget sync option cards, ad banner |
| `mobile/src/screens/ProfileScreen.tsx` | AdBanner at bottom |

*Last updated: 2026-04-09 — Phase 17 complete.*

---

## Phase 18 Changes — Contribution Fix, Debt Planner, Ads, Performance (2026-04-09)

### Performance: Warmup + Category Cache (TASK 0)
- `api.ts`: `fetchCategories()` now caches result in module-level `_categoriesCache` — only hits network once per app session
- `api.ts`: Added `warmupServer()` export that pings `/health` on app start to wake Render
- `App.tsx`: Calls `warmupServer()` in startup useEffect — reduces cold-start delay for first user action

### StyleSelector Removed (TASK 1)
- **Deleted** `mobile/src/components/categories/StyleSelector.tsx` — no longer used
- `CategoriesScreen.tsx`: Simplified to 2-step funnel (Sectors + Amount, was 3-step)
- `CategoryPicker.tsx`: Rewritten with grouped categories (BROAD MARKET / GROWTH / INCOME / ALTERNATIVE), search bar at top, expandable "Show N more sectors" for the full 98. No pre-selection — user picks their own sectors.

### ContributionStep Keyboard Fix (TASK 2)
- **Root cause**: Missing `returnKeyType="done"` and no `KeyboardAvoidingView` wrapper
- **Fix**: Added `returnKeyType="done"`, `keyboardType="decimal-pad"`, `onSubmitEditing={() => Keyboard.dismiss()}`
- Wrapped in `KeyboardAvoidingView` + `ScrollView` so Build button stays visible above keyboard
- Budget card: single tappable card with green left border showing weekly surplus; tapping it pre-fills the input field (which stays editable)
- Removed fixed `position: 'absolute'` footer — button now scrolls with content

### Ad Placeholders (TASK 3)
- `AdBanner.tsx`: DEV_MODE and Expo Go now show gold dashed placeholder boxes with "AD PLACEMENT (banner)" text — visible so developer can see exactly where ads appear
- `InterstitialAd.tsx`: DEV_MODE and Expo Go show `Alert.alert()` with "Ad Would Play Here" and OK button that proceeds — tests the full interstitial flow

### 50 Insights (TASK 4)
- `HomeWidgets.tsx`: INSIGHTS array expanded from 20 to 50 entries covering basics, risk, Efficient Frontier, ETF specifics, behavioral finance, planning, and My Frontier features

### Debt Planner (TASK 5)
| File | Purpose |
|------|---------|
| `mobile/src/screens/DebtPlannerScreen.tsx` | **Created.** Full debt repayment planner: add/delete debts, avalanche vs snowball strategy comparison, total interest + months to debt-free, after-debt-free investing projection, budget surplus integration, AsyncStorage persistence |

- Added `DebtPlanner: undefined` to `RootStackParamList` in `types.ts`
- Added `DebtPlannerScreen` to `App.tsx` stack navigator
- Added "Debt Repayment Planner" button to `BudgetScreen.tsx`

### All Modified Files
| File | What changed |
|------|-------------|
| `mobile/src/api.ts` | Category cache + warmupServer export |
| `mobile/App.tsx` | warmupServer() call + DebtPlannerScreen registration |
| `mobile/src/types.ts` | Added DebtPlanner route |
| `mobile/src/screens/CategoriesScreen.tsx` | 2-step funnel, removed StyleSelector |
| `mobile/src/components/categories/CategoryPicker.tsx` | Grouped categories, search, expandable more |
| `mobile/src/components/categories/ContributionStep.tsx` | Keyboard fix, budget card, ScrollView wrapper |
| `mobile/src/components/AdBanner.tsx` | Gold dashed placeholders in DEV_MODE/Expo Go |
| `mobile/src/components/ads/InterstitialAd.tsx` | Alert placeholder in DEV_MODE/Expo Go |
| `mobile/src/components/home/HomeWidgets.tsx` | 50 insights |
| `mobile/src/screens/BudgetScreen.tsx` | Debt Planner button |
| `mobile/src/screens/DebtPlannerScreen.tsx` | **New** |

### Deleted Files
| File | Reason |
|------|--------|
| `mobile/src/components/categories/StyleSelector.tsx` | Removed from funnel — users go straight to category picker |

*Last updated: 2026-04-09 — Phase 18 complete.*

---

## Phase 19 Changes — Critical Fixes + Free Model + Foundation (2026-04-09)

### Portfolio Optimizer Fix (TASK 0)
- Added stage-by-stage logging in `/optimize`: START, universe built, prices fetched, filter+pad count, optimization start
- Frontend `OPTIMIZE_TIMEOUT_MS` reduced from 120s to 90s for faster feedback
- Added `/alex-test` GET endpoint for quick AI connectivity check

### 2-Step Funnel (TASK 1)
- Progress bar now shows 2 steps (Sectors + Amount) instead of 4
- StyleSelector completely removed — users go straight to grouped category picker

### Category Chips (TASK 2)
- Categories now render as **pill chips with flexWrap** layout instead of full-width list rows
- Chips: `borderRadius: full`, selected = brandBlue background + white text + blue glow shadow
- 4 grouped sections: BROAD MARKET, GROWTH, INCOME, ALTERNATIVE
- "+ Show N more sectors" expands ungrouped categories with search

### Fully Free Model (TASK 3)
- `premiumService.ts`: `DEV_MODE` renamed to `ALL_FREE = true` (with legacy `DEV_MODE` alias)
- Comment: "My Frontier is free forever. Revenue from ads only."
- `PremiumScreen.tsx`: Completely rewritten as support/free screen — "My Frontier is Free" heading, feature list with checkmarks, Buy Me a Coffee / Share App / Rate Us buttons
- All premium lock overlays already bypassed by `ALL_FREE = true`

### Debt Planner Polish (TASK 4)
- Added total debt summary card with blue border at top
- APR color badges on debt cards: red >15%, amber 5-15%, green <5%
- Debt balance shown large (20px bold)
- Strategy cards show actual debt-free date (e.g. "June 2028")
- Empty state: checkmark icon + "No debts yet" message

### My Portfolio Tracker (TASK 5)
| File | Purpose |
|------|---------|
| `mobile/src/screens/MyPortfolioScreen.tsx` | **Created.** Real holdings tracker: add/delete positions, total value hero card, holdings list with ticker/shares/cost, AsyncStorage persistence |

### Community Screen (TASK 6)
| File | Purpose |
|------|---------|
| `mobile/src/screens/CommunityScreen.tsx` | **Created.** Mock community feed: 8 posts with grades/returns/likes, invite friends card, weekly challenge card, share button |
- Community tab added to BottomNav (replaces Learn tab)
- TabShell routes updated: Community -> CommunityScreen
- LearningScreen: removed TabShell wrapper (accessible from Home, not bottom nav)

### Alex AI Fix (TASK 7)
- `/alex-test` GET endpoint: tests Gemini connectivity, returns `{ok, response, model, key_prefix}`
- AdvisorScreen: calls `/alex-test` on mount, shows amber banner if Alex is having trouble
- `checkAlexStatus()` function added to `api.ts`

### New Files
| File | Lines | Purpose |
|------|-------|---------|
| `mobile/src/screens/MyPortfolioScreen.tsx` | 224 | Real holdings tracker |
| `mobile/src/screens/CommunityScreen.tsx` | 113 | Community feed + challenges |

### Modified Files
| File | What changed |
|------|-------------|
| `api.py` | `/optimize` stage logging, `/alex-test` endpoint |
| `mobile/src/api.ts` | 90s optimize timeout, `checkAlexStatus()`, `warmupServer()` already added |
| `mobile/App.tsx` | MyPortfolioScreen + CommunityScreen registered |
| `mobile/src/types.ts` | Added MyPortfolio + Community routes |
| `mobile/src/components/ui/BottomNav.tsx` | Community tab replaces Learn tab |
| `mobile/src/components/TabShell.tsx` | Community route mapping |
| `mobile/src/screens/CategoriesScreen.tsx` | 2-step progress bar |
| `mobile/src/components/categories/CategoryPicker.tsx` | Chip pills with flexWrap, grouped sections |
| `mobile/src/services/premiumService.ts` | ALL_FREE model, legacy DEV_MODE alias |
| `mobile/src/screens/PremiumScreen.tsx` | Free support screen |
| `mobile/src/screens/DebtPlannerScreen.tsx` | APR badges, summary card, debt-free dates, empty state |
| `mobile/src/screens/AdvisorScreen.tsx` | Alex status check on mount, amber banner |
| `mobile/src/screens/LearningScreen.tsx` | Removed TabShell wrapper |

*Last updated: 2026-04-09 — Phase 19 complete.*

---

## Phase 19 Fixes — Targeted (2026-04-09)

| Fix | File | What changed |
|-----|------|-------------|
| Alex model name | `api.py` | `gemini-1.5-flash` replaced with `gemini-2.0-flash` in ALL 4 locations (startup test, /alex-test, _call_alex_gemini, /alex response). This was the root cause of Alex never working — 1.5-flash was deprecated/404. |
| Gemini SDK pin | `requirements.txt` | `google-generativeai>=0.7.0` updated to `>=0.8.0` |
| Remove PRO badge | `ProfileScreen.tsx` | Removed PRO badge next to username, removed entire MEMBERSHIP section, replaced with "Support the App" row linking to free PremiumScreen |
| Community back button | `CommunityScreen.tsx` | Added Ionicons back arrow to header (left side) |
| Coffee link | `PremiumScreen.tsx` | Buy Me a Coffee now opens `https://www.buymeacoffee.com` with error catch |

*Last updated: 2026-04-09 — Phase 19 fixes applied.*

---

## Phase 20 Changes — Memory Fix, Learning Revamp, Premium Removal (2026-04-09)

### Memory Fix (TASK 0)
- `api.py`: Added `import gc`; calls `gc.collect()` after optimization and historical data processing
- `/historical`: Limits to top 5 tickers by weight to reduce memory; explicit `del` of large DataFrames
- `render.yaml`: `--workers 1 --timeout-keep-alive 60` to prevent multi-worker memory bloat
- `requirements.txt`: Added `psutil` for memory monitoring

### Lump Sum Field (TASK 2)
- `ContributionStep.tsx`: Added "One-time investment (optional)" TextInput below weekly amount
- Projection now calculates: weekly FV + lump sum compounded 30 years at 7%
- `onBuild` callback now passes `(weekly, lumpSum)` to parent

### Did You Know Tips (TASK 3)
- `LoadingCalculation.tsx`: Expanded from 6 tips to 30 covering ETF basics, psychology, math, My Frontier
- Interval changed from 4000ms to 5000ms (5 seconds per tip)

### Historical Chart Fix (TASK 4)
- Already handled by top-5 ticker limit in TASK 0 — prevents memory issues and timeouts

### Premium Removal (TASK 6)
- `HistoricalChart.tsx`: Removed premium gate + blur overlay — chart always shows
- `LearningScreen.tsx`: Removed all lock icons, removed Premium tier labels, all lessons/games directly accessible
- `HelpSystem.tsx`: Replaced "Premium" text with neutral language
- `PremiumScreen.tsx`: Updated Buy Me a Coffee URL to `https://www.buymeacoffee.com/MyFrontier`
- `PREMIUM_TRIGGER_COUNT` in constants.ts is now dead code (never triggers paywall)

### Modified Files
| File | What changed |
|------|-------------|
| `api.py` | gc.collect(), /historical top-5 limit, stage logging |
| `requirements.txt` | Added psutil |
| `render.yaml` | Single worker, 60s keepalive |
| `mobile/src/components/LoadingCalculation.tsx` | 30 tips at 5s interval |
| `mobile/src/components/categories/ContributionStep.tsx` | Lump sum input + updated projection |
| `mobile/src/screens/CategoriesScreen.tsx` | handleBuild accepts lumpSum param |
| `mobile/src/components/results/HistoricalChart.tsx` | Removed premium gate, always shows |
| `mobile/src/screens/LearningScreen.tsx` | All lessons/games unlocked, no locks/Premium text |
| `mobile/src/components/HelpSystem.tsx` | Neutral language replacing "Premium" |
| `mobile/src/screens/PremiumScreen.tsx` | Coffee URL updated to /MyFrontier |

*Last updated: 2026-04-09 — Phase 20 complete.*

---

## Phase 21 Changes — Fix Everything (2026-04-09)

### Alex Quota Fallback (TASK 0)
- `/alex` endpoint: When Gemini returns 429/ResourceExhausted, returns a random helpful fallback response instead of 503
- 5 hardcoded fallback responses covering Efficient Frontier, Frontier Score, diversification, correlation, expected return
- Falls through: Gemini → Anthropic → quota fallback. Never returns an error to the user.
- Created `NEW_GEMINI_KEY.md` with step-by-step instructions for getting a fresh key

### Step 3 Removed (TASK 1)
- **Root cause**: CategoriesScreen navigated to RiskToleranceScreen which navigated to InvestmentScreen ("How do you want to invest?")
- **Fix**: CategoriesScreen now navigates directly to Results with `riskTolerance: 3` (moderate default) and `age: 30`
- InvestmentScreen still exists (legacy) but is no longer in the active flow
- `totalSteps=2` confirmed in CategoriesScreen

### DisclaimerScreen Dark Theme (TASK 2)
- Background: `#FFFFFF` changed to `#0A0F1E` (app dark theme)
- Body card: `#F8F9FF` changed to `#0F1629`
- Footer: `#FFFFFF` changed to `#0A0F1E`
- Body text: fontSize 14 increased to 16, lineHeight 24, color `#94A3B8`
- Heading: `#F8FAFC` with fontWeight 700

### Historical Chart (TASK 3)
- `/historical`: Now limits to top 3 tickers (was 5) for memory safety
- Uses local `weights` dict after normalization instead of mutating `req.weights`

### Multi-Horizon Projections (TASK 4)
- ContributionStep: Replaced single 30-year projection with table showing 10/20/30/40/50 years
- 30-year row highlighted in brandGold (#F59E0B)
- Uses proper monthly compounding formula for accuracy

### Premium Cleanup Continued
- LearningScreen: Removed all lock icons, "Premium" tier labels, unused imports
- All lessons and games directly accessible with no gates

### New Files
| File | Purpose |
|------|---------|
| `NEW_GEMINI_KEY.md` | Step-by-step guide to get fresh Gemini API key |

### Modified Files
| File | What changed |
|------|-------------|
| `api.py` | Alex quota fallback, /historical top-3 limit, local weights variable |
| `mobile/src/screens/CategoriesScreen.tsx` | Navigate directly to Results (skip RiskTolerance/Investment) |
| `mobile/src/screens/DisclaimerScreen.tsx` | Dark theme: dark backgrounds, visible text |
| `mobile/src/components/categories/ContributionStep.tsx` | Multi-horizon projection table (10-50yr) |
| `mobile/src/screens/LearningScreen.tsx` | All locks removed, all lessons/games free |
| `mobile/src/screens/PremiumScreen.tsx` | Buy Me a Coffee URL: buymeacoffee.com/MyFrontier |

*Last updated: 2026-04-09 — Phase 21 complete.*

---

## Phase 22 Changes — Memory Fix + Smart Alex + All Issues (2026-04-09)

### Memory Fix (TASK 0)
- `/historical`: Replaced entirely with **mock-only** — zero yfinance calls, zero memory. Uses seeded random for realistic chart noise. Saves ~200MB per request.
- `/optimize`: Added `psutil` memory guard — returns 503 "Server busy" if memory >75% before starting
- Added `gc.collect()` calls after major operations
- `requirements.txt`: Removed `google-generativeai` (no longer needed)

### Smart Alex (TASK 1) — Free, instant, never fails
- **Removed all Gemini and Anthropic API calls from /alex**
- Replaced with keyword-matched pre-computed responses based on portfolio grade, score, return, risk, diversification
- 7 response categories: score, improve, risk, diversification, etf, return, default (2+ responses each)
- Responses are personalized using actual portfolio data (grade, score, return %, risk %, ETF count)
- Model name in response: `"frontier-ai"`
- Zero cost, instant response, never fails, never exceeds quota

### Loading Progress Steps (TASK 2)
- Added time-based progress steps: "Selecting ETF universe" → "Fetching market data" → "Running Efficient Frontier" → "Optimizing allocation" → "Calculating Frontier Score" → "Almost ready"
- Steps show checkmarks for completed, spinning dot for current, hollow for pending
- Warmup message delayed to 25s

### Debt Planner Loan Term (TASK 4)
- Added "Loan term years (optional)" field to Add Debt modal
- Auto-calculates minimum monthly payment using amortization formula when term is entered
- Pre-fills the minimum payment field

### Premium Cleanup (TASK 5)
- `AdvisorScreen.tsx`: Removed PRO chip, "Go Premium" button, replaced unlock bar with neutral "Watch Ad" only
- `TabShell.tsx`: Updated comment to list correct screens

### Modified Files
| File | What changed |
|------|-------------|
| `api.py` | Mock-only /historical, smart Alex responses replacing Gemini/Anthropic, memory guard |
| `requirements.txt` | Removed google-generativeai |
| `mobile/src/components/LoadingCalculation.tsx` | Time-based progress steps with checkmarks |
| `mobile/src/screens/DebtPlannerScreen.tsx` | Loan term field with auto-calc |
| `mobile/src/screens/AdvisorScreen.tsx` | Removed PRO chip and Premium upgrade buttons |
| `mobile/src/components/TabShell.tsx` | Updated comment |

*Last updated: 2026-04-09 — Phase 22 complete.*

---

## Phase 23 Changes — Debt Strategy + Alex Q&A + Community Chat (2026-04-09)

### Debt Planner: Selectable Strategies (TASK 1)
- Added `selectedStrategy` state defaulting to 'avalanche'
- Strategy cards now tappable — selected gets green border + "SELECTED ✓" badge
- Added "YOUR PAYOFF ORDER" section showing debts sorted by selected strategy (APR desc for avalanche, balance asc for snowball) with estimated payoff dates

### Alex: Curated Q&A (TASK 2)
- **Complete rewrite of AdvisorScreen.tsx** (127 lines, was 273)
- Removed all API calls, text input, message history, premium checks
- 5 category chips: My Portfolio / Investing Basics / The Math / Planning / About My Frontier
- 23 hardcoded Q&A pairs covering scores, diversification, ETFs, Sharpe ratio, compound interest, Modern Portfolio Theory, retirement planning, and more
- Tap question → shows answer with Alex avatar and "Ask another" button
- Portfolio context card shows grade + return % + risk % when available
- Instant, free, never fails

### Community: Feed + Chat (TASK 3)
- **Complete rewrite of CommunityScreen.tsx** (173 lines, was 126)
- Two tabs: Feed and Chat with underline selector
- Feed: "Share My Portfolio" button loads from AsyncStorage, shows picker alert; 8 mock posts with likes
- Chat: pre-populated with 5 starter messages; text input + send; user messages blue (right-aligned), others dark (left-aligned); auto-generated username stored in AsyncStorage; auto-scroll on send
- Removed all navigation to Categories/portfolio builder

### Modified Files
| File | What changed |
|------|-------------|
| `mobile/src/screens/DebtPlannerScreen.tsx` | Selectable strategy cards + payoff order section |
| `mobile/src/screens/AdvisorScreen.tsx` | Full rewrite: curated Q&A, no API, 23 questions |
| `mobile/src/screens/CommunityScreen.tsx` | Full rewrite: Feed+Chat tabs, portfolio sharing, local chat |

*Last updated: 2026-04-09 — Phase 23 complete.*

---

## Phase 24 Changes — Full Polish Pass (2026-04-09)

### Removed HelpFAB (TASK 1)
- Removed `<HelpFAB>` and import from WelcomeScreen, ResultsScreen, BudgetScreen
- Floating ? bubble no longer appears on any screen

### Score-Based Message (TASK 2)
- Replaced "Top X% of My Frontier investors" with score-based message in ScoreCard
- Messages: Exceptional/Strong/Solid/Decent/Keep building based on smart_score thresholds
- Removed leaderboard API call (`submitLeaderboard` no longer called)

### Privacy/Terms (TASK 4)
- Removed Privacy Policy row from ProfileScreen (was linking to ashtonwhales GitHub Pages)
- Terms of Service now shows inline Alert with disclaimer text instead of external URL

### Debt Planner (TASK 5)
- Strategy cards hidden when only 1 debt — shows simple "Pay off by [date]" instead
- Payoff order section wrapped in `debts.length > 1` conditional
- Added "Save Plan" button at bottom that saves and navigates back

### Results Screen (TASK 7)
- Replaced "Set Up Auto-Invest" with "Save and Go Home" button
- On tap: Alert "Saved! Your portfolio has been saved." then navigate to home

### Stress Test 15 Scenarios (TASK 8)
- Expanded from 3 to 15 historical scenarios covering 1987-2023
- Each scenario uses equity/bond weight split to calculate portfolio-specific impact
- New generalized `calcPortfolioDrop` function replaces old `calcDrawdown`

### Modified Files
| File | What changed |
|------|-------------|
| `mobile/src/screens/WelcomeScreen.tsx` | Removed HelpFAB |
| `mobile/src/screens/ResultsScreen.tsx` | Removed HelpFAB, replaced Auto-Invest with Save+Home |
| `mobile/src/screens/BudgetScreen.tsx` | Removed HelpFAB |
| `mobile/src/components/results/ScoreCard.tsx` | Score-based message, removed leaderboard call |
| `mobile/src/screens/ProfileScreen.tsx` | Removed Privacy Policy, Terms shows inline Alert |
| `mobile/src/screens/DebtPlannerScreen.tsx` | Single-debt logic, Save button |
| `mobile/src/components/StressTestModal.tsx` | 15 scenarios with generalized drawdown calc |

*Last updated: 2026-04-09 — Phase 24 complete.*

---

## Phase 25 Changes — Finish Skipped Tasks (2026-04-09)

### Home Debt Card Styling (TASK 1)
- Debt Repayment Planner button in BudgetScreen: added amber left border `borderLeftColor: '#F59E0B'`, removed house emoji prefix

### Badge Logic Fix (TASK 2)
- Renamed badges: Smart Diversifier -> Diversification Expert, Frontier Explorer -> Top Performer
- First Portfolio badge: only awards when `portfolioCount === 1` (truly first save)
- Market Beater threshold raised from 10% to 12%
- Added new badges: High Growth Seeker (>15%), Conservative Investor (<8% risk), Balanced Pro (grade B + low risk)
- DNAPersonality names updated to match: Market Beater, Top Performer, High Growth Seeker, Conservative Investor, Consistent Investor, Balanced Pro
- PortfolioScoreCard badges updated: Diversification Expert (div>=8), Top Performer (grade A), Market Beater (return>12%)

### Wealth Journey Multi-Line (TASK 3)
- Extended LINE_COLORS palette to 8 colors
- Legend now appends " #2", " #3" etc for portfolios with duplicate names
- Each portfolio renders its own line regardless of name similarity

### Learning Book Reader (TASK 4)
- Created `LessonReaderScreen.tsx` (89 lines): full-screen book reader with progress bar, page dots, prev/next navigation, Complete button on last page
- Registered in App.tsx and types.ts as `LessonReader` route
- LearningScreen now navigates to LessonReader instead of showing inline modal — splits lesson content into pages on `\n\n` boundaries

### Historical Chart Scrubber (TASK 5)
- Added PanResponder touch tracking to the chart SVG area
- Dragging horizontally shows floating card with: date, portfolio value, S&P 500 value, difference
- Card disappears on finger lift
- Makes individual month comparisons visible

### New Files
| File | Purpose |
|------|---------|
| `mobile/src/screens/LessonReaderScreen.tsx` | Book-style lesson reader with page navigation |

### Modified Files
| File | What changed |
|------|-------------|
| `mobile/src/screens/BudgetScreen.tsx` | Debt card amber left border |
| `mobile/src/services/badgeService.ts` | Renamed badges, new conditions, new badge types |
| `mobile/src/components/PortfolioScoreCard.tsx` | Updated badge display names and conditions |
| `mobile/src/components/results/DNAPersonality.tsx` | Updated personality type names |
| `mobile/src/screens/WealthTrackerScreen.tsx` | 8-color palette, duplicate name disambiguation |
| `mobile/src/components/results/HistoricalChart.tsx` | PanResponder scrubber with floating data card |
| `mobile/src/screens/LearningScreen.tsx` | Navigates to LessonReader instead of inline modal |
| `mobile/src/types.ts` | Added LessonReader route |
| `mobile/App.tsx` | Registered LessonReaderScreen |

*Last updated: 2026-04-09 — Phase 25 complete.*

---

## Phase 26 Changes — Fix Remaining + Unlimited Compare (2026-04-09)

### Wealth Journey Legend (TASK 2)
- Legend now shows expected return % next to each portfolio name: "Moderate Portfolio (16.8%)"
- Makes it clear which line belongs to which portfolio even when projections overlap

### Learning Reader Fix (TASK 3)
- Added console.log confirmation of page count before navigation
- Ensured pages array is always non-empty (falls back to full content as single page)

### Chart Scrubber Fix (TASK 4)
- Added `onStartShouldSetPanResponderCapture` and `onMoveShouldSetPanResponderCapture` for reliable touch capture
- Replaced SVG wrapper with absolute overlay `pointerEvents="box-only"` to avoid SVG touch conflicts
- Scrubber data card renders above chart area

### Unlimited Compare (TASK 5)
- **Complete rewrite of CompareScreen.tsx** (141 lines, was 203)
- Multi-select checkboxes instead of A/B slot picker — select any number of portfolios
- Horizontal scroll comparison table: fixed metric labels on left, portfolio columns scroll right
- 7 metrics: Grade, Score, Return, Risk, Sharpe, Diversification, ETFs
- Per-row winner highlighting in green for best value
- "Best" badge on portfolio with highest overall score
- No portfolio limit — compare 2, 5, or 10 simultaneously
- Removed all Premium/free-tier gating

### Modified Files
| File | What changed |
|------|-------------|
| `mobile/src/screens/WealthTrackerScreen.tsx` | Return % in legend labels |
| `mobile/src/screens/LearningScreen.tsx` | Console log + page array fallback |
| `mobile/src/components/results/HistoricalChart.tsx` | PanResponder capture + absolute overlay |
| `mobile/src/screens/CompareScreen.tsx` | Full rewrite: unlimited multi-select comparison |

*Last updated: 2026-04-09 — Phase 26 complete.*

---

## Phase 27 Changes — Content, Performance + Polish (2026-04-09)

### Portfolio Naming Fix (TASK 0)
- Risk tolerance now derived from category selections: >50% aggressive sectors → 5 (Aggressive), >50% safe sectors → 1 (Conservative), otherwise → 3 (Moderate)
- Portfolios save with correct risk label instead of always "Moderate"

### Builder Pill Removed (TASK 1)
- Replaced colored DNA pill with plain text spending insight (e.g. "Housing costs are above 35% of income.")

### What This Means Text (TASK 2)
- Added flexShrink and flexWrap to hook text style — prevents truncation

### Ticker Speed (TASK 3)
- Added `Easing.linear` to MarketTicker animation — stops acceleration. Fixed 30s loop duration.

### Chart Scrubber (TASK 4)
- Replaced PanResponder with `TouchableWithoutFeedback` + `onPressIn`/`onPressOut` for Expo Go compatibility
- Added `onLayout` measurement for accurate touch-to-data mapping

### Wealth Journey (TASK 5)
- Removed `.slice(0, 2)` limit on default selection — all portfolios selected by default
- Removed `max 3` toggle limit — unlimited portfolio comparison on chart

### Learning Tier Gates (TASK 6)
- Intermediate and Advanced tiers show lock icon until "Watch Ad" is tapped
- 1.5s simulated ad delay, then unlocks tier in AsyncStorage
- Lock hint text below locked tiers

### Mini Games (TASK 7)
| File | Purpose |
|------|---------|
| `mobile/src/screens/games/ETFMatcherGame.tsx` | Memory card flip game: match 8 ETF tickers to descriptions |
| `mobile/src/screens/games/RiskQuizGame.tsx` | 5-question risk tolerance quiz with profile result |
- Both registered in App.tsx and types.ts
- LearningScreen game section navigates to actual games (etf_matcher → ETFMatcherGame, risk_quiz → RiskQuizGame)

*Last updated: 2026-04-09 — Phase 27 complete.*

---

## Phase 28 Changes — Compare Fix, Price Cache, Home Redesign, Portfolio Tracker (2026-04-10)

### Compare Screen Fixed Column Alignment (Step 1)
- Metric labels now in a fixed 110px-wide left column that never scrolls
- Portfolio data columns scroll horizontally together as one unit
- Winner cells get gold background (#F59E0B20) + gold text
- Single horizontal ScrollView instead of per-row scrollviews

### Builder Badge Removed from Budget (Step 2)
- Renamed 'Builder' to 'Housing-heavy' in spendingDNA function and insight text

### Startup Price Cache (Step 3)
- `api.py`: Module-level `_PRICE_CACHE` dict pre-fetches 30 core tickers on first use
- 4-hour refresh interval via `_refresh_price_cache()`
- New `/prices` GET endpoint returns cached prices for comma-separated tickers
- Core tickers: VTI, SPY, QQQ, AGG, BND, GLD, VWO, VNQ, ARKK, XLK, XLF, XLE, XLV, XLI, SCHD, DGRO, VB, IJR, SCHA, VEA, VXUS, TLT, IEF, SHY, GDX, USO, XLY, XLP, XLU, XLRE

### Home Screen Redesign (Step 4)
- Added `DailyChallenge` component: 20 rotating challenges (seeded by day of year), gold-bordered card
- `QuickStats` now shows "Day Streak" instead of "Badges" — tracks consecutive days user opened app via AsyncStorage
- Daily challenge navigates to portfolio builder on accept

### Current Portfolio Tracker (Step 5)
| File | Purpose |
|------|---------|
| `mobile/src/screens/CurrentPortfolioScreen.tsx` | **Created.** Real holdings tracker: total value hero card, holdings list with ticker/shares/cost, add/delete positions, AsyncStorage persistence under 'myHoldings' |

### Community Portfolio Sharing in Chat (Step 6)
- When user shares a portfolio, it now posts as a chat message too: "Shared: [name] | Grade [X] | [Y]% return"
- Appears in both Feed tab picker and Chat tab message list

### New Files
| File | Lines | Purpose |
|------|-------|---------|
| `PHASE28_SPEC.md` | 51 | Phase 28 feature spec |
| `PHASE28_CONTENT.md` | 194 | Rich lesson content for 12 lessons |
| `mobile/src/screens/CurrentPortfolioScreen.tsx` | 281 | Real holdings portfolio tracker |

### Modified Files
| File | What changed |
|------|-------------|
| `api.py` | Price cache, /prices endpoint, _refresh_price_cache() |
| `mobile/src/screens/CompareScreen.tsx` | Fixed column alignment with single horizontal scroll |
| `mobile/src/screens/BudgetScreen.tsx` | Builder renamed to Housing-heavy |
| `mobile/src/components/home/HomeWidgets.tsx` | DailyChallenge component, 20 challenges, streak-based QuickStats |
| `mobile/src/screens/WelcomeScreen.tsx` | DailyChallenge added, streak tracking via AsyncStorage |
| `mobile/src/screens/CommunityScreen.tsx` | Portfolio shares post to Chat tab |
| `mobile/src/types.ts` | Added CurrentPortfolio route |
| `mobile/App.tsx` | Registered CurrentPortfolioScreen |

*Last updated: 2026-04-10 — Phase 28 complete.*
