/**
 * ContributionStep.tsx -- Step 3 of category funnel
 * Shows budget sync if available, amount input, 30yr projection.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, shadow } from '../../theme';
import AdBanner from '../AdBanner';

interface Props {
  onBuild: (weekly: number) => void;
  onBack: () => void;
  lumpSum: number;
}

export default function ContributionStep({ onBuild, onBack, lumpSum }: Props) {
  const [weeklyAmount, setWeeklyAmount] = useState(100);
  const [inputValue, setInputValue] = useState('100');
  const [budgetSurplus, setBudgetSurplus] = useState<number | null>(null);
  const [useBudget, setUseBudget] = useState(false);

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
          const weeklyFromBudget = Math.round(surplus / 4.33);
          setBudgetSurplus(surplus);
          setUseBudget(true);
          setWeeklyAmount(weeklyFromBudget);
          setInputValue(String(weeklyFromBudget));
        }
      } catch {}
    });
  }, []);

  const handleAmountChange = (text: string) => {
    setInputValue(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setWeeklyAmount(Math.min(parsed, 5000));
    }
  };

  const handleBlur = () => {
    if (!inputValue || isNaN(parseInt(inputValue, 10))) {
      setInputValue('100');
      setWeeklyAmount(100);
    } else {
      const cleaned = Math.min(parseInt(inputValue, 10), 5000);
      setInputValue(String(cleaned));
      setWeeklyAmount(cleaned);
    }
  };

  const selectQuick = (amt: number) => {
    setWeeklyAmount(amt);
    setInputValue(String(amt));
    setUseBudget(false);
  };

  const selectBudget = () => {
    if (budgetSurplus) {
      const w = Math.round(budgetSurplus / 4.33);
      setWeeklyAmount(w);
      setInputValue(String(w));
      setUseBudget(true);
    }
  };

  const annual = weeklyAmount * 52;
  const fv30 = annual * ((Math.pow(1.07, 30) - 1) / 0.07);
  const fmt = (n: number) => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Weekly Investment</Text>

      {/* Budget sync cards */}
      {budgetSurplus !== null && (
        <View style={styles.optionRow}>
          <TouchableOpacity style={[styles.optionCard, useBudget && styles.optionActive]} onPress={selectBudget} activeOpacity={0.8}>
            <Text style={styles.optionEmoji}>💰</Text>
            <Text style={[styles.optionTitle, useBudget && styles.optionTitleActive]}>Use my budget</Text>
            <Text style={styles.optionSub}>{fmt(Math.round(budgetSurplus / 4.33))}/week from surplus</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.optionCard, !useBudget && styles.optionActive]} onPress={() => setUseBudget(false)} activeOpacity={0.8}>
            <Text style={styles.optionEmoji}>✏️</Text>
            <Text style={[styles.optionTitle, !useBudget && styles.optionTitleActive]}>Custom amount</Text>
            <Text style={styles.optionSub}>Enter your own</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Amount input */}
      <View style={styles.amountCard}>
        <View style={styles.inputRow}>
          <Text style={styles.dollarSign}>$</Text>
          <TextInput
            style={styles.amountInput}
            value={inputValue}
            onChangeText={handleAmountChange}
            onBlur={handleBlur}
            keyboardType="number-pad"
            maxLength={5}
            selectTextOnFocus
          />
          <Text style={styles.perWeek}>/week</Text>
        </View>
        <View style={styles.quickPicks}>
          {[25, 50, 100, 250, 500].map(amt => (
            <TouchableOpacity key={amt} style={[styles.quickBtn, weeklyAmount === amt && !useBudget && styles.quickBtnActive]} onPress={() => selectQuick(amt)}>
              <Text style={[styles.quickBtnText, weeklyAmount === amt && !useBudget && styles.quickBtnTextActive]}>{'$' + amt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Live projection */}
      <View style={styles.projCard}>
        <Text style={styles.projValue}>{fmt(fv30)}</Text>
        <Text style={styles.projSub}>{fmt(weeklyAmount)}/week invested for 30 years at 7% avg return</Text>
      </View>

      <View style={styles.footer}>
        <AdBanner placement="banner" style={{ marginBottom: spacing.sm }} />
        <TouchableOpacity style={styles.buildBtn} onPress={() => onBuild(weeklyAmount)} activeOpacity={0.8}>
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
  title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, paddingHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.lg },
  optionRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  optionCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, padding: spacing.md, alignItems: 'center' as const, gap: 4 },
  optionActive: { borderColor: colors.primary, backgroundColor: '#3B82F618' },
  optionEmoji: { fontSize: 24 },
  optionTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  optionTitleActive: { color: colors.primary },
  optionSub: { fontSize: 11, color: colors.textMuted, textAlign: 'center' as const },
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
  projValue: { fontSize: 36, fontWeight: '900', color: '#10B981' },
  projSub: { fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: 'center' as const, lineHeight: 19 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, paddingBottom: spacing.xl, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
  buildBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', ...shadow.md },
  buildBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
