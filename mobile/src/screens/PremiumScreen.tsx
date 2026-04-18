import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  Linking,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { colors, spacing, radius, shadow } from '../theme';
import { useTheme } from '../context/ThemeContext';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Premium'> };

const FEATURES = [
  { icon: '📊', text: 'Efficient Frontier portfolio optimization' },
  { icon: '📈', text: '10-year historical portfolio chart vs S&P 500' },
  { icon: '💾', text: 'Unlimited portfolio saves and comparisons' },
  { icon: '📄', text: 'Export portfolio as PDF' },
  { icon: '💳', text: 'Full debt repayment planner with strategies' },
  { icon: '🏆', text: 'Badges and achievement tracking' },
];

export default function PremiumScreen({ navigation }: Props) {
  const { palette } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: palette.bgPrimary }]}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.freeEmoji}>🎉</Text>
        <Text style={[styles.heading, { color: palette.textPrimary }]}>My Frontier is Free</Text>
        <Text style={[styles.subheading, { color: palette.textSecondary }]}>We believe everyone deserves professional investing tools. My Frontier is 100% free. Ads keep us running.</Text>

        <View style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.checkCircle}>
                <Text style={styles.checkIcon}>✓</Text>
              </View>
              <Text style={[styles.featureText, { color: palette.textPrimary }]}>
                <Text style={styles.featureEmoji}>{f.icon} </Text>
                {f.text}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.supportTitle, { color: palette.textPrimary }]}>Support the App</Text>

        <TouchableOpacity style={styles.supportBtn} onPress={() => Linking.openURL('https://www.buymeacoffee.com/MyFrontier').catch(() => {})} activeOpacity={0.8}>
          <Text style={styles.supportBtnText}>Buy Me a Coffee</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.supportBtnOutline, { borderColor: palette.borderSubtle }]} onPress={() => Share.share({ message: 'I build investment portfolios with My Frontier. Free app, real math. Check it out: myfrontierapp.com' })} activeOpacity={0.8}>
          <Text style={[styles.supportBtnOutlineText, { color: palette.textSecondary }]}>Share App</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.supportBtnOutline, { borderColor: palette.borderSubtle }]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={[styles.supportBtnOutlineText, { color: palette.textSecondary }]}>Rate Us on the App Store</Text>
        </TouchableOpacity>

        <Text style={styles.legalNote}>For educational purposes only. Not financial advice.</Text>
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  closeBtn: { position: 'absolute', top: 56, right: spacing.lg, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: { paddingHorizontal: spacing.lg, paddingTop: 100, alignItems: 'center' },
  freeEmoji: { fontSize: 48, marginBottom: spacing.md },
  heading: { fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: spacing.sm },
  subheading: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },
  featureList: { width: '100%', marginBottom: spacing.xl, gap: spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#06D6A0', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  checkIcon: { color: '#000', fontSize: 13, fontWeight: '900' },
  featureText: { flex: 1, fontSize: 15, lineHeight: 22 },
  featureEmoji: { fontSize: 15 },
  supportTitle: { fontSize: 18, fontWeight: '800', marginBottom: spacing.md },
  supportBtn: { width: '100%', backgroundColor: '#F59E0B', borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', marginBottom: spacing.sm, ...shadow.md },
  supportBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
  supportBtnOutline: { width: '100%', borderWidth: 1.5, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginBottom: spacing.sm },
  supportBtnOutlineText: { fontSize: 15, fontWeight: '600' },
  legalNote: { fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 16, marginTop: spacing.lg },
});
