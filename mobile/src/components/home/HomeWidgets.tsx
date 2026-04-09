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
  'Diversification reduces risk without sacrificing expected returns.',
  'Time in the market beats timing the market.',
  'A portfolio with 15+ uncorrelated assets approaches the Efficient Frontier.',
  'Low expense ratios compound into massive savings over 30 years.',
  'Rebalancing annually can improve risk-adjusted returns by 0.5% per year.',
  'Dollar-cost averaging smooths out volatility over time.',
  'Index funds outperform 90% of actively managed funds over 15 years.',
  'Your biggest risk as a young investor is not taking enough risk.',
  'Compound interest is the eighth wonder of the world.',
  'A 1% fee difference costs you 25% of your portfolio over 35 years.',
  'Starting to invest at 25 vs 35 can double your retirement savings.',
  'Bonds reduce portfolio volatility during stock market crashes.',
  'International diversification protects against single-country risk.',
  'Small-cap stocks have historically outperformed large-caps long-term.',
  'Tax-advantaged accounts can save you thousands per year in taxes.',
  'Emergency funds should cover 3-6 months of expenses before investing.',
  'REITs provide real estate exposure without buying property.',
  'The S&P 500 has returned an average of 10% per year since 1926.',
  'Behavioral finance shows that panic selling is the biggest destroyer of wealth.',
  'ETFs trade like stocks but give you instant diversification.',
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

// ── QuickStats ──────────────────────────────────────────────────────────────
interface StatsProps { portfolioCount: number; bestScore: number | null; badgeCount: number }

export function QuickStats({ portfolioCount, bestScore, badgeCount }: StatsProps) {
  const stats = [
    { label: 'Portfolios', value: String(portfolioCount) },
    { label: 'Best Score', value: bestScore ? bestScore.toFixed(1) : '---' },
    { label: 'Badges', value: String(badgeCount) },
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
