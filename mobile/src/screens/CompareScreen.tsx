import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, SavedPortfolio } from '../types';
import { colors, spacing, radius, shadow } from '../theme';
import { STORAGE, FREE_LIMITS } from '../constants';
import { DEV_MODE, isPremium } from '../services/premiumService';
import AdBanner from '../components/AdBanner';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Compare'> };

function gradeColor(g: string): string {
  return g === 'A' ? '#06D6A0' : g === 'B' ? '#4361EE' : g === 'C' ? '#FFB703' : '#EF233C';
}

function fmt(n: number, decimals = 1): string {
  return n.toFixed(decimals);
}

interface CompareRow {
  label: string;
  a: string;
  b: string;
  winner: 'a' | 'b' | 'tie';
}

function buildRows(a: SavedPortfolio, b: SavedPortfolio): CompareRow[] {
  const ap = a.result.performance;
  const bp = b.result.performance;
  const as_ = a.result.scores;
  const bs = b.result.scores;

  const row = (label: string, av: number, bv: number, aFmt: string, bFmt: string, higherIsBetter = true): CompareRow => ({
    label,
    a: aFmt,
    b: bFmt,
    winner: av === bv ? 'tie' : (higherIsBetter ? (av > bv ? 'a' : 'b') : (av < bv ? 'a' : 'b')),
  });

  return [
    row('Expected Return', ap.expected_annual_return, bp.expected_annual_return, `${fmt(ap.expected_annual_return * 100)}%`, `${fmt(bp.expected_annual_return * 100)}%`),
    row('Risk (Volatility)', ap.annual_volatility, bp.annual_volatility, `${fmt(ap.annual_volatility * 100)}%`, `${fmt(bp.annual_volatility * 100)}%`, false),
    row('Sharpe Ratio', ap.sharpe_ratio, bp.sharpe_ratio, fmt(ap.sharpe_ratio, 2), fmt(bp.sharpe_ratio, 2)),
    row('Smart Score', as_.smart_score, bs.smart_score, `${fmt(as_.smart_score)}/10`, `${fmt(bs.smart_score)}/10`),
    row('Diversification', as_.diversification_score, bs.diversification_score, `${fmt(as_.diversification_score)}/10`, `${fmt(bs.diversification_score)}/10`),
    { label: 'ETF Count', a: String(a.result.holdings.length), b: String(b.result.holdings.length), winner: 'tie' },
    { label: 'Grade', a: as_.grade, b: bs.grade, winner: as_.smart_score >= bs.smart_score ? 'a' : 'b' },
    { label: 'Top Holding', a: a.result.holdings[0]?.ticker ?? '—', b: b.result.holdings[0]?.ticker ?? '—', winner: 'tie' },
  ];
}

export default function CompareScreen({ navigation }: Props) {
  const [portfolios, setPortfolios] = useState<SavedPortfolio[]>([]);
  const [selected, setSelected] = useState<[number | null, number | null]>([null, null]);
  const [premium, setPremium] = useState(DEV_MODE);

  useEffect(() => {
    if (!DEV_MODE) isPremium().then(setPremium);
    AsyncStorage.getItem(STORAGE.SAVED_PORTFOLIOS)
      .then(raw => raw ? setPortfolios(JSON.parse(raw)) : null)
      .catch(() => null);
  }, []);

  function toggleSelect(idx: number) {
    const [a, b] = selected;
    if (a === idx) { setSelected([null, b]); return; }
    if (b === idx) { setSelected([a, null]); return; }
    if (a === null) { setSelected([idx, b]); return; }
    if (b === null) { setSelected([a, idx]); return; }
    setSelected([idx, b]);
  }

  const [idxA, idxB] = selected;
  const canCompare = idxA !== null && idxB !== null;
  const pA = idxA !== null ? portfolios[idxA] : null;
  const pB = idxB !== null ? portfolios[idxB] : null;
  const rows = pA && pB ? buildRows(pA, pB) : [];
  const aWins = rows.filter(r => r.winner === 'a').length;
  const bWins = rows.filter(r => r.winner === 'b').length;

  const maxSelectable = premium ? portfolios.length : FREE_LIMITS.comparisonPortfolios;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚖️ Compare Portfolios</Text>
        {!premium && <Text style={styles.freeNote}>Free: {FREE_LIMITS.comparisonPortfolios} portfolios</Text>}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Portfolio picker */}
        <Text style={styles.sectionLabel}>Select 2 portfolios to compare</Text>
        {portfolios.slice(0, maxSelectable).map((p, i) => {
          const isA = idxA === i;
          const isB = idxB === i;
          const sel = isA || isB;
          const gc = gradeColor(p.result.scores.grade);
          return (
            <TouchableOpacity key={p.id} style={[styles.portfolioCard, sel && { borderColor: gc, borderWidth: 2 }]} onPress={() => toggleSelect(i)} activeOpacity={0.8}>
              <View style={styles.portfolioCardLeft}>
                <Text style={styles.portfolioName}>{p.name}</Text>
                <Text style={styles.portfolioMeta}>{p.result.profile.risk_label} · {new Date(p.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={styles.portfolioCardRight}>
                <Text style={[styles.portfolioGrade, { color: gc }]}>{p.result.scores.grade}</Text>
                {(isA || isB) && <Text style={[styles.slotBadge, { color: gc }]}>{isA ? 'A' : 'B'}</Text>}
              </View>
            </TouchableOpacity>
          );
        })}

        <AdBanner placement="banner" style={{ marginVertical: spacing.sm }} />

        {!premium && portfolios.length > FREE_LIMITS.comparisonPortfolios && (
          <TouchableOpacity style={styles.unlockBtn} onPress={() => navigation.navigate('Premium')} activeOpacity={0.85}>
            <Text style={styles.unlockBtnText}>🔒 Unlock all {portfolios.length} portfolios — Go Premium</Text>
          </TouchableOpacity>
        )}

        {/* Comparison table */}
        {canCompare && pA && pB && (
          <View style={styles.compareSection}>
            {/* Column headers */}
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderLabel}>Metric</Text>
              <Text style={[styles.tableHeaderA, { color: gradeColor(pA.result.scores.grade) }]}>{pA.name.split(' ')[0]}</Text>
              <Text style={[styles.tableHeaderB, { color: gradeColor(pB.result.scores.grade) }]}>{pB.name.split(' ')[0]}</Text>
            </View>
            {rows.map(row => (
              <View key={row.label} style={styles.tableRow}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={[styles.rowVal, row.winner === 'a' && styles.rowWinner]}>{row.a}</Text>
                <Text style={[styles.rowVal, row.winner === 'b' && styles.rowWinner]}>{row.b}</Text>
              </View>
            ))}

            {/* Winner banner */}
            <View style={[styles.winnerBanner, { backgroundColor: aWins > bWins ? gradeColor(pA.result.scores.grade) : gradeColor(pB.result.scores.grade) }]}>
              <Text style={styles.winnerText}>
                {aWins > bWins ? `🏆 ${pA.name} wins (${aWins} vs ${bWins})` : aWins < bWins ? `🏆 ${pB.name} wins (${bWins} vs ${aWins})` : "🤝 It's a tie!"}
              </Text>
            </View>

            {/* Share */}
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() => Share.share({ message: `My Frontier Portfolio Comparison\n\n${pA.name} (${pA.result.scores.grade}) vs ${pB.name} (${pB.result.scores.grade})\n\n${aWins > bWins ? pA.name : pB.name} wins!\n\nBuilt with My Frontier — for educational purposes only.` })}
              activeOpacity={0.85}
            >
              <Text style={styles.shareBtnText}>↑ Share Comparison</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingBottom: spacing.md, paddingHorizontal: spacing.md, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
  backBtn: { padding: spacing.sm },
  backText: { fontSize: 22, color: colors.primary, fontWeight: '700' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  freeNote: { fontSize: 11, color: colors.textMuted },
  content: { padding: spacing.md, gap: spacing.sm },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs },
  portfolioCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  portfolioCardLeft: { flex: 1 },
  portfolioName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  portfolioMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  portfolioCardRight: { alignItems: 'center', gap: 2 },
  portfolioGrade: { fontSize: 22, fontWeight: '900' },
  slotBadge: { fontSize: 11, fontWeight: '800' },
  unlockBtn: { backgroundColor: 'rgba(114,9,183,0.12)', borderRadius: radius.md, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: '#7209B7' },
  unlockBtnText: { color: '#7209B7', fontSize: 14, fontWeight: '700' },
  compareSection: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.md, gap: 2, ...shadow.sm, marginTop: spacing.md },
  tableHeader: { flexDirection: 'row', paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.xs },
  tableHeaderLabel: { flex: 1.5, fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  tableHeaderA: { flex: 1, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  tableHeaderB: { flex: 1, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { flex: 1.5, fontSize: 13, color: colors.textSecondary },
  rowVal: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  rowWinner: { color: '#06D6A0' },
  winnerBanner: { borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.md },
  winnerText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  shareBtn: { borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center', marginTop: spacing.sm },
  shareBtnText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
