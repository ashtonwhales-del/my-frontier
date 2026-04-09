# Phase 16 Feature Spec

## DEV MODE — Do first
premiumService.ts: DEV_MODE=true constant, all premium checks return true, all limits=Infinity
Comment: // SET TO FALSE BEFORE APP STORE SUBMISSION

## Market Ticker Tape
- Top of WelcomeScreen + ResultsScreen header
- Height 36px, bg #0A0F1E, border #1E2A45
- Tickers: SPY QQQ DIA IWM VTI AGG GLD SLV USO BTC-USD ETH-USD AAPL MSFT NVDA TSLA AMZN
- Auto-scroll left via Animated.loop, full loop 25 seconds
- Backend /market-pulse: return all 17 tickers, cache 5min
- Each item: symbol bold white, price, green/red % pill

## Category Selector 3-Step Funnel
Step1 StyleSelector.tsx
Step2 CategoryPicker.tsx
Step3 ContributionStep.tsx

## Alex Fix
/alex endpoint: trim context, 20s timeout, retry once

## Ad Placements
Per PHASE16_ADS.md. DEV_MODE=true skips all ads.

## CompareScreen Unlimited
Premium: no limit, horizontal scroll for 3+.

## Historical Chart Fix
DEV_MODE unlocks automatically. Mock curve fallback on timeout.

## Help System
HelpSystem.tsx: floating FAB, context-sensitive help.

## Premium Features — Make Fully Functional
HistoricalChart, DebtPayoff, SubscriptionAudit, NetWorthScreen, SavingsStreak, LearningScreen games
