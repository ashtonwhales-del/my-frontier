/**
 * WelcomeScreen.tsx — Home Dashboard
 * Financial dashboard shown to returning users every session.
 * Split: heavy sub-components live in components/home/HomeWidgets.tsx
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Animated, Dimensions,
} from 'react-native';
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
import TabShell from '../components/TabShell';
import MarketTicker from '../components/MarketTicker';
// No ads on home screen
import { DailyChallenge, QuickStats } from '../components/home/HomeWidgets';
// FinancialHealthScore moved to FinanceHub

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Welcome'> };

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function WelcomeScreen({ navigation }: Props) {
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
      <SafeAreaView style={styles.safe}>
        <MarketTicker pulse={pulse} />

        {/* Header bar */}
        <View style={styles.header}>
          <Text style={styles.brandName}>MY FRONTIER</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={22} color={Colors.textTertiary} />
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
              <View style={styles.heroCard}>
                <Text style={styles.heroEmoji}>📊</Text>
                <Text style={styles.heroTitle}>Welcome to My Frontier</Text>
                <Text style={styles.heroSub}>Build your first optimized portfolio using the same math as hedge funds</Text>
                <TouchableOpacity style={styles.heroCta} onPress={() => navigation.navigate('Categories', { name: savedName })} activeOpacity={0.85}>
                  <Text style={styles.heroCtaText}>Build My First Portfolio</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.featureRow}>
                {[{ e: '📊', t: 'Frontier Math' }, { e: '🎓', t: '30 Lessons' }, { e: '💼', t: 'Budget Tools' }].map(f => (
                  <View key={f.t} style={styles.featurePill}><Text style={{ fontSize: 18 }}>{f.e}</Text><Text style={styles.featurePillText}>{f.t}</Text></View>
                ))}
              </View>
            </>
          ) : (
            /* RETURNING USER — dashboard */
            <>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>{savedName}</Text>

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
                return <View style={styles.quoteCard}><Text style={styles.quoteText}>"{tq.q}"</Text><Text style={styles.quoteAuthor}>{tq.a}</Text></View>;
              })()}

              {/* Wealth Projection Chart */}
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
                  <View style={styles.wealthCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <View>
                        <Text style={styles.wealthLabel}>PROJECTED WEALTH</Text>
                        <Text style={styles.wealthValue}>{fmtK(finalVal)}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.wealthGrade, { color: gradeC }]}>{grade}</Text>
                        <Text style={styles.wealthRet}>{(ret * 100).toFixed(1)}%/yr</Text>
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
                      <SvgText x={PAD.l} y={CH - 4} fontSize={9} fill="#475569">Now</SvgText>
                      <SvgText x={yr10.x} y={CH - 4} fontSize={9} fill="#475569" textAnchor="middle">10yr</SvgText>
                      <SvgText x={yr20.x} y={CH - 4} fontSize={9} fill="#475569" textAnchor="middle">20yr</SvgText>
                      <SvgText x={CW - PAD.r} y={CH - 4} fontSize={9} fill="#475569" textAnchor="end">30yr</SvgText>
                      <SvgText x={yr10.x} y={yr10.y - 8} fontSize={9} fill="#F59E0B" textAnchor="middle">{fmtK(yr10.val)}</SvgText>
                      <SvgText x={yr20.x} y={yr20.y - 8} fontSize={9} fill="#F59E0B" textAnchor="middle">{fmtK(yr20.val)}</SvgText>
                    </Svg>
                    <Text style={styles.wealthSub}>{fmtK(weekly * 52)}/yr invested · Best portfolio</Text>
                  </View>
                );
              })()}

              {pulse && (
                <View style={styles.pulseCard}>
                  {[{ s: 'SPY', v: pulse.spy_change }, { s: 'QQQ', v: pulse.qqq_change }, { s: 'AGG', v: pulse.agg_change }].map(t => (
                    <View key={t.s} style={styles.pulseCol}>
                      <Text style={styles.pulseSym}>{t.s}</Text>
                      <Text style={[styles.pulseVal, { color: t.v >= 0 ? '#10B981' : '#EF4444' }]}>{t.v >= 0 ? '+' : ''}{t.v.toFixed(2)}%</Text>
                    </View>
                  ))}
                </View>
              )}

              <DailyChallenge navigation={navigation} />
              <QuickStats portfolioCount={portfolios.length} bestScore={bestScore} streak={streak} />
            </>
          )}

          <Text style={styles.disclaimer}>For educational purposes only. Not financial advice.</Text>
        </ScrollView>
      </SafeAreaView>
    </TabShell>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll:   { flex: 1 },
  content:  { paddingHorizontal: Spacing.lg, paddingBottom: 100 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  brandName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brandGold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  greeting: { ...BodyScale.lg, color: Colors.textSecondary, marginTop: Spacing.lg },
  userName: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.lg, letterSpacing: -0.5 },

  buildBtn:      { marginBottom: Spacing.sm, borderRadius: Radius.xl, overflow: 'hidden' },
  buildGradient: { paddingVertical: 17, alignItems: 'center', borderRadius: Radius.xl },
  buildText:     { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },

  heroCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.brandBlue, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg },
  heroEmoji: { fontSize: 56, marginBottom: Spacing.md },
  heroTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  heroSub: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.lg },
  heroCta: { backgroundColor: Colors.brandBlue, borderRadius: Radius.xl, paddingVertical: 16, paddingHorizontal: 40 },
  heroCtaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  featureRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
  featurePill: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Spacing.sm, alignItems: 'center', gap: 4 },
  featurePillText: { fontSize: 11, color: Colors.textTertiary, fontWeight: '600' },
  wealthCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.brandBlue + '40', padding: Spacing.md, marginBottom: Spacing.lg },
  wealthLabel: { fontSize: 10, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 1.2 },
  wealthValue: { fontSize: 32, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -1 },
  wealthGrade: { fontSize: 28, fontWeight: '900' },
  wealthRet: { fontSize: 12, color: Colors.textSecondary },
  wealthSub: { fontSize: 12, color: Colors.textTertiary, textAlign: 'center', marginTop: 6 },

  quoteCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Spacing.lg, marginBottom: Spacing.lg },
  quoteText: { fontSize: 15, fontStyle: 'italic', color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.sm },
  quoteAuthor: { fontSize: 12, color: Colors.textTertiary, fontWeight: '600' },
  pulseCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Spacing.md, marginBottom: Spacing.lg },
  pulseCol: { alignItems: 'center', flex: 1 },
  pulseSym: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 2 },
  pulseVal: { fontSize: 15, fontWeight: '700' },

  whatsNew: { backgroundColor: '#F59E0B18', borderRadius: Radius.lg, borderWidth: 1, borderColor: '#F59E0B', padding: Spacing.md, marginBottom: Spacing.lg },
  whatsNewTitle: { fontSize: 14, fontWeight: '700', color: '#F59E0B' },
  whatsNewText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },

  disclaimer: { ...BodyScale.sm, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.md },
});
