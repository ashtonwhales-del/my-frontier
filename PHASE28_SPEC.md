# Phase 28 Spec

## PRIORITY 1 — Fix Compare Screen Column Alignment
CompareScreen.tsx: metric label column must be FIXED (not scrolling).
Portfolio data columns scroll horizontally together as one unit.
Use a FlatList with horizontal={true} for portfolio columns only.
Metric labels in a fixed left View (width 110px).
Each portfolio column width 120px minimum.
All rows: Grade/Score/Return%/Risk%/Sharpe/Diversification/ETF Count/30yr Value.
Winner cell in each row: gold background (#F59E0B20) + gold text.

## PRIORITY 2 — Remove Builder Badge from Budget
In BudgetScreen.tsx find every instance of 'Builder' text or emoji pill.
Delete entirely. No replacement needed.

## PRIORITY 3 — Home Screen Daily Engagement Redesign
Replace the static home screen with a dynamic daily experience.

New sections (top to bottom):
1. MarketTicker (keep — scrolling at fixed speed)
2. Header: "MY FRONTIER" gold + greeting + date
3. DAILY FINANCIAL PULSE card (new — most important)
   - "Today's Market" — SPY change % with sentiment color
   - "Your Best Portfolio" — shows top-scoring saved portfolio grade + return
   - "Daily Challenge" — rotating investing challenge
   - "Daily Insight" — one investing fact (from the 50 tips list)
4. QUICK STATS row (3 cards): Portfolios Built | Best Score | Days Streak
5. MY PORTFOLIO SNAPSHOT card (if holdings exist)
6. Build New Portfolio button (blue gradient)
7. Open Budget / Open Learning row

## PRIORITY 4 — Portfolio Calculation Speed
In api.py add a startup price cache for 30 core tickers.
Store as module-level dict, refresh every 4 hours.
Use cached prices in optimize endpoint for any ticker in cache.
Only call yfinance for tickers NOT in cache.

## PRIORITY 5 — Current Portfolio Tracker
Create mobile/src/screens/CurrentPortfolioScreen.tsx
Real holdings tracker: total value, holdings list, add/edit/delete,
daily snapshots, performance section, chart with time ranges.

## PRIORITY 6 — Community Portfolio Sharing in Chat
Portfolio shares appear in both Feed and Chat tabs as special cards.

## PRIORITY 7 — All Charts: Touch Scrubbing
Apply TouchableWithoutFeedback scrubber to all chart components.

## PRIORITY 8 — Rich Learning Content
Replace all lesson content with rich multi-paragraph text.
Each lesson: minimum 5 pages, engaging analogies, concrete numbers.
