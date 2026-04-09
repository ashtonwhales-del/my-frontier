# Budget Hub Spec

## Core Loop
Income entered → expenses entered → surplus = income - expenses
→ weekly = surplus/4.33
→ "Build My Portfolio →" button pre-fills optimizer weekly contribution with that amount
This is the killer feature. Make the CTA prominent.

## Files to create

### mobile/src/screens/BudgetScreen.tsx
- Income card: Card+goldGlow, numberLG when filled, "Tap to add income" muted when empty
- 10 category grid (2 cols): Housing/Transport/Food/Utilities/Subscriptions/Entertainment/Shopping/Health/Education/Other
- Each cell: Card, emoji, name label muted, amount numberSM white, green left-border=filled, red=over limit
- Sticky summary bar: "Allocated $X" left | "Remaining $X" right (green if positive, red if negative)
- Investing Opportunity card: Card+blueGlow below summary
  "💡 Your Investing Opportunity"
  "$X left this month → $Y/week invested → $Z in 30 years"
  GradientButton blue "Build My Portfolio →" — passes weeklyAmount to optimizer
- Spending DNA pill below card:
  Saver <70% → emerald | Balancer 70-85% → blue | Optimizer high-subs → gold | Builder housing>35% → amber | Spender >95% → red
- AsyncStorage persistence. Free=current month only. Premium=12mo history.

### mobile/src/screens/NetWorthScreen.tsx
- Hero: "NET WORTH" label gold, numberXL white or negative color, month-over-month StatBadge
- Assets Card: Checking/Savings | Investments (auto-pull from saved My Frontier portfolios) | Home | Vehicle | Retirement | Other — each row tap-to-edit
- Liabilities Card: Mortgage | Car Loan | Student Loans | Credit Cards | Other
- Line chart: brandBlue line, bgCard fill, touch for values. Free=3 snapshots, Premium=full history.

### mobile/src/components/budget/RuleAnalyzer.tsx
- 3 progress bars: Needs(50% target) | Wants(30%) | Savings/Investing(20%)
- brandBlue fill, turns positive color when on/under target, negative when over
- Gap message: "You should be investing $X/mo. You have $Y available."

### mobile/src/components/budget/SavingsStreak.tsx
- Track consecutive surplus months in AsyncStorage
- Flame row: filled=streak month, empty=broken
- Auto-award badges at 3/6/12 months

### mobile/src/components/budget/SubscriptionAudit.tsx — PREMIUM
- List: name/monthly cost/keep-cancel toggle
- Auto-total monthly + annual
- Impact: "Cutting X saves $Y/mo → $Z extra in your 30yr portfolio"
- Lock overlay + "Unlock Pro" CTA for free users

### mobile/src/components/budget/DebtPayoff.tsx — PREMIUM
- Debt entries: name/balance/rate/min payment (tap + to add)
- Avalanche card (highest rate first) vs Snowball card (lowest balance first)
- Each: months-to-free numberMD, total interest StatBadge negative
- "Debt-Free Date:" large brandGold — the emotional anchor
- Bridge CTA: "Once debt-free, redirect $X/mo → My Frontier. 20yr projection: $Y"
- Lock overlay for free users

## premiumService.ts FREE_LIMITS — add these
budgetMonthsHistory:1
budgetCustomCategories:0
netWorthSnapshots:3
debtPayoffPlanner:false
subscriptionAudit:false
savingsStreakHistory:false

## Alex integration
When AdvisorScreen launched from BudgetScreen pass context:
{ monthlyIncome, totalExpenses, surplus, spendingDNA }
Budget suggested questions (replace portfolio ones when in budget context):
"Am I spending too much on food?"
"How do I find more money to invest?"
"What is the 50/30/20 rule?"
"Should I pay off debt or invest first?"

## Navigation
Budget stack in App.tsx: BudgetScreen → NetWorthScreen → DebtPayoff → SubscriptionAudit
Add 💰 Budget tab to BottomNav between Portfolio and Learn
