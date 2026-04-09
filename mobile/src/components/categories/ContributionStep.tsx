/**
 * ContributionStep.tsx -- Step 3 of category funnel
 * Shows budget sync if available, amount input, 30yr projection.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, shadow } from '../../theme';

interface Props {
  onBuild: (weekly: number) => void;
  onBack: () => void;
  lumpSum: number;
}

export default function ContributionStep({ onBuild, onBack, lumpSum }: Props) {
  const [weekly, setWeekly] = useState(100);
  const [budgetSurplus, setBudgetSurplus] = useState<number | null>(null);

  useEffect(() => {
    const month = new Date().toISOString().slice(0, 7);
    AsyncStorage.getItem('budgetData_' + month).then(raw => {
      if (!raw) return;
      try {
        const data = JSON.parse(raw);
        const income = data.income ?? 0;
        const allocated = Object.values(data.categories ?? {}).reduce((s: number, v: any) => s + (v as number), 0);
        const surplus = income - allocated;
        if (surplus > 0) {
          setBudgetSurplus(surplus);
          setWeekly(Math.round(surplus / 4.33));
        }
      } catch {}
    });
  }, []);

  const annual = weekly * 52;
  const fv30 = annual * ((Math.pow(1.07, 30) - 1) / 0.07);
  const fmt = (n: number) => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Set Your Contribution</Text>
      <Text style={styles.subtitle}>How much can you invest each week?</Text>

      {budgetSurplus !== null && (
        <View style={styles.budgetSync}>
          <Text style={styles.budgetLabel}>From your budget</Text>
          <Text style={styles.budgetValue}>{fmt(budgetSurplus)}/month surplus</Text>
          <Text style={styles.budgetHint}>Pre-filled at {fmt(Math.round(budgetSurplus / 4.33))}/week</Text>
        </View>
      )}

      <View style={styles.amountCard}>
        <Text style={styles.weeklyLabel}>Weekly investment</Text>
        <View style={styles.inputRow}>
          <Text style={styles.dollarSign}>$</Text>
          <TextInput
            style={styles.amountInput}
            value={String(weekly)}
            onChangeText={t => { const n = parseInt(t, 10); if (!isNaN(n) && n >= 0) setWeekly(Math.min(n, 5000)); }}
            keyboardType="number-pad"
            maxLength={5}
          />
          <Text style={styles.perWeek}>/week</Text>
        </View>
        <View style={styles.quickPicks}>
          {[25, 50, 100, 250, 500].map(amt => (
            <TouchableOpacity
              key={amt}
              style={[styles.quickBtn, weekly === amt && styles.quickBtnActive]}
              onPress={() => setWeekly(amt)}
            >
              <Text style={[styles.quickBtnText, weekly === amt && styles.quickBtnTextActive]}>{'$' + amt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.projCard}>
        <Text style={styles.projLabel}>30-Year Projection (7% avg return)</Text>
        <Text style={styles.projValue}>{fmt(fv30)}</Text>
        <Text style={styles.projSub}>{fmt(annual)}/year invested</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.buildBtn}
          onPress={() => onBuild(weekly)}
          activeOpacity={0.8}
        >
          <Text style={styles.buildBtnText}>Build My Portfolio</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  backBtn: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  backText: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, paddingHorizontal: spacing.lg, marginTop: spacing.md },
  subtitle: { fontSize: 14, color: colors.textSecondary, paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  budgetSync: {
    marginHorizontal: spacing.lg, marginBottom: spacing.lg,
    backgroundColor: '#10B98118', borderRadius: radius.lg, borderWidth: 1, borderColor: '#10B981',
    padding: spacing.md, alignItems: 'center', gap: 4,
  },
  budgetLabel: { fontSize: 11, color: '#10B981', fontWeight: '700', textTransform: 'uppercase' },
  budgetValue: { fontSize: 18, fontWeight: '800', color: '#10B981' },
  budgetHint: { fontSize: 12, color: colors.textSecondary },
  amountCard: {
    marginHorizontal: spacing.lg, marginBottom: spacing.lg,
    backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg,
    alignItems: 'center', ...shadow.sm,
  },
  weeklyLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.sm, textTransform: 'uppercase', fontWeight: '700' },
  inputRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.md },
  dollarSign: { fontSize: 28, fontWeight: '700', color: colors.textMuted },
  amountInput: { fontSize: 36, fontWeight: '900', color: colors.textPrimary, minWidth: 80, textAlign: 'center' },
  perWeek: { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
  quickPicks: { flexDirection: 'row', gap: spacing.sm },
  quickBtn: { backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 6 },
  quickBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  quickBtnText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  quickBtnTextActive: { color: '#fff' },
  projCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg,
    alignItems: 'center', ...shadow.sm,
  },
  projLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.sm },
  projValue: { fontSize: 32, fontWeight: '900', color: '#10B981' },
  projSub: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, paddingBottom: spacing.xl, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
  buildBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', ...shadow.md },
  buildBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
