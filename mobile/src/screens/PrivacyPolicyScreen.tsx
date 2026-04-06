import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { colors, spacing, radius } from '../theme';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Privacy'>;
};

export default function PrivacyPolicyScreen({ navigation }: Props) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: April 2, 2026</Text>

        <Text style={styles.section}>1. Overview</Text>
        <Text style={styles.body}>
          My Frontier ("the App") is designed with privacy first. We collect the minimum information
          necessary to operate the app and do not sell your data to any third party.
        </Text>

        <Text style={styles.section}>2. What We Collect</Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>Name:</Text> The first name or nickname you enter in the app.
          This is stored only on your device and is never transmitted to our servers in a way that
          identifies you personally.{'\n\n'}
          <Text style={styles.bold}>Portfolio selections:</Text> The ETF categories, risk tolerance,
          and investment amounts you choose. These are sent to our server to run the portfolio
          optimization calculation and are not retained after your session.{'\n\n'}
          <Text style={styles.bold}>Device information (via Google AdMob):</Text> If you use the
          free version of the app, Google AdMob may collect device identifiers, IP address, and
          usage data to serve relevant ads. This is governed by Google's Privacy Policy.
        </Text>

        <Text style={styles.section}>3. What We Do NOT Collect</Text>
        <Text style={styles.body}>
          • No account or email address is required to use the app.{'\n'}
          • We do not collect your Social Security number, bank details, or brokerage credentials.{'\n'}
          • We do not build a profile of you or track you across other apps or websites.{'\n'}
          • We do not sell, rent, or share your personal information with any third party for
          marketing purposes.
        </Text>

        <Text style={styles.section}>4. How We Use Data</Text>
        <Text style={styles.body}>
          Portfolio data sent to our server is used solely to compute your ETF allocation. It is
          processed in memory and discarded after the response is returned. We do not store
          portfolio calculations, investment amounts, or names on our servers.
        </Text>

        <Text style={styles.section}>5. Third-Party Services</Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>Google AdMob:</Text> The free version of My Frontier displays
          ads served by Google AdMob. Google may collect data per their Privacy Policy at
          policies.google.com/privacy.{'\n\n'}
          <Text style={styles.bold}>Yahoo Finance:</Text> Market data is sourced from Yahoo Finance
          via their public API. No personal data is shared with Yahoo Finance.
        </Text>

        <Text style={styles.section}>6. Data Deletion</Text>
        <Text style={styles.body}>
          Because we do not store personal data on our servers, there is no account to delete.
          To remove all locally stored data (name, portfolio history, chat history), uninstall the
          app from your device.{'\n\n'}
          For questions or data deletion requests related to AdMob, contact:
          support@myfrontierapp.com
        </Text>

        <Text style={styles.section}>7. Children's Privacy</Text>
        <Text style={styles.body}>
          My Frontier is not directed at children under 13. We do not knowingly collect personal
          information from children under 13. If you believe a child has provided us with personal
          information, please contact us at support@myfrontierapp.com.
        </Text>

        <Text style={styles.section}>8. Changes to This Policy</Text>
        <Text style={styles.body}>
          We may update this Privacy Policy from time to time. The "Last updated" date at the top
          reflects the most recent revision. Continued use of the app after changes constitutes
          acceptance of the updated policy.
        </Text>

        <Text style={styles.section}>9. Contact</Text>
        <Text style={styles.body}>
          Questions about this Privacy Policy?{'\n'}
          Email: support@myfrontierapp.com{'\n'}
          My Frontier — North Carolina, USA
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
  content: { padding: spacing.lg, paddingBottom: 40 },
  lastUpdated: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  section: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  bold: { fontWeight: '700', color: colors.textPrimary },
});
