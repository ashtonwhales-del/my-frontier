/**
 * GoalBucketsScreen.tsx — Named savings goals with ETF recommendations
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Alert, Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, shadow } from '../theme';

const ICONS = ['🏠', '🚗', '💒', '🎓', '✈️', '💰', '🏖️', '💼'] as const;
const RISK_OPTS = ['conservative', 'moderate', 'aggressive'] as const;
type RiskProfile = typeof RISK_OPTS[number];

interface Goal {
  id: string; name: string; icon: string;
  targetAmount: number; targetDate: string; currentSaved: number;
  weeklyContribution: number; riskProfile: RiskProfile;
}

function calcWeekly(target: number, saved: number, monthsAway: number): number {
  if (monthsAway <= 0) return 0;
  const remaining = Math.max(0, target - saved);
  const weeklyRate = Math.pow(1.07, 1 / 52) - 1;
  const weeks = monthsAway * 4.33;
  if (weeks <= 0) return remaining;
  return remaining * weeklyRate / (Math.pow(1 + weeklyRate, weeks) - 1);
}

function monthsUntil(dateStr: string): number {
  const [y, m] = dateStr.split('-').map(Number);
  const now = new Date();
  return (y - now.getFullYear()) * 12 + (m - now.getMonth() - 1);
}

function etfRec(months: number): string {
  if (months < 36) return '80% AGG (bonds), 20% VTI — protect what you have';
  if (months < 84) return '60% VTI, 30% AGG, 10% VWO — balanced growth';
  return '70% VTI, 20% QQQ, 10% VWO — maximize growth';
}

export default function GoalBucketsScreen() {
  const navigation = useNavigation<any>();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏠');
  const [amount, setAmount] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear() + 3));
  const [month, setMonth] = useState('06');
  const [saved, setSaved] = useState('');
  const [risk, setRisk] = useState<RiskProfile>('moderate');
  const [detail, setDetail] = useState<Goal | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('goalBuckets').then(raw => {
      if (raw) try { setGoals(JSON.parse(raw)); } catch {}
    });
  }, []);

  const persist = (next: Goal[]) => { setGoals(next); AsyncStorage.setItem('goalBuckets', JSON.stringify(next)); };

  const addGoal = () => {
    const t = parseFloat(amount); const s = parseFloat(saved) || 0;
    if (!name.trim() || isNaN(t) || t <= 0) { Alert.alert('Fill in all fields'); return; }
    const dateStr = `${year}-${month.padStart(2, '0')}`;
    const mo = monthsUntil(dateStr);
    const weekly = calcWeekly(t, s, mo);
    const goal: Goal = { id: Date.now().toString(), name: name.trim(), icon, targetAmount: t, targetDate: dateStr, currentSaved: s, weeklyContribution: Math.round(weekly * 100) / 100, riskProfile: risk };
    persist([...goals, goal]);
    setName(''); setAmount(''); setSaved(''); setModal(false); Keyboard.dismiss();
  };

  const removeGoal = (id: string) => persist(goals.filter(g => g.id !== id));

  const fmt = (n: number) => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <View style={st.root}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}><Text style={st.back}>{'<'}</Text></TouchableOpacity>
        <Text style={st.title}>My Goals</Text>
        <TouchableOpacity onPress={() => setModal(true)}><Text style={st.addBtn}>+</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        {goals.length === 0 && (
          <View style={st.empty}><Text style={st.emptyIcon}>🎯</Text><Text style={st.emptyTitle}>No goals yet</Text><Text style={st.emptySub}>Tap + to add your first savings goal</Text></View>
        )}
        {goals.map(g => {
          const pct = g.targetAmount > 0 ? Math.min(100, (g.currentSaved / g.targetAmount) * 100) : 0;
          const mo = monthsUntil(g.targetDate);
          const onTrack = g.weeklyContribution <= 500;
          return (
            <TouchableOpacity key={g.id} style={st.card} onPress={() => setDetail(g)} activeOpacity={0.8}>
              <View style={st.cardTop}>
                <Text style={st.cardIcon}>{g.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={st.cardName}>{g.name}</Text>
                  <Text style={st.cardMeta}>{fmt(g.currentSaved)} of {fmt(g.targetAmount)} · {mo > 0 ? mo + ' months left' : 'Past due'}</Text>
                </View>
                <TouchableOpacity onPress={() => removeGoal(g.id)}><Text style={st.deleteX}>X</Text></TouchableOpacity>
              </View>
              <View style={st.barBg}><View style={[st.barFill, { width: `${pct}%` }]} /></View>
              <View style={st.cardBottom}>
                <Text style={st.weekly}>{fmt(g.weeklyContribution)}/week needed</Text>
                <View style={[st.badge, { backgroundColor: onTrack ? '#10B98122' : '#EF444422' }]}><Text style={[st.badgeText, { color: onTrack ? '#10B981' : '#EF4444' }]}>{onTrack ? 'On track' : 'Behind'}</Text></View>
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Detail modal */}
      <Modal visible={detail !== null} transparent animationType="slide">
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            {detail && (<>
              <Text style={st.detailIcon}>{detail.icon}</Text>
              <Text style={st.detailName}>{detail.name}</Text>
              <Text style={st.detailAmt}>{fmt(detail.targetAmount)} by {detail.targetDate}</Text>
              <Text style={st.detailWeekly}>{fmt(detail.weeklyContribution)}/week · {detail.riskProfile}</Text>
              <View style={st.etfCard}><Text style={st.etfLabel}>RECOMMENDED ETF MIX</Text><Text style={st.etfText}>{etfRec(monthsUntil(detail.targetDate))}</Text></View>
            </>)}
            <TouchableOpacity style={st.closeBtn} onPress={() => setDetail(null)}><Text style={st.closeTxt}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add modal */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={st.modalOverlay}>
          <ScrollView contentContainerStyle={st.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={st.modalTitle}>Add Goal</Text>
            <TextInput style={st.input} placeholder="Goal name (e.g. House)" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
            <View style={st.iconRow}>{ICONS.map(i => <TouchableOpacity key={i} style={[st.iconBtn, icon === i && st.iconBtnSel]} onPress={() => setIcon(i)}><Text style={{ fontSize: 24 }}>{i}</Text></TouchableOpacity>)}</View>
            <TextInput style={st.input} placeholder="Target amount ($)" placeholderTextColor={colors.textMuted} value={amount} onChangeText={setAmount} keyboardType="number-pad" />
            <View style={st.dateRow}>
              <TextInput style={[st.input, { flex: 1 }]} placeholder="Month (01-12)" placeholderTextColor={colors.textMuted} value={month} onChangeText={setMonth} keyboardType="number-pad" maxLength={2} />
              <TextInput style={[st.input, { flex: 1 }]} placeholder="Year" placeholderTextColor={colors.textMuted} value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} />
            </View>
            <TextInput style={st.input} placeholder="Already saved ($0)" placeholderTextColor={colors.textMuted} value={saved} onChangeText={setSaved} keyboardType="number-pad" />
            <View style={st.riskRow}>{RISK_OPTS.map(r => <TouchableOpacity key={r} style={[st.riskBtn, risk === r && st.riskBtnSel]} onPress={() => setRisk(r)}><Text style={[st.riskTxt, risk === r && st.riskTxtSel]}>{r}</Text></TouchableOpacity>)}</View>
            <TouchableOpacity style={st.saveBtn} onPress={addGoal}><Text style={st.saveTxt}>Save Goal</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setModal(false)} style={{ marginTop: spacing.sm }}><Text style={{ color: colors.textMuted, textAlign: 'center' }}>Cancel</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { color: colors.primary, fontSize: 22, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  addBtn: { fontSize: 28, color: colors.primary, fontWeight: '700' },
  scroll: { padding: spacing.lg },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  emptySub: { fontSize: 14, color: colors.textSecondary },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  cardIcon: { fontSize: 28 },
  cardName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  cardMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  deleteX: { color: '#EF4444', fontSize: 16, fontWeight: '700', padding: 4 },
  barBg: { height: 6, backgroundColor: colors.border, borderRadius: 3, marginBottom: spacing.sm },
  barFill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weekly: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  badge: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  detailIcon: { fontSize: 48, textAlign: 'center', marginBottom: spacing.sm },
  detailName: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  detailAmt: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 4 },
  detailWeekly: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md },
  etfCard: { backgroundColor: colors.bg, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  etfLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.8, marginBottom: 4 },
  etfText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  closeBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' },
  closeTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.xl },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.lg },
  input: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, fontSize: 15, color: colors.textPrimary, marginBottom: spacing.sm },
  iconRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap', justifyContent: 'center' },
  iconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  iconBtnSel: { borderColor: colors.primary, backgroundColor: '#3B82F622' },
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  riskRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  riskBtn: { flex: 1, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center' },
  riskBtnSel: { borderColor: colors.primary, backgroundColor: '#3B82F622' },
  riskTxt: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'capitalize' },
  riskTxtSel: { color: colors.primary },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  saveTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
