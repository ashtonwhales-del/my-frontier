# My Frontier — Master Expansion Phases 29-34

## DATA ARCHITECTURE
All new features store data in AsyncStorage only. Zero new backend costs.
Existing data sources to leverage:
- savedPortfolios (AsyncStorage) — portfolio grades, scores, returns
- budgetData (AsyncStorage) — income, expenses, categories
- savedDebts (AsyncStorage) — debt balances, APR, minimum payments
- myHoldings (AsyncStorage) — real portfolio holdings (Phase 28)
- communityChat / communityPosts (AsyncStorage) — community data

## PHASE 29 — Financial Health Score
New component: mobile/src/components/FinancialHealthScore.tsx

Score calculation (0-100 total):
INVESTING RATE (30 pts max):
  - Load budgetData. Calculate: weeklyInvestment / weeklyIncome * 100
  - 20%+ of income invested = 30 pts
  - 10-19% = 20 pts, 5-9% = 10 pts, <5% = 5 pts, 0% = 0 pts

DEBT RATIO (25 pts max):
  - Load savedDebts. Calculate: totalMinPayments / monthlyIncome * 100
  - 0% (no debt) = 25 pts
  - <15% = 20 pts, 15-30% = 12 pts, 30-50% = 5 pts, >50% = 0 pts

PORTFOLIO QUALITY (25 pts max):
  - Load savedPortfolios. Take highest Frontier Score.
  - Score 9+ = 25 pts, 7.5+ = 20 pts, 6+ = 12 pts, 4.5+ = 5 pts, none = 0 pts

CONSISTENCY STREAK (20 pts max):
  - Load appStreak from AsyncStorage
  - 30+ days = 20 pts, 14+ = 15 pts, 7+ = 10 pts, 3+ = 5 pts, <3 = 2 pts

Display on home screen as circular progress ring with grade label.
Tap opens FinancialHealthScreen with full breakdown.

## PHASE 30 — Net Worth Timeline
New screen: mobile/src/screens/NetWorthTimelineScreen.tsx
Two projection lines: current path vs optimized path (+20% more invested).
Milestones: debt-free, $100K, $500K, $1M, retirement estimate.
Touch scrubber for age/net worth at any point.
Ask user for current age on first visit.

## PHASE 31 — Goal Buckets
New screen: mobile/src/screens/GoalBucketsScreen.tsx
Goal structure: name, targetAmount, targetDate, currentSaved, icon.
Auto-calculates required weekly contribution via compound interest.
Suggests ETF allocation based on time horizon.
Home screen shows goal cards with progress bars.

## PHASE 32 — Bill Negotiation Center
New screen: mobile/src/screens/BillNegotiationScreen.tsx
National averages for Internet, Cell, Insurance, Streaming, Gym, Utilities.
Red/green badges for over/under average.
Negotiation scripts per category.
Potential annual savings calculation.

## PHASE 33 — Multiple Income Streams
Add to Budget screen as expandable section.
Income source types: W2, Freelance, Rental, Dividends, Side Business, Other.
Each source: name, type, amount, frequency.
Total feeds into investing gap calculation.

## PHASE 34 — Housing Affordability Tool
New screen: mobile/src/screens/HousingScreen.tsx
Affordability calculator (30%/28%/25% rules).
Buy vs Rent calculator with mortgage math.
Links to Apartments.com, Zillow, Bankrate.

## HOME SCREEN INTEGRATION
New layout: Financial Health Score hero, Goal Progress, Net Worth Snapshot,
Best Portfolio card, Quick action + quick link rows.

## NAVIGATION ADDITIONS
Add to App.tsx + types.ts:
FinancialHealth, NetWorthTimeline, GoalBuckets, BillNegotiation, Housing
