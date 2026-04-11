/**
 * WelcomeScreen.tsx — Home Dashboard
 * Financial dashboard shown to returning users every session.
 * Split: heavy sub-components live in components/home/HomeWidgets.tsx
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert,
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
// No ads on home screen
import { PortfolioSnapshot, DailyChallenge, QuickStats } from '../components/home/HomeWidgets';
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
  const [showWhatsNew, setShowWhatsNew] = useState(false);

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
      const whatsNewDone = await AsyncStorage.getItem('whatsNewDismissed_v2');
      if (!whatsNewDone) setShowWhatsNew(true);
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
          {/* Greeting */}
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{savedName}</Text>

          {showWhatsNew && (
            <View style={styles.whatsNew}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={styles.whatsNewTitle}>What's New</Text>
                <TouchableOpacity onPress={() => { setShowWhatsNew(false); AsyncStorage.setItem('whatsNewDismissed_v2', 'true'); }}>
                  <Text style={{ color: Colors.textTertiary, fontSize: 14 }}>X</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.whatsNewText}>Financial Health Score, Net Worth Timeline, Goal Buckets, Bill Negotiator, Housing Tool, Income Streams</Text>
            </View>
          )}

          {/* Daily Quote */}
          {(() => {
            const QUOTES = [
              { q: 'The best time to invest was 20 years ago. The second best time is now.', a: 'Chinese Proverb' },
              { q: 'Do not save what is left after spending. Spend what is left after saving.', a: 'Warren Buffett' },
              { q: 'An investment in knowledge pays the best interest.', a: 'Benjamin Franklin' },
              { q: 'The stock market transfers money from the impatient to the patient.', a: 'Warren Buffett' },
              { q: 'Compound interest is the eighth wonder of the world.', a: 'Albert Einstein' },
              { q: 'A budget tells your money where to go instead of wondering where it went.', a: 'Dave Ramsey' },
              { q: 'Risk comes from not knowing what you are doing.', a: 'Warren Buffett' },
              { q: 'Price is what you pay. Value is what you get.', a: 'Warren Buffett' },
              { q: 'In investing, what is comfortable is rarely profitable.', a: 'Robert Arnott' },
              { q: 'Financial freedom is available to those who learn about it and work for it.', a: 'Robert Kiyosaki' },
            ];
            const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
            const tq = QUOTES[doy % QUOTES.length];
            return (
              <View style={styles.quoteCard}>
                <Text style={styles.quoteText}>"{tq.q}"</Text>
                <Text style={styles.quoteAuthor}>{tq.a}</Text>
              </View>
            );
          })()}

          {/* Daily Challenge */}
          <DailyChallenge navigation={navigation} />

          {/* Financial Health Score — compact */}
          <FinancialHealthScore navigation={navigation} />

          {/* Quick Stats Row */}
          <QuickStats portfolioCount={portfolios.length} bestScore={bestScore} streak={streak} />

          {/* Portfolio Snapshot */}
          <PortfolioSnapshot portfolios={portfolios} navigation={navigation} />

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

  quoteCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Spacing.lg, marginBottom: Spacing.lg },
  quoteText: { fontSize: 16, fontStyle: 'italic', color: Colors.textSecondary, lineHeight: 24, marginBottom: Spacing.sm },
  quoteAuthor: { fontSize: 13, color: Colors.textTertiary, fontWeight: '600' },

  whatsNew: { backgroundColor: '#F59E0B18', borderRadius: Radius.lg, borderWidth: 1, borderColor: '#F59E0B', padding: Spacing.md, marginBottom: Spacing.lg },
  whatsNewTitle: { fontSize: 14, fontWeight: '700', color: '#F59E0B' },
  whatsNewText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },

  disclaimer: { ...BodyScale.sm, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.md },
});
