/**
 * BillNegotiationScreen.tsx — Compare bills to national averages + negotiation scripts
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Modal, Alert, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, shadow } from '../theme';
import { SmartBanner } from '../components/ads/SmartBanner';

const BILLS = [
  { id: 'internet', name: 'Internet', emoji: '📡', avg: 65, script: 'Call your provider and say: "I have been a loyal customer and I see competitors offering service for $40/month. Can you match that or I will need to switch?" Most providers have retention departments that offer 20-40% discounts on the spot.' },
  { id: 'cell', name: 'Cell Phone', emoji: '📱', avg: 65, script: 'Call customer service: "I want to review my plan. What promotions do you have for loyal customers?" Ask about autopay discounts, paperless billing credits, and loyalty rewards.' },
  { id: 'car_ins', name: 'Car Insurance', emoji: '🚗', avg: 140, script: 'Get 3 competitor quotes first. Then call: "I have a quote for $X from a competitor. Can you beat it?" Also ask about safe driver discounts and bundling with renters insurance.' },
  { id: 'renters', name: 'Renters Insurance', emoji: '🏠', avg: 18, script: 'Ask your car insurance provider for a bundle discount. Most offer 10-15% off both policies. If paying over $18, shop at Lemonade or Progressive for instant online quotes.' },
  { id: 'streaming', name: 'Streaming', emoji: '📺', avg: 45, script: 'Audit every streaming service. Cancel any not used in 30 days. Many offer promo rates to returning customers. Share plans with family to split costs.' },
  { id: 'gym', name: 'Gym', emoji: '💪', avg: 40, script: 'Call and say: "I am considering canceling due to cost. What options do you have?" Gyms frequently offer 2-3 free months or rate reductions to retain members.' },
  { id: 'electric', name: 'Electric', emoji: '⚡', avg: 130, script: 'Ask your utility about budget billing, time-of-use rates, and smart thermostat rebate programs. Check if they offer a free energy audit.' },
  { id: 'subs', name: 'App Subscriptions', emoji: '📲', avg: 30, script: 'Open phone settings, review every subscription. Cancel anything unused weekly. Switch monthly to annual plans for 40-60% savings.' },
  { id: 'gas', name: 'Gas/Fuel', emoji: '⛽', avg: 180, script: 'Use GasBuddy to find cheapest stations nearby. Pay with a 3-5% cash back gas card. Consider warehouse clubs like Costco for 10-20 cents cheaper per gallon.' },
  { id: 'delivery', name: 'Food Delivery', emoji: '🍕', avg: 80, script: 'Delivery markups average 30-40% above restaurant prices. Cook 2 more days per week to save $100-200 monthly. Use restaurant apps directly to avoid platform fees.' },
];

type BillAmounts = Record<string, number>;

export default function BillNegotiationScreen() {
  const navigation = useNavigation<any>();
  const [amounts, setAmounts] = useState<BillAmounts>({});
  const [negotiated, setNegotiated] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<typeof BILLS[0] | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('billAmounts').then(r => { if (r) try { setAmounts(JSON.parse(r)); } catch {} });
    AsyncStorage.getItem('negotiatedBills').then(r => { if (r) try { setNegotiated(new Set(JSON.parse(r))); } catch {} });
  }, []);

  const saveAmount = (id: string, val: number) => {
    const next = { ...amounts, [id]: val };
    setAmounts(next);
    AsyncStorage.setItem('billAmounts', JSON.stringify(next));
  };

  const markNegotiated = (id: string) => {
    const next = new Set(negotiated);
    next.add(id);
    setNegotiated(next);
    AsyncStorage.setItem('negotiatedBills', JSON.stringify(Array.from(next)));
    setSelected(null);
    Alert.alert('Marked!', 'Great job negotiating this bill.');
  };

  const annualSavings = BILLS.reduce((t, b) => {
    const a = amounts[b.id] ?? 0;
    return t + (a > b.avg ? (a - b.avg) * 12 : 0);
  }, 0);

  const fmt = (n: number) => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}><Text style={s.back}>{'<'}</Text></TouchableOpacity>
        <Text style={s.title}>Bill Negotiator</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.heroCard}>
          <Text style={s.heroLabel}>POTENTIAL ANNUAL SAVINGS</Text>
          <Text style={s.heroAmount}>{fmt(annualSavings)}</Text>
          <Text style={s.heroSub}>Based on your bills vs national averages</Text>
        </View>

        {BILLS.map(bill => {
          const userAmt = amounts[bill.id] ?? 0;
          const over = userAmt > bill.avg;
          const diff = userAmt - bill.avg;
          return (
            <View key={bill.id} style={s.billCard}>
              <View style={s.billTop}>
                <Text style={s.billEmoji}>{bill.emoji}</Text>
                <Text style={s.billName}>{bill.name}</Text>
                <Text style={s.billAvg}>Avg: {fmt(bill.avg)}/mo</Text>
              </View>
              <View style={s.billRow}>
                <View style={s.inputWrap}>
                  <Text style={s.dollarSign}>$</Text>
                  <TextInput style={s.input} value={userAmt > 0 ? String(userAmt) : ''} onChangeText={t => { const n = parseInt(t, 10); saveAmount(bill.id, isNaN(n) ? 0 : n); }} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textMuted} />
                </View>
                {userAmt > 0 && (
                  <View style={[s.badge, { backgroundColor: over ? '#EF444422' : '#10B98122' }]}>
                    <Text style={[s.badgeText, { color: over ? '#EF4444' : '#10B981' }]}>{over ? `+${fmt(diff)}/mo` : 'Below avg'}</Text>
                  </View>
                )}
              </View>
              {!negotiated.has(bill.id) ? (
                <TouchableOpacity style={s.negotiateBtn} onPress={() => setSelected(bill)}><Text style={s.negotiateTxt}>Get script  ›</Text></TouchableOpacity>
              ) : (
                <Text style={s.negotiatedTag}>Negotiated</Text>
              )}
            </View>
          );
        })}

        <SmartBanner style={{ marginTop: spacing.md }} />
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={selected !== null} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            {selected && (<>
              <Text style={s.modalEmoji}>{selected.emoji}</Text>
              <Text style={s.modalTitle}>{selected.name}</Text>
              <Text style={s.modalCompare}>You pay: {fmt(amounts[selected.id] ?? 0)}/mo  |  Avg: {fmt(selected.avg)}/mo</Text>
              <Text style={s.modalScript}>{selected.script}</Text>
              <View style={s.modalBtns}>
                <TouchableOpacity style={s.copyBtn} onPress={() => Alert.alert('Script', selected.script)}>
                  <Text style={s.copyTxt}>Copy Script</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.markBtn} onPress={() => markNegotiated(selected.id)}>
                  <Text style={s.markTxt}>Mark Negotiated</Text>
                </TouchableOpacity>
              </View>
            </>)}
            <TouchableOpacity onPress={() => setSelected(null)} style={{ marginTop: spacing.sm }}><Text style={{ color: colors.textMuted, textAlign: 'center' }}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { color: colors.primary, fontSize: 22, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  scroll: { padding: spacing.lg },
  heroCard: { backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: '#F59E0B', padding: spacing.lg, alignItems: 'center', marginBottom: spacing.lg },
  heroLabel: { fontSize: 10, fontWeight: '700', color: '#F59E0B', letterSpacing: 1.2, marginBottom: 4 },
  heroAmount: { fontSize: 36, fontWeight: '900', color: '#F59E0B' },
  heroSub: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  billCard: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  billTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  billEmoji: { fontSize: 22 },
  billName: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  billAvg: { fontSize: 12, color: colors.textMuted },
  billRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 10, flex: 1 },
  dollarSign: { color: colors.textMuted, fontSize: 16, fontWeight: '600' },
  input: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.textPrimary, paddingVertical: 8 },
  badge: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  negotiateBtn: { marginTop: spacing.sm },
  negotiateTxt: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  negotiatedTag: { fontSize: 12, color: '#10B981', fontWeight: '600', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.xl },
  modalEmoji: { fontSize: 36, textAlign: 'center', marginBottom: spacing.sm },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  modalCompare: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  modalScript: { fontSize: 15, color: colors.textSecondary, lineHeight: 24, marginBottom: spacing.lg },
  modalBtns: { flexDirection: 'row', gap: spacing.sm },
  copyBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' },
  copyTxt: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  markBtn: { flex: 1, backgroundColor: '#10B981', borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' },
  markTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
