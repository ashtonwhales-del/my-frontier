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
import { BodyScale } from '../../theme/typography';

// ── DailyChallenge ─────────────────────────────────────────────────────────
const CHALLENGES = [
  { title: 'Build a portfolio with Sharpe above 1.2', explain: 'The Sharpe ratio measures return per unit of risk. Above 1.2 is excellent.', screen: 'Categories', params: { name: 'Investor' } },
  { title: 'Add international ETFs to your portfolio', explain: 'International ETFs like VWO expose you to faster-growing economies.', screen: 'Categories', params: { name: 'Investor' } },
  { title: 'Stress test your portfolio against 2008', explain: 'The 2008 crisis dropped markets 57%. See how your portfolio survives.', screen: 'WealthTracker', params: undefined },
  { title: 'Set a savings goal for something you want', explain: 'Goal-based investing ties your money to real milestones.', screen: 'GoalBuckets', params: undefined },
  { title: 'Enter your bills in the Bill Negotiator', explain: 'Most people overpay $200-500/year. Negotiating saves thousands.', screen: 'BillNegotiation', params: undefined },
  { title: 'Build an aggressive portfolio and stress test it', explain: 'Aggressive portfolios can drop 40-50%. Knowing this prevents panic.', screen: 'Categories', params: { name: 'Investor' } },
  { title: 'Add a second income source to your budget', explain: 'Multiple income streams reduce financial risk dramatically.', screen: 'Budget', params: undefined },
  { title: 'Check your Net Worth Timeline milestone ages', explain: 'Seeing projected wealth at 40, 50, 60 makes numbers feel real.', screen: 'NetWorthTimeline', params: undefined },
  { title: 'Compare two of your portfolios side by side', explain: 'Comparing portfolios shows which decisions improved your returns.', screen: 'Compare', params: undefined },
  { title: 'Find an affordable city in the Housing tool', explain: 'The 30% rule says housing should be under 30% of income.', screen: 'Housing', params: undefined },
];

export function DailyChallenge({ navigation }: { navigation: any }) {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const ch = CHALLENGES[dayOfYear % CHALLENGES.length];
  return (
    <TouchableOpacity style={dc.card} onPress={() => navigation.navigate(ch.screen as any, ch.params)} activeOpacity={0.8}>
      <Text style={dc.label}>DAILY CHALLENGE</Text>
      <Text style={dc.text}>{ch.title}</Text>
      <Text style={dc.explain}>{ch.explain}</Text>
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

// ── Styles ──────────────────────────────────────────────────────────────────
const dc = StyleSheet.create({
  card: { backgroundColor: '#F59E0B12', borderRadius: Radius.lg, borderWidth: 1, borderColor: '#F59E0B', padding: Spacing.lg, marginBottom: Spacing.lg },
  label: { fontSize: 10, fontWeight: '700', color: '#F59E0B', letterSpacing: 1.2, marginBottom: Spacing.sm },
  text: { ...BodyScale.md, color: Colors.textPrimary, fontWeight: '600', lineHeight: 22, marginBottom: 4 },
  explain: { ...BodyScale.sm, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.sm },
  cta: { ...BodyScale.sm, color: '#F59E0B', fontWeight: '600' },
});

const qs = StyleSheet.create({
  row:   { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  card:  { flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Spacing.md, alignItems: 'center' },
  value: { fontSize: 24, fontWeight: '900', color: Colors.brandGold, marginBottom: 2 },
  label: { ...BodyScale.sm, color: Colors.textTertiary },
});

// LearningProgress and PortfolioSnapshot styles removed (dead code)
