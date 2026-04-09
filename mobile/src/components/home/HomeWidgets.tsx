/**
 * HomeWidgets.tsx
 * Dashboard components for WelcomeScreen:
 *   - HomeMarketPulse  — clean market card (no dashes, no emoji mid-sentence)
 *   - DashboardGrid    — 2x2 tappable shortcut cards
 *   - RecentPortfolios — horizontal scroll of saved portfolio cards
 */
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import { HeadingScale, BodyScale, LabelStyle } from '../../theme/typography';
import { MarketPulseData, SavedPortfolio } from '../../types';

// ── Sentiment sentences (no dashes) ────────────────────────────────────────
const SENTIMENT_TEXT: Record<string, string> = {
  bullish:  'Equity markets are up today. Growth portfolios are performing well.',
  bearish:  'Markets pulled back today. Bonds are providing stability.',
  neutral:  'Markets are moving sideways. A steady day for diversified portfolios.',
};

function fmtChange(val: number): string {
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}

function gradeColor(g: string) {
  if (g === 'A') return Colors.positive;
  if (g === 'B') return Colors.brandBlue;
  if (g === 'C') return Colors.brandGold;
  return Colors.negative;
}

// ── HomeMarketPulse ─────────────────────────────────────────────────────────
interface PulseProps { pulse: MarketPulseData | null }

export function HomeMarketPulse({ pulse }: PulseProps) {
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const sentiment = pulse?.sentiment ?? 'neutral';
  const sentenceText = SENTIMENT_TEXT[sentiment] ?? SENTIMENT_TEXT.neutral;

  return (
    <View style={pw.card}>
      <View style={pw.row}>
        <Text style={pw.title}>Market Today</Text>
        <Text style={pw.time}>{now}</Text>
      </View>
      {pulse ? (
        <>
          {[
            { label: 'S&P 500', val: pulse.spy_change },
            { label: 'NASDAQ', val: pulse.qqq_change },
            { label: 'Bonds',  val: pulse.agg_change },
          ].map(row => (
            <View key={row.label} style={pw.tickerRow}>
              <Text style={pw.tickerLabel}>{row.label}</Text>
              <View style={[pw.badge, { backgroundColor: row.val >= 0 ? Colors.positiveSubtle : Colors.negativeSubtle }]}>
                <Text style={[pw.badgeText, { color: row.val >= 0 ? Colors.positive : Colors.negative }]}>
                  {fmtChange(row.val)}
                </Text>
              </View>
            </View>
          ))}
          <Text style={pw.sentiment}>{sentenceText}</Text>
        </>
      ) : (
        <Text style={pw.loading}>Loading market data...</Text>
      )}
    </View>
  );
}

// ── DashboardGrid ───────────────────────────────────────────────────────────
interface GridCard { emoji: string; title: string; subtitle: string; onPress: () => void }
interface GridProps {
  portfolioCount: number;
  bestGrade: string | null;
  lessonsComplete: number;
  badgeCount: number;
  navigation: any;
}

export function DashboardGrid({ portfolioCount, bestGrade, lessonsComplete, badgeCount, navigation }: GridProps) {
  const cards: GridCard[] = [
    {
      emoji: '📊',
      title: 'Portfolio',
      subtitle: bestGrade ? `Best grade: ${bestGrade}` : portfolioCount > 0 ? `${portfolioCount} saved` : 'None yet',
      onPress: () => navigation.navigate('WealthTracker'),
    },
    {
      emoji: '💰',
      title: 'Budget',
      subtitle: 'Track spending',
      onPress: () => navigation.navigate('Budget'),
    },
    {
      emoji: '📚',
      title: 'Learn',
      subtitle: `${lessonsComplete}/12 lessons`,
      onPress: () => navigation.navigate('Learning'),
    },
    {
      emoji: '🏆',
      title: 'Achievements',
      subtitle: `${badgeCount} badge${badgeCount !== 1 ? 's' : ''} earned`,
      onPress: () => navigation.navigate('Profile'),
    },
  ];

  return (
    <View style={dg.grid}>
      {cards.map(card => (
        <TouchableOpacity key={card.title} style={dg.card} onPress={card.onPress} activeOpacity={0.75}>
          <Text style={dg.emoji}>{card.emoji}</Text>
          <Text style={dg.cardTitle}>{card.title}</Text>
          <Text style={dg.cardSub} numberOfLines={1}>{card.subtitle}</Text>
          <Text style={dg.arrow}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── RecentPortfolios ────────────────────────────────────────────────────────
interface RecentProps { portfolios: SavedPortfolio[]; navigation: any }

export function RecentPortfolios({ portfolios, navigation }: RecentProps) {
  if (portfolios.length === 0) return null;

  return (
    <View style={rp.section}>
      <Text style={rp.sectionLabel}>RECENT PORTFOLIOS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={rp.row}>
        {portfolios.map(p => {
          const grade = p.result.scores.grade;
          const ret = p.result.performance.expected_annual_return;
          const date = new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <TouchableOpacity
              key={p.id}
              style={rp.card}
              onPress={() => navigation.navigate('Results', { data: p.data })}
              activeOpacity={0.8}
            >
              <Text style={[rp.grade, { color: gradeColor(grade) }]}>{grade}</Text>
              <Text style={rp.name} numberOfLines={1}>{p.name}</Text>
              <Text style={rp.ret}>{(ret * 100).toFixed(1)}%/yr</Text>
              <Text style={rp.date}>{date}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const pw = StyleSheet.create({
  card:        { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Spacing.lg, marginBottom: Spacing.lg },
  row:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  title:       { ...HeadingScale.md, color: Colors.textPrimary },
  time:        { ...BodyScale.sm, color: Colors.textTertiary },
  tickerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  tickerLabel: { ...BodyScale.md, color: Colors.textSecondary },
  badge:       { borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:   { fontSize: 13, fontWeight: '700' },
  sentiment:   { ...BodyScale.sm, color: Colors.textTertiary, marginTop: Spacing.sm, lineHeight: 18 },
  loading:     { ...BodyScale.sm, color: Colors.textTertiary, textAlign: 'center', paddingVertical: Spacing.md },
});

const dg = StyleSheet.create({
  grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  card:      { width: '48.5%', backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Spacing.md, minHeight: 90 },
  emoji:     { fontSize: 22, marginBottom: 4 },
  cardTitle: { ...BodyScale.md, color: Colors.textPrimary, fontWeight: '700', marginBottom: 2 },
  cardSub:   { ...BodyScale.sm, color: Colors.textSecondary },
  arrow:     { position: 'absolute', bottom: Spacing.sm, right: Spacing.md, fontSize: 20, color: Colors.textTertiary },
});

const rp = StyleSheet.create({
  section:      { marginBottom: Spacing.xl },
  sectionLabel: { ...LabelStyle, color: Colors.textTertiary, marginBottom: Spacing.sm },
  row:          { gap: Spacing.sm, paddingBottom: 4 },
  card:         { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Spacing.md, width: 110, alignItems: 'center' },
  grade:        { fontSize: 32, fontWeight: '900', lineHeight: 38 },
  name:         { ...BodyScale.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },
  ret:          { ...BodyScale.sm, color: Colors.positive, fontWeight: '700', marginTop: 2 },
  date:         { ...BodyScale.sm, color: Colors.textTertiary, marginTop: 2 },
});
