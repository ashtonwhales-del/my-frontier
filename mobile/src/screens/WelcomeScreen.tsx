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
import Svg, { Polyline, Defs, LinearGradient as SvgGradient, Stop, Path, Text as SvgText, Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { RootStackParamList, SavedPortfolio, MarketPulseData } from '../types';
import { STORAGE } from '../constants';
import { Colors } from '../theme/colors';
import { Spacing, Radius } from '../theme/spacing';
import { BodyScale } from '../theme/typography';
import { fetchMarketPulse } from '../api';
import { useTheme } from '../context/ThemeContext';
import TabShell from '../components/TabShell';
import MarketTicker from '../components/MarketTicker';
// No ads on home screen
import { DailyChallenge, QuickStats } from '../components/home/HomeWidgets';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Welcome'> };

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function WelcomeScreen({ navigation }: Props) {
  const { palette } = useTheme();
  const [savedName, setSavedName]       = useState('Investor');
  const [portfolios, setPortfolios]     = useState<SavedPortfolio[]>([]);
  const [pulse, setPulse]               = useState<MarketPulseData | null>(null);
  const [lessonsComplete, setLessons]   = useState(0);
  const [streak, setStreak]             = useState(0);
  // What's New banner removed — features are discoverable via tabs

  // Reload data every time screen is focused
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
      // What's New banner removed
      // Streak tracking
      const today = new Date().toISOString().slice(0, 10);
      const streakData = streakRaw ? JSON.parse(streakRaw) : { lastDate: '', count: 0 };
      if (streakData.lastDate === today) {
        setStreak(streakData.count);
      } else {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const newCount = streakData.lastDate === yesterday ? streakData.count + 1 : 1;
        setStreak(newCount);
        await AsyncStorage.setItem('appStreak', JSON.stringify({ lastDate: today, count: newCount }));
        // Streak milestone check
        const milestones = [{ d: 3, b: '🌱', t: 'Seedling', m: '3-day streak! Building a habit.' }, { d: 7, b: '🔥', t: 'On Fire', m: '1 week! Consistent investors win.' }, { d: 14, b: '⚡', t: 'Momentum', m: '2 weeks! More momentum than 90% of investors.' }, { d: 30, b: '💎', t: 'Diamond', m: '30 days! Top 5% of all users.' }, { d: 100, b: '🚀', t: 'Legend', m: '100 days! Daily wealth habit mastered.' }];
        const hit = milestones.filter(m => newCount >= m.d).pop();
        const prevShown = await AsyncStorage.getItem('lastStreakMilestoneShown');
        if (hit && prevShown !== String(hit.d)) { await AsyncStorage.setItem('lastStreakMilestoneShown', String(hit.d)); Alert.alert(hit.b + ' ' + hit.t, hit.m); }
      }
    })();
  }, []));

  // Market pulse — fetch once, light cache
  useEffect(() => {
    fetchMarketPulse().then(setPulse).catch(() => null);
  }, []);

  const bestScore = portfolios.length > 0
    ? Math.max(...portfolios.map(p => p.result.scores.smart_score))
    : null;

  return (
    <TabShell active="Home" navigation={navigation}>
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.bgPrimary }]} edges={['top', 'bottom']}>
        <MarketTicker pulse={pulse} />

        {/* Header bar */}
        <View style={[styles.header, { borderBottomColor: palette.borderSubtle }]}>
          <Text style={[styles.brandName, { color: palette.signalAmber }]}>MY FRONTIER</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={22} color={palette.textTertiary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {portfolios.length === 0 ? (
            /* NEW USER — hero CTA */
            <>
              <View style={[styles.heroCard, { backgroundColor: palette.bgElevated, borderColor: palette.brandBlue }]}>
                <Text style={styles.heroEmoji}>📊</Text>
                <Text style={[styles.heroTitle, { color: palette.textPrimary }]}>Welcome to My Frontier</Text>
                <Text style={[styles.heroSub, { color: palette.textSecondary }]}>Build your first optimized portfolio using the same math as hedge funds</Text>
                <TouchableOpacity style={[styles.heroCta, { backgroundColor: palette.brandBlue }]} onPress={() => navigation.navigate('Categories', { name: savedName })} activeOpacity={0.85}>
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
            /* RETURNING USER — dashboard */
            <>
              <Text style={[styles.greeting, { color: palette.textSecondary }]}>{getGreeting()},</Text>
              <Text style={[styles.userName, { color: palette.textPrimary }]}>{savedName}</Text>

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
                  <View style={[styles.quoteCard, { backgroundColor: palette.bgElevated, borderColor: palette.borderSubtle }]}>
                    <Text style={[styles.quoteText, { color: palette.textSecondary }]}>"{tq.q}"</Text>
                    <Text style={[styles.quoteAuthor, { color: palette.textTertiary }]}>{tq.a}</Text>
                  </View>
                );
              })()}

              {/* Wealth Projection Chart — tap to open Portfolio tracker */}
              {(() => {
                const best = portfolios[0];
                const ret = best?.result?.performance?.expected_annual_return ?? 0.08;
                const weekly = best?.result?.profile?.weekly_contribution ?? 100;
                const monthlyRate = Math.pow(1 + Math.min(ret, 0.20), 1 / 12) - 1;
                const monthly = weekly * 4.33;
                const CW = Dimensions.get('window').width - 64;
                const CH = 130;
                const PAD = { l: 8, r: 8, t: 10, b: 22 };
                const pts: { x: number; y: number; val: number }[] = [];
                let val = 0;
                for (let yr = 0; yr <= 30; yr++) {
                  if (yr > 0) for (let m = 0; m < 12; m++) val = val * (1 + monthlyRate) + monthly;
                  const x = PAD.l + (yr / 30) * (CW - PAD.l - PAD.r);
                  pts.push({ x, y: 0, val });
                }
                const maxVal = Math.max(...pts.map(p => p.val), 1);
                pts.forEach(p => { p.y = PAD.t + (CH - PAD.t - PAD.b) * (1 - p.val / maxVal); });
                const linePts = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
                const fillPath = `M${pts[0].x},${CH - PAD.b} ` + pts.map(p => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ` L${pts[30].x},${CH - PAD.b} Z`;
                const fmtK = (n: number) => n >= 1e6 ? '$' + (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? '$' + (n / 1e3).toFixed(0) + 'K' : '$' + Math.round(n);
                const finalVal = pts[30].val;
                const yr10 = pts[10];
                const yr20 = pts[20];
                const grade = best?.result?.scores?.grade ?? 'B';
                const gradeC = grade === 'A' ? '#10B981' : grade === 'B' ? '#3B82F6' : '#F59E0B';
                return (
                  <TouchableOpacity onPress={() => navigation.navigate('WealthTracker')} activeOpacity={0.85}>
                  <View style={[styles.wealthCard, { backgroundColor: palette.bgElevated, borderColor: palette.brandBlue + '40' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <View>
                        <Text style={[styles.wealthLabel, { color: palette.textTertiary }]}>PROJECTED WEALTH</Text>
                        <Text style={[styles.wealthValue, { color: palette.textPrimary }]}>{fmtK(finalVal)}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.wealthGrade, { color: gradeC }]}>{grade}</Text>
                        <Text style={[styles.wealthRet, { color: palette.textSecondary }]}>{(ret * 100).toFixed(1)}%/yr</Text>
                      </View>
                    </View>
                    <Svg width={CW} height={CH}>
                      <Defs>
                        <SvgGradient id="wealthFill" x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0" stopColor="#3B82F6" stopOpacity="0.3" />
                          <Stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
                        </SvgGradient>
                      </Defs>
                      <Path d={fillPath} fill="url(#wealthFill)" />
                      <Polyline points={linePts} fill="none" stroke="#3B82F6" strokeWidth={2.5} strokeLinecap="round" />
                      <Circle cx={yr10.x} cy={yr10.y} r={3} fill="#F59E0B" />
                      <Circle cx={yr20.x} cy={yr20.y} r={3} fill="#F59E0B" />
                      <SvgText x={PAD.l} y={CH - 4} fontSize={9} fill={palette.textTertiary}>Now</SvgText>
                      <SvgText x={yr10.x} y={CH - 4} fontSize={9} fill={palette.textTertiary} textAnchor="middle">10yr</SvgText>
                      <SvgText x={yr20.x} y={CH - 4} fontSize={9} fill={palette.textTertiary} textAnchor="middle">20yr</SvgText>
                      <SvgText x={CW - PAD.r} y={CH - 4} fontSize={9} fill={palette.textTertiary} textAnchor="end">30yr</SvgText>
                      <SvgText x={yr10.x} y={yr10.y - 8} fontSize={9} fill="#F59E0B" textAnchor="middle">{fmtK(yr10.val)}</SvgText>
                      <SvgText x={yr20.x} y={yr20.y - 8} fontSize={9} fill="#F59E0B" textAnchor="middle">{fmtK(yr20.val)}</SvgText>
                    </Svg>
                    <Text style={[styles.wealthSub, { color: palette.textTertiary }]}>{fmtK(weekly * 52)}/yr invested · Best portfolio</Text>
                  </View>
                  </TouchableOpacity>
                );
              })()}

              {pulse && (
                <View style={[styles.pulseCard, { backgroundColor: palette.bgElevated, borderColor: palette.borderSubtle }]}>
                  {[{ s: 'SPY', v: pulse.spy_change }, { s: 'QQQ', v: pulse.qqq_change }, { s: 'AGG', v: pulse.agg_change }].map(t => (
                    <View key={t.s} style={styles.pulseCol}>
                      <Text style={[styles.pulseSym, { color: palette.textSecondary }]}>{t.s}</Text>
                      <Text style={[styles.pulseVal, { color: t.v >= 0 ? '#10B981' : '#EF4444' }]}>{t.v >= 0 ? '+' : ''}{t.v.toFixed(2)}%</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Build new portfolio CTA */}
              <TouchableOpacity
                style={[styles.buildNewCta, { backgroundColor: palette.bgElevated, borderColor: palette.brandBlue + '60' }]}
                onPress={() => navigation.navigate('Categories', { name: savedName })}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 22 }}>📊</Text>
                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <Text style={[styles.buildNewCtaTitle, { color: palette.textPrimary }]}>Build New Portfolio</Text>
                  <Text style={[styles.buildNewCtaSub, { color: palette.textSecondary }]}>Optimized for your goals</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={palette.textTertiary} />
              </TouchableOpacity>

              {/* Debt planning CTA */}
              <TouchableOpacity
                style={[styles.debtCta, { backgroundColor: palette.bgElevated, borderColor: palette.signalAmber + '60' }]}
                onPress={() => navigation.navigate('DebtPlanner')}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 22 }}>💳</Text>
                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <Text style={[styles.debtCtaTitle, { color: palette.textPrimary }]}>Debt Repayment Plan</Text>
                  <Text style={[styles.debtCtaSub, { color: palette.textSecondary }]}>See when you could be debt-free</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={palette.textTertiary} />
              </TouchableOpacity>

              <DailyChallenge navigation={navigation} />
              <QuickStats portfolioCount={portfolios.length} bestScore={bestScore} streak={streak} />
            </>
          )}

          <Text style={[styles.disclaimer, { color: palette.textTertiary }]}>For educational purposes only. Not financial advice.</Text>
        </ScrollView>
      </SafeAreaView>
    </TabShell>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1 },
  scroll:   { flex: 1 },
  content:  { paddingHorizontal: Spacing.lg, paddingBottom: 100 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  brandName: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  greeting: { ...BodyScale.lg, marginTop: Spacing.lg },
  userName: { fontSize: 28, fontWeight: '800', marginBottom: Spacing.lg, letterSpacing: -0.5 },

  buildBtn:      { marginBottom: Spacing.sm, borderRadius: Radius.xl, overflow: 'hidden' },
  buildGradient: { paddingVertical: 17, alignItems: 'center', borderRadius: Radius.xl },
  buildText:     { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },

  heroCard:      { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg },
  heroEmoji:     { fontSize: 56, marginBottom: Spacing.md },
  heroTitle:     { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: Spacing.sm },
  heroSub:       { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.lg },
  heroCta:       { borderRadius: Radius.xl, paddingVertical: 14, paddingHorizontal: Spacing.xl, marginTop: Spacing.sm },
  heroCtaText:   { fontSize: 16, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },

  featureRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
  featurePill:     { flex: 1, marginHorizontal: 4, borderRadius: Radius.lg, borderWidth: 1, paddingVertical: Spacing.sm, alignItems: 'center', gap: 4 },
  featurePillText: { fontSize: 11, fontWeight: '600', marginTop: 2 },

  quoteCard:   { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.md },
  quoteText:   { fontSize: 13, lineHeight: 20, fontStyle: 'italic', marginBottom: 4 },
  quoteAuthor: { fontSize: 11, fontWeight: '600' },

  wealthCard:  { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.md },
  wealthLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  wealthValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  wealthGrade: { fontSize: 22, fontWeight: '800' },
  wealthRet:   { fontSize: 12, marginTop: 2 },
  wealthSub:   { fontSize: 11, marginTop: 6 },

  pulseCard: { flexDirection: 'row', borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.md, justifyContent: 'space-around' },
  pulseCol:  { alignItems: 'center' },
  pulseSym:  { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  pulseVal:  { fontSize: 14, fontWeight: '700' },

  buildNewCta:      { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.sm },
  buildNewCtaTitle: { fontSize: 15, fontWeight: '700' },
  buildNewCtaSub:   { fontSize: 12, marginTop: 2 },

  debtCta:      { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.lg },
  debtCtaTitle: { fontSize: 15, fontWeight: '700' },
  debtCtaSub:   { fontSize: 12, marginTop: 2 },

  disclaimer: { fontSize: 11, textAlign: 'center', marginTop: Spacing.lg, lineHeight: 16 },
});