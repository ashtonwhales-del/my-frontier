import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme';

interface Props {
  currentStep: number; // 1-based
  totalSteps: number;
  labels?: string[];
}

export default function StepProgressBar({ currentStep, totalSteps, labels }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.barRow}>
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum = i + 1;
          const filled = stepNum <= currentStep;
          const isLast = stepNum === totalSteps;
          return (
            <View key={i} style={[styles.segment, !isLast && styles.segmentGap, filled && styles.segmentFilled]} />
          );
        })}
      </View>
      <Text style={styles.label}>
        Step <Text style={styles.labelBold}>{currentStep}</Text> of {totalSteps}
        {labels && labels[currentStep - 1] ? (
          <Text style={styles.labelName}>  ·  {labels[currentStep - 1]}</Text>
        ) : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
  },
  barRow: {
    flexDirection: 'row',
    height: 4,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  segmentGap: {},
  segmentFilled: {
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
  },
  labelBold: {
    fontWeight: '700',
    color: colors.textSecondary,
  },
  labelName: {
    color: colors.textMuted,
  },
});
