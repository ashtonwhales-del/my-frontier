import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, FlatList, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';
import { colors, spacing, radius, shadow } from '../theme';
import { useTheme } from '../context/ThemeContext';
import TabShell from '../components/TabShell';

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
    items = items.map(d => {
      if (d.bal <= 0) return d;
      const interest = d.bal * (d.apr / 100 / 12);
      totalInterest += interest;
      return { ...d, bal: d.bal + interest };
    });
    let surplus = extra;
    items = items.map(d => {
      if (d.bal <= 0) { surplus += d.minPayment; return d; }
      const pay = Math.min(d.minPayment, d.bal);
      if (pay < d.minPayment) surplus += d.minPayment - pay;
      return { ...d, bal: Math.max(0, d.bal - pay) };
    });
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
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
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
    <View style={[s.debtCard, { backgroundColor: palette.bgElevated, borderColor: palette.borderSubtle }]}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Text style={[s.debtName, { color: palette.textPrimary }]}>{item.name}</Text>
          <View style={[s.aprBadge, { backgroundColor: aprColor(item.apr) + '22', borderColor: aprColor(item.apr) }]}>
            <Text style={[s.aprText, { color: aprColor(item.apr) }]}>{item.apr}%</Text>
          </View>
        </View>
        <Text style={[s.debtBalance, { color: palette.textPrimary }]}>${item.balance.toLocaleString()}</Text>
        <Text style={[s.debtDetail, { color: palette.textSecondary }]}>${item.minPayment}/mo minimum</Text>
      </View>
      <TouchableOpacity onPress={() => remove(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="trash-outline" size={18} color={palette.signalRed} />
      </TouchableOpacity>
    </View>
  );

  return (
    <TabShell active="Debt" navigation={navigation}>
    <View style={[s.root, { backgroundColor: palette.bgPrimary }]}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={palette.brandBlue} />
        </TouchableOpacity>
        <Text style={[s.title, { color: palette.textPrimary }]}>Debt Repayment Plan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {debts.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={{ fontSize: 48, textAlign: 'center' }}>{'✅'}</Text>
            <Text style={[s.emptyTitle, { color: palette.textPrimary }]}>No debts yet</Text>
            <Text style={[s.emptyText, { color: palette.textSecondary }]}>Add your first debt to see your payoff plan</Text>
          </View>
        ) : (
          <View style={[s.card, { backgroundColor: palette.bgElevated, borderColor: palette.brandBlue, borderWidth: 1 }]}>
            <Text style={[s.sectionLabel, { color: palette.textSecondary }]}>TOTAL DEBT</Text>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#EF4444' }}>${totalDebt.toLocaleString()}</Text>
            {bestMonths > 0 && <Text style={{ fontSize: 13, color: '#F59E0B', fontWeight: '700', marginTop: 4 }}>Debt-free: {debtFreeDate(bestMonths)}</Text>}
          </View>
        )}

        <TouchableOpacity style={[s.addBtn, { backgroundColor: palette.brandBlue }]} onPress={() => setModalVisible(true)}>
          <Text style={s.addBtnText}>+ Add Debt</Text>
        </TouchableOpacity>

        {debts.length > 0 && (
          <FlatList data={debts} keyExtractor={d => d.id} renderItem={renderDebt}
            scrollEnabled={false} style={{ marginBottom: spacing.lg }} />
        )}

        {surplus !== null && (
          <View style={[s.card, { backgroundColor: palette.bgElevated, borderColor: palette.borderSubtle }]}>
            <Text style={[s.cardTitle, { color: palette.textPrimary }]}>Monthly available from budget: ${surplus.toLocaleString()}</Text>
          </View>
        )}

        {debts.length > 0 && (
          <>
            <Text style={[s.sectionLabel, { color: palette.textSecondary }]}>Extra monthly payment</Text>
            <View style={s.pickRow}>
              {QUICK_PICKS.map(v => (
                <TouchableOpacity key={v} onPress={() => setExtraMonthly(v)}
                  style={[s.pick, { backgroundColor: palette.bgElevated, borderColor: palette.borderSubtle },
                    extraMonthly === v && { backgroundColor: palette.brandBlue, borderColor: palette.brandBlue }]}>
                  <Text style={[s.pickText, { color: extraMonthly === v ? '#fff' : palette.textSecondary }]}>${v}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {debts.length === 1 && avalanche.months > 0 && (
              <Text style={[s.projText, { color: palette.textSecondary }]}>Pay off by {debtFreeDate(avalanche.months)}</Text>
            )}
            {debts.length > 1 && <View style={s.stratRow}>
              {(['avalanche', 'snowball'] as const).map(strat => {
                const r = strat === 'avalanche' ? avalanche : snowball;
                const isSel = selectedStrategy === strat;
                return (
                  <TouchableOpacity key={strat}
                    style={[s.stratCard, { backgroundColor: palette.bgElevated, borderColor: isSel ? '#10B981' : palette.borderSubtle },
                      isSel && shadow.sm]}
                    onPress={() => setSelectedStrategy(strat)}
                    activeOpacity={0.8}
                  >
                    {isSel && <Text style={s.winnerBadge}>SELECTED ✓</Text>}
                    <Text style={[s.stratTitle, { color: palette.textPrimary }]}>{strat === 'avalanche' ? 'Avalanche' : 'Snowball'}</Text>
                    <Text style={[s.stratSub, { color: palette.textSecondary }]}>{strat === 'avalanche' ? 'Highest rate first' : 'Lowest balance first'}</Text>
                    <Text style={[s.stratNum, { color: palette.textPrimary }]}>{fmt(r.totalInterest)}</Text>
                    <Text style={[s.stratLabel, { color: palette.textTertiary }]}>total interest</Text>
                    <Text style={[s.stratNum, { color: palette.textPrimary }]}>{r.months} mo</Text>
                    <Text style={[s.stratLabel, { color: palette.textTertiary }]}>{r.months > 0 ? debtFreeDate(r.months) : 'N/A'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>}

            {debts.length > 1 && <>
              <Text style={[s.sectionLabel, { marginTop: spacing.md, color: palette.textSecondary }]}>YOUR PAYOFF ORDER</Text>
              {[...debts].sort((a, b) => selectedStrategy === 'avalanche' ? b.apr - a.apr : a.balance - b.balance).map((d, i) => {
                const r = selectedStrategy === 'avalanche' ? avalanche : snowball;
                return <Text key={d.id} style={[s.projText, { color: palette.textSecondary }]}>{i + 1}. {d.name} — pay off by {debtFreeDate(Math.round(r.months * ((i + 1) / debts.length)))}</Text>;
              })}
            </>}

            {debts.length > 1 && (
              <View style={[{ borderRadius: 12, padding: 12, marginTop: spacing.sm, marginBottom: spacing.sm, borderLeftWidth: 3 }, { backgroundColor: palette.bgElevated, borderLeftColor: '#10B981' }]}>
                <Text style={{ color: palette.textPrimary, fontSize: 13, fontWeight: '600' }}>
                  {avalanche.totalInterest <= snowball.totalInterest
                    ? `Avalanche saves $${(snowball.totalInterest - avalanche.totalInterest).toLocaleString()} vs Snowball`
                    : 'Both strategies are similar. Snowball gives faster early wins.'}
                </Text>
              </View>
            )}

            {monthlyAfter > 0 && (
              <View style={[s.card, { marginTop: spacing.lg, backgroundColor: palette.bgElevated, borderColor: palette.borderSubtle }]}>
                <Text style={[s.cardTitle, { color: palette.textPrimary }]}>After you are debt-free</Text>
                <Text style={[s.projText, { color: palette.textSecondary }]}>
                  Redirect ${monthlyAfter.toLocaleString()}/mo to investing
                </Text>
                <Text style={s.projBig}>{fmt(Math.round(futureValue))}</Text>
                <Text style={[s.projSub, { color: palette.textTertiary }]}>projected in {investYears} years at 8% avg return</Text>
              </View>
            )}
          </>
        )}

        {debts.length === 0 && (
          <Text style={[s.empty, { color: palette.textSecondary }]}>Add your debts above to see payoff strategies.</Text>
        )}
        {debts.length > 0 && (
          <TouchableOpacity style={[s.addBtn, { marginTop: spacing.lg, backgroundColor: palette.brandBlue }]} onPress={async () => {
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
          <View style={[s.modalContent, { backgroundColor: palette.bgElevated }]}>
            <Text style={[s.modalTitle, { color: palette.textPrimary }]}>Add Debt</Text>
            <TextInput style={[s.input, { backgroundColor: palette.bgPrimary, borderColor: palette.borderSubtle, color: palette.textPrimary }]} placeholder="Debt name" placeholderTextColor={palette.textTertiary}
              value={name} onChangeText={setName} />
            <TextInput style={[s.input, { backgroundColor: palette.bgPrimary, borderColor: palette.borderSubtle, color: palette.textPrimary }]} placeholder="Balance ($)" placeholderTextColor={palette.textTertiary}
              value={balance} onChangeText={setBalance} keyboardType="number-pad" returnKeyType="done" />
            <TextInput style={[s.input, { backgroundColor: palette.bgPrimary, borderColor: palette.borderSubtle, color: palette.textPrimary }]} placeholder="Interest rate (APR %)" placeholderTextColor={palette.textTertiary}
              value={apr} onChangeText={setApr} keyboardType="decimal-pad" returnKeyType="done" />
            <TextInput style={[s.input, { backgroundColor: palette.bgPrimary, borderColor: palette.borderSubtle, color: palette.textPrimary }]} placeholder="Loan term years (optional)" placeholderTextColor={palette.textTertiary}
              value={termYears} onChangeText={t => {
                setTermYears(t);
                const b = parseFloat(balance), a = parseFloat(apr), y = parseFloat(t);
                if (!isNaN(b) && !isNaN(a) && !isNaN(y) && y > 0 && a > 0) {
                  const mr = a / 100 / 12, n = y * 12;
                  const pmt = b * (mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1);
                  setMinPay(String(Math.round(pmt)));
                }
              }} keyboardType="number-pad" returnKeyType="done" />
            <TextInput style={[s.input, { backgroundColor: palette.bgPrimary, borderColor: palette.borderSubtle, color: palette.textPrimary }]} placeholder="Minimum payment ($)" placeholderTextColor={palette.textTertiary}
              value={minPay} onChangeText={setMinPay} keyboardType="number-pad" returnKeyType="done" />
            <TouchableOpacity style={[s.addBtn, { backgroundColor: palette.brandBlue }]} onPress={addDebt}>
              <Text style={s.addBtnText}>Add Debt</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: spacing.sm }}>
              <Text style={[s.stratSub, { textAlign: 'center', color: palette.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
    </TabShell>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  addBtn: { borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center', marginBottom: spacing.lg },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  debtCard: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, marginBottom: spacing.sm },
  debtName: { fontSize: 15, fontWeight: '700' },
  aprBadge: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  aprText: { fontSize: 11, fontWeight: '700' },
  debtBalance: { fontSize: 20, fontWeight: '900' },
  debtDetail: { fontSize: 12, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, ...shadow.sm },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  sectionLabel: { fontSize: 13, fontWeight: '600', marginBottom: spacing.sm, textTransform: 'uppercase' },
  pickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  pick: { borderRadius: radius.sm, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 14 },
  pickText: { fontSize: 14, fontWeight: '600' },
  stratRow: { flexDirection: 'row', gap: 10 },
  stratCard: { flex: 1, borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, alignItems: 'center' },
  winnerBadge: { color: '#10B981', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  stratTitle: { fontSize: 15, fontWeight: '700' },
  stratSub: { fontSize: 12, marginBottom: 8 },
  stratNum: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  stratLabel: { fontSize: 12 },
  projText: { fontSize: 14, marginTop: 4 },
  projBig: { color: '#10B981', fontSize: 28, fontWeight: '800', marginTop: 8 },
  projSub: { fontSize: 12, marginTop: 2 },
  empty: { fontSize: 15, textAlign: 'center', marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: spacing.lg },
  modalContent: { borderRadius: radius.lg, padding: spacing.xl },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.lg, textAlign: 'center' },
  input: { borderRadius: radius.sm, borderWidth: 1, fontSize: 15, padding: 12, marginBottom: spacing.sm },
});
