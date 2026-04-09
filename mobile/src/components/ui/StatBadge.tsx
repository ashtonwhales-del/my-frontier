import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Radius } from '../../theme/spacing';

type BadgeColor = 'positive' | 'negative' | 'gold' | 'blue' | 'neutral';

interface StatBadgeProps {
  value: string;
  label?: string;
  color?: BadgeColor;
}

const BG: Record<BadgeColor, string> = {
  positive: Colors.positiveSubtle,
  negative: Colors.negativeSubtle,
  gold:     'rgba(245,158,11,0.15)',
  blue:     'rgba(59,130,246,0.15)',
  neutral:  'rgba(148,163,184,0.12)',
};

const TEXT: Record<BadgeColor, string> = {
  positive: Colors.positive,
  negative: Colors.negative,
  gold:     Colors.brandGold,
  blue:     Colors.brandBlue,
  neutral:  Colors.textSecondary,
};

export default function StatBadge({ value, label, color = 'neutral' }: StatBadgeProps) {
  return (
    <View style={[styles.pill, { backgroundColor: BG[color] }]}>
      <Text style={[styles.value, { color: TEXT[color] }]}>{value}</Text>
      {label && <Text style={[styles.label, { color: TEXT[color] }]}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, alignItems: 'center' },
  value: { fontSize: 13, fontWeight: '700' },
  label: { fontSize: 10, fontWeight: '500', marginTop: 1, opacity: 0.8 },
});
