import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, FlatList, Alert, Platform,
  SafeAreaView, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';
import { colors, spacing, radius, shadow } from '../theme';

const STORAGE_KEY = 'debtPlannerData' as const;
const QUICK_PICKS = [100, 200, 300, 500, 750, 1000] as const;

interface Debt {
  id: string;
  name: string;
  balance: number;
  apr: number;
  minPayment: number;
}

interface PayoffResult { totalInterest: number; months: number }

function simulate(debts: Debt[], extra: number, strategy: 'avalanche' | 'snowball'): PayoffResult {
  if (!debts.length) return { months: 0, totalInterest: 0 };

  let items = debts
    .filter(d => d.balance > 0)
    .map(d => ({ ...d, bal: d.balance }))
    .sort((a, b) => strategy === 'avalanche' ? b.apr - a.apr : a.balance - b.balance);

  let months = 0;
  let totalInterest = 0;

  while (items.some(d => d.bal > 0) && months < 360) {
    months++;
    // Apply interest
    items = items.map(d => {
      if (d.bal <= 0) return d;
      const interest = d.bal * (d.apr / 100 / 12);
      totalInterest += interest;
      return { ...d, bal: d.bal + interest };
    });
    // Pay minimums on all active debts, roll freed minimums into surplus
    let surplus = extra;
    items = items.map(d => {
      if (d.bal <= 0) { surplus += d.minPayment; return d; }
      const pay = Math.min(d.minPayment, d.bal);
      if (pay < d.minPayment) surplus += d.minPayment - pay;
      return { ...d, bal: Math.max(0, d.bal - pay) };
    });
    // Apply surplus to first priority debt still owing
    for (let i = 0; i < items.length; i++) {
      if (items[i].bal > 0) {
        const pay = Math.min(surplus, items[i].bal);
        items[i] = { ...items[i], bal: Math.max(0, items[i].bal - pay) };
        break;
      }
    }
  }
  return { months, totalInterest: Math.round(totalInterest) };
}

function fmt(n: number): string {
  return n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `$${n.toLocaleString()}`;
}

function aprColor(apr: number) { return apr > 15 ? '#EF4444' : apr >= 5 ? '#F59E0B' : '#10B981'; }

function debtFreeDate(months: number): string {
  const d = new Date(); d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function DebtPlannerScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'DebtPlanner'>>();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [apr, setApr] = useState('');
  const [minPay, setMinPay] = useState('');
  const [termYears, setTermYears] = useState('');
  const [extraMonthly, setExtraMonthly] = useState(200);
  const [surplus, setSurplus] = useState<number | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) setDebts(JSON.parse(raw) as Debt[]);
    });
    const now = new Date();
    const key = `budgetData_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    AsyncStorage.getItem(key).then(raw => {
      if (!raw) return;
      const data = JSON.parse(raw) as { income?: number; categories?: Record<string, number> };
      if (data.income) {
        const totalExp = Object.values(data.categories ?? {}).reduce((s, v) => s + v, 0);
        setSurplus(Math.max(0, data.income - totalExp));
      }
    });
  }, []);

  const persist = useCallback((next: Debt[]) => {
    setDebts(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addDebt = () => {
    const b = parseFloat(balance), a = parseFloat(apr), m = parseFloat(minPay);
    if (!name.trim() || isNaN(b) || isNaN(a) || isNaN(m) || b <= 0) {
      Alert.alert('Missing info', 'Fill in all fields with valid numbers.');
      return;
    }
    const debt: Debt = { id: Date.now().toString(), name: name.trim(), balance: b, apr: a, minPayment: m };
    persist([...debts, debt]);
    setName(''); setBalance(''); setApr(''); setMinPay(''); setTermYears('');
    setModalVisible(false);
  };

  const remove = (id: string) => persist(debts.filter(d => d.id !== id));

  const [selectedStrategy, setSelectedStrategy] = useState<'avalanche' | 'snowball'>('avalanche');
  const avalanche = simulate(debts, extraMonthly, 'avalanche');
  const snowball = simulate(debts, extraMonthly, 'snowball');
  const winner = avalanche.totalInterest <= snowball.totalInterest ? 'avalanche' : 'snowball';
  const monthlyAfter = debts.reduce((s, d) => s + d.minPayment, 0) + extraMonthly;
  const investYears = 30;
  const futureValue = monthlyAfter > 0
    ? monthlyAfter * ((Math.pow(1 + 0.08 / 12, investYears * 12) - 1) / (0.08 / 12))
    : 0;

  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
  const bestMonths = Math.min(avalanche.months, snowball.months);

  const renderDebt = ({ item }: { item: Debt }) => (
    <View style={s.debtCard}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Text style={s.debtName}>{item.name}</Text>
          <View style={[s.aprBadge, { backgroundColor: aprColor(item.apr) + '22', borderColor: aprColor(item.apr) }]}>
            <Text style={[s.aprText, { color: aprColor(item.apr) }]}>{item.apr}%</Text>
          </View>
        </View>
        <Text style={s.debtBalance}>${item.balance.toLocaleString()}</Text>
        <Text style={s.debtDetail}>${item.minPayment}/mo minimum</Text>
      </View>
      <TouchableOpacity onPress={() => remove(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={s.title}>Debt Repayment Plan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {debts.length === 0 ? (
          <View style={s.emptyState}><Text style={{ fontSize: 48, textAlign: 'center' }}>{'✅'}</Text><Text style={s.emptyTitle}>No debts yet</Text><Text style={s.emptyText}>Add your first debt to see your payoff plan</Text></View>
        ) : (
          <View style={[s.card, { borderColor: colors.primary, borderWidth: 1 }]}>
            <Text style={s.sectionLabel}>TOTAL DEBT</Text>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#EF4444' }}>${totalDebt.toLocaleString()}</Text>
            {bestMonths > 0 && <Text style={{ fontSize: 13, color: '#F59E0B', fontWeight: '700', marginTop: 4 }}>Debt-free: {debtFreeDate(bestMonths)}</Text>}
          </View>
        )}

        <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={s.addBtnText}>+ Add Debt</Text>
        </TouchableOpacity>

        {debts.length > 0 && (
          <FlatList data={debts} keyExtractor={d => d.id} renderItem={renderDebt}
            scrollEnabled={false} style={{ marginBottom: spacing.lg }} />
        )}

        {surplus !== null && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Monthly available from budget: ${surplus.toLocaleString()}</Text>
          </View>
        )}

        {debts.length > 0 && (
          <>
            <Text style={s.sectionLabel}>Extra monthly payment</Text>
            <View style={s.pickRow}>
              {QUICK_PICKS.map(v => (
                <TouchableOpacity key={v} onPress={() => setExtraMonthly(v)}
                  style={[s.pick, extraMonthly === v && s.pickActive]}>
                  <Text style={[s.pickText, extraMonthly === v && s.pickTextActive]}>${v}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {debts.length === 1 && avalanche.months > 0 && (
              <Text style={s.projText}>Pay off by {debtFreeDate(avalanche.months)}</Text>
            )}
            {debts.length > 1 && <View style={s.stratRow}>
              {(['avalanche', 'snowball'] as const).map(strat => {
                const r = strat === 'avalanche' ? avalanche : snowball;
                const isSel = selectedStrategy === strat;
                return (
                  <TouchableOpacity key={strat} style={[s.stratCard, isSel && s.stratWinner]} onPress={() => setSelectedStrategy(strat)} activeOpacity={0.8}>
                    {isSel && <Text style={s.winnerBadge}>SELECTED ✓</Text>}
                    <Text style={s.stratTitle}>{strat === 'avalanche' ? 'Avalanche' : 'Snowball'}</Text>
                    <Text style={s.stratSub}>{strat === 'avalanche' ? 'Highest rate first' : 'Lowest balance first'}</Text>
                    <Text style={s.stratNum}>{fmt(r.totalInterest)}</Text>
                    <Text style={s.stratLabel}>total interest</Text>
                    <Text style={s.stratNum}>{r.months} mo</Text>
                    <Text style={s.stratLabel}>{r.months > 0 ? debtFreeDate(r.months) : 'N/A'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>}

            {debts.length > 1 && <><Text style={[s.sectionLabel, { marginTop: spacing.md }]}>YOUR PAYOFF ORDER</Text>
            {[...debts].sort((a, b) => selectedStrategy === 'avalanche' ? b.apr - a.apr : a.balance - b.balance).map((d, i) => {
              const r = selectedStrategy === 'avalanche' ? avalanche : snowball;
              return <Text key={d.id} style={s.projText}>{i + 1}. {d.name} — pay off by {debtFreeDate(Math.round(r.months * ((i + 1) / debts.length)))}</Text>;
            })}</>}

            {debts.length > 1 && (
              <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, marginTop: spacing.sm, marginBottom: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.success }}>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>
                  {avalanche.totalInterest <= snowball.totalInterest
                    ? `Avalanche saves $${(snowball.totalInterest - avalanche.totalInterest).toLocaleString()} vs Snowball`
                    : 'Both strategies are similar. Snowball gives faster early wins.'}
                </Text>
              </View>
            )}

            {monthlyAfter > 0 && (
              <View style={[s.card, { marginTop: spacing.lg }]}>
                <Text style={s.cardTitle}>After you are debt-free</Text>
                <Text style={s.projText}>
                  Redirect ${monthlyAfter.toLocaleString()}/mo to investing
                </Text>
                <Text style={s.projBig}>{fmt(Math.round(futureValue))}</Text>
                <Text style={s.projSub}>projected in {investYears} years at 8% avg return</Text>
              </View>
            )}
          </>
        )}

        {debts.length === 0 && (
          <Text style={s.empty}>Add your debts above to see payoff strategies.</Text>
        )}
        {debts.length > 0 && (
          <TouchableOpacity style={[s.addBtn, { marginTop: spacing.lg }]} onPress={async () => {
            await AsyncStorage.setItem('debtPlannerData', JSON.stringify(debts));
            const total = debts.reduce((s, d) => s + d.minPayment, 0) + extraMonthly;
            Alert.alert('Sync to Budget?', `Add $${total}/mo for debt payments to your budget?`, [
              { text: 'Not now', style: 'cancel' },
              { text: 'Add', onPress: async () => { await AsyncStorage.setItem('debtBudgetSync', JSON.stringify({ amount: total, label: `Debt (${selectedStrategy})` })); navigation.goBack(); } },
            ]);
          }}>
            <Text style={s.addBtnText}>Save Plan</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Add Debt</Text>
            <TextInput style={s.input} placeholder="Debt name" placeholderTextColor={colors.textMuted}
              value={name} onChangeText={setName} />
            <TextInput style={s.input} placeholder="Balance ($)" placeholderTextColor={colors.textMuted}
              value={balance} onChangeText={setBalance} keyboardType="number-pad" returnKeyType="done" />
            <TextInput style={s.input} placeholder="Interest rate (APR %)" placeholderTextColor={colors.textMuted}
              value={apr} onChangeText={setApr} keyboardType="decimal-pad" returnKeyType="done" />
            <TextInput style={s.input} placeholder="Loan term years (optional)" placeholderTextColor={colors.textMuted}
              value={termYears} onChangeText={t => {
                setTermYears(t);
                const b = parseFloat(balance), a = parseFloat(apr), y = parseFloat(t);
                if (!isNaN(b) && !isNaN(a) && !isNaN(y) && y > 0 && a > 0) {
                  const mr = a / 100 / 12, n = y * 12;
                  const pmt = b * (mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1);
                  setMinPay(String(Math.round(pmt)));
                }
              }} keyboardType="number-pad" returnKeyType="done" />
            <TextInput style={s.input} placeholder="Minimum payment ($)" placeholderTextColor={colors.textMuted}
              value={minPay} onChangeText={setMinPay} keyboardType="number-pad" returnKeyType="done" />
            <TouchableOpacity style={s.addBtn} onPress={addDebt}>
              <Text style={s.addBtnText}>Add Debt</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: spacing.sm }}>
              <Text style={[s.stratSub, { textAlign: 'center' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  backBtn: { width: 40, height: 40, justifyContent: 'center' }, backText: { color: colors.primary, fontSize: 22, fontWeight: '700' },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' }, scroll: { padding: spacing.lg, paddingBottom: 40 },
  addBtn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center', marginBottom: spacing.lg }, addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  debtCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  debtName: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' }, aprBadge: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 }, aprText: { fontSize: 11, fontWeight: '700' },
  debtBalance: { color: colors.textPrimary, fontSize: 20, fontWeight: '900' }, debtDetail: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 }, emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' }, deleteBtn: { color: colors.danger, fontSize: 16, fontWeight: '700', paddingHorizontal: 8 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, ...shadow.sm }, cardTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 4 },
  sectionLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: spacing.sm, textTransform: 'uppercase' },
  pickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  pick: { backgroundColor: colors.card, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingVertical: 8, paddingHorizontal: 14 }, pickActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pickText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' }, pickTextActive: { color: '#fff' },
  stratRow: { flexDirection: 'row', gap: 10 },
  stratCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, alignItems: 'center' }, stratWinner: { borderColor: colors.success, ...shadow.sm }, winnerBadge: { color: colors.success, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  stratTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' }, stratSub: { color: colors.textSecondary, fontSize: 12, marginBottom: 8 },
  stratNum: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginTop: 4 }, stratLabel: { color: colors.textMuted, fontSize: 12 },
  projText: { color: colors.textSecondary, fontSize: 14, marginTop: 4 }, projBig: { color: colors.success, fontSize: 28, fontWeight: '800', marginTop: 8 }, projSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  empty: { color: colors.textSecondary, fontSize: 15, textAlign: 'center', marginTop: 40 }, modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.xl }, modalTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: spacing.lg, textAlign: 'center' }, input: { backgroundColor: colors.bg, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, color: colors.textPrimary, fontSize: 15, padding: 12, marginBottom: spacing.sm },
});
