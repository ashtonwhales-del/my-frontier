import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import AdBanner from './AdBanner';

const TIPS = [
  'Did you know? Diversification is the only free lunch in investing.',
  'The S&P 500 has recovered from every single crash in history.',
  'Time in the market beats timing the market — every time.',
  'Your portfolio is being optimized using the same math used by institutional investors.',
  'The best investment you can make is in a diversified portfolio you\'ll actually hold.',
  'Compound interest is the eighth wonder of the world.',
];

export default function LoadingCalculation() {
  const [tipIndex, setTipIndex] = useState(0);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setTipIndex(i => (i + 1) % TIPS.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Spinner */}
        <Animated.View style={[styles.spinnerOuter, { transform: [{ rotate: spin }] }]}>
          <View style={styles.spinnerInner} />
        </Animated.View>

        <Text style={styles.title}>Building your portfolio…</Text>
        <Text style={styles.subtitle}>Analyzing 10 years of market data</Text>

        {/* Rotating tip */}
        <Animated.View style={[styles.tipCard, { opacity: fadeAnim }]}>
          <Text style={styles.tipLabel}>💡 DID YOU KNOW</Text>
          <Text style={styles.tipText}>{TIPS[tipIndex]}</Text>
        </Animated.View>

        {/* Animated dots */}
        <DotsIndicator />
      </View>

      {/* Banner ad — unobtrusive, user is already waiting */}
      <View style={styles.adContainer}>
        <AdBanner placement="banner" />
      </View>
    </View>
  );
}

function DotsIndicator() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % 4), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={styles.dotsRow}>
      {[0, 1, 2].map(i => (
        <View
          key={i}
          style={[styles.dot, i < step && styles.dotActive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1729',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  spinnerOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#4361EE',
    borderTopColor: 'transparent',
    marginBottom: 28,
  },
  spinnerInner: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#7209B7',
    borderTopColor: 'transparent',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginBottom: 36,
  },
  tipCard: {
    backgroundColor: 'rgba(67,97,238,0.18)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(67,97,238,0.35)',
    padding: 20,
    width: '100%',
    marginBottom: 28,
  },
  tipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4361EE',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 21,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    backgroundColor: '#4361EE',
  },
  adContainer: {
    paddingBottom: 24,
    paddingTop: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
});
