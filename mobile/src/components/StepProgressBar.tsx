import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface Props {
  currentStep: number; // 1-based
  totalSteps: number;
  labels?: string[];
}

export default function StepProgressBar({ currentStep, totalSteps, labels }: Props) {
  const { palette } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: palette.bgPrimary }]}>
      <View style={styles.barRow}>
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum = i + 1;
          const filled = stepNum <= currentStep;
          const isLast = stepNum === totalSteps;
          return (
            <View
              key={i}
              style={[
                styles.segment,
                !isLast && styles.segmentGap,
                { backgroundColor: filled ? palette.accent : palette.borderSubtle },
              ]}
            />
          );
        })}
      </View>
      <Text style={[styles.label, { color: palette.textSecondary }]}>
        Step <Text style={[styles.labelBold, { color: palette.textPrimary }]}>{currentStep}</Text> of {totalSteps}
        {labels && labels[currentStep - 1] ? (
          <Text style={[styles.labelName, { color: palette.textSecondary }]}>  ·  {labels[currentStep - 1]}</Text>
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
  },
  segmentGap: {},
  segmentFilled: {},
  label: {
    fontSize: 12,
  },
  labelBold: {
    fontWeight: '700',
  },
  labelName: {},
});
