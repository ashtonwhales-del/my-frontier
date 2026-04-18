import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { colors, spacing, radius, shadow } from '../theme';
import { useTheme } from '../context/ThemeContext';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'About'>;
};

const APP_VERSION = '1.0.0';
const APP_BUILD = '1';

export default function AboutScreen({ navigation }: Props) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

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
    <View style={[styles.screen, { backgroundColor: palette.bgPrimary }]}>
      <View style={[styles.header, { backgroundColor: palette.bgElevated, borderBottomColor: palette.borderSubtle, paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: palette.brandBlue }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>About</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* App identity */}
        <View style={[styles.heroCard, { backgroundColor: palette.bgElevated }]}>
          <Text style={styles.appName}>
            <Text style={{ color: palette.brandBlue }}>My </Text>
            <Text style={{ color: palette.textPrimary }}>Frontier</Text>
          </Text>
          <Text style={[styles.version, { color: palette.textTertiary }]}>Version {APP_VERSION} (Build {APP_BUILD})</Text>
          <Text style={[styles.tagline, { color: palette.textSecondary }]}>Made with ❤️ in North Carolina</Text>
        </View>

        {/* Action buttons */}
        <View style={[styles.section, { backgroundColor: palette.bgElevated }]}>
          <TouchableOpacity style={[styles.actionBtn, { borderBottomColor: palette.borderSubtle }]} onPress={openRating} activeOpacity={0.8}>
            <Text style={styles.actionEmoji}>⭐</Text>
            <View style={styles.actionTextWrap}>
              <Text style={[styles.actionTitle, { color: palette.textPrimary }]}>Rate My Frontier</Text>
              <Text style={[styles.actionSub, { color: palette.textTertiary }]}>Enjoying the app? Leave us a review</Text>
            </View>
            <Text style={[styles.chevron, { color: palette.textTertiary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { borderBottomColor: palette.borderSubtle }]} onPress={openFeedback} activeOpacity={0.8}>
            <Text style={styles.actionEmoji}>✉️</Text>
            <View style={styles.actionTextWrap}>
              <Text style={[styles.actionTitle, { color: palette.textPrimary }]}>Send Feedback</Text>
              <Text style={[styles.actionSub, { color: palette.textTertiary }]}>Report a bug or share an idea</Text>
            </View>
            <Text style={[styles.chevron, { color: palette.textTertiary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.proBtn, { borderBottomColor: palette.borderSubtle }]} onPress={openWaitlist} activeOpacity={0.8}>
            <Text style={styles.actionEmoji}>🚀</Text>
            <View style={styles.actionTextWrap}>
              <Text style={[styles.actionTitle, { color: colors.accent }]}>Join the Waitlist for Pro</Text>
              <Text style={[styles.actionSub, { color: palette.textTertiary }]}>Advanced features coming soon</Text>
            </View>
            <Text style={[styles.chevron, { color: colors.accent }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Legal links */}
        <View style={styles.legalRow}>
          <TouchableOpacity onPress={() => navigation.navigate('Privacy')} activeOpacity={0.7}>
            <Text style={[styles.legalLink, { color: palette.brandBlue }]}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={[styles.legalSep, { color: palette.textTertiary }]}>·</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Terms')} activeOpacity={0.7}>
            <Text style={[styles.legalLink, { color: palette.brandBlue }]}>Terms of Service</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.copyright, { color: palette.textTertiary }]}>
          © 2026 My Frontier. For educational purposes only.{'\n'}Not financial advice.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { width: 44, padding: spacing.sm },
  backText: { fontSize: 22, fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '800' },

  content: { padding: spacing.lg, paddingBottom: 48 },

  heroCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadow.md,
  },
  appName: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  version: { fontSize: 13, marginBottom: spacing.sm },
  tagline: { fontSize: 15, fontWeight: '500' },

  section: {
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
    gap: spacing.md,
  },
  proBtn: { borderBottomWidth: 0 },
  actionEmoji: { fontSize: 22, width: 30, textAlign: 'center' },
  actionTextWrap: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '600' },
  actionSub: { fontSize: 12, marginTop: 1 },
  chevron: { fontSize: 20, fontWeight: '300' },

  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  legalLink: { fontSize: 13, fontWeight: '500' },
  legalSep: { fontSize: 13 },

  copyright: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
  },
});
