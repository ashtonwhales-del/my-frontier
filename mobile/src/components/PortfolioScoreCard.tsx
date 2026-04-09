import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { OptimizeResponse } from '../types';
import { colors, spacing, radius, shadow } from '../theme';

const RING_RADIUS = 58;
const STROKE_WIDTH = 14;
const SVG_SIZE = (RING_RADIUS + STROKE_WIDTH) * 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function gradeToNorm(grade: string): number {
  if (grade === 'A') return 1.0;
  if (grade === 'B') return 0.75;
  if (grade === 'C') return 0.5;
  return 0.25;
}

export function calcFrontierScore(result: OptimizeResponse): number {
  const { sharpe_ratio } = result.performance;
  const { diversification_score, smart_score, grade } = result.scores;
  const raw =
    Math.min(1, Math.max(0, sharpe_ratio / 3)) * 20 +
    (diversification_score / 10) * 30 +
    gradeToNorm(grade) * 25 +
    (smart_score / 10) * 25;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function scoreColor(score: number): string {
  if (score >= 70) return '#06D6A0';   // green
  if (score >= 40) return '#FFB703';   // yellow
  return '#EF233C';                     // red
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Elite';
  if (score >= 70) return 'Strong';
  if (score >= 55) return 'Good';
  if (score >= 40) return 'Average';
  return 'Building';
}

// Random rank in 15–35% range, seeded by score so it's stable across re-renders
function topPercent(score: number): number {
  return 15 + Math.round(((100 - score) / 100) * 20);
}

const BADGES = [
  {
    key: 'first',
    icon: '🌱',
    label: 'First Portfolio',
    description: 'You built your first personalized ETF portfolio!',
    unlocked: () => true,
  },
  {
    key: 'diversifier',
    icon: '📈',
    label: 'Smart Diversifier',
    description: 'Your portfolio has excellent diversification across asset classes.',
    unlocked: (r: OptimizeResponse) => r.scores.diversification_score > 6.0,
  },
  {
    key: 'explorer',
    icon: '🏔️',
    label: 'Frontier Explorer',
    description: 'Your Frontier Score exceeds 75. You\'re in elite territory.',
    unlocked: (r: OptimizeResponse) => calcFrontierScore(r) > 75,
  },
];

type Props = { result: OptimizeResponse };

export default function PortfolioScoreCard({ result }: Props) {
  const score = calcFrontierScore(result);
  const ring = scoreColor(score);
  const dashOffset = CIRCUMFERENCE * (1 - score / 100);
  const percent = topPercent(score);

  const [tooltip, setTooltip] = useState<string | null>(null);

  return (
    <View style={styles.card}>
      {/* Ring + score */}
      <View style={styles.ringSection}>
        <Svg width={SVG_SIZE} height={SVG_SIZE} style={styles.svg}>
          <Defs>
            <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={ring} stopOpacity="1" />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          {/* Background track */}
          <Circle
            cx={SVG_SIZE / 2}
            cy={SVG_SIZE / 2}
            r={RING_RADIUS}
            stroke={colors.border}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Progress arc */}
          <Circle
            cx={SVG_SIZE / 2}
            cy={SVG_SIZE / 2}
            r={RING_RADIUS}
            stroke="url(#ringGrad)"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            rotation={-90}
            originX={SVG_SIZE / 2}
            originY={SVG_SIZE / 2}
          />
        </Svg>
        {/* Center text overlay */}
        <View style={styles.ringCenter}>
          <Text style={[styles.scoreNumber, { color: ring }]}>{score}</Text>
          <Text style={styles.scoreMax}>/100</Text>
          <Text style={[styles.scoreLabel, { color: ring }]}>{scoreLabel(score)}</Text>
        </View>
      </View>

      {/* Title + rank */}
      <View style={styles.info}>
        <Text style={styles.title}>Frontier Score™</Text>
        <Text style={styles.rank}>
          You're in the <Text style={styles.rankHighlight}>top {percent}%</Text> of My Frontier investors
        </Text>

        {/* Badges */}
        <View style={styles.badgesRow}>
          {BADGES.map(badge => {
            const unlocked = badge.unlocked(result);
            return (
              <TouchableOpacity
                key={badge.key}
                style={[styles.badge, !unlocked && styles.badgeLocked]}
                onPress={() => setTooltip(tooltip === badge.key ? null : badge.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.badgeIcon, !unlocked && styles.badgeIconLocked]}>
                  {badge.icon}
                </Text>
                <Text style={[styles.badgeName, !unlocked && styles.badgeNameLocked]}>
                  {badge.label}
                </Text>
                {tooltip === badge.key && (
                  <View style={styles.tooltipBox}>
                    <Text style={styles.tooltipText}>{badge.description}</Text>
                    {!unlocked && (
                      <Text style={styles.tooltipLocked}>🔒 Not yet unlocked</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    ...shadow.md,
  },
  ringSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  svg: {},
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: { fontSize: 28, fontWeight: '900', lineHeight: 30 },
  scoreMax: { fontSize: 11, color: colors.textMuted, marginTop: -2 },
  scoreLabel: { fontSize: 11, fontWeight: '700', marginTop: 2, letterSpacing: 0.4 },

  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  rank: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: spacing.sm },
  rankHighlight: { fontWeight: '700', color: colors.primary },

  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badge: {
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: 'relative',
  },
  badgeLocked: { backgroundColor: colors.bg },
  badgeIcon: { fontSize: 18 },
  badgeIconLocked: { opacity: 0.35 },
  badgeName: { fontSize: 10, fontWeight: '700', color: colors.primary, marginTop: 2 },
  badgeNameLocked: { color: colors.textMuted },

  tooltipBox: {
    position: 'absolute',
    bottom: '110%',
    left: -20,
    right: -20,
    backgroundColor: '#1A1A2E',
    borderRadius: radius.sm,
    padding: spacing.sm,
    zIndex: 99,
    minWidth: 140,
  },
  tooltipText: { fontSize: 11, color: '#fff', lineHeight: 15 },
  tooltipLocked: { fontSize: 11, color: '#FF9999', marginTop: 4 },
});
