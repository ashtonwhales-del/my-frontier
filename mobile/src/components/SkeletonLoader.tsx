import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

function usePulse() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1.0, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return opacity;
}

// ── Primitive ─────────────────────────────────────────────────────────────────

function SkeletonBlock({ style }: { style?: ViewStyle }) {
  const opacity = usePulse();
  return <Animated.View style={[styles.block, style, { opacity }]} />;
}

// ── Variants ──────────────────────────────────────────────────────────────────

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <SkeletonBlock style={styles.tickerBox} />
        <View style={styles.cardRight}>
          <SkeletonBlock style={styles.nameLine} />
          <SkeletonBlock style={styles.subLine} />
        </View>
        <SkeletonBlock style={styles.weightBox} />
      </View>
      <SkeletonBlock style={styles.descLine} />
    </View>
  );
}

export function SkeletonText({ width = '80%', height = 14 }: { width?: string | number; height?: number }) {
  return <SkeletonBlock style={{ width: width as any, height, borderRadius: 7, marginVertical: 4 }} />;
}

export function SkeletonScore() {
  return (
    <View style={styles.scoreWrap}>
      <SkeletonBlock style={styles.scoreCircle} />
      <SkeletonBlock style={styles.scoreLabel} />
    </View>
  );
}

// ── Full Results skeleton ─────────────────────────────────────────────────────

export function SkeletonResults() {
  return (
    <View style={styles.resultsWrap}>
      {/* Score row */}
      <View style={styles.scoresRow}>
        <SkeletonScore />
        <SkeletonScore />
        <SkeletonScore />
      </View>
      {/* ETF cards */}
      {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: '#C8D0E7',
    borderRadius: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tickerBox: { width: 48, height: 48, borderRadius: 10 },
  cardRight: { flex: 1, gap: 6 },
  nameLine: { height: 14, borderRadius: 7, width: '70%' },
  subLine:  { height: 11, borderRadius: 5, width: '50%' },
  weightBox: { width: 44, height: 44, borderRadius: 22 },
  descLine: { height: 11, borderRadius: 5, width: '90%' },

  scoreWrap: { alignItems: 'center', gap: 8 },
  scoresRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  scoreCircle: { width: 72, height: 72, borderRadius: 36 },
  scoreLabel: { width: 56, height: 11, borderRadius: 5 },

  resultsWrap: { padding: 16 },
});
