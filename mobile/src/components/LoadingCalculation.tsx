import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { showRewardedAd } from './ads/RewardedAd';
import AdBanner from './AdBanner';

// ── Detect native module availability once at module load ─────────────────────
// In Expo Go the native AdMob SDK is unavailable — we fall back to a banner.
// In a dev build or production build the rewarded video runs normally.
let _hasNativeModule = false;
try {
  require('react-native-google-mobile-ads');
  _hasNativeModule = true;
} catch { /* Expo Go — native module not available */ }

const TIPS = [
  'Did you know? Diversification is the only free lunch in investing.',
  'The S&P 500 has recovered from every single crash in history.',
  'Time in the market beats timing the market — every time.',
  'Your portfolio is being optimized using the same math used by institutional investors.',
  'The best investment you can make is in a diversified portfolio you\'ll actually hold.',
  'Compound interest is the eighth wonder of the world.',
];

type AdPhase = 'idle' | 'prompt' | 'rewarded';

export default function LoadingCalculation() {
  const [tipIndex, setTipIndex] = useState(0);
  const [adPhase, setAdPhase] = useState<AdPhase>('idle');
  const [showWarmup, setShowWarmup] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const warmupAnim = useRef(new Animated.Value(0)).current;

  // Spinner animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Rotating tip messages
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setTipIndex(i => (i + 1) % TIPS.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Warm-up message: show after 8s in case server is cold-starting
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWarmup(true);
      Animated.timing(warmupAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, 8000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Rewarded ad: trigger at 3-second mark
  useEffect(() => {
    const timer = setTimeout(() => {
      setAdPhase('prompt');
      if (_hasNativeModule) {
        // Real device / dev build — show rewarded video ad
        showRewardedAd(() => {
          setAdPhase('rewarded');
        });
      }
      // Expo Go: adPhase stays 'prompt' and we render the banner fallback below
    }, 3000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Dual-ring spinner */}
        <Animated.View style={[styles.spinnerOuter, { transform: [{ rotate: spin }] }]}>
          <View style={styles.spinnerInner} />
        </Animated.View>

        <Text style={styles.title}>Building your portfolio…</Text>
        <Text style={styles.subtitle}>Analyzing 10 years of market data</Text>

        {/* Cold-start warm-up notice — appears after 8s */}
        {showWarmup && (
          <Animated.Text style={[styles.warmupText, { opacity: warmupAnim }]}>
            ☕ Waking up the server… first load may take 30s
          </Animated.Text>
        )}

        {/* Rotating tip card */}
        <Animated.View style={[styles.tipCard, { opacity: fadeAnim }]}>
          <Text style={styles.tipLabel}>💡 DID YOU KNOW</Text>
          <Text style={styles.tipText}>{TIPS[tipIndex]}</Text>
        </Animated.View>

        {/* Animated progress dots */}
        <DotsIndicator />
      </View>

      {/* Bottom ad zone — rewarded video on device, banner fallback in Expo Go */}
      <AdZone phase={adPhase} hasNative={_hasNativeModule} />
    </View>
  );
}

// ── AdZone — swaps between rewarded prompt, thank-you, and banner fallback ────
function AdZone({ phase, hasNative }: { phase: AdPhase; hasNative: boolean }) {
  if (phase === 'idle') return null;

  if (phase === 'rewarded') {
    return (
      <View style={styles.adZone}>
        <Text style={styles.rewardedThanks}>✅ Thanks for supporting us! 🎉</Text>
        <Text style={styles.rewardedSub}>You help keep My Frontier free for everyone.</Text>
      </View>
    );
  }

  // phase === 'prompt'
  if (hasNative) {
    // Native build: rewarded video is being shown (full-screen AdMob overlay).
    // This message appears briefly before the overlay takes over.
    return (
      <View style={styles.adZone}>
        <Text style={styles.rewardedPrompt}>
          📺 Watch a short video to support My Frontier — it keeps the app free!
        </Text>
      </View>
    );
  }

  // Expo Go fallback: no native module, show banner instead
  return (
    <View style={styles.adZoneBanner}>
      <AdBanner placement="banner" />
    </View>
  );
}

// ── Animated progress dots ────────────────────────────────────────────────────
function DotsIndicator() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % 4), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={styles.dotsRow}>
      {[0, 1, 2].map(i => (
        <View key={i} style={[styles.dot, i < step && styles.dotActive]} />
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
    marginBottom: 8,
  },
  warmupText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.38)',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
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
  // Ad zone styles
  adZone: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  adZoneBanner: {
    paddingBottom: 24,
    paddingTop: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  rewardedPrompt: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 19,
  },
  rewardedThanks: {
    fontSize: 16,
    fontWeight: '700',
    color: '#06D6A0',
    textAlign: 'center',
    marginBottom: 4,
  },
  rewardedSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
});
