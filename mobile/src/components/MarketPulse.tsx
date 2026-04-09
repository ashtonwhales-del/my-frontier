import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, shadow } from '../theme';
import { STORAGE } from '../constants';
import { fetchMarketPulse } from '../api';
import { MarketPulseData } from '../types';

const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

function ChangeTag({ value }: { value: number }) {
  const positive = value >= 0;
  const color = positive ? '#06D6A0' : '#EF233C';
  const sign = positive ? '+' : '';
  return (
    <Text style={[styles.tag, { color, backgroundColor: positive ? 'rgba(6,214,160,0.12)' : 'rgba(239,35,60,0.12)' }]}>
      {sign}{value.toFixed(2)}%
    </Text>
  );
}

export default function MarketPulse() {
  const [data, setData] = useState<MarketPulseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    (async () => {
      // Try local cache first (4h TTL)
      const raw = await AsyncStorage.getItem(STORAGE.MARKET_PULSE_CACHE);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Date.now() - cached.ts < CACHE_TTL_MS) {
          setData(cached.data);
          setLoading(false);
          return;
        }
      }
      // Fetch fresh
      try {
        const fresh = await fetchMarketPulse();
        setData(fresh);
        await AsyncStorage.setItem(STORAGE.MARKET_PULSE_CACHE, JSON.stringify({ data: fresh, ts: Date.now() }));
      } catch {
        // silently fail — market pulse is non-critical
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!data) return null;

  const sentimentEmoji = data.sentiment === 'bullish' ? '📈' : data.sentiment === 'bearish' ? '📉' : '➡️';

  return (
    <TouchableOpacity style={styles.card} onPress={() => setExpanded(e => !e)} activeOpacity={0.85}>
      <View style={styles.row}>
        <Text style={styles.sentimentEmoji}>{sentimentEmoji}</Text>
        <View style={styles.msgWrap}>
          <Text style={styles.msg} numberOfLines={expanded ? undefined : 1}>{data.message}</Text>
        </View>
      </View>
      {expanded && (
        <View style={styles.tickerRow}>
          {[
            { label: 'SPY', value: data.spy_change },
            { label: 'QQQ', value: data.qqq_change },
            { label: 'AGG', value: data.agg_change },
          ].map(t => (
            <View key={t.label} style={styles.tickerItem}>
              <Text style={styles.tickerLabel}>{t.label}</Text>
              <ChangeTag value={t.value} />
            </View>
          ))}
        </View>
      )}
      <Text style={styles.hint}>{expanded ? 'Tap to collapse' : 'Tap to expand'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.sm,
    marginBottom: spacing.md,
    width: '100%',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sentimentEmoji: { fontSize: 20, flexShrink: 0 },
  msgWrap: { flex: 1 },
  msg: { fontSize: 13, color: colors.textPrimary, lineHeight: 18 },
  tickerRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  tickerItem: { alignItems: 'center', gap: 4 },
  tickerLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  tag: { fontSize: 12, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  hint: { fontSize: 10, color: colors.textMuted, textAlign: 'right', marginTop: spacing.xs },
});
