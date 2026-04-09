/**
 * StyleSelector.tsx — Step 1 of the category funnel
 * 4 investment style cards, user picks one to filter categories.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, radius, shadow } from '../../theme';

export type InvestmentStyle = 'safe' | 'balanced' | 'aggressive' | 'custom';

interface StyleOption {
  id: InvestmentStyle;
  emoji: string;
  title: string;
  subtitle: string;
  accent: string;
}

const STYLES: StyleOption[] = [
  { id: 'safe', emoji: '🛡️', title: 'Play It Safe', subtitle: 'Low risk, steady growth. Bonds, dividends, and blue chips.', accent: '#10B981' },
  { id: 'balanced', emoji: '⚖️', title: 'Balanced Growth', subtitle: 'Mix of stability and growth. A little bit of everything.', accent: '#3B82F6' },
  { id: 'aggressive', emoji: '🚀', title: 'Aggressive Growth', subtitle: 'High risk, high reward. Tech, emerging markets, innovation.', accent: '#F59E0B' },
  { id: 'custom', emoji: '🎯', title: 'I Know What I Want', subtitle: 'Pick your own sectors from all 98 categories.', accent: '#7209B7' },
];

const SCREEN_W = Dimensions.get('window').width;

interface Props {
  onSelect: (style: InvestmentStyle) => void;
}

export default function StyleSelector({ onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How do you like to invest?</Text>
      <Text style={styles.subtitle}>Pick a style and we'll suggest the best sectors for you</Text>
      {STYLES.map(s => (
        <TouchableOpacity
          key={s.id}
          style={[styles.card, { borderLeftColor: s.accent }]}
          onPress={() => onSelect(s.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.emoji}>{s.emoji}</Text>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.cardSub}>{s.subtitle}</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.sm, lineHeight: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.sm,
  },
  emoji: { fontSize: 32 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  cardSub: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  arrow: { fontSize: 20, color: colors.textMuted },
});
