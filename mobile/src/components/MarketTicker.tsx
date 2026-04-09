/**
 * MarketTicker.tsx — Auto-scrolling ticker tape
 * Shows 17 tickers with price and % change pills.
 * Height 36px, dark bg, auto-scrolls left in a continuous loop.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { TickerQuote, MarketPulseData } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const LOOP_DURATION = 25000; // 25 seconds full loop

function TickerItem({ t }: { t: TickerQuote }) {
  const isUp = t.change_pct >= 0;
  const color = isUp ? '#10B981' : '#EF4444';
  const arrow = isUp ? '+' : '';
  return (
    <View style={styles.item}>
      <Text style={styles.symbol}>{t.symbol}</Text>
      <Text style={styles.price}>${t.price > 1000 ? t.price.toFixed(0) : t.price.toFixed(2)}</Text>
      <View style={[styles.pill, { backgroundColor: `${color}22` }]}>
        <Text style={[styles.pillText, { color }]}>{arrow}{t.change_pct.toFixed(2)}%</Text>
      </View>
    </View>
  );
}

export default function MarketTicker({ pulse }: { pulse: MarketPulseData | null }) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const tickers = pulse?.tickers ?? [];

  useEffect(() => {
    if (!tickers.length) return;
    // Double the content for seamless loop
    const contentWidth = tickers.length * 160;
    scrollX.setValue(0);
    const animation = Animated.loop(
      Animated.timing(scrollX, {
        toValue: -contentWidth,
        duration: LOOP_DURATION,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [tickers.length]);

  if (!tickers.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading markets...</Text>
      </View>
    );
  }

  // Render tickers twice for seamless looping
  const doubled = [...tickers, ...tickers];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.track, { transform: [{ translateX: scrollX }] }]}>
        {doubled.map((t, i) => (
          <TickerItem key={`${t.symbol}-${i}`} t={t} />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 36,
    backgroundColor: '#0A0F1E',
    borderBottomWidth: 1,
    borderBottomColor: '#1E2A45',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loading: {
    color: '#475569',
    fontSize: 11,
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 6,
  },
  symbol: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
  price: {
    color: '#94A3B8',
    fontSize: 11,
  },
  pill: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
