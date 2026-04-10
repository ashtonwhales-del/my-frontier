export interface OnboardingData {
  name: string;
  categories: string[];
  riskTolerance: number;
  lumpSum: number;
  weeklyContribution: number;
  age: number;
}

export interface HoldingResult {
  ticker: string;
  name: string;
  description: string;
  weight: number;
  lump_sum_amount: number;
  weekly_amount: number;
  historical_annual_return_pct: number;
  top_holdings: string[];
}

export interface ProjectionPoint {
  years: number;
  at_age: number;
  conservative: number;
  optimistic: number;
}

export interface PortfolioScores {
  smart_score: number;
  risk_score_pct: number;
  diversification_score: number;
  grade: string;
}

export interface PortfolioPerformanceResult {
  expected_annual_return: number;
  annual_volatility: number;
  sharpe_ratio: number;
}

export interface InvestorProfile {
  name: string;
  categories: string[];
  risk_tolerance: number;
  risk_label: string;
  lump_sum: number;
  weekly_contribution: number;
  age: number;
}

export interface OptimizeResponse {
  profile: InvestorProfile;
  performance: PortfolioPerformanceResult;
  scores: PortfolioScores;
  holdings: HoldingResult[];
  projections: ProjectionPoint[];
}

export interface SavedPortfolio {
  id: string;
  name: string;          // user-given nickname, e.g. "My Tech Portfolio"
  createdAt: number;     // unix ms timestamp
  data: OnboardingData;
  result: OptimizeResponse;
}

export interface TickerQuote {
  symbol: string;
  price: number;
  change_pct: number;
}

export interface MarketPulseData {
  spy_change: number;
  qqq_change: number;
  agg_change: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  message: string;
  tickers?: TickerQuote[];
}

export interface HistoricalPoint {
  date: string;
  portfolio: number;
  spy: number;
}

export interface LeaderboardRank {
  percentile: number;
  total_submissions: number;
}

export interface BudgetContext {
  monthlyIncome: number;
  totalExpenses: number;
  surplus: number;
  spendingDNA: string;
}

export type RootStackParamList = {
  Disclaimer:        undefined;
  Onboarding:        undefined;
  Welcome:           undefined;
  Categories:        { name: string };
  RiskTolerance:     { name: string; categories: string[] };
  Investment:        { name: string; categories: string[]; riskTolerance: number };
  Results:           { data: OnboardingData };
  Advisor:           { portfolio?: OptimizeResponse; budgetContext?: BudgetContext };
  WealthTracker:     undefined;
  Premium:           undefined;
  Privacy:           undefined;
  Terms:             undefined;
  About:             undefined;
  Learning:          undefined;
  Compare:           undefined;
  Budget:            undefined;
  NetWorth:          undefined;
  DebtPayoff:        undefined;
  DebtPlanner:       undefined;
  SubscriptionAudit: undefined;
  MyPortfolio:       undefined;
  CurrentPortfolio:  undefined;
  Community:         undefined;
  LessonReader:      { lessonId: string; title: string; pages: string[]; tier: string };
  ETFMatcherGame:    undefined;
  RiskQuizGame:      undefined;
  FinancialHealth:   undefined;
  NetWorthTimeline:  undefined;
  GoalBuckets:       undefined;
  BillNegotiation:   undefined;
  Profile:           undefined;
};
