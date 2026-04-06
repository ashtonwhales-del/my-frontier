import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { colors, spacing, radius, shadow } from '../../theme';
import { HoldingResult } from '../../types';
import { ETF_DESCRIPTIONS } from './ETFDescriptions';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_INNER_WIDTH = SCREEN_WIDTH - 32 * 2 - 16 * 2;

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function HoldingCard({ holding, lumpSum }: { holding: HoldingResult; lumpSum: number }) {
  const [expanded, setExpanded] = useState(false);
  const pct = (holding.weight * 100).toFixed(1);
  const desc = ETF_DESCRIPTIONS[holding.ticker] || holding.description;

  return (
    <TouchableOpacity
      style={holdingStyles.card}
      onPress={() => setExpanded(e => !e)}
      activeOpacity={0.85}
    >
      {/* Collapsed view — always shown */}
      <View style={holdingStyles.collapsedRow}>
        <View style={holdingStyles.tickerBadge}>
          <Text style={holdingStyles.ticker}>{holding.ticker}</Text>
        </View>
        <View style={holdingStyles.collapsedMiddle}>
          <Text style={holdingStyles.weight}>{pct}%</Text>
        </View>
        <View style={holdingStyles.collapsedRight}>
          {lumpSum > 0 && (
            <Text style={holdingStyles.dollarAmount}>${fmt(holding.lump_sum_amount)} <Text style={holdingStyles.est}>(est.)</Text></Text>
          )}
          {holding.weekly_amount > 0 && (
            <Text style={holdingStyles.weeklyAmount}>${fmt(holding.weekly_amount)}/wk <Text style={holdingStyles.est}>(est.)</Text></Text>
          )}
        </View>
        <Text style={holdingStyles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </View>

      {/* Expanded view */}
      {expanded && (
        <View style={holdingStyles.expandedContent}>
          <Text style={holdingStyles.name}>{holding.name}</Text>
          <Text style={holdingStyles.desc}>{desc}</Text>

          {holding.top_holdings.length > 0 && (
            <Text style={holdingStyles.holdings}>
              🏢 {holding.top_holdings.slice(0, 3).join(' · ')}
            </Text>
          )}

          <View style={holdingStyles.allocRow}>
            <View style={holdingStyles.allocItem}>
              <Text style={holdingStyles.allocLabel}>One-time (est.)</Text>
              <Text style={holdingStyles.allocValue}>${fmt(holding.lump_sum_amount)}</Text>
            </View>
            <View style={holdingStyles.allocDivider} />
            <View style={holdingStyles.allocItem}>
              <Text style={holdingStyles.allocLabel}>Weekly (est.)</Text>
              <Text style={holdingStyles.allocValue}>${fmt(holding.weekly_amount)}</Text>
            </View>
            <View style={holdingStyles.allocDivider} />
            <View style={holdingStyles.allocItem}>
              <Text style={holdingStyles.allocLabel}>Hist. Return</Text>
              <Text style={[holdingStyles.allocValue, { color: colors.success }]}>
                +{holding.historical_annual_return_pct.toFixed(1)}%/yr
              </Text>
            </View>
          </View>

          <View style={holdingStyles.barTrack}>
            <View style={[holdingStyles.barFill, { width: CARD_INNER_WIDTH * Math.min(1, holding.weight) }]} />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const holdingStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  collapsedRow: { flexDirection: 'row', alignItems: 'center' },
  tickerBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: spacing.sm,
  },
  ticker: { fontSize: 14, fontWeight: '800', color: colors.primary },
  collapsedMiddle: { flex: 1 },
  weight: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  collapsedRight: { alignItems: 'flex-end', marginRight: spacing.sm },
  dollarAmount: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  weeklyAmount: { fontSize: 11, color: colors.textSecondary },
  est: { fontSize: 10, color: colors.textMuted, fontWeight: '400' },
  chevron: { fontSize: 12, color: colors.textMuted },
  expandedContent: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  name: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  desc: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: spacing.sm },
  holdings: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
  allocRow: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  allocItem: { flex: 1, alignItems: 'center' },
  allocLabel: { fontSize: 10, color: colors.textMuted, marginBottom: 2, textAlign: 'center' },
  allocValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  allocDivider: { width: 1, backgroundColor: colors.border },
  barTrack: { height: 4, backgroundColor: colors.border, borderRadius: 2 },
  barFill: { height: 4, backgroundColor: colors.primary, borderRadius: 2 },
});
