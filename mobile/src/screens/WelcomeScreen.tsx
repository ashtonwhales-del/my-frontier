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
import { NumberScale, HeadingScale, BodyScale, LabelStyle } from '../theme/typography';
import { fetchMarketPulse } from '../api';
import TabShell from '../components/TabShell';
import MarketTicker from '../components/MarketTicker';
import { HomeMarketPulse, DashboardGrid, RecentPortfolios } from '../components/home/HomeWidgets';
import HelpFAB from '../components/HelpSystem';

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
  const [badgeCount, setBadgeCount]     = useState(0);

  // Reload data every time screen is focused
  useFocusEffect(useCallback(() => {
    (async () => {
      const [name, portfoliosRaw, lessonsRaw, badgesRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE.SAVED_NAME),
        AsyncStorage.getItem(STORAGE.SAVED_PORTFOLIOS),
        AsyncStorage.getItem(STORAGE.LESSONS_COMPLETE),
        AsyncStorage.getItem(STORAGE.BADGES_EARNED),
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
      if (badgesRaw) {
        try { setBadgeCount(JSON.parse(badgesRaw).length); } catch {}
      }
    })();
  }, []));

  // Market pulse — fetch once, light cache
  useEffect(() => {
    fetchMarketPulse().then(setPulse).catch(() => null);
  }, []);

  const bestGrade = portfolios.length > 0
    ? portfolios.reduce((best, p) => {
        const order = ['A', 'B', 'C', 'D', 'F'];
        return order.indexOf(p.result.scores.grade) < order.indexOf(best) ? p.result.scores.grade : best;
      }, portfolios[0].result.scores.grade)
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

          {/* Market Pulse */}
          <HomeMarketPulse pulse={pulse} />

          {/* Dashboard 2x2 grid */}
          <DashboardGrid
            portfolioCount={portfolios.length}
            bestGrade={bestGrade}
            lessonsComplete={lessonsComplete}
            badgeCount={badgeCount}
            navigation={navigation}
          />

          {/* Build new portfolio CTA */}
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
              <Text style={styles.buildText}>Build New Portfolio →</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Recent portfolio strip */}
          <RecentPortfolios portfolios={portfolios} navigation={navigation} />

          <Text style={styles.disclaimer}>For educational purposes only. Not financial advice.</Text>
        </ScrollView>
        <HelpFAB screen="home" />
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

  buildBtn:      { marginBottom: Spacing.xl, borderRadius: Radius.xl, overflow: 'hidden' },
  buildGradient: { paddingVertical: 17, alignItems: 'center', borderRadius: Radius.xl },
  buildText:     { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },

  disclaimer: { ...BodyScale.sm, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.md },
});
