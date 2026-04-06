import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { colors, spacing, radius, shadow } from '../theme';
import StepProgressBar from '../components/StepProgressBar';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'RiskTolerance'>;
  route: RouteProp<RootStackParamList, 'RiskTolerance'>;
};

const RISK_OPTIONS = [
  {
    level: 1,
    label: 'Very Conservative',
    emoji: '🛡️',
    color: '#06D6A0',
    description: 'I want steady, slow growth and hate seeing my money drop even a little.',
    plain: 'Best for: short time horizons or anyone who needs the money within 1–3 years.',
  },
  {
    level: 2,
    label: 'Conservative',
    emoji: '🌿',
    color: '#4ADE80',
    description: 'I prefer small, reliable gains over chasing big returns. Stability first.',
    plain: 'Best for: investors who sleep better knowing their portfolio rarely dips more than 10%.',
  },
  {
    level: 3,
    label: 'Moderate',
    emoji: '⚖️',
    color: '#FFB703',
    description: 'I can handle some ups and downs if it means better growth over time.',
    plain: 'Best for: most investors with a 5–10 year horizon who want balanced growth.',
  },
  {
    level: 4,
    label: 'Aggressive',
    emoji: '🔥',
    color: '#FB923C',
    description: "I'm okay with big swings if it means bigger gains long-term.",
    plain: 'Best for: investors with 10+ years ahead who won\'t panic-sell in a downturn.',
  },
  {
    level: 5,
    label: 'Very Aggressive',
    emoji: '🚀',
    color: '#EF233C',
    description: "Maximum growth potential. I won't panic when markets drop hard.",
    plain: 'Best for: young investors with 15+ years and high conviction in long-term markets.',
  },
];

export default function RiskToleranceScreen({ navigation, route }: Props) {
  const { name, categories } = route.params;
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
      <StepProgressBar currentStep={2} totalSteps={4} labels={['Categories', 'Risk Level', 'Investment', 'Results']} />

      <Text style={styles.title}>How do you handle risk?</Text>
      <Text style={styles.subtitle}>
        Your comfort level shapes the entire portfolio.
      </Text>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {RISK_OPTIONS.map(opt => {
          const isSelected = selected === opt.level;
          return (
            <TouchableOpacity
              key={opt.level}
              style={[styles.card, isSelected && { borderColor: opt.color, borderWidth: 2.5 }]}
              onPress={() => setSelected(opt.level)}
              activeOpacity={0.75}
            >
              {/* Always-visible color strip on left edge */}
              <View style={[styles.colorStrip, { backgroundColor: opt.color }]} />

              <View style={[styles.badge, { backgroundColor: opt.color + '22' }]}>
                <Text style={styles.badgeEmoji}>{opt.emoji}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardLabel, isSelected && { color: opt.color }]}>
                  {opt.label}
                </Text>
                <Text style={styles.cardDesc}>{opt.description}</Text>
                <Text style={styles.cardPlain}>{opt.plain}</Text>
              </View>
              <View style={[styles.radio, isSelected && { borderColor: opt.color }]}>
                {isSelected && <View style={[styles.radioDot, { backgroundColor: opt.color }]} />}
              </View>
            </TouchableOpacity>
          );
        })}
        <Text style={styles.changeNote}>You can change your risk preference any time.</Text>
        <View style={{ height: spacing.xl }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !selected && styles.buttonDisabled]}
          onPress={() =>
            navigation.navigate('Investment', {
              name,
              categories,
              riskTolerance: selected!,
            })
          }
          disabled={!selected}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {selected
              ? `Continue as ${RISK_OPTIONS[selected - 1].label} →`
              : 'Choose a risk level'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.md,
  },
  backBtn: { padding: spacing.xs },
  backText: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.sm,
  },
  colorStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  badgeEmoji: { fontSize: 22 },
  cardBody: { flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  cardDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 4 },
  cardPlain: { fontSize: 11, color: colors.textMuted, lineHeight: 16 },
  changeNote: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.bg,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadow.md,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
