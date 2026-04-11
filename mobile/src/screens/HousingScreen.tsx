/**
 * HousingScreen.tsx — Affordability calculator, market data, buy vs rent, resources
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Linking, Keyboard, SafeAreaView, } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme';
import { SmartBanner } from '../components/ads/SmartBanner';

const TABS = ['Budget', 'Market', 'Buy vs Rent', 'Resources'] as const;
type Tab = typeof TABS[number];

const RULES = [
  { name: '30% Rule', desc: 'Standard guideline', pct: 0.30 },
  { name: '28% Rule', desc: 'Conservative', pct: 0.28 },
  { name: '25% Rule', desc: 'Aggressive saver', pct: 0.25 },
];

const METROS = [
  { city: 'New York, NY', r1: 2400, r2: 2900, r3: 3600 }, { city: 'Los Angeles, CA', r1: 2100, r2: 2700, r3: 3400 },
  { city: 'Chicago, IL', r1: 1400, r2: 1800, r3: 2200 }, { city: 'Houston, TX', r1: 1100, r2: 1400, r3: 1700 },
  { city: 'Phoenix, AZ', r1: 1200, r2: 1500, r3: 1900 }, { city: 'San Diego, CA', r1: 2000, r2: 2600, r3: 3200 },
  { city: 'Dallas, TX', r1: 1200, r2: 1600, r3: 2000 }, { city: 'Austin, TX', r1: 1400, r2: 1800, r3: 2300 },
  { city: 'Denver, CO', r1: 1700, r2: 2200, r3: 2700 }, { city: 'Seattle, WA', r1: 2000, r2: 2600, r3: 3200 },
  { city: 'Miami, FL', r1: 1800, r2: 2400, r3: 3000 }, { city: 'Atlanta, GA', r1: 1400, r2: 1800, r3: 2200 },
  { city: 'Nashville, TN', r1: 1500, r2: 1900, r3: 2400 }, { city: 'Charlotte, NC', r1: 1200, r2: 1600, r3: 2000 },
  { city: 'Raleigh, NC', r1: 1300, r2: 1700, r3: 2100 }, { city: 'San Jose, CA', r1: 2500, r2: 3200, r3: 4000 },
];

const RESOURCES = [
  { title: 'Find Apartments', sub: 'Apartments.com', url: 'https://www.apartments.com' },
  { title: 'Search Homes', sub: 'Zillow', url: 'https://www.zillow.com' },
  { title: 'Compare Mortgage Rates', sub: 'Bankrate', url: 'https://www.bankrate.com/mortgages' },
  { title: 'Mortgage Calculator', sub: 'NerdWallet', url: 'https://www.nerdwallet.com/mortgages/mortgage-calculator' },
  { title: 'Rental Assistance', sub: 'HUD.gov', url: 'https://www.hud.gov/topics/rental_assistance' },
  { title: 'First-Time Buyer Programs', sub: 'HUD.gov', url: 'https://www.hud.gov/buying/localbuying' },
];

const fmt = (n: number) => '$' + Math.round(n).toLocaleString();

export default function HousingScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<Tab>('Budget');
  const [income, setIncome] = useState(0);
  const [rent, setRent] = useState('');
  const [search, setSearch] = useState('');
  const [homePrice, setHomePrice] = useState('300000');
  const [downPct, setDownPct] = useState('20');
  const [rate, setRate] = useState('7.0');

  useEffect(() => {
    const month = new Date().toISOString().slice(0, 7);
    AsyncStorage.getItem('budgetData_' + month).then(raw => {
      if (raw) try { setIncome(JSON.parse(raw).income ?? 0); } catch {}
    });
    AsyncStorage.getItem('housingData').then(raw => {
      if (raw) try { const d = JSON.parse(raw); setRent(d.rent ?? ''); setHomePrice(d.homePrice ?? '300000'); } catch {}
    });
  }, []);

  const save = () => AsyncStorage.setItem('housingData', JSON.stringify({ rent, homePrice }));

  const curRent = parseFloat(rent) || 0;
  const hp = parseFloat(homePrice) || 300000;
  const dp = (parseFloat(downPct) || 20) / 100;
  const ir = (parseFloat(rate) || 7) / 100 / 12;
  const loan = hp * (1 - dp);
  const nPay = 360;
  const mortgage = loan * (ir * Math.pow(1 + ir, nPay)) / (Math.pow(1 + ir, nPay) - 1);
  const totalOwn = mortgage + hp * 0.012 / 12 + 100;
  const rentEquiv = curRent || hp * 0.007;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}><Text style={s.back}>{'<'}</Text></TouchableOpacity>
        <Text style={s.title}>Housing</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={s.tabs}>
        {TABS.map(t => <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}><Text style={[s.tabText, tab === t && s.tabTextActive]}>{t}</Text></TouchableOpacity>)}
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {tab === 'Budget' && (<>
          {income > 0 && (
            <View style={s.card}>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12 }}>Based on your {fmt(income)}/month income:</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                {[{ label: 'Comfortable', pct: 0.25, color: '#10B981' }, { label: 'Stretching', pct: 0.28, color: '#F59E0B' }, { label: 'Tight', pct: 0.30, color: '#EF4444' }].map(r => (
                  <View key={r.label} style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ fontSize: 11, color: r.color, fontWeight: '700', marginBottom: 4 }}>{r.label}</Text>
                    <Text style={{ fontSize: 20, fontWeight: '900', color: colors.textPrimary }}>{fmt(income * r.pct)}</Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>{Math.round(r.pct * 100)}% of income</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <Text style={s.inputLabel}>Your current rent/mortgage:</Text>
          <TextInput style={s.input} value={rent} onChangeText={t => { setRent(t); save(); }} keyboardType="number-pad" returnKeyType="done" placeholder="0" placeholderTextColor={colors.textMuted} />
          {curRent > 0 && income > 0 && (
            <View style={[s.card, { borderLeftWidth: 4, borderLeftColor: curRent > income * 0.30 ? '#EF4444' : '#10B981' }]}>
              <Text style={{ fontSize: 14, color: curRent > income * 0.30 ? '#EF4444' : '#10B981', fontWeight: '600' }}>
                {curRent > income * 0.30 ? 'You are overspending on housing.' : 'You are within a healthy housing budget.'}
              </Text>
              {curRent > income * 0.25 && (
                <Text style={s.savingsHint}>Moving to 25% frees up {fmt((curRent - income * 0.25))}/mo to invest. That is {fmt((curRent - income * 0.25) * 12 * ((Math.pow(1.07, 30) - 1) / 0.07))} over 30 years.</Text>
              )}
            </View>
          )}
        </>)}
        {tab === 'Market' && (<>
          <TextInput style={s.input} value={search} onChangeText={setSearch} placeholder="Search city..." placeholderTextColor={colors.textMuted} />
          {METROS.filter(m => !search || m.city.toLowerCase().includes(search.toLowerCase())).map(m => {
            const affordable = income > 0 && m.r2 <= income * 0.30;
            return (
              <View key={m.city} style={[s.card, affordable && { borderLeftWidth: 4, borderLeftColor: '#10B981' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={s.cityName}>{m.city}</Text>
                  {income > 0 && <Text style={{ fontSize: 11, fontWeight: '700', color: affordable ? '#10B981' : m.r2 <= income * 0.36 ? '#F59E0B' : '#EF4444' }}>{affordable ? 'Affordable' : m.r2 <= income * 0.36 ? 'Tight' : 'Over budget'}</Text>}
                </View>
                <View style={s.rentRow}>
                  <Text style={s.rentCol}>1BR: {fmt(m.r1)}</Text>
                  <Text style={s.rentCol}>2BR: {fmt(m.r2)}</Text>
                  <Text style={s.rentCol}>3BR: {fmt(m.r3)}</Text>
                </View>
              </View>
            );
          })}
        </>)}
        {tab === 'Buy vs Rent' && (<>
          <Text style={s.inputLabel}>Home price:</Text>
          <TextInput style={s.input} value={homePrice} onChangeText={t => { setHomePrice(t); save(); }} keyboardType="number-pad" returnKeyType="done" />
          <Text style={s.inputLabel}>Down payment %:</Text>
          <TextInput style={s.input} value={downPct} onChangeText={setDownPct} keyboardType="decimal-pad" returnKeyType="done" />
          <Text style={s.inputLabel}>Interest rate %:</Text>
          <TextInput style={s.input} value={rate} onChangeText={setRate} keyboardType="decimal-pad" returnKeyType="done" />
          <View style={s.card}>
            <Text style={s.compareLabel}>Monthly Mortgage (est.)</Text>
            <Text style={s.compareVal}>{fmt(totalOwn)}</Text>
          </View>
          <View style={s.card}>
            <Text style={s.compareLabel}>Equivalent Rent</Text>
            <Text style={s.compareVal}>{fmt(rentEquiv)}</Text>
          </View>
          <View style={[s.card, { borderLeftWidth: 4, borderLeftColor: totalOwn < rentEquiv ? '#10B981' : '#F59E0B' }]}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
              {totalOwn < rentEquiv ? 'Buying may be cheaper monthly' : 'Renting may be more affordable'}
            </Text>
            <Text style={s.savingsHint}>Difference: {fmt(Math.abs(totalOwn - rentEquiv))}/mo</Text>
          </View>
        </>)}
        {tab === 'Resources' && (<>
          {RESOURCES.map(r => (
            <TouchableOpacity key={r.title} style={s.linkCard} onPress={() => Linking.openURL(r.url)} activeOpacity={0.8}>
              <View style={{ flex: 1 }}><Text style={s.linkTitle}>{r.title}</Text><Text style={s.linkSub}>{r.sub}</Text></View>
              <Text style={s.linkArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </>)}
        <SmartBanner style={{ marginTop: spacing.md }} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { color: colors.primary, fontSize: 22, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.primary },
  scroll: { padding: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  ruleName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  ruleAmt: { fontSize: 24, fontWeight: '900', color: '#F59E0B', marginVertical: 4 },
  ruleDesc: { fontSize: 12, color: colors.textMuted },
  inputLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 4, marginTop: spacing.sm },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  savingsHint: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  cityName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  rentRow: { flexDirection: 'row', gap: spacing.sm },
  rentCol: { fontSize: 13, color: colors.textSecondary },
  compareLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  compareVal: { fontSize: 22, fontWeight: '900', color: colors.textPrimary },
  linkCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  linkTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  linkSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  linkArrow: { fontSize: 22, color: colors.textMuted },
});
