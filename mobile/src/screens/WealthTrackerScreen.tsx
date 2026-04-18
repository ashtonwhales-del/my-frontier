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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Line, Text as SvgText, Circle as SvgCircle } from 'react-native-svg';
import { RootStackParamList, SavedPortfolio } from '../types';
import { colors, spacing, radius, shadow } from '../theme';
import { useTheme } from '../context/ThemeContext';
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
  const { palette } = useTheme();
  const selected = portfolios.filter(p => selectedIds.includes(p.id));
  if (!selected.length) return null;

  const allYears = selected.flatMap(p => p.result.projections.map(pt => pt.years));
  const allValues = selected.flatMap(p => p.result.projections.map(pt => pt.optimistic));
  const maxYears = Math.max(...allYears, 5);
  const maxVal = Math.max(...allValues, 1);
  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];

  function toX(years: number) { return PAD_L + (years / maxYears) * PLOT_W; }
  function toY(val: number) { return PAD_T + PLOT_H - (val / maxVal) * PLOT_H; }

  return (
    <View style={[chartStyles.container, { backgroundColor: palette.bgElevated }]}>
      <Text style={[chartStyles.title, { color: palette.textPrimary }]}>Projected Wealth at Retirement (Optimistic)</Text>
      <Svg width={CHART_W} height={CHART_H}>
        {yTicks.map((v, i) => (
          <SvgText
            key={i}
            x={PAD_L - 4}
            y={toY(v) + 4}
            fontSize={9}
            fill={palette.textTertiary}
            textAnchor="end"
          >
            {fmt(v)}
          </SvgText>
        ))}
        <Line
          x1={PAD_L} y1={PAD_T + PLOT_H}
          x2={PAD_L + PLOT_W} y2={PAD_T + PLOT_H}
          stroke={palette.borderSubtle} strokeWidth={1}
        />
        <Line
          x1={PAD_L} y1={PAD_T}
          x2={PAD_L} y2={PAD_T + PLOT_H}
          stroke={palette.borderSubtle} strokeWidth={1}
        />
        {[0, Math.round(maxYears * 0.33), Math.round(maxYears * 0.66), Math.round(maxYears)].map((yr, i) => (
          <SvgText
            key={i}
            x={toX(yr)}
            y={PAD_T + PLOT_H + 14}
            fontSize={9}
            fill={palette.textTertiary}
            textAnchor="middle"
          >
            {yr}yr
          </SvgText>
        ))}
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
      <View style={chartStyles.legend}>
        {(() => {
          const nameCounts: Record<string, number> = {};
          const nameIndex: Record<string, number> = {};
          selected.forEach(p => { nameCounts[p.name] = (nameCounts[p.name] || 0) + 1; });
          return selected.map((p, idx) => {
            let suffix = '';
            if (nameCounts[p.name] > 1) {
              nameIndex[p.name] = (nameIndex[p.name] || 0) + 1;
              suffix = ` #${nameIndex[p.name]}`;
            }
            const retPct = (p.result.performance.expected_annual_return * 100).toFixed(1);
            const label = `${p.name}${suffix} (${retPct}%)`;
            return (
              <View key={p.id} style={chartStyles.legendItem}>
                <View style={[chartStyles.legendDot, { backgroundColor: LINE_COLORS[idx % LINE_COLORS.length] }]} />
                <Text style={[chartStyles.legendLabel, { color: palette.textSecondary }]}>{label}</Text>
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
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  title: { fontSize: 13, fontWeight: '700', marginBottom: spacing.sm },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11 },
});

// ── Portfolio Detail Modal ──────────────────────────────────────────────────

interface DetailModalProps {
  portfolio: SavedPortfolio | null;
  onClose: () => void;
}

function PortfolioDetailModal({ portfolio, onClose }: DetailModalProps) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  if (!portfolio) return null;
  const score = calcFrontierScore(portfolio.result);
  const grade = portfolio.result.scores.grade;
  const perf = portfolio.result.performance;
  const days = daysSince(portfolio.createdAt);
  const sortedHoldings = [...portfolio.result.holdings].sort((a, b) => b.weight - a.weight);

  return (
    <Modal visible={!!portfolio} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[detailStyles.container, { backgroundColor: palette.bgPrimary }]}>
        <View style={[detailStyles.header, { paddingTop: insets.top + 8, backgroundColor: palette.bgElevated, borderBottomColor: palette.borderSubtle }]}>
          <View style={detailStyles.headerLeft}>
            <Text style={[detailStyles.headerName, { color: palette.textPrimary }]}>{portfolio.name}</Text>
            <Text style={[detailStyles.headerMeta, { color: palette.textTertiary }]}>
              {days === 0 ? 'Today' : `${days} day${days !== 1 ? 's' : ''} ago`} · {portfolio.result.profile.risk_label}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={detailStyles.closeBtn} activeOpacity={0.7}>
            <Text style={[detailStyles.closeText, { color: palette.textSecondary }]}>✕ Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={detailStyles.scroll} contentContainerStyle={detailStyles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[detailStyles.gradeHero, { backgroundColor: palette.bgElevated }]}>
            <Text style={[detailStyles.gradeHeroLetter, { color: gradeColor(grade) }]}>{grade}</Text>
            <View style={detailStyles.gradeHeroRight}>
              <Text style={[detailStyles.gradeHeroScore, { color: palette.textPrimary }]}>{score}/10</Text>
              <Text style={[detailStyles.gradeHeroLabel, { color: palette.textTertiary }]}>Frontier Score</Text>
              <Text style={[detailStyles.gradeHeroGrade, { color: palette.textSecondary }]}>{grade} Portfolio</Text>
            </View>
          </View>

          <View style={[detailStyles.statsCard, { backgroundColor: palette.bgElevated }]}>
            <View style={detailStyles.statBox}>
              <Text style={[detailStyles.statValue, { color: palette.textPrimary }]}>{(perf.expected_annual_return * 100).toFixed(1)}%</Text>
              <Text style={[detailStyles.statLabel, { color: palette.textTertiary }]}>Exp. Return / yr</Text>
            </View>
            <View style={[detailStyles.statDivider, { backgroundColor: palette.borderSubtle }]} />
            <View style={detailStyles.statBox}>
              <Text style={[detailStyles.statValue, { color: palette.textPrimary }]}>{(perf.annual_volatility * 100).toFixed(1)}%</Text>
              <Text style={[detailStyles.statLabel, { color: palette.textTertiary }]}>Volatility</Text>
            </View>
            <View style={[detailStyles.statDivider, { backgroundColor: palette.borderSubtle }]} />
            <View style={detailStyles.statBox}>
              <Text style={[detailStyles.statValue, { color: palette.textPrimary }]}>{perf.sharpe_ratio.toFixed(2)}</Text>
              <Text style={[detailStyles.statLabel, { color: palette.textTertiary }]}>Sharpe Ratio</Text>
            </View>
          </View>

          <Text style={[detailStyles.sectionTitle, { color: palette.textPrimary }]}>Holdings ({sortedHoldings.length} ETFs)</Text>
          {sortedHoldings.map((h, i) => (
            <View key={i} style={[detailStyles.holdingRow, { borderBottomColor: palette.borderSubtle }]}>
              <Text style={[detailStyles.holdingTicker, { color: palette.brandBlue }]}>{h.ticker}</Text>
              <View style={detailStyles.holdingBarWrap}>
                <View style={[detailStyles.holdingBarTrack, { backgroundColor: palette.borderSubtle }]}>
                  <View
                    style={[
                      detailStyles.holdingBarFill,
                      { width: `${Math.min(100, Math.round(h.weight * 100))}%` as any, backgroundColor: palette.brandBlue },
                    ]}
                  />
                </View>
              </View>
              <Text style={[detailStyles.holdingWeight, { color: palette.textPrimary }]}>{(h.weight * 100).toFixed(1)}%</Text>
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const detailStyles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: { flex: 1 },
  headerName: { fontSize: 18, fontWeight: '800' },
  headerMeta: { fontSize: 12, marginTop: 2 },
  closeBtn: {},
  closeText: { fontSize: 14, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  gradeHero: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  gradeHeroLetter: { fontSize: 72, fontWeight: '900', lineHeight: 76, marginRight: spacing.lg },
  gradeHeroRight: {},
  gradeHeroScore: { fontSize: 28, fontWeight: '900' },
  gradeHeroLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  gradeHeroGrade: { fontSize: 13, marginTop: spacing.xs },
  statsCard: {
    flexDirection: 'row',
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1 },
  statValue: { fontSize: 20, fontWeight: '900', marginBottom: 4 },
  statLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: spacing.md },
  holdingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  holdingTicker: { width: 60, fontSize: 13, fontWeight: '800' },
  holdingBarWrap: { flex: 1, marginHorizontal: spacing.sm },
  holdingBarTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  holdingBarFill: { height: 8, borderRadius: 4 },
  holdingWeight: { width: 48, fontSize: 13, fontWeight: '700', textAlign: 'right' },
});

export default function WealthTrackerScreen({ navigation }: Props) {
  const { palette } = useTheme();
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
        setSelectedIds(prev => prev.length === 0 ? sorted.map(p => p.id) : prev);
      } catch {}
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
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

  const userName = portfolios[0]?.name ?? 'Your';

  return (
    <TabShell active="Portfolio" navigation={navigation}>
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.bgPrimary }]} edges={['top', 'bottom']}>
      <PortfolioDetailModal portfolio={detailPortfolio} onClose={() => setDetailPortfolio(null)} />

      <View style={[styles.header, { backgroundColor: palette.bgElevated, borderBottomColor: palette.borderSubtle }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={palette.brandBlue} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>{userName}'s Wealth Journey</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Compare')} style={[styles.headerCompareBtn, { borderColor: palette.brandBlue }]}>
          <Text style={[styles.headerCompareBtnText, { color: palette.brandBlue }]}>⚖️ Compare</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {portfolios.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📂</Text>
            <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>No saved portfolios yet</Text>
            <Text style={[styles.emptySub, { color: palette.textSecondary }]}>
              Run your first optimization to see your wealth projections here.
            </Text>
          </View>
        ) : (
          <>
            {selectedIds.length >= 2 && (
              <ProjectionChart portfolios={portfolios} selectedIds={selectedIds} />
            )}

            <Text style={styles.sectionTitle}>
              <Text style={[styles.sectionTitleText, { color: palette.textPrimary }]}>Your Portfolios </Text>
              <Text style={[styles.sectionHint, { color: palette.textTertiary }]}>(tap for details · 📊 to compare)</Text>
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
                  style={[styles.portfolioCard, { backgroundColor: palette.bgElevated, borderColor: isSelected ? palette.brandBlue : 'transparent' }]}
                >
                  <TouchableOpacity
                    style={styles.portfolioCardTouchable}
                    onPress={() => setDetailPortfolio(portfolio)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.cardRow}>
                      <Text style={[styles.gradeLetterBig, { color: gradeColor(grade) }]}>{grade}</Text>

                      <View style={styles.cardContent}>
                        {editingId === portfolio.id ? (
                          <TextInput
                            style={[styles.nameInput, { color: palette.textPrimary, borderBottomColor: palette.brandBlue }]}
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
                            <Text style={[styles.portfolioName, { color: palette.textPrimary }]}>{portfolio.name} ✏️</Text>
                          </TouchableOpacity>
                        )}
                        <View style={styles.chipRow}>
                          <View style={[styles.chip, { backgroundColor: palette.bgPrimary }]}>
                            <Text style={[styles.chipText, { color: palette.textSecondary }]}>{score}/10</Text>
                          </View>
                          <View style={[styles.chip, { backgroundColor: palette.bgPrimary }]}>
                            <Text style={[styles.chipText, { color: palette.textSecondary }]}>{(portfolio.result.performance.expected_annual_return * 100).toFixed(1)}% return</Text>
                          </View>
                          {lastProjection && (
                            <View style={[styles.chip, { backgroundColor: palette.bgPrimary }]}>
                              <Text style={[styles.chipText, { color: palette.textSecondary }]}>{fmt(lastProjection.optimistic)}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.daysAgo, { color: palette.textTertiary }]}>
                          {days === 0 ? 'Today' : `${days} day${days !== 1 ? 's' : ''} ago`} ·{' '}
                          {portfolio.result.profile.risk_label}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <View style={[styles.cardActions, { borderLeftColor: palette.borderSubtle }]}>
                    <TouchableOpacity
                      style={[styles.compareBtn, { borderBottomColor: palette.borderSubtle }, isSelected && styles.compareBtnActive]}
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
    </SafeAreaView>
    </TabShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.sm },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800' },
  headerCompareBtn: { borderWidth: 1.5, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5 },
  headerCompareBtnText: { fontSize: 12, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: spacing.lg },

  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: spacing.sm },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 21 },

  sectionTitle: { marginBottom: spacing.md },
  sectionTitleText: { fontSize: 15, fontWeight: '700' },
  sectionHint: { fontSize: 13, fontWeight: '400' },

  portfolioCard: {
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    ...shadow.sm,
    flexDirection: 'row',
    borderWidth: 2,
    overflow: 'hidden',
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
  portfolioName: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  nameInput: {
    fontSize: 15,
    fontWeight: '700',
    borderBottomWidth: 1.5,
    paddingVertical: 2,
    marginBottom: 4,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  chip: {
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  chipText: { fontSize: 11, fontWeight: '600' },
  daysAgo: { fontSize: 11 },
  cardActions: {
    width: 44,
    flexDirection: 'column',
    borderLeftWidth: 1,
  },
  compareBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
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
