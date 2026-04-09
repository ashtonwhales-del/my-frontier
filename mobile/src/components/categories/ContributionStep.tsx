/**
 * ContributionStep.tsx -- Step 2: Set weekly investment amount
 * Budget card pre-fills, keyboard-safe, live 30yr projection.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, shadow } from '../../theme';
import AdBanner from '../AdBanner';

interface Props {
  onBuild: (weekly: number, lumpSum: number) => void;
  onBack: () => void;
  lumpSum: number;
}

export default function ContributionStep({ onBuild, onBack }: Props) {
  const [weeklyAmount, setWeeklyAmount] = useState(100);
  const [inputValue, setInputValue] = useState('100');
  const [budgetWeekly, setBudgetWeekly] = useState<number | null>(null);
  const [budgetActive, setBudgetActive] = useState(false);

  useEffect(() => {
    const month = new Date().toISOString().slice(0, 7);
    AsyncStorage.getItem('budgetData_' + month).then(raw => {
      if (!raw) return;
      try {
        const data = JSON.parse(raw);
        const income = data.income ?? 0;
        const total = Object.values(data.categories ?? {}).reduce((s: number, v: any) => s + (v as number), 0);
        const surplus = income - total;
        if (surplus > 0) {
          const w = Math.round(surplus / 4.33);
          setBudgetWeekly(w);
          setBudgetActive(true);
          setWeeklyAmount(w);
          setInputValue(String(w));
        }
      } catch {}
    });
  }, []);

  const handleChange = (text: string) => {
    setInputValue(text);
    setBudgetActive(false);
    const n = parseFloat(text);
    if (!isNaN(n) && n > 0) setWeeklyAmount(Math.min(Math.round(n), 5000));
  };

  const handleBlur = () => {
    if (!inputValue || isNaN(parseFloat(inputValue))) {
      setInputValue('100');
      setWeeklyAmount(100);
    } else {
      const v = Math.min(Math.round(parseFloat(inputValue)), 5000);
      setInputValue(String(v));
      setWeeklyAmount(v);
    }
  };

  const useBudgetAmount = () => {
    if (!budgetWeekly) return;
    setWeeklyAmount(budgetWeekly);
    setInputValue(String(budgetWeekly));
    setBudgetActive(true);
    Keyboard.dismiss();
  };

  const [lumpSumVal, setLumpSumVal] = useState(0);
  const [lumpInput, setLumpInput] = useState('');
  const RATE = 0.07;
  const calcFV = (years: number) => {
    const monthlyRate = Math.pow(1 + RATE, 1 / 12) - 1;
    const months = years * 12;
    const monthly = weeklyAmount * 4.33;
    const fvContrib = monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    const fvLump = lumpSumVal * Math.pow(1 + RATE, years);
    return fvContrib + fvLump;
  };
  const HORIZONS = [10, 20, 30, 40, 50] as const;
  const fmt = (n: number) => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Set Your Weekly Investment</Text>
        <Text style={styles.subtitle}>How much will you invest each week?</Text>

        {budgetWeekly !== null && (
          <TouchableOpacity style={[styles.budgetCard, budgetActive && styles.budgetCardActive]} onPress={useBudgetAmount} activeOpacity={0.8}>
            <View style={styles.budgetLeft}>
              <Text style={styles.budgetEmoji}>💰</Text>
              <View>
                <Text style={[styles.budgetTitle, budgetActive && styles.budgetTitleActive]}>Based on your budget</Text>
                <Text style={styles.budgetSub}>{fmt(budgetWeekly)}/week available after expenses</Text>
              </View>
            </View>
            {budgetActive && <Text style={styles.budgetCheck}>✓</Text>}
          </TouchableOpacity>
        )}

        <Text style={styles.inputLabel}>{budgetWeekly ? 'Or enter your own amount:' : 'Enter your weekly amount:'}</Text>
        <View style={styles.amountCard}>
          <View style={styles.inputRow}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={inputValue}
              onChangeText={handleChange}
              onBlur={handleBlur}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              maxLength={5}
              selectTextOnFocus
            />
            <Text style={styles.perWeek}>/week</Text>
          </View>
          <View style={styles.quickPicks}>
            {[25, 50, 100, 250, 500].map(amt => (
              <TouchableOpacity key={amt} style={[styles.quickBtn, weeklyAmount === amt && !budgetActive && styles.quickBtnActive]} onPress={() => { setWeeklyAmount(amt); setInputValue(String(amt)); setBudgetActive(false); }}>
                <Text style={[styles.quickBtnText, weeklyAmount === amt && !budgetActive && styles.quickBtnTextActive]}>{'$' + amt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>One-time investment (optional):</Text>
        <View style={[styles.amountCard, { marginBottom: spacing.md }]}>
          <View style={styles.inputRow}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput style={[styles.amountInput, { fontSize: 28 }]} value={lumpInput} onChangeText={t => { setLumpInput(t); const n = parseFloat(t); if (!isNaN(n) && n >= 0) setLumpSumVal(n); }} keyboardType="decimal-pad" returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} placeholder="0" placeholderTextColor={colors.textMuted} maxLength={8} />
            <Text style={styles.perWeek}>lump sum</Text>
          </View>
        </View>

        <View style={styles.projCard}>
          <Text style={styles.projLabel}>PROJECTED GROWTH AT 7%</Text>
          {HORIZONS.map(yr => {
            const val = calcFV(yr);
            const is30 = yr === 30;
            return (
              <View key={yr} style={styles.projRow}>
                <Text style={[styles.projYr, is30 && { color: '#F59E0B' }]}>{yr} years</Text>
                <Text style={[styles.projVal, is30 && { color: '#F59E0B', fontSize: 20 }]}>{fmt(val)}</Text>
              </View>
            );
          })}
        </View>

        <AdBanner placement="banner" style={{ marginHorizontal: spacing.lg, marginBottom: spacing.md }} />

        <TouchableOpacity style={styles.buildBtn} onPress={() => onBuild(weeklyAmount, lumpSumVal)} activeOpacity={0.8}>
          <Text style={styles.buildBtnText}>Build My Portfolio</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 40 },
  backBtn: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  backText: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, paddingHorizontal: spacing.lg, marginTop: spacing.md },
  subtitle: { fontSize: 14, color: colors.textSecondary, paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  budgetCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: spacing.lg, marginBottom: spacing.lg,
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: '#10B981',
    padding: spacing.md,
  },
  budgetCardActive: { borderColor: '#10B981', backgroundColor: '#10B98112' },
  budgetLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  budgetEmoji: { fontSize: 28 },
  budgetTitle: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  budgetTitleActive: { color: '#10B981' },
  budgetSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  budgetCheck: { fontSize: 18, fontWeight: '900', color: '#10B981' },
  inputLabel: { fontSize: 13, color: colors.textSecondary, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  amountCard: {
    marginHorizontal: spacing.lg, marginBottom: spacing.lg,
    backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg,
    alignItems: 'center' as const, ...shadow.sm,
  },
  inputRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.md },
  dollarSign: { fontSize: 28, fontWeight: '700', color: colors.textMuted },
  amountInput: { fontSize: 36, fontWeight: '900', color: colors.textPrimary, minWidth: 80, textAlign: 'center' as const },
  perWeek: { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
  quickPicks: { flexDirection: 'row', gap: spacing.sm },
  quickBtn: { backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 6 },
  quickBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  quickBtnText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  quickBtnTextActive: { color: '#fff' },
  projCard: {
    marginHorizontal: spacing.lg, marginBottom: spacing.lg,
    backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg,
    alignItems: 'center' as const, ...shadow.sm,
  },
  projLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' as const, marginBottom: spacing.sm },
  projRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  projYr: { fontSize: 14, color: colors.textSecondary },
  projVal: { fontSize: 16, fontWeight: '700', color: '#10B981' },
  buildBtn: { marginHorizontal: spacing.lg, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center' as const, ...shadow.md },
  buildBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
