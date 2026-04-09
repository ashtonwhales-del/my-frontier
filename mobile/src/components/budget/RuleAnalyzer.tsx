/**
 * RuleAnalyzer.tsx
 * Displays 50/30/20 rule progress bars for budget categories.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { NumberScale, BodyScale } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';

interface RuleAnalyzerProps {
  income: number;
  needs: number;   // Housing + Transport + Food + Utilities + Health
  wants: number;   // Subscriptions + Entertainment + Shopping + Other
  investing: number;
}

interface BarRowProps {
  label: string;
  actual: number;
  target: number;
  pct: number;
}

function BarRow({ label, actual, target, pct }: BarRowProps) {
  const overTarget = pct > target;
  const barColor = overTarget ? Colors.negative : Colors.positive;
  const pctColor = overTarget ? Colors.negative : Colors.positive;
  const fillWidth = Math.min(pct / (target * 1.5), 1) * 100;

  return (
    <View style={styles.barRow}>
      <View style={styles.barHeader}>
        <Text style={styles.barLabel}>{label}</Text>
        <View style={styles.barRight}>
          <Text style={[NumberScale.sm, { color: pctColor }]}>
            {pct.toFixed(0)}%
          </Text>
          <Text style={styles.barTarget}> / {target}%</Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${fillWidth}%` as any, backgroundColor: barColor }]} />
        <View style={[styles.targetMarker, { left: `${(target / (target * 1.5)) * 100}%` as any }]} />
      </View>
    </View>
  );
}

export default function RuleAnalyzer({ income, needs, wants, investing }: RuleAnalyzerProps) {
  if (income <= 0) return null;

  const needsPct   = (needs / income) * 100;
  const wantsPct   = (wants / income) * 100;
  const savingsPct = (investing / income) * 100;

  const targetInvesting = income * 0.20;
  const available = income - needs - wants;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>50 / 30 / 20 Rule</Text>

      <BarRow label="Needs"             actual={needs}     target={50} pct={needsPct} />
      <BarRow label="Wants"             actual={wants}     target={30} pct={wantsPct} />
      <BarRow label="Savings/Investing" actual={investing} target={20} pct={savingsPct} />

      <View style={styles.gapRow}>
        <Text style={styles.gapText}>
          Target: invest{' '}
          <Text style={styles.gapHighlight}>
            ${targetInvesting.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
          </Text>
          {'  '}Available:{' '}
          <Text style={[styles.gapHighlight, { color: available >= 0 ? Colors.positive : Colors.negative }]}>
            ${Math.abs(available).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
            {available < 0 ? ' over' : ' left'}
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: Spacing.sm },

  title: {
    ...BodyScale.md,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  barRow: { marginBottom: Spacing.lg },

  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  barLabel: { ...BodyScale.md, color: Colors.textPrimary },

  barRight:  { flexDirection: 'row', alignItems: 'baseline' },

  barTarget: { ...BodyScale.sm, color: Colors.textTertiary },

  track: {
    height: 8,
    backgroundColor: Colors.borderSubtle,
    borderRadius: Radius.full,
    overflow: 'hidden',
    position: 'relative',
  },

  fill: { height: '100%', borderRadius: Radius.full },

  targetMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },

  gapRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },

  gapText: { ...BodyScale.md, color: Colors.textSecondary },

  gapHighlight: { ...BodyScale.md, color: Colors.brandGold, fontWeight: '600' },
});
