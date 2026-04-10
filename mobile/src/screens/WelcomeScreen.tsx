/**
 * WelcomeScreen.tsx — Home Dashboard
 * Financial dashboard shown to returning users every session.
 * Split: heavy sub-components live in components/home/HomeWidgets.tsx
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
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
import AdBanner from '../components/ads/SmartBanner';
import { PortfolioSnapshot, WeeklyInsight, DailyChallenge, QuickStats, LearningProgress } from '../components/home/HomeWidgets';
import FinancialHealthScore from '../components/FinancialHealthScore';

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
  const [goals, setGoals]               = useState<any[]>([]);

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
      const goalsRaw = await AsyncStorage.getItem('goalBuckets');
      if (goalsRaw) { try { setGoals(JSON.parse(goalsRaw)); } catch {} }
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
          {/* Greeting */}
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{savedName}</Text>

          {/* Financial Health Score — hero metric */}
          <FinancialHealthScore navigation={navigation} />

          {/* Goal Progress */}
          {goals.length > 0 && (
            <View style={styles.goalSection}>
              {goals.slice(0, 2).map((g: any) => {
                const pct = g.targetAmount > 0 ? Math.min(100, (g.currentSaved / g.targetAmount) * 100) : 0;
                return (
                  <View key={g.id} style={styles.goalCard}>
                    <Text style={{ fontSize: 22 }}>{g.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.goalName}>{g.name}</Text>
                      <View style={styles.goalBar}><View style={[styles.goalBarFill, { width: `${pct}%` }]} /></View>
                    </View>
                    <Text style={styles.goalPct}>{Math.round(pct)}%</Text>
                  </View>
                );
              })}
              <TouchableOpacity onPress={() => navigation.navigate('GoalBuckets')}><Text style={styles.goalLink}>View All Goals  ›</Text></TouchableOpacity>
            </View>
          )}

          {/* Portfolio Snapshot */}
          <PortfolioSnapshot portfolios={portfolios} navigation={navigation} />

          {/* Ad banner (free users) */}
          <AdBanner placement="banner" />

          {/* Daily Challenge */}
          <DailyChallenge navigation={navigation} />

          {/* Weekly Insight */}
          <WeeklyInsight navigation={navigation} />

          {/* Quick Stats Row */}
          <QuickStats portfolioCount={portfolios.length} bestScore={bestScore} streak={streak} />

          {/* Action Buttons */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Categories', { name: savedName })}
            activeOpacity={0.85}
            style={styles.buildBtn}
          >
            <LinearGradient
              colors={['#1D4ED8', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buildGradient}
            >
              <Text style={styles.buildText}>Build New Portfolio</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Budget')}
            activeOpacity={0.8}
            style={styles.budgetBtn}
          >
            <Text style={styles.budgetText}>Open Budget</Text>
          </TouchableOpacity>

          {/* Quick links */}
          <TouchableOpacity onPress={() => navigation.navigate('GoalBuckets')} activeOpacity={0.8} style={styles.budgetBtn}>
            <Text style={styles.budgetText}>My Goals</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('BillNegotiation')} activeOpacity={0.8} style={styles.budgetBtn}>
            <Text style={styles.budgetText}>Bill Negotiator</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('NetWorthTimeline')} activeOpacity={0.8} style={styles.budgetBtn}>
            <Text style={styles.budgetText}>Net Worth Timeline</Text>
          </TouchableOpacity>

          {/* Learning Progress */}
          <LearningProgress completed={lessonsComplete} total={12} navigation={navigation} />

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

  budgetBtn: { borderWidth: 1.5, borderColor: Colors.borderSubtle, borderRadius: Radius.xl, paddingVertical: 14, alignItems: 'center', marginBottom: Spacing.lg },
  budgetText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },

  goalSection: { marginBottom: Spacing.lg },
  goalCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Spacing.md, marginBottom: Spacing.xs },
  goalName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  goalBar: { height: 4, backgroundColor: Colors.borderSubtle, borderRadius: 2 },
  goalBarFill: { height: 4, backgroundColor: Colors.brandBlue, borderRadius: 2 },
  goalPct: { fontSize: 14, fontWeight: '700', color: Colors.brandGold },
  goalLink: { fontSize: 13, color: Colors.brandBlue, fontWeight: '600', textAlign: 'right', marginTop: 4 },

  disclaimer: { ...BodyScale.sm, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.md },
});
