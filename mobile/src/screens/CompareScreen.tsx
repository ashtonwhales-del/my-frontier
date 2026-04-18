/**
 * CompareScreen.tsx — Unlimited portfolio comparison
 * Select any number of portfolios, compare all metrics side by side.
 */
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, SavedPortfolio } from '../types';
import { colors, spacing, radius, shadow } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { STORAGE } from '../constants';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Compare'> };

function gc(g: string) { return g === 'A' ? '#06D6A0' : g === 'B' ? '#4361EE' : g === 'C' ? '#FFB703' : '#EF233C'; }
function fmt(n: number, d = 1) { return n.toFixed(d); }

interface Metric { label: string; getValue: (p: SavedPortfolio) => number; format: (p: SavedPortfolio) => string; higherBetter: boolean }

const METRICS: Metric[] = [
  { label: 'Grade', getValue: p => 'ABCDF'.indexOf(p.result.scores.grade) * -1, format: p => p.result.scores.grade, higherBetter: true },
  { label: 'Score', getValue: p => p.result.scores.smart_score, format: p => `${fmt(p.result.scores.smart_score)}/10`, higherBetter: true },
  { label: 'Return', getValue: p => p.result.performance.expected_annual_return, format: p => `${fmt(p.result.performance.expected_annual_return * 100)}%`, higherBetter: true },
  { label: 'Risk', getValue: p => p.result.performance.annual_volatility, format: p => `${fmt(p.result.performance.annual_volatility * 100)}%`, higherBetter: false },
  { label: 'Sharpe', getValue: p => p.result.performance.sharpe_ratio, format: p => fmt(p.result.performance.sharpe_ratio, 2), higherBetter: true },
  { label: 'Diversification', getValue: p => p.result.scores.diversification_score, format: p => `${fmt(p.result.scores.diversification_score)}/10`, higherBetter: true },
  { label: 'ETFs', getValue: p => p.result.holdings.length, format: p => String(p.result.holdings.length), higherBetter: true },
];

export default function CompareScreen({ navigation }: Props) {
  const { palette } = useTheme();
  const [portfolios, setPortfolios] = useState<SavedPortfolio[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem(STORAGE.SAVED_PORTFOLIOS)
      .then(raw => raw ? setPortfolios(JSON.parse(raw)) : null)
      .catch(() => null);
  }, []));

  function toggle(idx: number) {
    setSelected(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });
  }

  const sel = Array.from(selected).map(i => portfolios[i]).filter(Boolean);
  const comparing = sel.length >= 2;

  const bestIdx = sel.length > 0 ? sel.reduce((best, p, i) => p.result.scores.smart_score > sel[best].result.scores.smart_score ? i : best, 0) : -1;

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: palette.bgPrimary }]} edges={['top', 'bottom']}>
      <View style={[s.header, { borderBottomColor: palette.borderSubtle }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={palette.brandBlue} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: palette.textPrimary }]}>Compare Portfolios</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={[s.label, { color: palette.textSecondary }]}>Select portfolios to compare (min 2)</Text>
        {portfolios.map((p, i) => {
          const isSel = selected.has(i);
          return (
            <TouchableOpacity
              key={p.id}
              style={[s.pickCard, { backgroundColor: palette.bgElevated, borderColor: isSel ? palette.brandBlue : palette.borderSubtle },
                isSel && { backgroundColor: palette.brandBlue + '12' }]}
              onPress={() => toggle(i)}
              activeOpacity={0.8}
            >
              <View style={[s.checkbox, { borderColor: isSel ? palette.brandBlue : palette.borderSubtle },
                isSel && { borderColor: palette.brandBlue, backgroundColor: palette.brandBlue }]}>
                {isSel && <Text style={s.checkmark}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.pickName, { color: palette.textPrimary }]}>{p.name}</Text>
                <Text style={[s.pickMeta, { color: palette.textTertiary }]}>{p.result.profile.risk_label} · {new Date(p.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={[s.pickGrade, { color: gc(p.result.scores.grade) }]}>{p.result.scores.grade}</Text>
            </TouchableOpacity>
          );
        })}

        {comparing && (
          <View style={[s.tableWrap, { backgroundColor: palette.bgElevated, ...shadow.sm }]}>
            <View style={{ flexDirection: 'row' }}>
              <View style={s.fixedCol}>
                <View style={[s.fixedHeader, { borderBottomColor: palette.borderSubtle }]}>
                  <Text style={[s.metricLabel, { color: palette.textTertiary }]}>Metric</Text>
                </View>
                {METRICS.map(m => (
                  <View key={m.label} style={[s.fixedRow, { borderBottomColor: palette.borderSubtle }]}>
                    <Text style={[s.metricText, { color: palette.textSecondary }]}>{m.label}</Text>
                  </View>
                ))}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                <View>
                  <View style={{ flexDirection: 'row' }}>
                    {sel.map((p, i) => (
                      <View key={p.id} style={s.valCol}>
                        <Text style={[s.colName, { color: gc(p.result.scores.grade) }]}>{p.name.split(' ')[0]}</Text>
                        {i === bestIdx && <Text style={s.crownBadge}>Best</Text>}
                      </View>
                    ))}
                  </View>
                  {METRICS.map(metric => {
                    const values = sel.map(p => metric.getValue(p));
                    const best = metric.higherBetter ? Math.max(...values) : Math.min(...values);
                    return (
                      <View key={metric.label} style={{ flexDirection: 'row' }}>
                        {sel.map((p, i) => (
                          <View key={p.id} style={[s.valCol, s.valCell, { borderBottomColor: palette.borderSubtle },
                            values[i] === best && sel.length > 1 && s.valCellWin]}>
                            <Text style={[s.valText, { color: palette.textPrimary },
                              values[i] === best && sel.length > 1 && s.valWinner]}>
                              {metric.format(p)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  content: { padding: spacing.md, gap: spacing.sm },
  label: { fontSize: 13, fontWeight: '600', marginBottom: spacing.xs },
  pickCard: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, gap: spacing.sm },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '900' },
  pickName: { fontSize: 15, fontWeight: '700' },
  pickMeta: { fontSize: 12, marginTop: 2 },
  pickGrade: { fontSize: 24, fontWeight: '900' },
  tableWrap: { borderRadius: radius.xl, padding: spacing.sm, marginTop: spacing.md, overflow: 'hidden' },
  fixedCol: { width: 110 },
  fixedHeader: { height: 44, justifyContent: 'center', borderBottomWidth: 1 },
  fixedRow: { height: 40, justifyContent: 'center', borderBottomWidth: 1 },
  metricLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  metricText: { fontSize: 13 },
  valCol: { width: 120, alignItems: 'center', justifyContent: 'center' },
  valCell: { height: 40, borderBottomWidth: 1 },
  valCellWin: { backgroundColor: '#F59E0B20', borderRadius: 4 },
  colName: { fontSize: 12, fontWeight: '800' },
  crownBadge: { fontSize: 9, fontWeight: '700', color: '#F59E0B', textTransform: 'uppercase' },
  valText: { fontSize: 14, fontWeight: '700' },
  valWinner: { color: '#06D6A0' },
});
