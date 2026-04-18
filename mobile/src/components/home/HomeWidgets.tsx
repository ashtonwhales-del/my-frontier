/**
 * HomeWidgets.tsx
 * Dashboard components for WelcomeScreen:
 *   - DailyChallenge — rotating challenge card
 *   - QuickStats     — 3-card horizontal row
 */
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Spacing, Radius } from '../../theme/spacing';
import { BodyScale } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';

// ── DailyChallenge ─────────────────────────────────────────────────────────
const CHALLENGES = [
  { title: 'Build a portfolio with Sharpe above 1.2', explain: 'The Sharpe ratio measures return per unit of risk. Above 1.2 is excellent.', screen: 'Categories', params: { name: 'Investor' } },
  { title: 'Add international ETFs to your portfolio', explain: 'International ETFs like VWO expose you to faster-growing economies.', screen: 'Categories', params: { name: 'Investor' } },
  { title: 'Stress test your portfolio against 2008', explain: 'The 2008 crisis dropped markets 57%. See how your portfolio survives.', screen: 'WealthTracker', params: undefined },
  { title: 'Build an aggressive portfolio and stress test it', explain: 'Aggressive portfolios can drop 40-50%. Knowing this prevents panic.', screen: 'Categories', params: { name: 'Investor' } },
  { title: 'Compare two of your portfolios side by side', explain: 'Comparing portfolios shows which decisions improved your returns.', screen: 'Compare', params: undefined },
  { title: 'Create a debt repayment plan today', explain: 'Paying off high-interest debt first (Avalanche) saves the most money.', screen: 'DebtPlanner', params: undefined },
  { title: 'Track your current holdings in the Portfolio tab', explain: 'Knowing exactly what you own helps you make better rebalancing decisions.', screen: 'WealthTracker', params: undefined },
];

export function DailyChallenge({ navigation }: { navigation: any }) {
  const { palette } = useTheme();
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const ch = CHALLENGES[dayOfYear % CHALLENGES.length];
  return (
    <TouchableOpacity
      style={[dc.card, { backgroundColor: palette.signalAmberSoft, borderColor: palette.signalAmber }]}
      onPress={() => navigation.navigate(ch.screen as any, ch.params)}
      activeOpacity={0.8}
    >
      <Text style={[dc.label, { color: palette.signalAmber }]}>DAILY CHALLENGE</Text>
      <Text style={[dc.text, { color: palette.textPrimary }]}>{ch.title}</Text>
      <Text style={[dc.explain, { color: palette.textSecondary }]}>{ch.explain}</Text>
      <Text style={[dc.cta, { color: palette.signalAmber }]}>Accept Challenge  ›</Text>
    </TouchableOpacity>
  );
}

// ── QuickStats ──────────────────────────────────────────────────────────────
interface StatsProps { portfolioCount: number; bestScore: number | null; streak: number }

export function QuickStats({ portfolioCount, bestScore, streak }: StatsProps) {
  const { palette } = useTheme();
  const stats = [
    { label: 'Portfolios', value: String(portfolioCount) },
    { label: 'Best Score', value: bestScore ? bestScore.toFixed(1) : '---' },
    { label: 'Day Streak', value: String(streak) },
  ];

  return (
    <View style={qs.row}>
      {stats.map(s => (
        <View
          key={s.label}
          style={[qs.card, { backgroundColor: palette.bgElevated, borderColor: palette.borderSubtle }]}
        >
          <Text style={[qs.value, { color: palette.accent }]}>{s.value}</Text>
          <Text style={[qs.label, { color: palette.textTertiary }]}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Styles (non-color only) ─────────────────────────────────────────────────
const dc = StyleSheet.create({
  card:    { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, marginBottom: Spacing.lg },
  label:   { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: Spacing.sm },
  text:    { ...BodyScale.md, fontWeight: '600', lineHeight: 22, marginBottom: 4 },
  explain: { ...BodyScale.sm, lineHeight: 18, marginBottom: Spacing.sm },
  cta:     { ...BodyScale.sm, fontWeight: '600' },
});

const qs = StyleSheet.create({
  row:   { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  card:  { flex: 1, borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, alignItems: 'center' },
  value: { fontSize: 24, fontWeight: '900', marginBottom: 2, fontVariant: ['tabular-nums'] },
  label: { ...BodyScale.sm },
});
