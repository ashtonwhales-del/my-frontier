import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { colors, spacing, radius, shadow } from '../../theme';
import { HoldingResult } from '../../types';
import { ETF_DESCRIPTIONS } from './ETFDescriptions';

interface Props {
  holding: HoldingResult | null;
  lumpSum: number;
  onClose: () => void;
}

function ArcWeight({ weight }: { weight: number }) {
  const pct = Math.round(weight * 100);
  const color = weight >= 0.08 ? '#06D6A0' : weight >= 0.05 ? '#4361EE' : '#FFB703';
  return (
    <View style={arc.container}>
      <View style={[arc.bar, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
      <Text style={[arc.label, { color }]}>{pct}%</Text>
    </View>
  );
}

export default function ETFDetailModal({ holding, lumpSum, onClose }: Props) {
  if (!holding) return null;

  const description = ETF_DESCRIPTIONS[holding.ticker] ?? holding.description;
  const dollarAmount = lumpSum > 0 ? holding.lump_sum_amount : null;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.ticker}>{holding.ticker}</Text>
              <Text style={styles.name} numberOfLines={2}>{holding.name}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Weight arc */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Your Allocation</Text>
              <ArcWeight weight={holding.weight} />
              {dollarAmount !== null && (
                <Text style={styles.dollarNote}>${Math.round(dollarAmount).toLocaleString()} of your lump sum</Text>
              )}
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>What It Owns</Text>
              <Text style={styles.bodyText}>{description}</Text>
            </View>

            {/* Top Holdings */}
            {holding.top_holdings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Top Holdings</Text>
                {holding.top_holdings.map((h, i) => (
                  <View key={i} style={styles.holdingRow}>
                    <Text style={styles.holdingDot}>•</Text>
                    <Text style={styles.holdingName}>{h}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Hist. Return</Text>
                <Text style={styles.statValue}>{holding.historical_annual_return_pct.toFixed(1)}%/yr</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Weight</Text>
                <Text style={styles.statValue}>{(holding.weight * 100).toFixed(1)}%</Text>
              </View>
              {holding.weekly_amount > 0 && (
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Weekly</Text>
                  <Text style={styles.statValue}>${holding.weekly_amount.toFixed(0)}</Text>
                </View>
              )}
            </View>

            <Text style={styles.disclaimer}>Not financial advice. ETF data from Yahoo Finance.</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    ...shadow.md,
  },
  handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginTop: spacing.sm, marginBottom: spacing.xs },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  ticker: { fontSize: 28, fontWeight: '900', color: colors.primary },
  name: { fontSize: 14, color: colors.textSecondary, maxWidth: 260, lineHeight: 19 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 15, color: colors.textSecondary, fontWeight: '700' },
  body: { paddingHorizontal: spacing.lg, paddingBottom: 48, gap: spacing.lg },
  section: { gap: spacing.xs },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  bodyText: { fontSize: 14, color: colors.textPrimary, lineHeight: 21 },
  holdingRow: { flexDirection: 'row', gap: spacing.xs },
  holdingDot: { color: colors.primary, fontWeight: '900' },
  holdingName: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  dollarNote: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statBox: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  disclaimer: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
});

const arc = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  bar: { height: 8, borderRadius: 4, flex: 1 },
  label: { fontSize: 14, fontWeight: '800', minWidth: 36, textAlign: 'right' },
});
