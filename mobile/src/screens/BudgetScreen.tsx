/**
 * BudgetScreen.tsx
 * Monthly budget tracker with investing opportunity.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { Colors } from '../theme/colors';
import { NumberScale, HeadingScale, BodyScale, LabelStyle } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import Card from '../components/ui/Card';
import GradientButton from '../components/ui/GradientButton';
import TabShell from '../components/TabShell';
import { IncomeModal, CategoryModal } from './BudgetModals';
import AdBanner from '../components/ads/SmartBanner';
import IncomeSourcesSection from '../components/budget/IncomeSourcesSection';

// ---------- constants ----------
type NavProp = StackNavigationProp<RootStackParamList, 'Budget'>;

const CATEGORIES = [
  { key: 'Housing',       emoji: '🏠' },
  { key: 'Transport',     emoji: '🚗' },
  { key: 'Food',          emoji: '🍔' },
  { key: 'Utilities',     emoji: '💡' },
  { key: 'Subscriptions', emoji: '📱' },
  { key: 'Entertainment', emoji: '🎬' },
  { key: 'Shopping',      emoji: '🛍️' },
  { key: 'Health',        emoji: '🏥' },
  { key: 'Education',     emoji: '📚' },
  { key: 'Other',         emoji: '💼' },
];

type CategoryAmounts = Record<string, number>;

interface BudgetData { income: number; categories: CategoryAmounts }

const storageKey = (month: string) => `budgetData_${month}`;
const currentMonth = () => new Date().toISOString().slice(0, 7);
const fmt = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

// Spending DNA removed — no personality labels on budget screen

export default function BudgetScreen() {
  const navigation = useNavigation<NavProp>();
  const [income, setIncome]       = useState(0);
  const [amounts, setAmounts]     = useState<CategoryAmounts>({});
  const [incomeModal, setIncomeModal]   = useState(false);
  const [catModal, setCatModal]         = useState<{ key: string; emoji: string } | null>(null);
  const [additionalMonthly, setAdditionalMonthly] = useState(0);

  const month = currentMonth();

  const load = useCallback(async () => {
    const raw = await AsyncStorage.getItem(storageKey(month));
    if (raw) {
      const data: BudgetData = JSON.parse(raw);
      setIncome(data.income ?? 0);
      setAmounts(data.categories ?? {});
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const persist = async (newIncome: number, newAmounts: CategoryAmounts) => {
    const data: BudgetData = { income: newIncome, categories: newAmounts };
    await AsyncStorage.setItem(storageKey(month), JSON.stringify(data));
  };

  const saveIncome = (val: number) => {
    setIncome(val);
    persist(val, amounts);
    setIncomeModal(false);
  };

  const saveCategory = (key: string, val: number) => {
    const updated = { ...amounts, [key]: val };
    setAmounts(updated);
    persist(income, updated);
    setCatModal(null);
  };

  const allocated  = Object.values(amounts).reduce((s, v) => s + v, 0);
  const totalIncome = income + additionalMonthly;
  const remaining  = totalIncome - allocated;
  const weeklyInvest = remaining > 0 ? remaining / 4.33 : 0;
  const fv30 = weeklyInvest > 0
    ? (weeklyInvest * 52) * ((Math.pow(1.07, 30) - 1) / 0.07)
    : 0;
  return (
    <TabShell active="Budget">
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Monthly Budget</Text>
        <Text style={styles.screenMonth}>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>

        {/* Income card */}
        <TouchableOpacity onPress={() => setIncomeModal(true)}>
          <Card glow="gold" style={styles.incomeCard}>
            <Text style={styles.incomeLabel}>Monthly Income</Text>
            {income > 0
              ? <Text style={[NumberScale.lg, { color: Colors.textPrimary }]}>{fmt(income)}</Text>
              : <Text style={styles.incomePlaceholder}>Tap to add income →</Text>}
          </Card>
        </TouchableOpacity>

        {/* Additional income sources */}
        <IncomeSourcesSection onTotalChange={setAdditionalMonthly} />

        {/* Category grid */}
        <View style={styles.grid}>
          {CATEGORIES.map(cat => {
            const val = amounts[cat.key] ?? 0;
            const borderColor = val > 0 ? Colors.positive : Colors.negative;
            return (
              <TouchableOpacity key={cat.key} style={styles.cellWrapper} onPress={() => setCatModal(cat)}>
                <Card style={[styles.cell, { borderLeftColor: borderColor, borderLeftWidth: 3 }]}>
                  <Text style={styles.cellEmoji}>{cat.emoji}</Text>
                  <Text style={styles.cellName}>{cat.key}</Text>
                  <Text style={[NumberScale.sm, { color: Colors.textPrimary }]}>
                    {val > 0 ? fmt(val) : '—'}
                  </Text>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Investing opportunity */}
        {income > 0 && (
          <Card glow="blue" style={styles.opportunityCard}>
            <Text style={styles.opportunityTitle}>💡 Your Investing Opportunity</Text>
            <Text style={styles.opportunityBody}>
              {fmt(Math.max(0, remaining))} left this month
              {' → '}{fmt(weeklyInvest)}/week invested
              {' → '}{fmt(fv30)} in 30 years
            </Text>
            <GradientButton
              label="Build My Portfolio →"
              onPress={() => navigation.navigate('Welcome')}
              style={styles.ctaBtn}
            />
          </Card>
        )}

        {/* Debt Planner link */}
        <TouchableOpacity
          style={{ marginBottom: Spacing.lg, borderWidth: 1.5, borderColor: Colors.borderSubtle, borderLeftWidth: 4, borderLeftColor: '#F59E0B', borderRadius: Radius.lg, paddingVertical: 14, paddingHorizontal: Spacing.lg }}
          onPress={() => navigation.navigate('DebtPlanner' as any)}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.textSecondary }}>Debt Repayment Planner</Text>
        </TouchableOpacity>

        {/* Bill Negotiator link */}
        <TouchableOpacity
          style={{ marginBottom: Spacing.lg, borderWidth: 1.5, borderColor: Colors.borderSubtle, borderLeftWidth: 4, borderLeftColor: '#F59E0B', borderRadius: Radius.lg, paddingVertical: 14, paddingHorizontal: Spacing.lg }}
          onPress={() => navigation.navigate('BillNegotiation' as any)} activeOpacity={0.8}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.textSecondary }}>Bill Negotiator</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sticky ad banner */}
      <AdBanner placement="banner" style={{ marginBottom: income > 0 ? 0 : 0 }} />

      {/* Sticky summary bar */}
      {income > 0 && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryLeft}>Allocated {fmt(allocated)}</Text>
          <Text style={[styles.summaryRight, { color: remaining >= 0 ? Colors.positive : Colors.negative }]}>
            {remaining >= 0 ? 'Remaining' : 'Over'} {fmt(Math.abs(remaining))}
          </Text>
        </View>
      )}

      {/* Modals */}
      <IncomeModal
        visible={incomeModal}
        current={income}
        onClose={() => setIncomeModal(false)}
        onSave={saveIncome}
      />
      {catModal && (
        <CategoryModal
          visible
          categoryName={catModal.key}
          emoji={catModal.emoji}
          current={amounts[catModal.key] ?? 0}
          onClose={() => setCatModal(null)}
          onSave={val => saveCategory(catModal.key, val)}
        />
      )}
    </SafeAreaView>
    </TabShell>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll:     { flex: 1 },
  content:    { padding: Spacing.lg, paddingBottom: 120 },

  screenTitle:  { ...HeadingScale.xl, color: Colors.textPrimary, marginBottom: 4 },
  screenMonth:  { ...BodyScale.md, color: Colors.textSecondary, marginBottom: Spacing.lg },

  incomeCard:       { marginBottom: Spacing.lg, alignItems: 'center', paddingVertical: Spacing.xl },
  incomeLabel:      { ...LabelStyle, color: Colors.textGold, marginBottom: Spacing.sm },
  incomePlaceholder:{ ...BodyScale.lg, color: Colors.textTertiary, fontStyle: 'italic' },

  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  cellWrapper:{ width: '48%' },
  cell:       { alignItems: 'center', paddingVertical: Spacing.md, gap: 4 },
  cellEmoji:  { fontSize: 24 },
  cellName:   { ...BodyScale.sm, color: Colors.textSecondary, textAlign: 'center' },

  opportunityCard: { marginBottom: Spacing.lg, gap: Spacing.md },
  opportunityTitle: { ...HeadingScale.md, color: Colors.textGold },
  opportunityBody:  { ...BodyScale.md, color: Colors.textSecondary, lineHeight: 22 },
  ctaBtn:           {},

  summaryBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.bgCard, borderTopWidth: 1, borderTopColor: Colors.borderSubtle,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, paddingBottom: Spacing.xl,
  },
  summaryLeft:  { ...BodyScale.md, color: Colors.textSecondary, fontWeight: '600' },
  summaryRight: { ...BodyScale.md, fontWeight: '700' },
});
