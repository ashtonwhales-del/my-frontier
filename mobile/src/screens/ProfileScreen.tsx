/**
 * ProfileScreen.tsx — Account & Settings
 * Shows user avatar, stats, account settings, premium status, and danger zone.
 */
import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, Linking, Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList, SavedPortfolio } from '../types';
import { STORAGE } from '../constants';
import { Spacing, Radius } from '../theme/spacing';
import { HeadingScale, BodyScale, LabelStyle } from '../theme/typography';
import { isPremium } from '../services/premiumService';
import AdBanner from '../components/ads/SmartBanner';
import TabShell from '../components/TabShell';
import { useTheme } from '../context/ThemeContext';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Profile'> };

const APP_VERSION = '1.0.0';
const MEMBER_SINCE = 'April 2026';
const PRIVACY_URL  = 'https://ashtonwhales-del.github.io/my-frontier/privacy-policy.html';
const SUPPORT_EMAIL = 'support.myfrontier@gmail.com';

// ── Helper: initials from name ──────────────────────────────────────────────
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ── Row component for settings cards ───────────────────────────────────────
function SettingsRow({ emoji, label, value, onPress, danger = false }: {
  emoji: string; label: string; value?: string; onPress?: () => void; danger?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <TouchableOpacity
      style={[st.row, { borderBottomColor: palette.borderSubtle }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <Text style={st.rowEmoji}>{emoji}</Text>
      <Text style={[st.rowLabel, { color: danger ? palette.signalRed : palette.textPrimary }]}>{label}</Text>
      <View style={st.rowRight}>
        {value ? <Text style={[st.rowValue, { color: palette.textSecondary }]}>{value}</Text> : null}
        {onPress && <Ionicons name="chevron-forward" size={16} color={palette.textTertiary} />}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }: Props) {
  const { isDark, setMode, palette } = useTheme();
  const toggleTheme = () => setMode(isDark ? 'light' : 'dark');
  const [savedName, setSavedName]   = useState('');
  const [portfolios, setPortfolios] = useState<SavedPortfolio[]>([]);
  const [badgeCount, setBadgeCount] = useState(0);
  const [premium, setPremium]       = useState(false);

  useFocusEffect(useCallback(() => {
    (async () => {
      const [name, portfoliosRaw, badgesRaw, prem] = await Promise.all([
        AsyncStorage.getItem(STORAGE.SAVED_NAME),
        AsyncStorage.getItem(STORAGE.SAVED_PORTFOLIOS),
        AsyncStorage.getItem(STORAGE.BADGES_EARNED),
        isPremium(),
      ]);
      if (name) setSavedName(name);
      if (portfoliosRaw) {
        try { setPortfolios(JSON.parse(portfoliosRaw)); } catch {}
      }
      if (badgesRaw) {
        try { setBadgeCount(JSON.parse(badgesRaw).length); } catch {}
      }
      setPremium(prem);
    })();
  }, []));

  const bestGrade = portfolios.length > 0
    ? portfolios.reduce((best, p) => {
        const order = ['A', 'B', 'C', 'D', 'F'];
        return order.indexOf(p.result.scores.grade) < order.indexOf(best) ? p.result.scores.grade : best;
      }, portfolios[0].result.scores.grade)
    : 'N/A';

  async function handleResetApp() {
    Alert.alert(
      'Reset App Data',
      'This will erase all portfolios, settings, and progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.reset({ index: 0, routes: [{ name: 'Disclaimer' }] });
          },
        },
      ]
    );
  }

  return (
    <TabShell active="Profile" navigation={navigation}>
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.bgPrimary }]}>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: palette.borderSubtle }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={palette.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>Profile</Text>
          <View style={{ width: 34 }} />
        </View>

        <ScrollView
          style={[styles.scroll, { backgroundColor: palette.bgPrimary }]}
          contentContainerStyle={[styles.content, { backgroundColor: palette.bgPrimary }]}
          showsVerticalScrollIndicator={false}
        >

          {/* Avatar + name */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatarCircle, { backgroundColor: palette.brandBlue }]}>
              <Text style={styles.avatarInitials}>{savedName ? getInitials(savedName) : 'MF'}</Text>
            </View>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: palette.textPrimary }]}>{savedName || 'My Frontier User'}</Text>
            </View>
            <Text style={[styles.memberSince, { color: palette.textTertiary }]}>Member since {MEMBER_SINCE}</Text>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {[
              { label: 'Portfolios', value: String(portfolios.length) },
              { label: 'Best Grade', value: bestGrade },
              { label: 'Badges', value: String(badgeCount) },
            ].map(stat => (
              <View key={stat.label} style={styles.statCell}>
                <Text style={[styles.statValue, { color: palette.accent }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: palette.textSecondary }]}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Account settings */}
          <Text style={[styles.sectionLabel, { color: palette.textTertiary }]}>ACCOUNT</Text>
          <View style={[styles.card, { backgroundColor: palette.bgElevated, borderColor: palette.borderSubtle }]}>
            <SettingsRow emoji="🎯" label="Risk Preference" value="Moderate" />
            <SettingsRow emoji="📝" label="Display Name" value={savedName} onPress={() => {
              Alert.prompt?.('Display Name', 'Enter your name', (text) => {
                if (text?.trim()) {
                  AsyncStorage.setItem(STORAGE.SAVED_NAME, text.trim());
                  setSavedName(text.trim());
                }
              }, 'plain-text', savedName);
            }} />
            <SettingsRow emoji="📋" label="Terms of Service" onPress={() => Alert.alert('Terms of Service', 'My Frontier is for educational purposes only. Not financial advice. All portfolio data is stored locally on your device. We do not collect personal information.')} />
            <SettingsRow emoji="ℹ️" label="About My Frontier" value={`v${APP_VERSION}`} onPress={() => navigation.navigate('About')} />
          </View>

          {/* Appearance */}
          <Text style={[styles.sectionLabel, { color: palette.textTertiary }]}>APPEARANCE</Text>
          <View style={[styles.card, { backgroundColor: palette.bgElevated, borderColor: palette.borderSubtle }]}>
            <View style={[st.row, { borderBottomColor: palette.borderSubtle }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 24 }}>{isDark ? '🌙' : '☀️'}</Text>
                <View>
                  <Text style={[st.rowLabel, { color: palette.textPrimary }]}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
                  <Text style={{ fontSize: 12, color: palette.textTertiary, marginTop: 2 }}>Switch app appearance</Text>
                </View>
              </View>
              <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: palette.borderDefault, true: palette.brandBlue }} thumbColor="#FFFFFF" />
            </View>
          </View>

          {/* Support section */}
          <Text style={[styles.sectionLabel, { color: palette.textTertiary }]}>SUPPORT</Text>
          <View style={[styles.card, { backgroundColor: palette.bgElevated, borderColor: palette.borderSubtle }]}>
            <SettingsRow emoji="☕" label="Support the App" onPress={() => navigation.navigate('Premium')} />
          </View>

          {/* Danger zone */}
          <Text style={[styles.sectionLabel, { color: palette.textTertiary }]}>DANGER ZONE</Text>
          <View style={[styles.card, { backgroundColor: palette.bgElevated, borderColor: palette.borderSubtle }]}>
            <SettingsRow emoji="📧" label="Send Feedback" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=My Frontier Feedback`)} />
            <SettingsRow emoji="🗑️" label="Reset App Data" onPress={handleResetApp} danger />
          </View>

          <AdBanner placement="banner" />
          <View style={{ height: Spacing.xxxl }} />
        </ScrollView>
      </SafeAreaView>
    </TabShell>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1 },
  backBtn:     { padding: Spacing.xs },
  headerTitle: { ...HeadingScale.md },

  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatarCircle:  { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  avatarInitials:{ fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  nameRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  userName:      { fontSize: 24, fontWeight: '800' },
  memberSince:   { ...BodyScale.sm, marginTop: 4 },

  statsRow:  { flexDirection: 'row', marginBottom: Spacing.xl },
  statCell:  { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statLabel: { ...BodyScale.sm, marginTop: 2 },

  sectionLabel: { ...LabelStyle, marginBottom: Spacing.sm, marginTop: Spacing.lg },

  card:        { borderRadius: Radius.lg, borderWidth: 1, marginBottom: Spacing.sm, overflow: 'hidden' },
});

const st = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 14, borderBottomWidth: 1 },
  rowEmoji:  { fontSize: 18, width: 28 },
  rowLabel:  { ...BodyScale.md, flex: 1 },
  rowRight:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValue:  { ...BodyScale.sm },
});
