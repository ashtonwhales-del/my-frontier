/**
 * FinancialHealthScreen.tsx — Detailed breakdown of Financial Health Score
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, shadow } from '../theme';
import { STORAGE } from '../constants';

function gradeLabel(s: number) { return s >= 90 ? 'Excellent' : s >= 75 ? 'Strong' : s >= 60 ? 'Building' : s >= 40 ? 'Starting' : 'Critical'; }
function gradeColor(s: number) { return s >= 75 ? '#10B981' : s >= 60 ? '#3B82F6' : s >= 40 ? '#F59E0B' : '#EF4444'; }

interface Cat { name: string; emoji: string; score: number; max: number; tip: string }

export default function FinancialHealthScreen() {
  const navigation = useNavigation<any>();
  const [total, setTotal] = useState(0);
  const [cats, setCats] = useState<Cat[]>([]);

  useEffect(() => {
    (async () => {
      let investing = 0, debt = 25, portfolio = 0, streak = 2;
      const month = new Date().toISOString().slice(0, 7);
      const budgetRaw = await AsyncStorage.getItem('budgetData_' + month);
      if (budgetRaw) {
        try {
          const bd = JSON.parse(budgetRaw);
          const inc = bd.income ?? 0;
          const exp = Object.values(bd.categories ?? {}).reduce((s: number, v: any) => s + (v as number), 0);
          const rate = inc > 0 ? ((inc - exp) / inc) * 100 : 0;
          investing = rate >= 20 ? 30 : rate >= 10 ? 20 : rate >= 5 ? 10 : rate > 0 ? 5 : 0;
        } catch {}
      }
      const debtRaw = await AsyncStorage.getItem('debtPlannerData');
      if (debtRaw) {
        try {
          const debts = JSON.parse(debtRaw);
          const totalMin = debts.reduce((s: number, d: any) => s + (d.minPayment ?? 0), 0);
          const inc = budgetRaw ? JSON.parse(budgetRaw).income ?? 0 : 0;
          const ratio = inc > 0 ? (totalMin / inc) * 100 : 0;
          debt = debts.length === 0 ? 25 : ratio < 15 ? 20 : ratio < 30 ? 12 : ratio < 50 ? 5 : 0;
        } catch {}
      }
      const portRaw = await AsyncStorage.getItem(STORAGE.SAVED_PORTFOLIOS);
      if (portRaw) {
        try {
          const ports = JSON.parse(portRaw);
          const best = Math.max(0, ...ports.map((p: any) => p.result?.scores?.smart_score ?? 0));
          portfolio = best >= 9 ? 25 : best >= 7.5 ? 20 : best >= 6 ? 12 : best >= 4.5 ? 5 : 0;
        } catch {}
      }
      const streakRaw = await AsyncStorage.getItem('appStreak');
      if (streakRaw) {
        try { const d = JSON.parse(streakRaw).count ?? 0; streak = d >= 30 ? 20 : d >= 14 ? 15 : d >= 7 ? 10 : d >= 3 ? 5 : 2; } catch {}
      }
      setTotal(investing + debt + portfolio + streak);
      setCats([
        { name: 'Investing Rate', emoji: '\uD83D\uDCB0', score: investing, max: 30, tip: investing < 15 ? 'Try to invest at least 10% of your income' : 'Great investing rate! Keep it up.' },
        { name: 'Debt Ratio', emoji: '\uD83D\uDCB3', score: debt, max: 25, tip: debt < 15 ? 'Focus on paying down high-interest debt first' : 'Low debt is a strong financial foundation.' },
        { name: 'Portfolio Quality', emoji: '\uD83D\uDCCA', score: portfolio, max: 25, tip: portfolio < 15 ? 'Build a higher-scoring portfolio to improve' : 'Your portfolio is working well for you.' },
        { name: 'Consistency', emoji: '\uD83D\uDD25', score: streak, max: 20, tip: streak < 10 ? 'Open the app daily to build your streak' : 'Great consistency! Keep the habit going.' },
      ]);
    })();
  }, []);

  return (
    <View style={st.root}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
          <Text style={st.back}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={st.headerTitle}>Financial Health</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        <View style={st.heroCard}>
          <Text style={[st.heroScore, { color: gradeColor(total) }]}>{total}</Text>
          <Text style={st.heroGrade}>{gradeLabel(total)}</Text>
          <Text style={st.heroSub}>out of 100</Text>
        </View>
        {cats.map(c => (
          <View key={c.name} style={st.catCard}>
            <View style={st.catTop}>
              <Text style={st.catEmoji}>{c.emoji}</Text>
              <Text style={st.catName}>{c.name}</Text>
              <Text style={st.catScore}>{c.score} / {c.max}</Text>
            </View>
            <View style={st.barBg}>
              <View style={[st.barFill, { width: `${(c.score / c.max) * 100}%`, backgroundColor: gradeColor((c.score / c.max) * 100) }]} />
            </View>
            <Text style={st.catTip}>{c.tip}</Text>
            <TouchableOpacity onPress={() => {
              const screens: Record<string, string> = { 'Investing Rate': 'Budget', 'Debt Ratio': 'DebtPlanner', 'Portfolio Quality': 'Categories', 'Consistency': 'Learning' };
              const target = screens[c.name];
              if (target) navigation.navigate(target as any, target === 'Categories' ? { name: 'Investor' } : undefined);
            }} style={st.fixBtn}><Text style={st.fixTxt}>Fix This  ›</Text></TouchableOpacity>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { color: colors.primary, fontSize: 22, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  scroll: { padding: spacing.lg },
  heroCard: { alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, marginBottom: spacing.lg },
  heroScore: { fontSize: 56, fontWeight: '900' },
  heroGrade: { fontSize: 16, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', marginTop: 4 },
  heroSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  catCard: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  catTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  catEmoji: { fontSize: 20 },
  catName: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  catScore: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  barBg: { height: 6, backgroundColor: colors.border, borderRadius: 3, marginBottom: spacing.sm },
  barFill: { height: 6, borderRadius: 3 },
  catTip: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 8 },
  fixBtn: { alignSelf: 'flex-start' },
  fixTxt: { fontSize: 13, color: colors.primary, fontWeight: '600' },
});
