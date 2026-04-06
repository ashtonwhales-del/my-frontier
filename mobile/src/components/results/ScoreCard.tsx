import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, shadow } from '../../theme';
import { OptimizeResponse } from '../../types';

export function gradeColor(grade: string): string {
  return grade === 'A' ? '#06D6A0' : grade === 'B' ? '#4361EE' : grade === 'C' ? '#FFB703' : '#EF233C';
}

export default function ScoreCard({ result }: { result: OptimizeResponse }) {
  const { scores, performance } = result;
  const gc = gradeColor(scores.grade);
  return (
    <View style={scoreStyles.card}>
      {/* Grade + grade tooltip */}
      <View style={scoreStyles.gradeRow}>
        <View style={[scoreStyles.gradeCircle, { borderColor: gc }]}>
          <Text style={[scoreStyles.gradeText, { color: gc }]}>{scores.grade}</Text>
        </View>
        <View style={scoreStyles.gradeInfo}>
          <Text style={scoreStyles.gradeInfoLabel}>Portfolio Grade</Text>
          <Text style={scoreStyles.gradeInfoTooltip}>
            Overall portfolio quality based on diversification and expected returns
          </Text>
        </View>
      </View>

      {/* 2×2 metric grid */}
      <View style={scoreStyles.grid}>
        <View style={scoreStyles.metricBox}>
          <Text style={scoreStyles.metricLabel}>Smart Score</Text>
          <Text style={scoreStyles.metricValue}>{scores.smart_score.toFixed(1)}<Text style={scoreStyles.metricUnit}>/10</Text></Text>
          <Text style={scoreStyles.metricTooltip}>How well this portfolio balances risk and reward (higher = better)</Text>
        </View>
        <View style={[scoreStyles.metricBox, scoreStyles.metricBoxRight]}>
          <Text style={scoreStyles.metricLabel}>Risk Score</Text>
          <Text style={scoreStyles.metricValue}>{scores.risk_score_pct.toFixed(0)}<Text style={scoreStyles.metricUnit}>%</Text></Text>
          <Text style={scoreStyles.metricTooltip}>How much your portfolio could swing up or down in a bad year</Text>
        </View>
        <View style={[scoreStyles.metricBox, scoreStyles.metricBoxBottom]}>
          <Text style={scoreStyles.metricLabel}>Exp. Return</Text>
          <Text style={scoreStyles.metricValue}>
            {(performance.expected_annual_return * 100).toFixed(1)}<Text style={scoreStyles.metricUnit}>%/yr</Text>
          </Text>
          <Text style={scoreStyles.metricTooltip}>Estimated annual return based on historical data</Text>
        </View>
        <View style={[scoreStyles.metricBox, scoreStyles.metricBoxRight, scoreStyles.metricBoxBottom]}>
          <Text style={scoreStyles.metricLabel}>Diversif.</Text>
          <Text style={scoreStyles.metricValue}>{scores.diversification_score.toFixed(1)}<Text style={scoreStyles.metricUnit}>/10</Text></Text>
          <Text style={scoreStyles.metricTooltip}>How spread out your risk is across different holdings</Text>
        </View>
      </View>
    </View>
  );
}

const scoreStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow.sm,
    marginBottom: spacing.lg,
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  gradeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  gradeText: { fontSize: 32, fontWeight: '900' },
  gradeInfo: { flex: 1 },
  gradeInfoLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  gradeInfoTooltip: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  metricBox: {
    width: '50%',
    padding: spacing.md,
    backgroundColor: colors.bg,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  metricBoxRight: { borderRightWidth: 0 },
  metricBoxBottom: { borderTopWidth: 1, borderTopColor: colors.border },
  metricLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  metricValue: { fontSize: 22, fontWeight: '900', color: colors.textPrimary, marginBottom: 4 },
  metricUnit: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  metricTooltip: { fontSize: 11, color: colors.textMuted, lineHeight: 15 },
});
