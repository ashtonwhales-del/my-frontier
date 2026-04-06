import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, spacing, radius, shadow } from '../../theme';

const RISK_LABELS = ['Very Safe', 'Safe', 'Balanced', 'Risky', 'Very Risky'] as const;

type Props = {
  selected: number;
  onSelect: (level: number) => void;
  switching: boolean;
};

export default function RiskSwitcher({ selected, onSelect, switching }: Props) {
  return (
    <View style={riskStyles.container}>
      <Text style={riskStyles.label}>See how risk level changes your portfolio</Text>
      <View style={riskStyles.row}>
        {RISK_LABELS.map((label, i) => {
          const level = i + 1;
          const active = level === selected;
          return (
            <TouchableOpacity
              key={level}
              style={[riskStyles.pill, active && riskStyles.pillActive]}
              onPress={() => onSelect(level)}
              disabled={switching}
              activeOpacity={0.75}
            >
              <Text style={[riskStyles.pillText, active && riskStyles.pillTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {switching && (
        <View style={riskStyles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={riskStyles.loadingText}>Recalculating portfolio…</Text>
        </View>
      )}
    </View>
  );
}

const riskStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  label: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  pill: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.bg,
  },
  pillActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  pillText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  pillTextActive: { color: '#fff' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.sm },
  loadingText: { fontSize: 12, color: colors.textMuted },
});
