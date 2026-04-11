import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Modal, Dimensions, PanResponder, Keyboard, SafeAreaView, } from 'react-native';
import Svg, { Polyline, Line, Text as SvgText, Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme';
import { STORAGE } from '../constants';

const CHART_H = 200;
const PAD = { l: 50, r: 12, t: 12, b: 28 };

function fmtD(n: number) {
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
  return '$' + Math.round(n);
}

export default function NetWorthTimelineScreen() {
  const navigation = useNavigation<any>();
  const [age, setAge] = useState<number | null>(null);
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [ageInput, setAgeInput] = useState('');
  const [current, setCurrent] = useState<number[]>([]);
  const [optimized, setOptimized] = useState<number[]>([]);
  const [chartW, setChartW] = useState(300);
  const [scrubIdx, setScrubIdx] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const storedAge = await AsyncStorage.getItem('userAge');
      if (storedAge) setAge(parseInt(storedAge, 10));
      else setShowAgeModal(true);

      const month = new Date().toISOString().slice(0, 7);
      const budgetRaw = await AsyncStorage.getItem('budgetData_' + month);
      const portRaw = await AsyncStorage.getItem(STORAGE.SAVED_PORTFOLIOS);

      let monthlySurplus = 500;
      if (budgetRaw) {
        try {
          const bd = JSON.parse(budgetRaw);
          const inc = bd.income ?? 0;
          const exp = Object.values(bd.categories ?? {}).reduce((s: number, v: any) => s + (v as number), 0);
          monthlySurplus = Math.max(0, inc - exp);
        } catch {}
      }

      let annualReturn = 0.07;
      if (portRaw) {
        try {
          const ports = JSON.parse(portRaw);
          const bestRet = Math.max(0, ...ports.map((p: any) => p.result?.performance?.expected_annual_return ?? 0));
          if (bestRet > 0.03 && bestRet < 0.25) annualReturn = bestRet; // sanity: 3-25%
        } catch {}
      }
      // Cap return at 15% to prevent wild projections
      annualReturn = Math.min(annualReturn, 0.15);
      // Cap monthly contribution at a reasonable maximum ($5000/month)
      monthlySurplus = Math.min(monthlySurplus, 5000);

      const monthlyRate = Math.pow(1 + annualReturn, 1 / 12) - 1;
      const years = 50;
      const cur: number[] = [];
      const opt: number[] = [];
      let curVal = 0;
      let optVal = 0;
      const optBoost = monthlySurplus * 0.2;
      for (let m = 0; m < years * 12; m++) {
        curVal = curVal * (1 + monthlyRate) + monthlySurplus;
        optVal = optVal * (1 + monthlyRate) + monthlySurplus + optBoost;
        if (m % 12 === 0) { cur.push(curVal); opt.push(optVal); }
      }
      setCurrent(cur);
      setOptimized(opt);
    })();
  }, []);

  const saveAge = () => {
    const a = parseInt(ageInput, 10);
    if (isNaN(a) || a < 13 || a > 80) return;
    setAge(a);
    AsyncStorage.setItem('userAge', String(a));
    setShowAgeModal(false);
  };

  const plotW = chartW - PAD.l - PAD.r;
  const plotH = CHART_H - PAD.t - PAD.b;
  const maxVal = optimized.length > 0 ? Math.max(...optimized) * 1.1 : 1e6;
  const toX = (i: number) => PAD.l + (i / Math.max(current.length - 1, 1)) * plotW;
  const toY = (v: number) => PAD.t + plotH - (v / maxVal) * plotH;

  const curPts = current.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
  const optPts = optimized.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');

  const updateScrub = (x: number) => {
    const adj = x - PAD.l;
    if (current.length === 0 || plotW === 0) return;
    setScrubIdx(Math.min(Math.max(0, Math.floor((adj / plotW) * current.length)), current.length - 1));
  };
  const panRef = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: (e) => updateScrub(e.nativeEvent.locationX),
    onPanResponderMove: (e) => updateScrub(e.nativeEvent.locationX),
    onPanResponderRelease: () => setScrubIdx(null),
  })).current;

  const milestones = [100000, 500000, 1000000].map(target => {
    const yr = current.findIndex(v => v >= target);
    return { target, label: fmtD(target), yearIdx: yr >= 0 ? yr : null };
  });

  const startAge = age ?? 25;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
          <Text style={s.back}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Net Worth Timeline</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.subtitle}>Projected from age {startAge} to {startAge + current.length}</Text>

        <View onLayout={e => setChartW(e.nativeEvent.layout.width)} style={s.chartWrap}>
          {scrubIdx !== null && current[scrubIdx] !== undefined && (
            <View style={s.scrubCard}>
              <Text style={s.scrubAge}>Age {startAge + scrubIdx}</Text>
              <Text style={s.scrubVal}>Current: {fmtD(current[scrubIdx])}</Text>
              <Text style={[s.scrubVal, { color: '#10B981' }]}>Optimized: {fmtD(optimized[scrubIdx] ?? 0)}</Text>
            </View>
          )}
          <View style={{ position: 'relative' }}>
              <Svg width={chartW} height={CHART_H}>
                {[0, 0.25, 0.5, 0.75, 1].map(r => {
                  const y = PAD.t + plotH * (1 - r);
                  return (
                    <React.Fragment key={r}>
                      <Line x1={PAD.l} y1={y} x2={PAD.l + plotW} y2={y} stroke={colors.border} strokeWidth={1} />
                      <SvgText x={PAD.l - 4} y={y + 4} fontSize={9} fill={colors.textMuted} textAnchor="end">{fmtD(maxVal * r)}</SvgText>
                    </React.Fragment>
                  );
                })}
                {curPts && <Polyline points={curPts} fill="none" stroke={colors.primary} strokeWidth={2.5} />}
                {optPts && <Polyline points={optPts} fill="none" stroke="#10B981" strokeWidth={2} strokeDasharray="6,3" />}
                {milestones.filter(m => m.yearIdx !== null).map(m => (
                  <Circle key={m.target} cx={toX(m.yearIdx!)} cy={toY(m.target)} r={4} fill="#F59E0B" />
                ))}
              </Svg>
              <View style={StyleSheet.absoluteFill} {...panRef.panHandlers} />
          </View>
        </View>

        <View style={s.legend}>
          <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: colors.primary }]} /><Text style={s.legendLabel}>Current Path</Text></View>
          <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: '#10B981' }]} /><Text style={s.legendLabel}>+20% Optimized</Text></View>
        </View>

        <Text style={s.sectionTitle}>Milestones</Text>
        {milestones.map(m => (
          <View key={m.target} style={s.milestoneCard}>
            <Text style={s.milestoneLabel}>{m.label}</Text>
            <Text style={s.milestoneAge}>{m.yearIdx !== null ? `Age ${startAge + m.yearIdx}` : 'Beyond projection'}</Text>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAgeModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>How old are you?</Text>
            <TextInput style={s.modalInput} value={ageInput} onChangeText={setAgeInput} keyboardType="number-pad" returnKeyType="done" placeholder="25" placeholderTextColor={colors.textMuted} maxLength={2} />
            <TouchableOpacity style={s.modalBtn} onPress={saveAge}><Text style={s.modalBtnText}>Save</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { color: colors.primary, fontSize: 22, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  scroll: { padding: spacing.lg },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.md },
  chartWrap: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.sm, marginBottom: spacing.md, position: 'relative' },
  scrubCard: { position: 'absolute', top: 4, right: 8, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 8, zIndex: 10 },
  scrubAge: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  scrubVal: { fontSize: 11, color: colors.textSecondary },
  legend: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, color: colors.textSecondary },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  milestoneCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  milestoneLabel: { fontSize: 15, fontWeight: '700', color: '#F59E0B' },
  milestoneAge: { fontSize: 14, color: colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: spacing.xl },
  modalContent: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.lg },
  modalInput: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, fontSize: 24, fontWeight: '700', color: colors.textPrimary, width: 100, textAlign: 'center', marginBottom: spacing.lg },
  modalBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: spacing.xl },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
