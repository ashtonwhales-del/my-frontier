import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors } from '../../theme/colors';
import { Radius } from '../../theme/spacing';

interface SkeletonProps {
  variant?: 'card' | 'row' | 'chart';
  style?: StyleProp<ViewStyle>;
}

function ShimmerBar({ style }: { style?: StyleProp<ViewStyle> }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[styles.bar, { opacity }, style]} />;
}

export default function LoadingSkeleton({ variant = 'card', style }: SkeletonProps) {
  if (variant === 'row') {
    return (
      <View style={[styles.rowWrap, style]}>
        <ShimmerBar style={styles.rowCircle} />
        <View style={styles.rowLines}>
          <ShimmerBar style={styles.lineWide} />
          <ShimmerBar style={styles.lineNarrow} />
        </View>
      </View>
    );
  }
  if (variant === 'chart') {
    return <ShimmerBar style={[styles.chart, style]} />;
  }
  return (
    <View style={[styles.card, style]}>
      <ShimmerBar style={styles.lineWide} />
      <ShimmerBar style={[styles.lineNarrow, { marginTop: 8 }]} />
      <ShimmerBar style={[styles.lineWide, { marginTop: 16, height: 60 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: Colors.borderSubtle, borderRadius: Radius.sm },
  card: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: 16, gap: 8 },
  rowWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  rowCircle: { width: 40, height: 40, borderRadius: 20 },
  rowLines: { flex: 1, gap: 6 },
  lineWide: { height: 14, width: '85%' },
  lineNarrow: { height: 10, width: '55%' },
  chart: { height: 140, width: '100%' },
});
