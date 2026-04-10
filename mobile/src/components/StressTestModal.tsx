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

interface ScenarioDef { name: string; emoji: string; period: string; eqDrop: number; bondDrop: number; recovery: number; desc: string }

const SCENARIO_DEFS: ScenarioDef[] = [
  { name: '2008 Financial Crisis', emoji: '🏦', period: '2007-2009', eqDrop: 0.48, bondDrop: 0.14, recovery: 49, desc: 'Global banking collapse, Lehman Brothers fails' },
  { name: '2020 COVID Crash', emoji: '🦠', period: 'Feb-Mar 2020', eqDrop: 0.30, bondDrop: 0.05, recovery: 5, desc: 'Fastest bear market in history, pandemic panic' },
  { name: '2022 Rate Shock', emoji: '📈', period: 'Jan-Dec 2022', eqDrop: 0.18, bondDrop: 0.28, recovery: 18, desc: 'Fed raises rates aggressively to fight inflation' },
  { name: '2000 Dot-Com Bust', emoji: '💻', period: '2000-2002', eqDrop: 0.45, bondDrop: 0.02, recovery: 56, desc: 'Tech bubble bursts, internet stocks collapse' },
  { name: '1987 Black Monday', emoji: '📉', period: 'Oct 1987', eqDrop: 0.22, bondDrop: 0.03, recovery: 15, desc: 'Single day 22% drop, largest one-day crash' },
  { name: '2011 Debt Downgrade', emoji: '🏛️', period: 'Aug 2011', eqDrop: 0.16, bondDrop: 0.02, recovery: 6, desc: 'S&P downgrades US credit rating' },
  { name: '2015 China Selloff', emoji: '🇨🇳', period: 'Aug 2015', eqDrop: 0.10, bondDrop: 0.01, recovery: 5, desc: 'Chinese market crash triggers global selloff' },
  { name: '2018 Q4 Selloff', emoji: '⚡', period: 'Oct-Dec 2018', eqDrop: 0.17, bondDrop: 0.02, recovery: 4, desc: 'Trade war fears and Fed rate hikes' },
  { name: '1997 Asian Crisis', emoji: '🌏', period: '1997', eqDrop: 0.12, bondDrop: 0.01, recovery: 8, desc: 'Currency crisis spreads across Asia' },
  { name: '2010 Flash Crash', emoji: '💥', period: 'May 2010', eqDrop: 0.07, bondDrop: 0.01, recovery: 1, desc: 'Market dropped 9% in minutes from algo trading' },
  { name: '2001 Post 9/11', emoji: '🗽', period: 'Sep 2001', eqDrop: 0.10, bondDrop: 0.01, recovery: 4, desc: 'Markets closed 4 days, reopened sharply lower' },
  { name: '2016 Brexit Shock', emoji: '🇬🇧', period: 'Jun 2016', eqDrop: 0.05, bondDrop: 0.01, recovery: 1, desc: 'UK votes to leave EU, surprises markets' },
  { name: '2013 Taper Tantrum', emoji: '🏦', period: 'May 2013', eqDrop: 0.05, bondDrop: 0.04, recovery: 3, desc: 'Fed hints at ending QE, bond yields spike' },
  { name: '1994 Bond Massacre', emoji: '📊', period: '1994', eqDrop: 0.05, bondDrop: 0.10, recovery: 12, desc: 'Fed surprises with aggressive rate hikes' },
  { name: '2023 Banking Crisis', emoji: '🏧', period: 'Mar 2023', eqDrop: 0.06, bondDrop: 0.02, recovery: 3, desc: 'SVB and Signature Bank collapse' },
];

function calcPortfolioDrop(holdings: HoldingResult[], def: ScenarioDef): number {
  let eq = 0, bond = 0;
  holdings.forEach(h => { if (BOND_TICKERS.has(h.ticker)) bond += h.weight; else eq += h.weight; });
  return Math.round(-(eq * def.eqDrop + bond * def.bondDrop) * 100);
}

type Props = {
  visible: boolean;
  holdings: HoldingResult[];
  onClose: () => void;
};

export default function StressTestModal({ visible, holdings, onClose }: Props) {
  const scenarios: Scenario[] = SCENARIO_DEFS.map(def => ({
    title: def.name,
    period: def.period,
    emoji: def.emoji,
    drawdownPct: calcPortfolioDrop(holdings, def),
    recoveryMonths: def.recovery,
    description: def.desc,
  }));

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
