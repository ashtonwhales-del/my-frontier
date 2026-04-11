/**
 * FinancialHealthScore.tsx — Circular health score for home screen
 * Loads budget, portfolio, debt, streak data and calculates 0-100 score.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius } from '../theme';
import { STORAGE } from '../constants';

const SIZE = 120;
const STROKE = 10;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

function gradeLabel(s: number) {
  if (s >= 90) return 'Excellent';
  if (s >= 75) return 'Strong';
  if (s >= 60) return 'Building';
  if (s >= 40) return 'Starting';
  return 'Critical';
}

function gradeColor(s: number) {
  if (s >= 75) return '#10B981';
  if (s >= 60) return '#3B82F6';
  if (s >= 40) return '#F59E0B';
  return '#EF4444';
}

interface Props { navigation: any }

export default function FinancialHealthScore({ navigation }: Props) {
  const [score, setScore] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [insight, setInsight] = useState('Calculating...');

  useEffect(() => {
    (async () => {
      let investing = 0, debt = 25, portfolio = 0, streak = 2;
      let lowestCat = 'consistency';

      // Investing rate from budget
      const month = new Date().toISOString().slice(0, 7);
      const budgetRaw = await AsyncStorage.getItem('budgetData_' + month);
      const sourcesRaw = await AsyncStorage.getItem('incomeSources');
      let additionalMonthly = 0;
      if (sourcesRaw) {
        try {
          const srcs = JSON.parse(sourcesRaw);
          additionalMonthly = srcs.reduce((s: number, x: any) => {
            const a = x.amount ?? 0;
            const f = x.frequency;
            return s + (f === 'weekly' ? a * 4.33 : f === 'biweekly' ? a * 2.17 : f === 'monthly' ? a : a / 12);
          }, 0);
        } catch {}
      }
      if (budgetRaw) {
        try {
          const bd = JSON.parse(budgetRaw);
          const inc = (bd.income ?? 0) + additionalMonthly;
          const exp = Object.values(bd.categories ?? {}).reduce((s: number, v: any) => s + (v as number), 0);
          const surplus = inc - exp;
          const rate = inc > 0 ? (surplus / inc) * 100 : 0;
          investing = rate >= 20 ? 30 : rate >= 10 ? 20 : rate >= 5 ? 10 : rate > 0 ? 5 : 0;
        } catch {}
      }
      if (investing < 15) lowestCat = 'investing rate';

      // Debt ratio
      const debtRaw = await AsyncStorage.getItem('debtPlannerData');
      if (debtRaw) {
        try {
          const debts = JSON.parse(debtRaw);
          const totalMin = debts.reduce((s: number, d: any) => s + (d.minPayment ?? 0), 0);
          const budgetInc = budgetRaw ? JSON.parse(budgetRaw).income ?? 0 : 0;
          const ratio = budgetInc > 0 ? (totalMin / budgetInc) * 100 : 0;
          debt = debts.length === 0 ? 25 : ratio < 15 ? 20 : ratio < 30 ? 12 : ratio < 50 ? 5 : 0;
        } catch {}
      }
      if (debt < 12) lowestCat = 'debt';

      // Portfolio quality
      const portRaw = await AsyncStorage.getItem(STORAGE.SAVED_PORTFOLIOS);
      if (portRaw) {
        try {
          const ports = JSON.parse(portRaw);
          const best = Math.max(...ports.map((p: any) => p.result?.scores?.smart_score ?? 0));
          portfolio = best >= 9 ? 25 : best >= 7.5 ? 20 : best >= 6 ? 12 : best >= 4.5 ? 5 : 0;
        } catch {}
      }
      if (portfolio < 12) lowestCat = 'portfolio quality';

      // Streak
      const streakRaw = await AsyncStorage.getItem('appStreak');
      if (streakRaw) {
        try {
          const sd = JSON.parse(streakRaw);
          const days = sd.count ?? 0;
          streak = days >= 30 ? 20 : days >= 14 ? 15 : days >= 7 ? 10 : days >= 3 ? 5 : 2;
        } catch {}
      }

      const total = investing + debt + portfolio + streak;
      setScore(total);
      setLoaded(true);

      const insights: Record<string, string> = {
        'investing rate': 'Boost your score: invest even $25 more per week',
        'debt': 'Pay down debt to unlock your full financial potential',
        'portfolio quality': 'Build a higher-scoring portfolio to improve',
        'consistency': 'Open My Frontier daily to build your streak',
        'none': 'Your finances are in excellent shape!',
      };
      setInsight(total >= 85 ? insights['none'] : insights[lowestCat] ?? 'Keep building your financial foundation');
    })();
  }, []);

  const offset = CIRC * (1 - score / 100);
  const c = loaded ? gradeColor(score) : colors.border;

  return (
    <TouchableOpacity style={s.card} onPress={() => navigation.navigate('FinancialHealth')} activeOpacity={0.8}>
      <View style={s.row}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={SIZE/2} cy={SIZE/2} r={R} stroke={colors.border} strokeWidth={STROKE} fill="none" />
          <Circle cx={SIZE/2} cy={SIZE/2} r={R} stroke={c} strokeWidth={STROKE} fill="none"
            strokeDasharray={`${CIRC}`} strokeDashoffset={loaded ? offset : CIRC}
            strokeLinecap="round" rotation="-90" origin={`${SIZE/2},${SIZE/2}`} />
        </Svg>
        <View style={s.scoreOverlay}>
          <Text style={[s.scoreNum, { color: c }]}>{score}</Text>
          <Text style={s.scoreLabel}>{gradeLabel(score)}</Text>
        </View>
        <View style={s.info}>
          <Text style={s.title}>Financial Health</Text>
          <Text style={s.subtitle}>{insight}</Text>
          <Text style={s.tap}>Tap for details  ›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  scoreOverlay: { position: 'absolute', left: 0, width: SIZE, alignItems: 'center', justifyContent: 'center', height: SIZE },
  scoreNum: { fontSize: 32, fontWeight: '900' },
  scoreLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 4 },
  tap: { fontSize: 12, color: colors.primary, fontWeight: '600' },
});
