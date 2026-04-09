/**
 * NetWorthScreen.tsx
 * Tracks assets and liabilities; shows net worth with month-over-month change
 * and a simple historical chart. Snapshots saved once per month.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  SafeAreaView, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { NumberScale, HeadingScale, BodyScale, LabelStyle } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import Card from '../components/ui/Card';
import StatBadge from '../components/ui/StatBadge';

// ---------- types ----------
interface LineItem { label: string; amount: number }
interface HistorySnapshot { month: string; netWorth: number }

const ASSET_DEFAULTS: LineItem[] = [
  { label: 'Checking',    amount: 0 },
  { label: 'Savings',     amount: 0 },
  { label: 'Investments', amount: 0 },
  { label: 'Home',        amount: 0 },
  { label: 'Vehicle',     amount: 0 },
  { label: 'Retirement',  amount: 0 },
  { label: 'Other',       amount: 0 },
];

const LIABILITY_DEFAULTS: LineItem[] = [
  { label: 'Mortgage',      amount: 0 },
  { label: 'Car Loan',      amount: 0 },
  { label: 'Student Loans', amount: 0 },
  { label: 'Credit Cards',  amount: 0 },
  { label: 'Other',         amount: 0 },
];

const fmt = (n: number) => `$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const currentMonth = () => new Date().toISOString().slice(0, 7);

// ---------- row edit modal ----------
interface EditModalProps {
  item: LineItem | null;
  onClose: () => void;
  onSave: (amount: number) => void;
}
function EditModal({ item, onClose, onSave }: EditModalProps) {
  const [val, setVal] = useState(item ? String(item.amount) : '');
  if (!item) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <View style={styles.editSheet}>
          <Text style={styles.editTitle}>{item.label}</Text>
          <View style={styles.editInputRow}>
            <Text style={styles.editDollar}>$</Text>
            <TextInput
              style={styles.editInput}
              value={val}
              onChangeText={setVal}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.textTertiary}
              autoFocus
            />
          </View>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => { const n = parseFloat(val); onSave(isNaN(n) ? 0 : n); }}
          >
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------- simple bar chart ----------
interface ChartProps { history: HistorySnapshot[] }
function MiniChart({ history }: ChartProps) {
  if (history.length < 2) return null;
  const vals = history.map(h => h.netWorth);
  const maxV = Math.max(...vals, 1);
  const minV = Math.min(...vals, 0);
  const range = maxV - minV || 1;

  return (
    <View style={styles.chart}>
      {history.map((h, i) => {
        const heightPct = ((h.netWorth - minV) / range);
        const barColor = h.netWorth >= 0 ? Colors.positive : Colors.negative;
        return (
          <View key={i} style={styles.chartBar}>
            <View style={[styles.chartFill, { flex: heightPct, backgroundColor: barColor, opacity: 0.8 }]} />
            <View style={{ flex: 1 - heightPct }} />
            <Text style={styles.chartLabel}>{h.month.slice(5)}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ---------- main screen ----------
export default function NetWorthScreen() {
  const navigation = useNavigation();
  const [assets,      setAssets]      = useState<LineItem[]>(ASSET_DEFAULTS);
  const [liabilities, setLiabilities] = useState<LineItem[]>(LIABILITY_DEFAULTS);
  const [history,     setHistory]     = useState<HistorySnapshot[]>([]);
  const [editing,     setEditing]     = useState<{ item: LineItem; isAsset: boolean; idx: number } | null>(null);

  const totalAssets      = assets.reduce((s, x) => s + x.amount, 0);
  const totalLiabilities = liabilities.reduce((s, x) => s + x.amount, 0);
  const netWorth         = totalAssets - totalLiabilities;

  const load = useCallback(async () => {
    const [rawAssets, rawLiab, rawHist] = await Promise.all([
      AsyncStorage.getItem('nwAssets'),
      AsyncStorage.getItem('nwLiabilities'),
      AsyncStorage.getItem('netWorthHistory'),
    ]);
    if (rawAssets) setAssets(JSON.parse(rawAssets));
    if (rawLiab)   setLiabilities(JSON.parse(rawLiab));
    if (rawHist)   setHistory(JSON.parse(rawHist));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Snapshot once per month
  useEffect(() => {
    (async () => {
      const month = currentMonth();
      const rawHist = await AsyncStorage.getItem('netWorthHistory');
      const hist: HistorySnapshot[] = rawHist ? JSON.parse(rawHist) : [];
      if (!hist.find(h => h.month === month)) {
        const updated = [...hist, { month, netWorth }].slice(-24);
        await AsyncStorage.setItem('netWorthHistory', JSON.stringify(updated));
        setHistory(updated);
      }
    })();
  }, [netWorth]);

  const saveItem = async (isAsset: boolean, idx: number, amount: number) => {
    if (isAsset) {
      const updated = assets.map((a, i) => i === idx ? { ...a, amount } : a);
      setAssets(updated);
      await AsyncStorage.setItem('nwAssets', JSON.stringify(updated));
    } else {
      const updated = liabilities.map((l, i) => i === idx ? { ...l, amount } : l);
      setLiabilities(updated);
      await AsyncStorage.setItem('nwLiabilities', JSON.stringify(updated));
    }
    setEditing(null);
  };

  const prevMonth = history.length >= 2 ? history[history.length - 2].netWorth : null;
  const momChange = prevMonth !== null ? netWorth - prevMonth : null;
  const momColor: 'positive' | 'negative' | 'neutral' =
    momChange === null ? 'neutral' : momChange >= 0 ? 'positive' : 'negative';

  const renderRows = (items: LineItem[], isAsset: boolean) =>
    items.map((item, idx) => (
      <TouchableOpacity
        key={idx}
        style={styles.itemRow}
        onPress={() => setEditing({ item, isAsset, idx })}
      >
        <Text style={styles.itemLabel}>{item.label}</Text>
        <Text style={[styles.itemAmount, { color: item.amount > 0 ? Colors.textPrimary : Colors.textTertiary }]}>
          {item.amount > 0 ? fmt(item.amount) : '—'}
        </Text>
      </TouchableOpacity>
    ));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={[LabelStyle, { color: Colors.textGold }]}>NET WORTH</Text>
        <Text style={[NumberScale.xl, { color: netWorth >= 0 ? Colors.textPrimary : Colors.negative, marginTop: 4 }]}>
          {netWorth < 0 ? '-' : ''}{fmt(netWorth)}
        </Text>
        {momChange !== null && (
          <StatBadge
            value={`${momChange >= 0 ? '+' : ''}${fmt(momChange)} this month`}
            color={momColor}
          />
        )}

        {/* Mini chart */}
        {history.length >= 2 && (
          <Card style={styles.chartCard}>
            <Text style={styles.sectionTitle}>History</Text>
            <MiniChart history={history} />
          </Card>
        )}

        {/* Assets */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Assets</Text>
          {renderRows(assets, true)}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Assets</Text>
            <Text style={[styles.totalValue, { color: Colors.positive }]}>{fmt(totalAssets)}</Text>
          </View>
        </Card>

        {/* Liabilities */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Liabilities</Text>
          {renderRows(liabilities, false)}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Liabilities</Text>
            <Text style={[styles.totalValue, { color: Colors.negative }]}>{fmt(totalLiabilities)}</Text>
          </View>
        </Card>
      </ScrollView>

      <EditModal
        item={editing?.item ?? null}
        onClose={() => setEditing(null)}
        onSave={amount => editing && saveItem(editing.isAsset, editing.idx, amount)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bgPrimary },
  content:   { padding: Spacing.lg, paddingBottom: 48, gap: Spacing.lg },

  backBtn:   { marginBottom: Spacing.md },
  backText:  { ...BodyScale.md, color: Colors.brandBlue },

  chartCard:    { gap: Spacing.sm },
  chart:        { flexDirection: 'row', height: 80, gap: 4, alignItems: 'flex-end' },
  chartBar:     { flex: 1, height: 80, justifyContent: 'flex-end', alignItems: 'center' },
  chartFill:    { width: '100%', borderRadius: 3, minHeight: 4 },
  chartLabel:   { ...BodyScale.sm, color: Colors.textTertiary, marginTop: 2, fontSize: 9 },

  section:      { gap: Spacing.sm },
  sectionTitle: { ...HeadingScale.md, color: Colors.textPrimary, marginBottom: Spacing.sm },

  itemRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  itemLabel:  { ...BodyScale.lg, color: Colors.textPrimary },
  itemAmount: { ...BodyScale.lg, fontWeight: '600' },

  totalRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.md, marginTop: Spacing.sm },
  totalLabel: { ...BodyScale.md, color: Colors.textSecondary, fontWeight: '600' },
  totalValue: { ...BodyScale.md, fontWeight: '700' },

  backdrop:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  editSheet:     { backgroundColor: Colors.bgCard, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, borderWidth: 1, borderColor: Colors.borderSubtle, padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  editTitle:     { ...HeadingScale.lg, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.lg },
  editInputRow:  { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCardElevated, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderSubtle, paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  editDollar:    { ...HeadingScale.lg, color: Colors.textSecondary, marginRight: Spacing.sm },
  editInput:     { flex: 1, ...HeadingScale.lg, color: Colors.textPrimary, paddingVertical: Spacing.lg },
  saveBtn:       { backgroundColor: Colors.brandBlue, borderRadius: Radius.xl, paddingVertical: 16, alignItems: 'center', marginBottom: Spacing.md },
  saveBtnText:   { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  cancelBtn:     { alignItems: 'center' },
  cancelText:    { ...BodyScale.md, color: Colors.textSecondary },
});
