import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { HoldingResult } from '../types';
import { colors, spacing, radius, shadow } from '../theme';

// Tickers classified as bonds for weight calculation
const BOND_TICKERS = new Set([
  'AGG','BND','TLT','IEF','LQD','HYG','JNK','EMB','MUB','TIP','VTIP',
  'SCHP','STIP','USFR','FLRN','FLTR','IVOL','PFIX','RINF','LTPZ',
  'MBB','VMBS','SPMB','ICVT','CWB','FCVT','BIL','SGOV','SHV','JPST',
  'SCHO','SHY','FLOT','BKLN','SRLN','FTSL',
]);

type Scenario = {
  title: string;
  period: string;
  emoji: string;
  drawdownPct: number;
  recoveryMonths: number;
  description: string;
};

function calcDrawdown(holdings: HoldingResult[]): { crisis2008: number; covid2020: number; rates2022: number } {
  let equityWeight = 0;
  let bondWeight = 0;
  holdings.forEach(h => {
    if (BOND_TICKERS.has(h.ticker)) bondWeight += h.weight;
    else equityWeight += h.weight;
  });

  // 2008: equity-heavy = -40 to -55%, bond-heavy = -10 to -20%
  const crisis2008 = -(equityWeight * 0.48 + bondWeight * 0.14);

  // 2020 COVID: sharp drop then fast recovery; equity-heavy = -30%, bonds mild
  const covid2020 = -(equityWeight * 0.30 + bondWeight * 0.05);

  // 2022 rate hikes: bonds hurt more than equities
  const rates2022 = -(equityWeight * 0.18 + bondWeight * 0.28);

  return {
    crisis2008: Math.round(crisis2008 * 100),
    covid2020: Math.round(covid2020 * 100),
    rates2022: Math.round(rates2022 * 100),
  };
}

function recoveryMonths(drawdownPct: number, scenario: '2008' | '2020' | '2022'): number {
  if (scenario === '2008') return drawdownPct < -40 ? 54 : drawdownPct < -30 ? 42 : 30;
  if (scenario === '2020') return 6; // unusually fast recovery
  return drawdownPct < -20 ? 24 : 18;
}

type Props = {
  visible: boolean;
  holdings: HoldingResult[];
  onClose: () => void;
};

export default function StressTestModal({ visible, holdings, onClose }: Props) {
  const dd = calcDrawdown(holdings);

  const scenarios: Scenario[] = [
    {
      title: '2008 Financial Crisis',
      period: 'Oct 2007 – Mar 2009',
      emoji: '🏦',
      drawdownPct: dd.crisis2008,
      recoveryMonths: recoveryMonths(dd.crisis2008, '2008'),
      description:
        'Mortgage loans made to people who could never repay them triggered a chain reaction that collapsed the global banking system — wiping out more than half of stock market values over 17 months. Knowing exactly where your portfolio stood during the worst financial crisis since 1929 is the difference between panic-selling at the bottom and holding through to the recovery.',
    },
    {
      title: '2020 COVID Crash',
      period: 'Feb – Mar 2020',
      emoji: '🦠',
      drawdownPct: dd.covid2020,
      recoveryMonths: recoveryMonths(dd.covid2020, '2020'),
      description:
        'A global pandemic shut down the world economy almost overnight, sending markets into a freefall of 34% in just 23 trading days — the fastest crash in history — before fully recovering within 5 months. Your portfolio\'s behavior here reveals whether your mix had the right balance to survive the chaos and capture the rebound.',
    },
    {
      title: '2022 Rate Hike Shock',
      period: 'Jan – Dec 2022',
      emoji: '📈',
      drawdownPct: dd.rates2022,
      recoveryMonths: recoveryMonths(dd.rates2022, '2022'),
      description:
        'To fight 40-year-high inflation, the Fed raised interest rates seven times in twelve months — punishing stocks and bonds simultaneously in a way that hadn\'t happened since 1937. This scenario is the most revealing of the three: it shows whether your diversification actually works when the usual "safe" assets stop being safe.',
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📊 Portfolio Stress Test</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Text style={styles.closeText}>✕ Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.intro}>
            Every portfolio looks great during a bull market. This is where you find out how yours holds up when things go wrong.
          </Text>

          {scenarios.map((s, i) => (
            <View key={i} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.scenarioEmoji}>{s.emoji}</Text>
                <View style={styles.cardTitles}>
                  <Text style={styles.scenarioTitle}>{s.title}</Text>
                  <Text style={styles.scenarioPeriod}>{s.period}</Text>
                </View>
              </View>

              <Text style={styles.description}>{s.description}</Text>

              <View style={styles.metricsRow}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Est. Drawdown</Text>
                  <Text style={[styles.metricValue, { color: '#EF233C' }]}>
                    {s.drawdownPct}%
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Est. Recovery</Text>
                  <Text style={[styles.metricValue, { color: '#06D6A0' }]}>
                    ~{s.recoveryMonths} mo
                  </Text>
                </View>
              </View>

              {/* Drawdown bar */}
              <View style={styles.barContainer}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${Math.min(100, Math.abs(s.drawdownPct))}%` as any },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{Math.abs(s.drawdownPct)}% loss</Text>
              </View>
            </View>
          ))}

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              ⚠️ These are simulated estimates based on historical index performance and your portfolio's asset class weights. Actual results would vary based on specific ETF holdings, rebalancing, dividends, and other factors. Past performance does not guarantee future results. Not financial advice.
            </Text>
          </View>

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  closeBtn: {},
  closeText: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  intro: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  scenarioEmoji: { fontSize: 28, marginRight: spacing.md },
  cardTitles: { flex: 1 },
  scenarioTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  scenarioPeriod: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  metricBox: { flex: 1, alignItems: 'center' },
  metricDivider: { width: 1, backgroundColor: colors.border },
  metricLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  metricValue: { fontSize: 22, fontWeight: '900' },
  barContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: 8, backgroundColor: '#EF233C', borderRadius: 4 },
  barLabel: { fontSize: 12, color: colors.textMuted, width: 64, textAlign: 'right' },
  disclaimer: {
    backgroundColor: '#FFF9E6',
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: '#FFB703',
  },
  disclaimerText: { fontSize: 12, color: '#92400E', lineHeight: 18 },
});
