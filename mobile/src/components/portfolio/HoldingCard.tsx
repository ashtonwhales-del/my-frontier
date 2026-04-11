/**
 * HoldingCard.tsx — Yahoo Finance-style holding card with price data
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../../theme';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#14B8A6'];

interface PriceData { price: number; change: number; changePercent: number; history: number[] }
interface Holding { ticker: string; shares: number; avgCost: number }

interface Props {
  holding: Holding;
  priceData?: PriceData;
  index: number;
  totalValue: number;
  onDelete: () => void;
}

export default function HoldingCard({ holding, priceData, index, totalValue, onDelete }: Props) {
  const price = priceData?.price ?? holding.avgCost;
  const chg = priceData?.change ?? 0;
  const chgPct = priceData?.changePercent ?? 0;
  const value = holding.shares * price;
  const costBasis = holding.shares * holding.avgCost;
  const gainLoss = value - costBasis;
  const gainPct = costBasis > 0 ? ((gainLoss / costBasis) * 100) : 0;
  const portfolioPct = totalValue > 0 ? (value / totalValue) * 100 : 0;
  const dotColor = COLORS[index % COLORS.length];
  const isUp = chg >= 0;
  const gainUp = gainLoss >= 0;

  return (
    <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: dotColor }]}>
      <View style={s.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.ticker}>{holding.ticker}</Text>
          <Text style={s.meta}>{holding.shares} shares @ ${holding.avgCost.toFixed(2)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.price}>${price.toFixed(2)}</Text>
          <View style={[s.badge, { backgroundColor: isUp ? '#10B98122' : '#EF444422' }]}>
            <Text style={[s.badgeText, { color: isUp ? '#10B981' : '#EF4444' }]}>
              {isUp ? '+' : ''}{chg.toFixed(2)} ({chgPct.toFixed(1)}%)
            </Text>
          </View>
        </View>
      </View>
      <View style={s.bottomRow}>
        <Text style={s.value}>Value: ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
        <Text style={[s.gain, { color: gainUp ? '#10B981' : '#EF4444' }]}>
          {gainUp ? '+' : ''}{gainLoss.toFixed(0)} ({gainPct.toFixed(1)}%)
        </Text>
      </View>
      <View style={s.barBg}><View style={[s.barFill, { width: `${Math.min(portfolioPct, 100)}%`, backgroundColor: dotColor }]} /></View>
      <TouchableOpacity onPress={onDelete} style={s.deleteBtn}><Text style={s.deleteText}>Remove</Text></TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  ticker: { fontSize: 18, fontWeight: '900', color: colors.textPrimary },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  price: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  badge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  value: { fontSize: 13, color: colors.textSecondary },
  gain: { fontSize: 13, fontWeight: '700' },
  barBg: { height: 3, backgroundColor: colors.border, borderRadius: 2, marginBottom: 8 },
  barFill: { height: 3, borderRadius: 2 },
  deleteBtn: { alignSelf: 'flex-end' },
  deleteText: { fontSize: 11, color: '#EF4444', fontWeight: '600' },
});
