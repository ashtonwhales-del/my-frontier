import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, shadow } from '../../theme';
import { ProjectionPoint, OptimizeResponse } from '../../types';

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

type Props = {
  projections: ProjectionPoint[];
  profile: OptimizeResponse['profile'];
  performance: OptimizeResponse['performance'];
};

export default function ProjectionsSection({ projections, profile, performance }: Props) {
  if (!projections.length) return null;
  const weekly = profile.weekly_contribution;
  const retPct = (performance.expected_annual_return * 100).toFixed(1);
  return (
    <View style={projStyles.container}>
      <Text style={projStyles.title}>💰 What your money could become</Text>
      {weekly > 0 && (
        <Text style={projStyles.intro}>
          If you invest ${fmt(weekly)}/week at {retPct}% expected annual return:
        </Text>
      )}
      {projections.map((p, i) => {
        const midpoint = Math.round((p.conservative + p.optimistic) / 2);
        const isLast = i === projections.length - 1;
        return (
          <View key={i} style={[projStyles.horizonRow, !isLast && projStyles.horizonBorder]}>
            <View style={projStyles.horizonLeft}>
              <Text style={projStyles.horizonAge}>Age {p.at_age % 1 === 0 ? p.at_age.toFixed(0) : p.at_age.toFixed(1)}</Text>
              <Text style={projStyles.horizonYrs}>{p.years % 1 === 0 ? p.years.toFixed(0) : p.years.toFixed(1)} yrs</Text>
            </View>
            <View style={projStyles.horizonRight}>
              <Text style={projStyles.horizonMid}>${fmt(midpoint)}</Text>
              <Text style={projStyles.horizonOptLabel}>If markets perform well: ${fmt(Math.round(p.optimistic))}</Text>
              <Text style={projStyles.horizonConsLabel}>If markets underperform: ${fmt(Math.round(p.conservative))}</Text>
            </View>
          </View>
        );
      })}
      <Text style={projStyles.note}>
        Projections assume consistent contributions and historical average returns. Past performance does not guarantee future results. Not financial advice.
      </Text>
    </View>
  );
}

const projStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  title: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md },
  intro: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 19 },
  horizonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  horizonBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  horizonLeft: { width: 76 },
  horizonAge: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  horizonYrs: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  horizonRight: { flex: 1, marginLeft: spacing.md },
  horizonMid: { fontSize: 26, fontWeight: '900', color: colors.success, marginBottom: 3 },
  horizonOptLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 2 },
  horizonConsLabel: { fontSize: 11, color: colors.textMuted },
  note: { marginTop: spacing.md, fontSize: 11, color: colors.textMuted, lineHeight: 16 },
});
