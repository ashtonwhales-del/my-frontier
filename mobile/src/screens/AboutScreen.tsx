import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { colors, spacing, radius, shadow } from '../theme';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'About'>;
};

const APP_VERSION = '1.0.0';
const APP_BUILD = '1';

export default function AboutScreen({ navigation }: Props) {
  function openFeedback() {
    Linking.openURL('mailto:support@myfrontierapp.com?subject=My%20Frontier%20Feedback');
  }

  function openRating() {
    // Replace with real App Store URL before launch
    Linking.openURL('https://apps.apple.com/app/id000000000');
  }

  function openWaitlist() {
    Linking.openURL('https://myfrontierapp.com/pro-waitlist');
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* App identity */}
        <View style={styles.heroCard}>
          <Text style={styles.appName}>
            <Text style={{ color: colors.primary }}>My </Text>
            <Text style={{ color: colors.textPrimary }}>Frontier</Text>
          </Text>
          <Text style={styles.version}>Version {APP_VERSION} (Build {APP_BUILD})</Text>
          <Text style={styles.tagline}>Made with ❤️ in North Carolina</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.actionBtn} onPress={openRating} activeOpacity={0.8}>
            <Text style={styles.actionEmoji}>⭐</Text>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionTitle}>Rate My Frontier</Text>
              <Text style={styles.actionSub}>Enjoying the app? Leave us a review</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={openFeedback} activeOpacity={0.8}>
            <Text style={styles.actionEmoji}>✉️</Text>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionTitle}>Send Feedback</Text>
              <Text style={styles.actionSub}>Report a bug or share an idea</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.proBtn]} onPress={openWaitlist} activeOpacity={0.8}>
            <Text style={styles.actionEmoji}>🚀</Text>
            <View style={styles.actionTextWrap}>
              <Text style={[styles.actionTitle, { color: colors.accent }]}>Join the Waitlist for Pro</Text>
              <Text style={styles.actionSub}>Advanced features coming soon</Text>
            </View>
            <Text style={[styles.chevron, { color: colors.accent }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Legal links */}
        <View style={styles.legalRow}>
          <TouchableOpacity onPress={() => navigation.navigate('Privacy')} activeOpacity={0.7}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalSep}>·</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Terms')} activeOpacity={0.7}>
            <Text style={styles.legalLink}>Terms of Service</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.copyright}>
          © 2026 My Frontier. For educational purposes only.{'\n'}Not financial advice.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: 56,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 44, padding: spacing.sm },
  backText: { fontSize: 22, color: colors.primary, fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },

  content: { padding: spacing.lg, paddingBottom: 48 },

  heroCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadow.md,
  },
  appName: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  version: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm },
  tagline: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },

  section: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  proBtn: { borderBottomWidth: 0 },
  actionEmoji: { fontSize: 22, width: 30, textAlign: 'center' },
  actionTextWrap: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  actionSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  chevron: { fontSize: 20, color: colors.textMuted, fontWeight: '300' },

  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  legalLink: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  legalSep: { fontSize: 13, color: colors.textMuted },

  copyright: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
});
