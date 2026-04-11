import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Dimensions,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Svg, { Polyline, Line, Text as SvgText, Circle as SvgCircle } from 'react-native-svg';
import { RootStackParamList, SavedPortfolio } from '../types';
import { colors, spacing, radius, shadow } from '../theme';
import { STORAGE } from '../constants';
import { calcFrontierScore } from '../components/PortfolioScoreCard';
import TabShell from '../components/TabShell';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'WealthTracker'> };

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - spacing.lg * 2 - spacing.md * 2;
const CHART_H = 180;
const PAD_L = 52;
const PAD_B = 32;
const PAD_T = 16;
const PAD_R = 16;
const PLOT_W = CHART_W - PAD_L - PAD_R;
const PLOT_H = CHART_H - PAD_T - PAD_B;

const LINE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#14B8A6', '#EF4444', '#EC4899'];

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

function daysSince(ts: number): number {
  return Math.floor((Date.now() - ts) / 86_400_000);
}

function gradeColor(grade: string): string {
  if (grade === 'A') return '#06D6A0';
  if (grade === 'B') return '#4361EE';
  if (grade === 'C') return '#FFB703';
  return '#EF233C';
}

interface ProjectionChartProps {
  portfolios: SavedPortfolio[];
  selectedIds: string[];
}

function ProjectionChart({ portfolios, selectedIds }: ProjectionChartProps) {
  const selected = portfolios.filter(p => selectedIds.includes(p.id));
  if (!selected.length) return null;

  // Collect all projection data across selected portfolios
  const allYears = selected.flatMap(p => p.result.projections.map(pt => pt.years));
  const allValues = selected.flatMap(p => p.result.projections.map(pt => pt.optimistic));
  const maxYears = Math.max(...allYears, 5);
  const maxVal = Math.max(...allValues, 1);
  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];

  function toX(years: number) { return PAD_L + (years / maxYears) * PLOT_W; }
  function toY(val: number) { return PAD_T + PLOT_H - (val / maxVal) * PLOT_H; }

  return (
    <View style={chartStyles.container}>
      <Text style={chartStyles.title}>Projected Wealth at Retirement (Optimistic)</Text>
      <Svg width={CHART_W} height={CHART_H}>
        {/* Y-axis ticks */}
        {yTicks.map((v, i) => (
          <SvgText
            key={i}
            x={PAD_L - 4}
            y={toY(v) + 4}
            fontSize={9}
            fill={colors.textMuted}
            textAnchor="end"
          >
            {fmt(v)}
          </SvgText>
        ))}
        {/* X-axis */}
        <Line
          x1={PAD_L} y1={PAD_T + PLOT_H}
          x2={PAD_L + PLOT_W} y2={PAD_T + PLOT_H}
          stroke={colors.border} strokeWidth={1}
        />
        {/* Y-axis */}
        <Line
          x1={PAD_L} y1={PAD_T}
          x2={PAD_L} y2={PAD_T + PLOT_H}
          stroke={colors.border} strokeWidth={1}
        />
        {/* X-axis year labels */}
        {[0, Math.round(maxYears * 0.33), Math.round(maxYears * 0.66), Math.round(maxYears)].map((yr, i) => (
          <SvgText
            key={i}
            x={toX(yr)}
            y={PAD_T + PLOT_H + 14}
            fontSize={9}
            fill={colors.textMuted}
            textAnchor="middle"
          >
            {yr}yr
          </SvgText>
        ))}
        {/* Portfolio lines */}
        {selected.map((p, idx) => {
          const pts = p.result.projections
            .map(pt => `${toX(pt.years)},${toY(pt.optimistic)}`)
            .join(' ');
          const color = LINE_COLORS[idx % LINE_COLORS.length];
          return (
            <React.Fragment key={p.id}>
              <Polyline
                points={pts}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Last point dot */}
              {p.result.projections.length > 0 && (() => {
                const last = p.result.projections[p.result.projections.length - 1];
                return (
                  <SvgCircle
                    cx={toX(last.years)}
                    cy={toY(last.optimistic)}
                    r={4}
                    fill={color}
                  />
                );
              })()}
            </React.Fragment>
          );
        })}
      </Svg>
      {/* Legend */}
      <View style={chartStyles.legend}>
        {(() => {
          const nameCount: Record<string, number> = {};
          return selected.map((p, idx) => {
            nameCount[p.name] = (nameCount[p.name] || 0) + 1;
            const suffix = nameCount[p.name] > 1 ? ` #${nameCount[p.name]}` : '';
            const retPct = (p.result.performance.expected_annual_return * 100).toFixed(1);
            const label = `${p.name}${suffix} (${retPct}%)`;
            return (
              <View key={p.id} style={chartStyles.legendItem}>
                <View style={[chartStyles.legendDot, { backgroundColor: LINE_COLORS[idx % LINE_COLORS.length] }]} />
                <Text style={chartStyles.legendLabel}>{label}</Text>
              </View>
            );
          });
        })()}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  title: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: colors.textSecondary },
});

// ── Portfolio Detail Modal ──────────────────────────────────────────────────

interface DetailModalProps {
  portfolio: SavedPortfolio | null;
  onClose: () => void;
}

function PortfolioDetailModal({ portfolio, onClose }: DetailModalProps) {
  if (!portfolio) return null;
  const score = calcFrontierScore(portfolio.result);
  const grade = portfolio.result.scores.grade;
  const perf = portfolio.result.performance;
  const days = daysSince(portfolio.createdAt);
  const sortedHoldings = [...portfolio.result.holdings].sort((a, b) => b.weight - a.weight);

  return (
    <Modal visible={!!portfolio} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={detailStyles.container}>
        {/* Header */}
        <View style={detailStyles.header}>
          <View style={detailStyles.headerLeft}>
            <Text style={detailStyles.headerName}>{portfolio.name}</Text>
            <Text style={detailStyles.headerMeta}>
              {days === 0 ? 'Today' : `${days} day${days !== 1 ? 's' : ''} ago`} · {portfolio.result.profile.risk_label}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={detailStyles.closeBtn} activeOpacity={0.7}>
            <Text style={detailStyles.closeText}>✕ Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={detailStyles.scroll} contentContainerStyle={detailStyles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Grade hero */}
          <View style={detailStyles.gradeHero}>
            <Text style={[detailStyles.gradeHeroLetter, { color: gradeColor(grade) }]}>{grade}</Text>
            <View style={detailStyles.gradeHeroRight}>
              <Text style={detailStyles.gradeHeroScore}>{score}/100</Text>
              <Text style={detailStyles.gradeHeroLabel}>Frontier Score</Text>
              <Text style={detailStyles.gradeHeroGrade}>{grade} Portfolio</Text>
            </View>
          </View>

          {/* Key stats */}
          <View style={detailStyles.statsCard}>
            <View style={detailStyles.statBox}>
              <Text style={detailStyles.statValue}>{(perf.expected_annual_return * 100).toFixed(1)}%</Text>
              <Text style={detailStyles.statLabel}>Exp. Return / yr</Text>
            </View>
            <View style={detailStyles.statDivider} />
            <View style={detailStyles.statBox}>
              <Text style={detailStyles.statValue}>{(perf.annual_volatility * 100).toFixed(1)}%</Text>
              <Text style={detailStyles.statLabel}>Volatility</Text>
            </View>
            <View style={detailStyles.statDivider} />
            <View style={detailStyles.statBox}>
              <Text style={detailStyles.statValue}>{perf.sharpe_ratio.toFixed(2)}</Text>
              <Text style={detailStyles.statLabel}>Sharpe Ratio</Text>
            </View>
          </View>

          {/* Holdings */}
          <Text style={detailStyles.sectionTitle}>Holdings ({sortedHoldings.length} ETFs)</Text>
          {sortedHoldings.map((h, i) => (
            <View key={i} style={detailStyles.holdingRow}>
              <Text style={detailStyles.holdingTicker}>{h.ticker}</Text>
              <View style={detailStyles.holdingBarWrap}>
                <View style={detailStyles.holdingBarTrack}>
                  <View
                    style={[
                      detailStyles.holdingBarFill,
                      { width: `${Math.min(100, Math.round(h.weight * 100))}%` as any },
                    ]}
                  />
                </View>
              </View>
              <Text style={detailStyles.holdingWeight}>{(h.weight * 100).toFixed(1)}%</Text>
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const detailStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: { flex: 1 },
  headerName: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  headerMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  closeBtn: {},
  closeText: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  gradeHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  gradeHeroLetter: { fontSize: 72, fontWeight: '900', lineHeight: 76, marginRight: spacing.lg },
  gradeHeroRight: {},
  gradeHeroScore: { fontSize: 28, fontWeight: '900', color: colors.textPrimary },
  gradeHeroLabel: { fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  gradeHeroGrade: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border },
  statValue: { fontSize: 20, fontWeight: '900', color: colors.textPrimary, marginBottom: 4 },
  statLabel: { fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md },
  holdingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  holdingTicker: { width: 60, fontSize: 13, fontWeight: '800', color: colors.primary },
  holdingBarWrap: { flex: 1, marginHorizontal: spacing.sm },
  holdingBarTrack: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  holdingBarFill: { height: 8, backgroundColor: colors.primary, borderRadius: 4 },
  holdingWeight: { width: 48, fontSize: 13, fontWeight: '700', color: colors.textPrimary, textAlign: 'right' },
});

export default function WealthTrackerScreen({ navigation }: Props) {
  const [portfolios, setPortfolios] = useState<SavedPortfolio[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [detailPortfolio, setDetailPortfolio] = useState<SavedPortfolio | null>(null);

  async function load() {
    const raw = await AsyncStorage.getItem(STORAGE.SAVED_PORTFOLIOS);
    if (raw) {
      try {
        const saved: SavedPortfolio[] = JSON.parse(raw);
        const sorted = saved.sort((a, b) => b.createdAt - a.createdAt);
        setPortfolios(sorted);
        // Auto-select the 2 most recent for comparison
        setSelectedIds(sorted.map(p => p.id)); // select all by default
      } catch {}
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      // No limit — show all selected portfolios
      return [...prev, id];
    });
  }

  async function deletePortfolio(id: string) {
    Alert.alert('Delete Portfolio', 'Are you sure you want to delete this saved portfolio?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = portfolios.filter(p => p.id !== id);
          setPortfolios(updated);
          setSelectedIds(prev => prev.filter(x => x !== id));
          await AsyncStorage.setItem(STORAGE.SAVED_PORTFOLIOS, JSON.stringify(updated));
        },
      },
    ]);
  }

  async function saveName(id: string) {
    if (!editingName.trim()) { setEditingId(null); return; }
    const updated = portfolios.map(p =>
      p.id === id ? { ...p, name: editingName.trim() } : p,
    );
    setPortfolios(updated);
    setEditingId(null);
    await AsyncStorage.setItem(STORAGE.SAVED_PORTFOLIOS, JSON.stringify(updated));
  }

  const userName = portfolios[0]?.data.name ?? 'Your';

  return (
    <TabShell active="Invest" navigation={navigation}>
    <View style={styles.screen}>
      <PortfolioDetailModal portfolio={detailPortfolio} onClose={() => setDetailPortfolio(null)} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{userName}'s Wealth Journey</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Compare')} style={styles.headerCompareBtn}>
          <Text style={styles.headerCompareBtnText}>⚖️ Compare</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {portfolios.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📂</Text>
            <Text style={styles.emptyTitle}>No saved portfolios yet</Text>
            <Text style={styles.emptySub}>
              Run your first optimization to see your wealth projections here.
            </Text>
          </View>
        ) : (
          <>
            {selectedIds.length >= 2 && (
              <ProjectionChart portfolios={portfolios} selectedIds={selectedIds} />
            )}

            <Text style={styles.sectionTitle}>
              Your Portfolios{' '}
              <Text style={styles.sectionHint}>(tap for details · 📊 to compare)</Text>
            </Text>

            {portfolios.map(portfolio => {
              const isSelected = selectedIds.includes(portfolio.id);
              const score = calcFrontierScore(portfolio.result);
              const grade = portfolio.result.scores.grade;
              const days = daysSince(portfolio.createdAt);
              const lastProjection = portfolio.result.projections[portfolio.result.projections.length - 1];

              return (
                <View
                  key={portfolio.id}
                  style={[styles.portfolioCard, isSelected && styles.portfolioCardSelected]}
                >
                  {/* Main tappable area → detail view */}
                  <TouchableOpacity
                    style={styles.portfolioCardTouchable}
                    onPress={() => setDetailPortfolio(portfolio)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.cardRow}>
                      {/* Grade — biggest element */}
                      <Text style={[styles.gradeLetterBig, { color: gradeColor(grade) }]}>{grade}</Text>

                      {/* Content */}
                      <View style={styles.cardContent}>
                        {editingId === portfolio.id ? (
                          <TextInput
                            style={styles.nameInput}
                            value={editingName}
                            onChangeText={setEditingName}
                            onBlur={() => saveName(portfolio.id)}
                            onSubmitEditing={() => saveName(portfolio.id)}
                            autoFocus
                            returnKeyType="done"
                          />
                        ) : (
                          <TouchableOpacity
                            onPress={(e) => { e.stopPropagation?.(); setEditingId(portfolio.id); setEditingName(portfolio.name); }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.portfolioName}>{portfolio.name} ✏️</Text>
                          </TouchableOpacity>
                        )}
                        <View style={styles.chipRow}>
                          <View style={styles.chip}>
                            <Text style={styles.chipText}>{score}/100</Text>
                          </View>
                          <View style={styles.chip}>
                            <Text style={styles.chipText}>{(portfolio.result.performance.expected_annual_return * 100).toFixed(1)}% return</Text>
                          </View>
                          {lastProjection && (
                            <View style={styles.chip}>
                              <Text style={styles.chipText}>{fmt(lastProjection.optimistic)}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.daysAgo}>
                          {days === 0 ? 'Today' : `${days} day${days !== 1 ? 's' : ''} ago`} ·{' '}
                          {portfolio.result.profile.risk_label}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Action column: compare toggle + delete */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={[styles.compareBtn, isSelected && styles.compareBtnActive]}
                      onPress={() => toggleSelect(portfolio.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.compareBtnText, isSelected && styles.compareBtnTextActive]}>
                        📊
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => deletePortfolio(portfolio.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.deleteBtnText}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
    </TabShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: 56,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.sm },
  backText: { fontSize: 22, color: colors.primary, fontWeight: '700' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  headerCompareBtn: { borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5 },
  headerCompareBtnText: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: spacing.lg },

  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  emptySub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  sectionHint: { fontSize: 13, color: colors.textMuted, fontWeight: '400' },

  portfolioCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    ...shadow.sm,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  portfolioCardSelected: {
    borderColor: colors.primary,
  },
  portfolioCardTouchable: { flex: 1, padding: spacing.md },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  gradeLetterBig: {
    fontSize: 48,
    fontWeight: '900',
    lineHeight: 52,
    width: 52,
    textAlign: 'center',
    marginRight: spacing.md,
  },
  cardContent: { flex: 1 },
  portfolioName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  nameInput: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.primary,
    paddingVertical: 2,
    marginBottom: 4,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  chip: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  chipText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  daysAgo: { fontSize: 11, color: colors.textMuted },
  cardActions: {
    width: 44,
    flexDirection: 'column',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  compareBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  compareBtnActive: { backgroundColor: '#3B82F620' },
  compareBtnText: { fontSize: 16, opacity: 0.4 },
  compareBtnTextActive: { opacity: 1 },
  deleteBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF444415',
  },
  deleteBtnText: { fontSize: 16 },
});
