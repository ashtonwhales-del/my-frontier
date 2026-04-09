import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { colors, spacing, radius, shadow } from '../theme';
import { purchasePremium, restorePurchases } from '../services/purchaseService';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Premium'> };

const FEATURES = [
  { icon: '🤖', text: 'Unlimited Alex AI messages (free: 5/day)' },
  { icon: '💾', text: 'Unlimited saves & comparisons (free: 2 each)' },
  { icon: '📈', text: 'Historical 10-year portfolio chart vs S&P 500' },
  { icon: '📚', text: 'Full Learning Center: 12 lessons + 4 mini games' },
  { icon: '⚡', text: 'No ads — clean, distraction-free experience' },
  { icon: '📄', text: 'Export portfolio as PDF' },
  { icon: '🏆', text: 'Exclusive premium badges + advanced analytics' },
];

export default function PremiumScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  async function handleWaitlist() {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    const raw = await AsyncStorage.getItem('premiumWaitlist');
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(trimmed)) {
      list.push(trimmed);
      await AsyncStorage.setItem('premiumWaitlist', JSON.stringify(list));
    }
    setSubmitted(true);
  }

  async function handleTrial() {
    setPurchasing(true);
    try {
      const success = await purchasePremium();
      if (success) {
        Alert.alert('Welcome to Premium! 🎉', 'Your 7-day free trial has started.', [
          { text: 'Get Started', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Purchase Failed', err?.message ?? 'Please try again.');
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    try {
      const hasPremium = await restorePurchases();
      if (hasPremium) {
        Alert.alert('Restored! ✅', 'Your Premium access has been restored.', [
          { text: 'Continue', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('No Purchases Found', 'We could not find a previous Premium subscription for this Apple ID.');
      }
    } catch (err: any) {
      Alert.alert('Restore Failed', err?.message ?? 'Please try again.');
    } finally {
      setRestoring(false);
    }
  }

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Badge */}
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>PRO</Text>
        </View>

        <Text style={styles.heading}>My Frontier Pro</Text>
        <Text style={styles.subheading}>Invest like the 1%</Text>

        {/* Pricing */}
        <View style={styles.pricingRow}>
          <View style={[styles.pricingCard, styles.pricingCardSelected]}>
            <Text style={styles.pricingLabel}>MONTHLY</Text>
            <Text style={styles.pricingPrice}>$2.99</Text>
            <Text style={styles.pricingPeriod}>per month</Text>
          </View>
          <View style={styles.pricingCard}>
            <View style={styles.saveBadge}><Text style={styles.saveBadgeText}>SAVE 30%</Text></View>
            <Text style={styles.pricingLabel}>YEARLY</Text>
            <Text style={styles.pricingPrice}>$24.99</Text>
            <Text style={styles.pricingPeriod}>per year</Text>
          </View>
        </View>

        {/* Feature list */}
        <View style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.checkCircle}>
                <Text style={styles.checkIcon}>✓</Text>
              </View>
              <Text style={styles.featureText}>
                <Text style={styles.featureEmoji}>{f.icon} </Text>
                {f.text}
              </Text>
            </View>
          ))}
        </View>

        {/* CTA Buttons */}
        <TouchableOpacity
          style={[styles.trialBtn, purchasing && styles.trialBtnDisabled]}
          onPress={handleTrial}
          activeOpacity={0.85}
          disabled={purchasing || restoring}
        >
          {purchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.trialBtnText}>Start 7-Day Free Trial</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestore}
          activeOpacity={0.7}
          disabled={purchasing || restoring}
        >
          {restoring ? (
            <ActivityIndicator color={colors.textSecondary} size="small" />
          ) : (
            <Text style={styles.restoreText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>

        {/* Waitlist */}
        {!submitted ? (
          <View style={styles.waitlistSection}>
            <Text style={styles.waitlistTitle}>Not ready? Join the waitlist.</Text>
            <Text style={styles.waitlistSub}>Get notified when Pro launches + an exclusive launch discount.</Text>
            <View style={styles.waitlistRow}>
              <TextInput
                style={styles.emailInput}
                placeholder="your@email.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleWaitlist}
              />
              <TouchableOpacity style={styles.joinBtn} onPress={handleWaitlist} activeOpacity={0.8}>
                <Text style={styles.joinBtnText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.successBox}>
            <Text style={styles.successText}>🎉 You're on the list! We'll email you when Pro launches.</Text>
          </View>
        )}

        <TouchableOpacity style={styles.laterBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.laterText}>Maybe Later</Text>
        </TouchableOpacity>

        <Text style={styles.legalNote}>
          Free trial converts to paid subscription. Cancel anytime. Educational use only.
        </Text>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F1729' },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: spacing.lg,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  content: { paddingHorizontal: spacing.lg, paddingTop: 100, alignItems: 'center' },

  proBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: spacing.md,
  },
  proBadgeText: { fontSize: 13, fontWeight: '900', color: '#000', letterSpacing: 2 },

  heading: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', marginBottom: 4 },
  subheading: { fontSize: 18, color: 'rgba(255,255,255,0.7)', marginBottom: spacing.xl },

  pricingRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl, width: '100%' },
  pricingCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    position: 'relative',
  },
  pricingCardSelected: {
    borderColor: '#4361EE',
    backgroundColor: 'rgba(67,97,238,0.15)',
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#06D6A0',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  saveBadgeText: { fontSize: 9, fontWeight: '900', color: '#000', letterSpacing: 0.5 },
  pricingLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, marginBottom: 4 },
  pricingPrice: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 2 },
  pricingPeriod: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },

  featureList: { width: '100%', marginBottom: spacing.xl, gap: spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#06D6A0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkIcon: { color: '#000', fontSize: 13, fontWeight: '900' },
  featureText: { flex: 1, fontSize: 15, color: '#fff', lineHeight: 22 },
  featureEmoji: { fontSize: 15 },

  trialBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadow.md,
  },
  trialBtnDisabled: { opacity: 0.6 },
  trialBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  restoreBtn: { paddingVertical: spacing.sm, marginBottom: spacing.md },
  restoreText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },

  waitlistSection: { width: '100%', marginBottom: spacing.lg },
  waitlistTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 4, textAlign: 'center' },
  waitlistSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: spacing.md },
  waitlistRow: { flexDirection: 'row', gap: spacing.sm },
  emailInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  joinBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  successBox: {
    backgroundColor: 'rgba(6,214,160,0.15)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#06D6A0',
  },
  successText: { color: '#06D6A0', fontSize: 14, textAlign: 'center', fontWeight: '600' },

  laterBtn: { marginBottom: spacing.md },
  laterText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '500' },
  legalNote: { fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 16 },
});
