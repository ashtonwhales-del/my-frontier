/**
 * WelcomeScreen.tsx — Home Dashboard
 * Financial dashboard shown to returning users every session.
 * Split: heavy sub-components live in components/home/HomeWidgets.tsx
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList, SavedPortfolio, MarketPulseData } from '../types';
import { STORAGE } from '../constants';
import { Spacing, Radius } from '../theme/spacing';
import { BodyScale } from '../theme/typography';
import { getSemanticDataColor } from '../theme/chartColors';
import { fetchMarketPulse } from '../api';
import { useTheme } from '../context/ThemeContext';
import { haptic } from '../utils/haptic';
import TabShell from '../components/TabShell';
import MarketTicker from '../components/MarketTicker';
import Sparkline from '../components/charts/Sparkline';
import { DailyChallenge, QuickStats } from '../components/home/HomeWidgets';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Welcome'> };

const tabularNumbers = { fontVariant: ['tabular-nums' as const] };

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function fmtCurrency(n: number): string {
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
  return '$' + Math.round(n).toString();
}

// ── HeroNumber — large animated count-up ───────────────────────────────────
function HeroNumber({ value, color }: { value: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    anim.setValue(0);
    const id = anim.addListener(({ value: v }) => setDisplay(v * value));
    Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [value, anim]);

  return (
    <Text style={[heroStyles.hero, tabularNumbers, { color }]}>{fmtCurrency(display)}</Text>
  );
}

const heroStyles = StyleSheet.create({
  hero: { fontSize: 56, fontWeight: '700', letterSpacing: -1.5, marginTop: 4 },
});

// ── StatCard — compact labelled metric ─────────────────────────────────────
function StatCard({ label, value, palette }: { label: string; value: string; palette: any }) {
  return (
    <View style={[statStyles.card, { backgroundColor: palette.bgMuted }]}>
      <Text style={[statStyles.label, { color: palette.textTertiary }]}>{label}</Text>
      <Text style={[statStyles.value, tabularNumbers, { color: palette.accent }]}>{value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card:  { flex: 1, borderRadius: Radius.md, paddingVertical: 10, paddingHorizontal: 10, alignItems: 'center' },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4, textTransform: 'uppercase' },
  value: { fontSize: 16, fontWeight: '700' },
});

// ── Tile — stacked row with icon, label, value, subline ────────────────────
function Tile({
  icon, label, value, subline, onPress, palette, children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  subline: string;
  onPress: () => void;
  palette: any;
  children?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={[tileStyles.tile, { backgroundColor: palette.bgElevated, borderColor: palette.borderSubtle }]}
      onPress={() => { haptic.selection(); onPress(); }}
      activeOpacity={0.8}
    >
      <View style={[tileStyles.iconWrap, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={20} color={palette.accent} />
      </View>
      <View style={tileStyles.body}>
        <Text style={[tileStyles.label, { color: palette.textTertiary }]}>{label}</Text>
        <Text style={[tileStyles.value, { color: palette.textPrimary }]}>{value}</Text>
        <Text style={[tileStyles.sub, { color: palette.textSecondary }]}>{subline}</Text>
        {children}
      </View>
      <Ionicons name="chevron-forward" size={18} color={palette.textTertiary} />
    </TouchableOpacity>
  );
}

const tileStyles = StyleSheet.create({
  tile:    { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.sm },
  iconWrap:{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  body:    { flex: 1 },
  label:   { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 2, textTransform: 'uppercase' },
  value:   { fontSize: 16, fontWeight: '700' },
  sub:     { fontSize: 12, marginTop: 2 },
});

// ── Component ──────────────────────────────────────────────────────────────
export default function WelcomeScreen({ navigation }: Props) {
  const { palette } = useTheme();
  const [savedName, setSavedName]       = useState('Investor');
  const [portfolios, setPortfolios]     = useState<SavedPortfolio[]>([]);
  const [pulse, setPulse]               = useState<MarketPulseData | null>(null);
  const [lessonsComplete, setLessons]   = useState(0);
  const [streak, setStreak]             = useState(0);

  useFocusEffect(useCallback(() => {
    (async () => {
      const [name, portfoliosRaw, lessonsRaw, streakRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE.SAVED_NAME),
        AsyncStorage.getItem(STORAGE.SAVED_PORTFOLIOS),
        AsyncStorage.getItem(STORAGE.LESSONS_COMPLETE),
        AsyncStorage.getItem('appStreak'),
      ]);
      if (name) setSavedName(name);
      if (portfoliosRaw) {
        try {
          const arr: SavedPortfolio[] = JSON.parse(portfoliosRaw);
          setPortfolios(arr.sort((a, b) => b.createdAt - a.createdAt));
        } catch {}
      }
      if (lessonsRaw) {
        try { setLessons(JSON.parse(lessonsRaw).length); } catch {}
      }
      const today = new Date().toISOString().slice(0, 10);
      const streakData = streakRaw ? JSON.parse(streakRaw) : { lastDate: '', count: 0 };
      if (streakData.lastDate === today) {
        setStreak(streakData.count);
      } else {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const newCount = streakData.lastDate === yesterday ? streakData.count + 1 : 1;
        setStreak(newCount);
        await AsyncStorage.setItem('appStreak', JSON.stringify({ lastDate: today, count: newCount }));
        const milestones = [{ d: 3, b: '🌱', t: 'Seedling', m: '3-day streak! Building a habit.' }, { d: 7, b: '🔥', t: 'On Fire', m: '1 week! Consistent investors win.' }, { d: 14, b: '⚡', t: 'Momentum', m: '2 weeks! More momentum than 90% of investors.' }, { d: 30, b: '💎', t: 'Diamond', m: '30 days! Top 5% of all users.' }, { d: 100, b: '🚀', t: 'Legend', m: '100 days! Daily wealth habit mastered.' }];
        const hit = milestones.filter(m => newCount >= m.d).pop();
        const prevShown = await AsyncStorage.getItem('lastStreakMilestoneShown');
        if (hit && prevShown !== String(hit.d)) {
          await AsyncStorage.setItem('lastStreakMilestoneShown', String(hit.d));
          Alert.alert(hit.b + ' ' + hit.t, hit.m);
        }
      }
    })();
  }, []));

  useEffect(() => {
    fetchMarketPulse().then(setPulse).catch(() => null);
  }, []);

  const bestScore = portfolios.length > 0
    ? Math.max(...portfolios.map(p => p.result.scores.smart_score))
    : null;

  // ── Projection math (returning users) ────────────────────────────────────
  const best = portfolios[0];
  const ret = best?.result?.performance?.expected_annual_return ?? 0.08;
  const weekly = best?.result?.profile?.weekly_contribution ?? 100;
  const monthlyRate = Math.pow(1 + Math.min(ret, 0.20), 1 / 12) - 1;
  const monthly = weekly * 4.33;
  const yearly: number[] = [];
  let val = 0;
  for (let yr = 0; yr <= 30; yr++) {
    if (yr > 0) for (let m = 0; m < 12; m++) val = val * (1 + monthlyRate) + monthly;
    yearly.push(val);
  }
  const finalVal = yearly[30];
  const yr10 = yearly[10];
  const yr20 = yearly[20];

  const bestGrade = portfolios.length > 0
    ? portfolios.reduce((acc, p) => {
        const order = ['A', 'B', 'C', 'D', 'F'];
        return order.indexOf(p.result.scores.grade) < order.indexOf(acc) ? p.result.scores.grade : acc;
      }, portfolios[0].result.scores.grade)
    : 'N/A';

  const screenW = Dimensions.get('window').width;
  const sparkWidth = screenW - Spacing.lg * 2 - 48; // page pad × 2 + card pad × 2

  return (
    <TabShell active="Home" navigation={navigation}>
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.bgPrimary }]} edges={['top', 'bottom']}>
        <MarketTicker pulse={pulse} />

        {/* Header bar */}
        <View style={[styles.header, { borderBottomColor: palette.borderSubtle }]}>
          <Text style={[styles.brandName, { color: palette.signalAmber }]}>MY FRONTIER</Text>
          <TouchableOpacity
            onPress={() => { haptic.selection(); navigation.navigate('Profile'); }}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color={palette.textTertiary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {portfolios.length === 0 ? (
            /* NEW USER — hero CTA (unchanged) */
            <>
              <View style={[styles.heroCard, { backgroundColor: palette.bgElevated, borderColor: palette.brandBlue }]}>
                <Text style={styles.heroEmoji}>📊</Text>
                <Text style={[styles.heroTitle, { color: palette.textPrimary }]}>Welcome to My Frontier</Text>
                <Text style={[styles.heroSub, { color: palette.textSecondary }]}>Build your first optimized portfolio using the same math as hedge funds</Text>
                <TouchableOpacity
                  style={[styles.heroCta, { backgroundColor: palette.brandBlue }]}
                  onPress={() => { haptic.medium(); navigation.navigate('Categories', { name: savedName }); }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.heroCtaText}>Build My First Portfolio</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.featureRow}>
                {[{ e: '📊', t: 'Frontier Math' }, { e: '🥧', t: 'Portfolio' }, { e: '💳', t: 'Debt Plan' }].map(f => (
                  <View key={f.t} style={[styles.featurePill, { backgroundColor: palette.bgElevated, borderColor: palette.borderSubtle }]}>
                    <Text style={{ fontSize: 18 }}>{f.e}</Text>
                    <Text style={[styles.featurePillText, { color: palette.textTertiary }]}>{f.t}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            /* RETURNING USER — redesigned dashboard */
            <>
              {/* Greeting row */}
              <View style={styles.greetingBlock}>
                <Text style={[styles.greetingLabel, { color: palette.textSecondary }]}>{getGreeting()},</Text>
                <Text style={[styles.greetingName, { color: palette.textPrimary }]}>{savedName}</Text>
              </View>

              {/* Net Worth hero card */}
              <TouchableOpacity
                onPress={() => { haptic.selection(); navigation.navigate('WealthTracker'); }}
                activeOpacity={0.9}
                style={[styles.heroWealthCard, { backgroundColor: palette.bgElevated, borderColor: palette.borderSubtle }]}
              >
                <Text style={[styles.heroLabel, { color: palette.textTertiary }]}>YOUR PROJECTED NET WORTH</Text>
                <HeroNumber value={finalVal} color={palette.textPrimary} />
                <Text style={[styles.heroSubline, { color: palette.textSecondary }]}>
                  in 30 years at {(ret * 100).toFixed(1)}%/yr
                </Text>

                <View style={styles.sparkWrap}>
                  <Sparkline
                    data={yearly}
                    width={sparkWidth}
                    height={56}
                    tone="positive"
                    fillGradient
                  />
                </View>

                <View style={styles.statRow}>
                  <StatCard label="10 YR" value={fmtCurrency(yr10)} palette={palette} />
                  <View style={{ width: 8 }} />
                  <StatCard label="20 YR" value={fmtCurrency(yr20)} palette={palette} />
                  <View style={{ width: 8 }} />
                  <StatCard label="30 YR" value={fmtCurrency(finalVal)} palette={palette} />
                </View>
              </TouchableOpacity>

              {/* Three-tile stack */}
              <Tile
                icon="stats-chart"
                label="PORTFOLIOS"
                value={`${portfolios.length}`}
                subline={`Best grade: ${bestGrade}`}
                palette={palette}
                onPress={() => navigation.navigate('WealthTracker')}
              >
                {portfolios.length >= 2 && (
                  <View style={{ marginTop: 6 }}>
                    <Sparkline
                      data={portfolios.slice().reverse().map(p => p.result.scores.smart_score)}
                      width={140}
                      height={24}
                      tone="positive"
                      fillGradient={false}
                      strokeWidth={1.5}
                    />
                  </View>
                )}
              </Tile>

              <Tile
                icon="card-outline"
                label="DEBT PLAN"
                value="View"
                subline="Plan your payoff"
                palette={palette}
                onPress={() => navigation.navigate('DebtPlanner')}
              />

              <Tile
                icon="add-circle"
                label="BUILD NEW"
                value="Start"
                subline="Optimized for your goals"
                palette={palette}
                onPress={() => navigation.navigate('Categories', { name: savedName })}
              />

              {/* Daily Quote */}
              {(() => {
                const Q = [
                  { q: 'The best time to invest was 20 years ago. The second best time is now.', a: 'Chinese Proverb' },
                  { q: 'Do not save what is left after spending. Spend what is left after saving.', a: 'Warren Buffett' },
                  { q: 'Compound interest is the eighth wonder of the world.', a: 'Albert Einstein' },
                  { q: 'Risk comes from not knowing what you are doing.', a: 'Warren Buffett' },
                  { q: 'Financial freedom is available to those who learn about it and work for it.', a: 'Robert Kiyosaki' },
                ];
                const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
                const tq = Q[doy % Q.length];
                return (
                  <View style={[styles.quoteCard, { backgroundColor: palette.bgMuted }]}>
                    <Text style={[styles.quoteText, { color: palette.textSecondary }]}>{tq.q}</Text>
                    <Text style={[styles.quoteAuthor, { color: palette.textTertiary }]}>{tq.a}</Text>
                  </View>
                );
              })()}

              {/* Market Pulse */}
              {pulse && (
                <View style={[styles.pulseCard, { backgroundColor: palette.bgElevated, borderColor: palette.borderSubtle }]}>
                  {[{ s: 'SPY', v: pulse.spy_change }, { s: 'QQQ', v: pulse.qqq_change }, { s: 'AGG', v: pulse.agg_change }].map(t => (
                    <View key={t.s} style={styles.pulseCol}>
                      <Text style={[styles.pulseSym, { color: palette.textSecondary }]}>{t.s}</Text>
                      <Text style={[styles.pulseVal, tabularNumbers, { color: getSemanticDataColor(palette, t.v) }]}>
                        {t.v >= 0 ? '+' : ''}{t.v.toFixed(2)}%
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <DailyChallenge navigation={navigation} />
              <QuickStats portfolioCount={portfolios.length} bestScore={bestScore} streak={streak} />
            </>
          )}

          <Text style={[styles.disclaimer, { color: palette.textTertiary }]}>
            For educational purposes only. Not financial advice.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </TabShell>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  brandName: { fontSize: 13, fontWeight: '700', letterSpacing: 2 },

  // Returning user
  greetingBlock:   { marginTop: Spacing.xxl, marginBottom: Spacing.lg },
  greetingLabel:   { fontSize: 13, fontWeight: '600', letterSpacing: 0.3, marginBottom: 4 },
  greetingName:    { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },

  heroWealthCard:  { borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.xxl, marginBottom: Spacing.lg },
  heroLabel:       { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  heroSubline:     { ...BodyScale.md, marginTop: 4 },
  sparkWrap:       { marginTop: Spacing.md, marginBottom: Spacing.md },
  statRow:         { flexDirection: 'row', marginTop: Spacing.sm },

  quoteCard:   { borderRadius: Radius.lg, padding: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.md },
  quoteText:   { fontSize: 14, lineHeight: 22, fontStyle: 'italic', marginBottom: Spacing.sm },
  quoteAuthor: { fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },

  pulseCard: { flexDirection: 'row', borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, marginBottom: Spacing.lg, justifyContent: 'space-around' },
  pulseCol:  { alignItems: 'center' },
  pulseSym:  { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, marginBottom: 4, textTransform: 'uppercase' },
  pulseVal:  { fontSize: 18, fontWeight: '600' },

  // New-user view (unchanged)
  heroCard:    { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg },
  heroEmoji:   { fontSize: 56, marginBottom: Spacing.md },
  heroTitle:   { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: Spacing.sm },
  heroSub:     { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.lg },
  heroCta:     { borderRadius: Radius.xl, paddingVertical: 14, paddingHorizontal: Spacing.xl, marginTop: Spacing.sm },
  heroCtaText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },

  featureRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
  featurePill:     { flex: 1, marginHorizontal: 4, borderRadius: Radius.lg, borderWidth: 1, paddingVertical: Spacing.sm, alignItems: 'center', gap: 4 },
  featurePillText: { fontSize: 11, fontWeight: '600', marginTop: 2 },

  disclaimer: { fontSize: 11, textAlign: 'center', marginTop: Spacing.lg, lineHeight: 16 },
});
