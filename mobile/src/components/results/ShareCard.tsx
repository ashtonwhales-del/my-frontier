/**
 * ShareCard — dark navy portfolio card captured as PNG and shared via iOS Share Sheet.
 * Requires: npx expo install react-native-view-shot
 */
import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { colors, spacing, radius, shadow } from '../../theme';
import { OptimizeResponse } from '../../types';
import { buildShareText } from './pdfExport';

// Try to import ViewShot — gracefully skip if not installed
let ViewShot: any = null;
try { ViewShot = require('react-native-view-shot').default; } catch {}

function gradeColor(g: string): string {
  return g === 'A' ? '#06D6A0' : g === 'B' ? '#4361EE' : g === 'C' ? '#FFB703' : '#EF233C';
}

interface Props {
  result: OptimizeResponse;
}

function CardContent({ result }: Props) {
  const { scores, performance, profile, holdings } = result;
  const gc = gradeColor(scores.grade);
  const topThree = holdings.slice(0, 3);

  return (
    <View style={card.root}>
      {/* Header */}
      <View style={card.header}>
        <Text style={card.brand}>My Frontier</Text>
        <Text style={card.tagline}>Efficient Frontier Portfolio</Text>
      </View>

      {/* Grade hero */}
      <View style={card.gradeRow}>
        <View style={[card.gradeCircle, { borderColor: gc }]}>
          <Text style={[card.gradeLetter, { color: gc }]}>{scores.grade}</Text>
        </View>
        <View>
          <Text style={card.scoreVal}>{scores.smart_score.toFixed(1)}/10 Smart Score</Text>
          <Text style={card.riskLabel}>{profile.risk_label}</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={card.statsRow}>
        {[
          { label: 'Expected Return', value: `${(performance.expected_annual_return * 100).toFixed(1)}%/yr` },
          { label: 'Risk (Vol)', value: `${(performance.annual_volatility * 100).toFixed(1)}%` },
          { label: 'Diversification', value: `${scores.diversification_score.toFixed(1)}/10` },
        ].map(s => (
          <View key={s.label} style={card.statItem}>
            <Text style={card.statVal}>{s.value}</Text>
            <Text style={card.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Top 3 ETFs */}
      <View style={card.holdingsSection}>
        <Text style={card.holdingsTitle}>Top Holdings</Text>
        {topThree.map(h => (
          <View key={h.ticker} style={card.holdingRow}>
            <Text style={card.holdingTicker}>{h.ticker}</Text>
            <View style={card.holdingBarWrap}>
              <View style={[card.holdingBar, { width: `${Math.min(h.weight * 100 * 10, 100)}%` }]} />
            </View>
            <Text style={card.holdingPct}>{(h.weight * 100).toFixed(1)}%</Text>
          </View>
        ))}
      </View>

      {/* Watermark */}
      <Text style={card.watermark}>Built with My Frontier · myfrontierapp.com</Text>
      <Text style={card.disclaimer}>For educational purposes only. Not financial advice.</Text>
    </View>
  );
}

export default function ShareCard({ result }: Props) {
  const ref = useRef<any>(null);

  async function handleShare() {
    if (ViewShot && ref.current) {
      try {
        const uri: string = await ref.current.capture();
        await Share.share({ url: uri, message: buildShareText(result) });
        return;
      } catch {
        // fall through to text share
      }
    }
    // Fallback: text-only share
    try {
      await Share.share({ message: buildShareText(result) });
    } catch (e: any) {
      Alert.alert('Share failed', e?.message ?? 'Could not share portfolio.');
    }
  }

  return (
    <>
      {ViewShot ? (
        <ViewShot ref={ref} options={{ format: 'png', quality: 0.95 }}>
          <CardContent result={result} />
        </ViewShot>
      ) : (
        <CardContent result={result} />
      )}
      <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
        <Text style={styles.shareBtnText}>↑ Share Portfolio Card</Text>
      </TouchableOpacity>
    </>
  );
}

const card = StyleSheet.create({
  root: { backgroundColor: '#0F1729', borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  header: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: spacing.sm },
  brand: { fontSize: 18, fontWeight: '900', color: '#4361EE' },
  tagline: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  gradeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  gradeCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  gradeLetter: { fontSize: 26, fontWeight: '900' },
  scoreVal: { fontSize: 14, fontWeight: '800', color: '#fff' },
  riskLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 14, fontWeight: '900', color: '#06D6A0' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  holdingsSection: { gap: 6 },
  holdingsTitle: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.6 },
  holdingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  holdingTicker: { fontSize: 12, fontWeight: '800', color: '#fff', width: 42 },
  holdingBarWrap: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  holdingBar: { height: 6, backgroundColor: '#4361EE', borderRadius: 3 },
  holdingPct: { fontSize: 12, color: 'rgba(255,255,255,0.7)', width: 36, textAlign: 'right' },
  watermark: { fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },
  disclaimer: { fontSize: 9, color: 'rgba(255,255,255,0.2)', textAlign: 'center' },
});

const styles = StyleSheet.create({
  shareBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadow.md,
  },
  shareBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
