import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { colors, spacing, radius } from '../theme';
import { useTheme } from '../context/ThemeContext';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Privacy'>;
};

export default function PrivacyPolicyScreen({ navigation }: Props) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { backgroundColor: palette.bgPrimary }]}>
      <View style={[styles.header, { backgroundColor: palette.bgElevated, borderBottomColor: palette.borderSubtle, paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: palette.brandBlue }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>Privacy Policy</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.lastUpdated, { color: palette.textTertiary }]}>Last updated: April 2, 2026</Text>

        <Text style={[styles.section, { color: palette.textPrimary }]}>1. Overview</Text>
        <Text style={[styles.body, { color: palette.textSecondary }]}>
          My Frontier ("the App") is designed with privacy first. We collect the minimum information
          necessary to operate the app and do not sell your data to any third party.
        </Text>

        <Text style={[styles.section, { color: palette.textPrimary }]}>2. What We Collect</Text>
        <Text style={[styles.body, { color: palette.textSecondary }]}>
          <Text style={[styles.bold, { color: palette.textPrimary }]}>Name:</Text> The first name or nickname you enter in the app.
          This is stored only on your device and is never transmitted to our servers in a way that
          identifies you personally.{'\n\n'}
          <Text style={[styles.bold, { color: palette.textPrimary }]}>Portfolio selections:</Text> The ETF categories, risk tolerance,
          and investment amounts you choose. These are sent to our server to run the portfolio
          optimization calculation and are not retained after your session.{'\n\n'}
          <Text style={[styles.bold, { color: palette.textPrimary }]}>Device information (via Google AdMob):</Text> If you use the
          free version of the app, Google AdMob may collect device identifiers, IP address, and
          usage data to serve relevant ads. This is governed by Google's Privacy Policy.
        </Text>

        <Text style={[styles.section, { color: palette.textPrimary }]}>3. What We Do NOT Collect</Text>
        <Text style={[styles.body, { color: palette.textSecondary }]}>
          • No account or email address is required to use the app.{'\n'}
          • We do not collect your Social Security number, bank details, or brokerage credentials.{'\n'}
          • We do not build a profile of you or track you across other apps or websites.{'\n'}
          • We do not sell, rent, or share your personal information with any third party for
          marketing purposes.
        </Text>

        <Text style={[styles.section, { color: palette.textPrimary }]}>4. How We Use Data</Text>
        <Text style={[styles.body, { color: palette.textSecondary }]}>
          Portfolio data sent to our server is used solely to compute your ETF allocation. It is
          processed in memory and discarded after the response is returned. We do not store
          portfolio calculations, investment amounts, or names on our servers.
        </Text>

        <Text style={[styles.section, { color: palette.textPrimary }]}>5. Third-Party Services</Text>
        <Text style={[styles.body, { color: palette.textSecondary }]}>
          <Text style={[styles.bold, { color: palette.textPrimary }]}>Google AdMob:</Text> The free version of My Frontier displays
          ads served by Google AdMob. Google may collect data per their Privacy Policy at
          policies.google.com/privacy.{'\n\n'}
          <Text style={[styles.bold, { color: palette.textPrimary }]}>Yahoo Finance:</Text> Market data is sourced from Yahoo Finance
          via their public API. No personal data is shared with Yahoo Finance.
        </Text>

        <Text style={[styles.section, { color: palette.textPrimary }]}>6. Data Deletion</Text>
        <Text style={[styles.body, { color: palette.textSecondary }]}>
          Because we do not store personal data on our servers, there is no account to delete.
          To remove all locally stored data (name, portfolio history, chat history), uninstall the
          app from your device.{'\n\n'}
          For questions or data deletion requests related to AdMob, contact:
          support@myfrontierapp.com
        </Text>

        <Text style={[styles.section, { color: palette.textPrimary }]}>7. Children's Privacy</Text>
        <Text style={[styles.body, { color: palette.textSecondary }]}>
          My Frontier is not directed at children under 13. We do not knowingly collect personal
          information from children under 13. If you believe a child has provided us with personal
          information, please contact us at support@myfrontierapp.com.
        </Text>

        <Text style={[styles.section, { color: palette.textPrimary }]}>8. Changes to This Policy</Text>
        <Text style={[styles.body, { color: palette.textSecondary }]}>
          We may update this Privacy Policy from time to time. The "Last updated" date at the top
          reflects the most recent revision. Continued use of the app after changes constitutes
          acceptance of the updated policy.
        </Text>

        <Text style={[styles.section, { color: palette.textPrimary }]}>9. Contact</Text>
        <Text style={[styles.body, { color: palette.textSecondary }]}>
          Questions about this Privacy Policy?{'\n'}
          Email: support@myfrontierapp.com{'\n'}
          My Frontier — North Carolina, USA
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
  content: { padding: spacing.lg, paddingBottom: 40 },
  lastUpdated: {
    fontSize: 12,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  section: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
  },
  bold: { fontWeight: '700' },
});
