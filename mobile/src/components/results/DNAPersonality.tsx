import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { OptimizeResponse } from '../../types';

interface Personality {
  name: string;
  desc: string;
  color: string;
  bg: string;
}

function getPersonality(result: OptimizeResponse): Personality {
  const { scores, performance } = result;
  const ret = performance.expected_annual_return;
  const vol = performance.annual_volatility;
  const { grade, diversification_score, smart_score } = scores;

  if (grade === 'A' && ret > 0.12) {
    return { name: 'Market Beater', desc: 'Built to outperform. The math is on your side.', color: '#fff', bg: '#06D6A0' };
  }
  if (grade === 'A' && diversification_score >= 7) {
    return { name: 'Top Performer', desc: 'Maximum return for minimum risk. Elite territory.', color: '#fff', bg: '#4361EE' };
  }
  if (ret > 0.11 && vol > 0.15) {
    return { name: 'High Growth Seeker', desc: 'Swinging for the fences. High potential, wild ride.', color: '#fff', bg: '#7209B7' };
  }
  if (vol < 0.07 && ret < 0.06) {
    return { name: 'Conservative Investor', desc: 'Security first. A stable foundation while you learn.', color: '#1e293b', bg: '#94A3B8' };
  }
  if (vol < 0.10 && (grade === 'B' || grade === 'C') && ret >= 0.06 && ret <= 0.09) {
    return { name: 'Consistent Investor', desc: 'Playing the long game. Slow, consistent growth compounds.', color: '#fff', bg: '#2D9CDB' };
  }
  return { name: 'Balanced Pro', desc: 'Goldilocks portfolio. Not too risky, not too safe.', color: '#fff', bg: '#F59E0B' };
}

export default function DNAPersonality({ result }: { result: OptimizeResponse }) {
  const p = getPersonality(result);
  return (
    <View style={[styles.pill, { backgroundColor: p.bg }]}>
      <Text style={[styles.name, { color: p.color }]}>{p.name}</Text>
      <Text style={[styles.desc, { color: p.color }]}>{p.desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  name: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  desc: { fontSize: 12, textAlign: 'center', lineHeight: 17, opacity: 0.9 },
});
