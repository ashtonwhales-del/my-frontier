/**
 * HistoricalChart — 10-year portfolio vs SPY benchmark.
 * PREMIUM only — free users see a blur overlay with upgrade prompt.
 * Uses react-native-svg (already installed via WealthTrackerScreen).
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Polyline, Line, Text as SvgText, Circle, Rect } from 'react-native-svg';
import { colors, spacing, radius, shadow } from '../../theme';
import { OptimizeResponse } from '../../types';
import { fetchHistorical } from '../../api';
// All features are free — no premium gating
import { HistoricalPoint } from '../../types';

const CHART_W = Dimensions.get('window').width - spacing.lg * 2 - spacing.lg * 2;
const CHART_H = 160;
const PAD = { l: 48, r: 12, t: 12, b: 28 };
const PLOT_W = CHART_W - PAD.l - PAD.r;
const PLOT_H = CHART_H - PAD.t - PAD.b;

function toPoints(data: HistoricalPoint[], key: 'portfolio' | 'spy', minV: number, maxV: number): string {
  if (!data.length) return '';
  return data.map((p, i) => {
    const x = PAD.l + (i / (data.length - 1)) * PLOT_W;
    const y = PAD.t + PLOT_H - ((p[key] - minV) / (maxV - minV)) * PLOT_H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

function fmt(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

export default function HistoricalChart({ result }: { result: OptimizeResponse }) {
  const [points, setPoints] = useState<HistoricalPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrubIdx, setScrubIdx] = useState<number | null>(null);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => { const x = e.nativeEvent.locationX; if (points.length) setScrubIdx(Math.min(Math.max(0, Math.floor((x / CHART_W) * points.length)), points.length - 1)); },
    onPanResponderMove: (e) => { const x = e.nativeEvent.locationX; if (points.length) setScrubIdx(Math.min(Math.max(0, Math.floor((x / CHART_W) * points.length)), points.length - 1)); },
    onPanResponderRelease: () => setScrubIdx(null),
  })).current;

  useEffect(() => {
    setLoading(true);
    const weights: Record<string, number> = {};
    result.holdings.forEach(h => { weights[h.ticker] = h.weight; });
    fetchHistorical(weights)
      .then(setPoints)
      .catch(e => setError(e.message ?? 'Could not load history'))
      .finally(() => setLoading(false));
  }, []);

  const finalPortfolio = points.length ? points[points.length - 1].portfolio : 0;
  const finalSpy = points.length ? points[points.length - 1].spy : 0;
  const outperformed = finalPortfolio >= finalSpy;

  const minV = points.length ? Math.min(...points.map(p => Math.min(p.portfolio, p.spy))) * 0.97 : 0;
  const maxV = points.length ? Math.max(...points.map(p => Math.max(p.portfolio, p.spy))) * 1.03 : 1;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>📈 10-Year Historical Performance</Text>
      <Text style={styles.subtitle}>$10,000 invested 10 years ago</Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading 10 years of data…</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
          <View {...panResponder.panHandlers}>
          {scrubIdx !== null && points[scrubIdx] && (
            <View style={styles.scrubCard}>
              <Text style={styles.scrubDate}>{points[scrubIdx].date}</Text>
              <Text style={styles.scrubVal}>Portfolio: {fmt(points[scrubIdx].portfolio)}</Text>
              <Text style={styles.scrubVal}>S&P 500: {fmt(points[scrubIdx].spy)}</Text>
              <Text style={[styles.scrubVal, { color: points[scrubIdx].portfolio >= points[scrubIdx].spy ? '#10B981' : '#EF4444' }]}>
                Diff: {fmt(points[scrubIdx].portfolio - points[scrubIdx].spy)}
              </Text>
            </View>
          )}
          <Svg width={CHART_W} height={CHART_H}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(r => {
              const y = PAD.t + PLOT_H * (1 - r);
              const v = minV + (maxV - minV) * r;
              return (
                <React.Fragment key={r}>
                  <Line x1={PAD.l} y1={y} x2={PAD.l + PLOT_W} y2={y} stroke={colors.border} strokeWidth={1} />
                  <SvgText x={PAD.l - 4} y={y + 4} fontSize={9} fill={colors.textMuted} textAnchor="end">{fmt(v)}</SvgText>
                </React.Fragment>
              );
            })}
            {/* SPY line (gray) */}
            <Polyline points={toPoints(points, 'spy', minV, maxV)} fill="none" stroke="#94A3B8" strokeWidth={1.5} />
            {/* Portfolio line (blue) */}
            <Polyline points={toPoints(points, 'portfolio', minV, maxV)} fill="none" stroke={colors.primary} strokeWidth={2.5} />
          </Svg>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.primary }]} /><Text style={styles.legendLabel}>Your Portfolio</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#94A3B8' }]} /><Text style={styles.legendLabel}>S&P 500 (SPY)</Text></View>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultValue}>{fmt(finalPortfolio)}</Text>
            <View style={[styles.perfBadge, { backgroundColor: outperformed ? 'rgba(6,214,160,0.15)' : 'rgba(148,163,184,0.15)' }]}>
              <Text style={[styles.perfBadgeText, { color: outperformed ? '#06D6A0' : '#94A3B8' }]}>
                {outperformed ? 'Outperformed S&P 📈' : 'Trailed S&P — but with lower risk'}
              </Text>
            </View>
          </View>
          <Text style={styles.note}>Historical results do not guarantee future performance. Not financial advice.</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, ...shadow.sm, marginBottom: spacing.lg },
  title: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.md },
  lockedWrap: { position: 'relative', height: 200, borderRadius: radius.lg, overflow: 'hidden' },
  blurChart: { position: 'absolute', inset: 0, backgroundColor: colors.bg, opacity: 0.7 },
  lockOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  lockEmoji: { fontSize: 32 },
  lockTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  lockDesc: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19 },
  loadingBox: { height: 120, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  loadingText: { fontSize: 13, color: colors.textSecondary },
  errorText: { fontSize: 13, color: '#EF233C', textAlign: 'center' },
  legend: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, color: colors.textSecondary },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  resultValue: { fontSize: 24, fontWeight: '900', color: colors.success },
  perfBadge: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  perfBadgeText: { fontSize: 12, fontWeight: '700' },
  note: { fontSize: 11, color: colors.textMuted, lineHeight: 15 },
  scrubCard: { position: 'absolute', top: -8, right: 0, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 8, zIndex: 10 },
  scrubDate: { fontSize: 11, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  scrubVal: { fontSize: 11, color: colors.textSecondary },
});
