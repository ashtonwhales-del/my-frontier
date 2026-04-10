/**
 * HomeWidgets.tsx
 * Dashboard components for WelcomeScreen:
 *   - PortfolioSnapshot — best portfolio card or empty state
 *   - WeeklyInsight     — daily investing tip
 *   - QuickStats        — 3-card horizontal row
 *   - LearningProgress  — progress bar with continue link
 */
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import { NumberScale, HeadingScale, BodyScale, LabelStyle } from '../../theme/typography';
import { SavedPortfolio } from '../../types';

function gradeColor(g: string) {
  if (g === 'A') return Colors.positive;
  if (g === 'B') return Colors.brandBlue;
  if (g === 'C') return Colors.brandGold;
  return Colors.negative;
}

// ── PortfolioSnapshot ───────────────────────────────────────────────────────
interface SnapshotProps { portfolios: SavedPortfolio[]; navigation: any }

export function PortfolioSnapshot({ portfolios, navigation }: SnapshotProps) {
  if (portfolios.length === 0) {
    return (
      <TouchableOpacity style={ps.card} onPress={() => navigation.navigate('Categories', { name: 'Investor' })} activeOpacity={0.8}>
        <Text style={ps.emptyEmoji}>📊</Text>
        <Text style={ps.emptyTitle}>Build your first portfolio</Text>
        <Text style={ps.emptySub}>Pick sectors, set risk, get a personalized ETF allocation.</Text>
      </TouchableOpacity>
    );
  }

  // Show best portfolio
  const best = portfolios.reduce((a, b) =>
    a.result.scores.smart_score >= b.result.scores.smart_score ? a : b
  );
  const g = best.result.scores.grade;
  const ret = (best.result.performance.expected_annual_return * 100).toFixed(1);
  const score = best.result.scores.smart_score.toFixed(1);

  return (
    <View style={ps.card}>
      <View style={ps.row}>
        <Text style={[ps.gradeLetter, { color: gradeColor(g) }]}>{g}</Text>
        <View style={ps.info}>
          <Text style={ps.name} numberOfLines={1}>{best.name}</Text>
          <Text style={ps.meta}>{ret}% return  |  Score {score}/10</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('WealthTracker')} activeOpacity={0.7}>
        <Text style={ps.viewAll}>View All Portfolios  ›</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── WeeklyInsight ───────────────────────────────────────────────────────────
const INSIGHTS = [
  'ETFs give you instant diversification across hundreds of companies with one purchase.',
  'The expense ratio is the annual fee an ETF charges. Even 0.5% difference costs thousands over 30 years.',
  'Index ETFs outperform 80% of actively managed funds over any 10-year period.',
  'Dollar cost averaging means investing the same amount regularly regardless of market conditions.',
  'Time in the market beats timing the market.',
  'Starting investing at 25 vs 35 can result in twice the retirement wealth.',
  'Compound interest means your returns earn returns. It is the most powerful force in finance.',
  'Risk and return are always linked. Higher potential gains mean higher potential losses.',
  'Diversification is the only free lunch in investing. It reduces risk without reducing expected return.',
  'Your risk tolerance should match how well you sleep during a 30% market crash.',
  'Young investors can afford more risk. They have decades to recover from downturns.',
  'A 50% market drop requires a 100% gain just to break even. Manage risk carefully.',
  'Volatility is the price you pay for higher long-term returns.',
  'The Efficient Frontier shows every portfolio that maximizes return for a given level of risk.',
  'Harry Markowitz won the Nobel Prize in Economics for developing Modern Portfolio Theory.',
  'A portfolio of uncorrelated assets has lower risk than any single asset inside it.',
  'The Sharpe ratio measures how much return you get per unit of risk. Higher is always better.',
  'Correlation between assets is the key to true diversification, not just number of holdings.',
  'Adding international exposure to a US-only portfolio reduces volatility significantly.',
  'Bonds and stocks often move in opposite directions. Combining them smooths your ride.',
  'VTI tracks the entire US stock market with over 3,500 companies in one ETF.',
  'SPY tracks the S&P 500, the 500 largest US companies by market cap.',
  'QQQ tracks the Nasdaq-100, the 100 largest non-financial companies on Nasdaq.',
  'AGG is the most popular bond ETF. It holds thousands of US investment-grade bonds.',
  'GLD holds physical gold bars in vaults and tracks the gold price directly.',
  'REITs are required by law to distribute 90% of income as dividends.',
  'Dividend ETFs provide regular income while you hold them, not just price appreciation.',
  'Small-cap stocks have historically outperformed large-caps over long periods despite more volatility.',
  'Emerging market ETFs give exposure to fast-growing economies like India, Brazil, and Vietnam.',
  'Clean energy ETFs have outperformed traditional energy in 7 of the last 10 years.',
  'The average investor earns 1.5% less per year than the funds they invest in due to emotional trading.',
  'Panic selling during crashes locks in losses permanently. Historically every crash has recovered.',
  'Rebalancing annually keeps your risk level consistent and forces you to buy low and sell high.',
  'The best time to invest was yesterday. The second best time is today.',
  'Missing the 10 best days in the market over 20 years cuts your returns by more than half.',
  'Most professional fund managers underperform a simple index fund after fees.',
  'Checking your portfolio daily increases anxiety without improving returns.',
  'Automatic investing removes emotion from the equation. Set it and forget it.',
  'The 4% rule: in retirement you can withdraw 4% of your portfolio annually with low risk of running out.',
  'A $1,000/month investment at 8% annual return becomes $1.5 million in 30 years.',
  'Tax-advantaged accounts like IRAs compound faster because taxes do not eat your returns annually.',
  'An emergency fund of 3-6 months expenses prevents you from selling investments at the worst time.',
  'Inflation averages 3% per year. Money in a savings account loses purchasing power over time.',
  'Investing $50/week from age 22 to 65 at 8% return produces over $1 million.',
  'The difference between 6% and 8% annual returns on $10,000 over 30 years is $76,000.',
  'My Frontier uses the same mathematical model institutional investors use to build portfolios.',
  'Your Frontier Score measures how efficiently your portfolio converts risk into return.',
  'A diversification score above 7 means your portfolio is genuinely well-spread across asset classes.',
  'The stress test shows how your specific ETF weights would have performed in real historical crashes.',
  'Reoptimizing your portfolio every 90 days keeps it aligned with current market conditions.',
];

export function WeeklyInsight({ navigation }: { navigation: any }) {
  // Seed by date so it changes daily
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const insight = INSIGHTS[dayOfYear % INSIGHTS.length];

  return (
    <TouchableOpacity style={wi.card} onPress={() => navigation.navigate('Learning')} activeOpacity={0.8}>
      <Text style={wi.icon}>💡</Text>
      <Text style={wi.text}>{insight}</Text>
      <Text style={wi.link}>Learn more  ›</Text>
    </TouchableOpacity>
  );
}

// ── DailyChallenge ─────────────────────────────────────────────────────────
const CHALLENGES = [
  'Build a portfolio with Sharpe ratio above 1.2',
  'Add an international ETF to your allocation',
  'Check if your portfolio survived the 2008 crash test',
  'Build a Conservative portfolio with grade B or better',
  'Create a portfolio with 10+ ETFs for maximum diversification',
  'Build a portfolio that beats the S&P 500 expected return',
  'Try adding bonds to see how it affects your risk score',
  'Build your most aggressive portfolio yet',
  'Create a portfolio focused on dividends and income',
  'Compare two portfolios to find the more efficient one',
  'Build a portfolio with diversification score above 8',
  'Try clean energy sectors in your next portfolio',
  'Build a portfolio with less than 10% volatility',
  'Add emerging markets and see how it changes your return',
  'Build a portfolio that holds through the COVID crash test',
  'Create a balanced portfolio with grade B',
  'Try adding real estate ETFs for extra diversification',
  'Build your lowest-risk portfolio possible',
  'Create a portfolio with expected return above 15%',
  'Compare your best portfolio against your newest one',
];

export function DailyChallenge({ navigation }: { navigation: any }) {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const challenge = CHALLENGES[dayOfYear % CHALLENGES.length];
  return (
    <TouchableOpacity style={dc.card} onPress={() => navigation.navigate('Categories', { name: 'Investor' })} activeOpacity={0.8}>
      <Text style={dc.label}>DAILY CHALLENGE</Text>
      <Text style={dc.text}>{challenge}</Text>
      <Text style={dc.cta}>Accept Challenge  ›</Text>
    </TouchableOpacity>
  );
}

// ── QuickStats ──────────────────────────────────────────────────────────────
interface StatsProps { portfolioCount: number; bestScore: number | null; streak: number }

export function QuickStats({ portfolioCount, bestScore, streak }: StatsProps) {
  const stats = [
    { label: 'Portfolios', value: String(portfolioCount) },
    { label: 'Best Score', value: bestScore ? bestScore.toFixed(1) : '---' },
    { label: 'Day Streak', value: String(streak) },
  ];

  return (
    <View style={qs.row}>
      {stats.map(s => (
        <View key={s.label} style={qs.card}>
          <Text style={qs.value}>{s.value}</Text>
          <Text style={qs.label}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ── LearningProgress ────────────────────────────────────────────────────────
interface LearnProps { completed: number; total: number; navigation: any }

export function LearningProgress({ completed, total, navigation }: LearnProps) {
  const pct = total > 0 ? (completed / total) * 100 : 0;
  return (
    <TouchableOpacity style={lp.card} onPress={() => navigation.navigate('Learning')} activeOpacity={0.8}>
      <View style={lp.top}>
        <Text style={lp.label}>📚  Learning Center</Text>
        <Text style={lp.count}>{completed} of {total}</Text>
      </View>
      <View style={lp.barBg}>
        <View style={[lp.barFill, { width: `${Math.min(pct, 100)}%` }]} />
      </View>
      <Text style={lp.cont}>Continue  ›</Text>
    </TouchableOpacity>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const ps = StyleSheet.create({
  card:        { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Spacing.lg, marginBottom: Spacing.lg },
  row:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginBottom: Spacing.md },
  gradeLetter: { fontSize: 48, fontWeight: '900', lineHeight: 54 },
  info:        { flex: 1 },
  name:        { ...HeadingScale.md, color: Colors.textPrimary, marginBottom: 2 },
  meta:        { ...BodyScale.sm, color: Colors.textSecondary },
  viewAll:     { ...BodyScale.sm, color: Colors.brandBlue, fontWeight: '600', textAlign: 'right' },
  emptyEmoji:  { fontSize: 36, textAlign: 'center', marginBottom: Spacing.sm },
  emptyTitle:  { ...HeadingScale.md, color: Colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  emptySub:    { ...BodyScale.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },
});

const wi = StyleSheet.create({
  card:  { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Spacing.lg, marginBottom: Spacing.lg },
  icon:  { fontSize: 22, marginBottom: Spacing.sm },
  text:  { ...BodyScale.md, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.sm },
  link:  { ...BodyScale.sm, color: Colors.brandBlue, fontWeight: '600' },
});

const dc = StyleSheet.create({
  card: { backgroundColor: '#F59E0B12', borderRadius: Radius.lg, borderWidth: 1, borderColor: '#F59E0B', padding: Spacing.lg, marginBottom: Spacing.lg },
  label: { fontSize: 10, fontWeight: '700', color: '#F59E0B', letterSpacing: 1.2, marginBottom: Spacing.sm },
  text: { ...BodyScale.md, color: Colors.textPrimary, fontWeight: '600', lineHeight: 22, marginBottom: Spacing.sm },
  cta: { ...BodyScale.sm, color: '#F59E0B', fontWeight: '600' },
});

const qs = StyleSheet.create({
  row:   { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  card:  { flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Spacing.md, alignItems: 'center' },
  value: { fontSize: 24, fontWeight: '900', color: Colors.brandGold, marginBottom: 2 },
  label: { ...BodyScale.sm, color: Colors.textTertiary },
});

const lp = StyleSheet.create({
  card:    { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Spacing.lg, marginBottom: Spacing.lg },
  top:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  label:   { ...BodyScale.md, color: Colors.textPrimary, fontWeight: '600' },
  count:   { ...BodyScale.sm, color: Colors.textSecondary },
  barBg:   { height: 6, backgroundColor: Colors.bgInput, borderRadius: 3, marginBottom: Spacing.sm },
  barFill: { height: 6, backgroundColor: Colors.brandBlue, borderRadius: 3 },
  cont:    { ...BodyScale.sm, color: Colors.brandBlue, fontWeight: '600', textAlign: 'right' },
});
