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
import { Colors } from '../theme/colors';
import { Spacing, Radius } from '../theme/spacing';
import { HeadingScale, BodyScale, LabelStyle, NumberScale } from '../theme/typography';
import { isPremium } from '../services/premiumService';
import AdBanner from '../components/ads/SmartBanner';
import TabShell from '../components/TabShell';

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
  return (
    <TouchableOpacity
      style={st.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <Text style={st.rowEmoji}>{emoji}</Text>
      <Text style={[st.rowLabel, danger && { color: Colors.negative }]}>{label}</Text>
      <View style={st.rowRight}>
        {value ? <Text style={st.rowValue}>{value}</Text> : null}
        {onPress && <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }: Props) {
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
      <SafeAreaView style={styles.safe}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 34 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Avatar + name */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{savedName ? getInitials(savedName) : 'MF'}</Text>
            </View>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{savedName || 'My Frontier User'}</Text>
            </View>
            <Text style={styles.memberSince}>Member since {MEMBER_SINCE}</Text>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {[
              { label: 'Portfolios', value: String(portfolios.length) },
              { label: 'Best Grade', value: bestGrade },
              { label: 'Badges', value: String(badgeCount) },
            ].map(stat => (
              <View key={stat.label} style={styles.statCell}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Account settings */}
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.card}>
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

          {/* Support section */}
          <Text style={styles.sectionLabel}>SUPPORT</Text>
          <View style={styles.card}>
            <SettingsRow emoji="☕" label="Support the App" onPress={() => navigation.navigate('Premium')} />
          </View>

          {/* Danger zone */}
          <Text style={styles.sectionLabel}>DANGER ZONE</Text>
          <View style={styles.card}>
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
  safe:    { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  backBtn:     { padding: Spacing.xs },
  headerTitle: { ...HeadingScale.md, color: Colors.textPrimary },

  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatarCircle:  { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.brandBlue, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  avatarInitials:{ fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  nameRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  userName:      { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  proBadge:      { backgroundColor: Colors.brandGold, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 2 },
  proText:       { fontSize: 10, fontWeight: '800', color: '#000' },
  memberSince:   { ...BodyScale.sm, color: Colors.textTertiary, marginTop: 4 },

  statsRow:  { flexDirection: 'row', marginBottom: Spacing.xl },
  statCell:  { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '800', color: Colors.brandGold },
  statLabel: { ...BodyScale.sm, color: Colors.textSecondary, marginTop: 2 },

  sectionLabel: { ...LabelStyle, color: Colors.textTertiary, marginBottom: Spacing.sm, marginTop: Spacing.lg },

  card:        { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderSubtle, marginBottom: Spacing.sm, overflow: 'hidden' },
  proCard:     { borderColor: Colors.brandGold, padding: Spacing.lg },
  proCardTitle:{ ...HeadingScale.md, color: Colors.brandGold },
  proCardSub:  { ...BodyScale.sm, color: Colors.textSecondary, marginTop: 4 },
  upgradeCard: { borderColor: Colors.brandGold + '66', padding: Spacing.lg },
  upgradeRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  upgradeTitle:{ ...HeadingScale.md, color: Colors.brandGold },
  upgradeSub:  { ...BodyScale.sm, color: Colors.textSecondary, marginTop: 4 },
});

const st = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle + '80' },
  rowEmoji:  { fontSize: 18, width: 28 },
  rowLabel:  { ...BodyScale.md, color: Colors.textPrimary, flex: 1 },
  rowRight:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValue:  { ...BodyScale.sm, color: Colors.textSecondary },
});
