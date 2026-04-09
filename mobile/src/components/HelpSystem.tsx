/**
 * HelpSystem.tsx -- Floating help FAB + context-sensitive bottom sheet
 * Add to any screen: <HelpFAB screen="home" />
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, shadow } from '../theme';

const HELP_CONTENT: Record<string, { title: string; tips: string[] }> = {
  home: {
    title: 'Home Dashboard',
    tips: [
      'Tap "Build New Portfolio" to create a personalized ETF allocation.',
      'The Market Pulse shows real-time ticker data updated every 5 minutes.',
      'Your recent portfolios appear at the bottom for quick access.',
      'Use the bottom nav to switch between Home, Budget, Portfolio, Learn, and Profile.',
    ],
  },
  results: {
    title: 'Your Portfolio Results',
    tips: [
      'The Frontier Score grades your portfolio from A (excellent) to F (poor).',
      'Tap any ETF card to expand it and see allocation details.',
      'Long-press an ETF to see a full detail sheet.',
      'Use the Risk Switcher pills to instantly recalculate at a different risk level.',
      'Scroll down for projections showing your estimated wealth over time.',
    ],
  },
  budget: {
    title: 'Monthly Budget',
    tips: [
      'Tap the gold card to set your monthly income.',
      'Tap each category to set your spending.',
      'The investing opportunity card shows how much you can invest weekly.',
      'Your Spending DNA pill shows your financial personality type.',
    ],
  },
  advisor: {
    title: 'Ask Alex',
    tips: [
      'Alex is a free AI guide powered by Gemini.',
      'Ask about your portfolio, risk levels, or investing concepts.',
      'Free users get 5 messages per day, resetting at midnight.',
      'Watch a video ad to unlock 10 more messages.',
    ],
  },
  learning: {
    title: 'Learning Center',
    tips: [
      'Complete beginner lessons to earn badges.',
      'Watch a short ad to unlock intermediate, advanced, and game lessons.',
      'Your progress is saved automatically.',
    ],
  },
  compare: {
    title: 'Compare Portfolios',
    tips: [
      'Select two portfolios to see a head-to-head comparison.',
      'The winner is determined by who wins more metrics.',
      'You can compare all your saved portfolios.',
    ],
  },
};

const TOOLTIP_KEY = 'helpTooltipsShown';

interface Props {
  screen: keyof typeof HELP_CONTENT;
}

export default function HelpFAB({ screen }: Props) {
  const [visible, setVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const help = HELP_CONTENT[screen];

  useEffect(() => {
    AsyncStorage.getItem(TOOLTIP_KEY).then(raw => {
      const shown: string[] = raw ? JSON.parse(raw) : [];
      if (!shown.includes(screen)) {
        setShowTooltip(true);
        AsyncStorage.setItem(TOOLTIP_KEY, JSON.stringify([...shown, screen]));
        setTimeout(() => setShowTooltip(false), 4000);
      }
    });
  }, []);

  if (!help) return null;

  return (
    <>
      {showTooltip && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>Tap ? for help</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>?</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.overlay} onPress={() => setVisible(false)} activeOpacity={1}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{help.title}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {help.tips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Text style={styles.tipBullet}>{i + 1}</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.gotItBtn} onPress={() => setVisible(false)}>
              <Text style={styles.gotItText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute', bottom: 80, left: spacing.lg,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6,
  },
  fabText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  tooltip: {
    position: 'absolute', bottom: 126, left: spacing.lg,
    backgroundColor: '#1D4ED8', borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 6,
  },
  tooltipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, paddingBottom: spacing.xl, maxHeight: Dimensions.get('window').height * 0.6,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.lg },
  tipRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md, alignItems: 'flex-start' },
  tipBullet: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#3B82F622', color: '#3B82F6', textAlign: 'center', lineHeight: 24, fontSize: 13, fontWeight: '700', overflow: 'hidden' },
  tipText: { flex: 1, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  gotItBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: spacing.lg },
  gotItText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
