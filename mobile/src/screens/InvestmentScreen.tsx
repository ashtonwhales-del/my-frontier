import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { colors, spacing, radius, shadow } from '../theme';
import StepProgressBar from '../components/StepProgressBar';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Investment'>;
  route: RouteProp<RootStackParamList, 'Investment'>;
};

type Path = 'choose' | 'decide' | 'manual';

function safeFloat(s: string): number {
  const v = parseFloat(s.replace(/[^0-9.]/g, ''));
  return isNaN(v) || v < 0 ? 0 : v;
}

function safeInt(s: string): number {
  const v = parseInt(s.replace(/[^0-9]/g, ''), 10);
  return isNaN(v) ? 0 : v;
}

function calcSuggestion(age: number, annualIncome: number) {
  if (age < 18 || age > 100 || annualIncome <= 0) return null;
  const equityPct = Math.max(30, 110 - age);
  const savingsRate = 0.125;
  const weeklyRaw = (annualIncome * savingsRate) / 52;
  return {
    equityPct,
    weekly: Math.round(weeklyRaw * 100) / 100,
    weeklyDisplay: weeklyRaw.toFixed(2),
    monthly: Math.round((annualIncome * savingsRate) / 12),
  };
}

function CurrencyInput({
  label,
  hint,
  value,
  onChangeText,
  optional,
}: {
  label: string;
  hint: string;
  value: string;
  onChangeText: (v: string) => void;
  optional?: boolean;
}) {
  return (
    <View style={inputStyles.wrapper}>
      <Text style={inputStyles.label}>
        {label}
        {optional ? <Text style={inputStyles.optional}> (optional)</Text> : null}
      </Text>
      <Text style={inputStyles.hint}>{hint}</Text>
      <View style={inputStyles.row}>
        <Text style={inputStyles.prefix}>$</Text>
        <TextInput
          style={inputStyles.field}
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          value={value}
          onChangeText={v => onChangeText(v.replace(/[^0-9.]/g, ''))}
          returnKeyType="done"
        />
      </View>
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  label: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  optional: { fontSize: 13, fontWeight: '400', color: colors.textMuted },
  hint: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm, lineHeight: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
  },
  prefix: { fontSize: 18, color: colors.textSecondary, marginRight: 4, fontWeight: '600' },
  field: { flex: 1, fontSize: 22, fontWeight: '700', color: colors.textPrimary, paddingVertical: 14 },
});

export default function InvestmentScreen({ navigation, route }: Props) {
  const { name, categories, riskTolerance } = route.params;
  const [path, setPath] = useState<Path>('choose');

  // PATH A — "Help Me Decide" state
  const [decideAge, setDecideAge] = useState('');
  const [decideIncome, setDecideIncome] = useState('');
  const [decideLump, setDecideLump] = useState('');

  // PATH B — "I Know My Amount" state
  const [manualLump, setManualLump] = useState('');
  const [manualWeekly, setManualWeekly] = useState('');
  const [manualAge, setManualAge] = useState('');

  const parsedDecideAge = safeInt(decideAge);
  const parsedDecideIncome = safeFloat(decideIncome);
  const suggestion =
    parsedDecideAge >= 18 && parsedDecideAge <= 100 && parsedDecideIncome > 0
      ? calcSuggestion(parsedDecideAge, parsedDecideIncome)
      : null;

  function navigateToResults(lumpSum: number, weeklyContribution: number, age: number) {
    navigation.navigate('Results', {
      data: { name, categories, riskTolerance, lumpSum, weeklyContribution, age },
    });
  }

  function handleDecideContinue() {
    const age = parsedDecideAge;
    const weekly = suggestion ? safeFloat(suggestion.weeklyDisplay) : 0;
    const lump = safeFloat(decideLump);
    navigateToResults(lump, weekly, age);
  }

  function handleManualContinue() {
    navigateToResults(
      safeFloat(manualLump),
      safeFloat(manualWeekly),
      safeInt(manualAge),
    );
  }

  const manualAge_n = safeInt(manualAge);
  const manualCanContinue =
    manualAge !== '' && manualAge_n >= 18 && manualAge_n <= 100 &&
    (manualLump !== '' || manualWeekly !== '');

  const decideCanContinue =
    parsedDecideAge >= 18 && parsedDecideAge <= 100;

  // Header shared across all paths
  function Header() {
    return (
      <>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => path === 'choose' ? navigation.goBack() : setPath('choose')}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <StepProgressBar currentStep={3} totalSteps={4} labels={['Categories', 'Risk Level', 'Investment', 'Results']} />
      </>
    );
  }

  // ── PATH CHOOSER ────────────────────────────────────────────────────────────
  if (path === 'choose') {
    return (
      <View style={styles.flex}>
        <Header />
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>How do you want to invest?</Text>
          <Text style={styles.subtitle}>
            Choose how you'd like to set your investment amounts.
          </Text>

          <TouchableOpacity style={styles.pathCard} onPress={() => setPath('decide')} activeOpacity={0.8}>
            <Text style={styles.pathCardIcon}>🧮</Text>
            <View style={styles.pathCardText}>
              <Text style={styles.pathCardTitle}>Help Me Decide</Text>
              <Text style={styles.pathCardDesc}>
                Tell us your age and income — we'll recommend a savings target following the same guidelines financial advisors use.
              </Text>
            </View>
            <Text style={styles.pathCardArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pathCard} onPress={() => setPath('manual')} activeOpacity={0.8}>
            <Text style={styles.pathCardIcon}>✏️</Text>
            <View style={styles.pathCardText}>
              <Text style={styles.pathCardTitle}>I Know My Amount</Text>
              <Text style={styles.pathCardDesc}>
                Enter your lump sum and weekly contribution directly.
              </Text>
            </View>
            <Text style={styles.pathCardArrow}>→</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            This is not financial advice. We use publicly known guidelines to suggest amounts. Consult a licensed financial advisor before investing.
          </Text>
        </ScrollView>
      </View>
    );
  }

  // ── PATH A: HELP ME DECIDE ──────────────────────────────────────────────────
  if (path === 'decide') {
    return (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Header />
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Help Me Decide</Text>
          <Text style={styles.subtitle}>
            We'll calculate a savings target based on your age and income using standard financial planning guidelines.
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              We use the "110 minus your age" rule for equity allocation and a 12.5% savings rate — the same guidelines financial advisors typically use. This is not financial advice and does not account for your full financial picture.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={inputStyles.wrapper}>
              <Text style={inputStyles.label}>Your Age</Text>
              <Text style={inputStyles.hint}>Used to calculate how much equity vs. bonds to hold</Text>
              <TextInput
                style={styles.ageInput}
                placeholder="e.g. 28"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                value={decideAge}
                onChangeText={v => setDecideAge(v.replace(/[^0-9]/g, ''))}
                returnKeyType="done"
                maxLength={3}
              />
              {decideAge !== '' && (parsedDecideAge < 18 || parsedDecideAge > 100) && (
                <Text style={styles.ageError}>Age must be between 18 and 100</Text>
              )}
            </View>

            <View style={inputStyles.wrapper}>
              <Text style={inputStyles.label}>
                Annual Income <Text style={inputStyles.optional}>(recommended)</Text>
              </Text>
              <Text style={inputStyles.hint}>
                We'll calculate 12.5% of this as your suggested savings — a standard guideline to build real wealth without overcommitting
              </Text>
              <View style={inputStyles.row}>
                <Text style={inputStyles.prefix}>$</Text>
                <TextInput
                  style={inputStyles.field}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={decideIncome}
                  onChangeText={v => setDecideIncome(v.replace(/[^0-9.]/g, ''))}
                  returnKeyType="done"
                />
              </View>
            </View>

            <CurrencyInput
              label="One-time Starting Amount"
              hint="Money you want to invest right now as a lump sum (leave at 0 if none)"
              value={decideLump}
              onChangeText={setDecideLump}
              optional
            />
          </View>

          {suggestion && (
            <View style={styles.suggestionCard}>
              <View style={styles.suggestionHeader}>
                <Text style={styles.suggestionTitle}>Your suggested target</Text>
                <View style={styles.equityBadge}>
                  <Text style={styles.equityBadgeText}>{suggestion.equityPct}% equities</Text>
                </View>
              </View>
              <Text style={styles.suggestionDesc}>
                Based on your age ({parsedDecideAge}) and a 12.5% savings rate:
              </Text>
              <View style={styles.suggestionAmounts}>
                <View style={styles.suggestionAmountItem}>
                  <Text style={styles.suggestionAmountValue}>${suggestion.weeklyDisplay}</Text>
                  <Text style={styles.suggestionAmountLabel}>per week</Text>
                </View>
                <View style={styles.suggestionAmountDivider} />
                <View style={styles.suggestionAmountItem}>
                  <Text style={styles.suggestionAmountValue}>${suggestion.monthly}</Text>
                  <Text style={styles.suggestionAmountLabel}>per month</Text>
                </View>
              </View>
              <Text style={styles.equitySplit}>
                Suggested split: {suggestion.equityPct}% stocks / {100 - suggestion.equityPct}% bonds
              </Text>
            </View>
          )}

          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              ⚡ Optimization takes 30–90 seconds while we download 10 years of market data.
            </Text>
          </View>

          <Text style={styles.disclaimer}>
            This is not financial advice. Past performance does not guarantee future results. Consult a licensed financial advisor before investing.
          </Text>

          <TouchableOpacity
            style={[styles.button, !decideCanContinue && styles.buttonDisabled]}
            onPress={handleDecideContinue}
            disabled={!decideCanContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Optimize My Portfolio →</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── PATH B: I KNOW MY AMOUNT ─────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Header />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Your investment plan</Text>
        <Text style={styles.subtitle}>
          Enter your investment amounts below.
        </Text>

        <View style={styles.card}>
          <CurrencyInput
            label="One-time Starting Amount"
            hint="A lump sum you invest today — money sitting in savings you want to put to work. Enter 0 if not applicable."
            value={manualLump}
            onChangeText={setManualLump}
            optional
          />
          <CurrencyInput
            label="Weekly Contribution"
            hint="What you add every week going forward — even small amounts compound significantly over time."
            value={manualWeekly}
            onChangeText={setManualWeekly}
          />

          <View style={inputStyles.wrapper}>
            <Text style={inputStyles.label}>Your Age</Text>
            <Text style={inputStyles.hint}>Used to calculate retirement projections to age 59.5</Text>
            <TextInput
              style={styles.ageInput}
              placeholder="e.g. 28"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={manualAge}
              onChangeText={v => setManualAge(v.replace(/[^0-9]/g, ''))}
              returnKeyType="done"
              maxLength={3}
            />
            {manualAge !== '' && (manualAge_n < 18 || manualAge_n > 100) && (
              <Text style={styles.ageError}>Age must be between 18 and 100</Text>
            )}
          </View>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            ⚡ Optimization takes 30–90 seconds while we download 10 years of market data.
          </Text>
        </View>

        <Text style={styles.disclaimer}>
          This is not financial advice. Past performance does not guarantee future results. Consult a licensed financial advisor before investing.
        </Text>

        <TouchableOpacity
          style={[styles.button, !manualCanContinue && styles.buttonDisabled]}
          onPress={handleManualContinue}
          disabled={!manualCanContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Optimize My Portfolio →</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
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
  container: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 22 },
  pathCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pathCardIcon: { fontSize: 32, marginRight: spacing.md },
  pathCardText: { flex: 1 },
  pathCardTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  pathCardDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  pathCardArrow: { fontSize: 20, color: colors.primary, marginLeft: spacing.sm },
  infoBox: {
    backgroundColor: '#3B82F615',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  infoText: { fontSize: 13, color: '#312E81', lineHeight: 19 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  ageInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    backgroundColor: colors.bg,
  },
  ageError: { marginTop: spacing.xs, fontSize: 13, color: colors.danger },
  suggestionCard: {
    backgroundColor: '#EEF9F4',
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  suggestionTitle: { fontSize: 15, fontWeight: '800', color: '#065F46', flex: 1, marginRight: spacing.sm },
  equityBadge: { backgroundColor: '#10B981', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  equityBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  suggestionDesc: { fontSize: 13, color: '#047857', lineHeight: 19, marginBottom: spacing.md },
  suggestionAmounts: {
    flexDirection: 'row',
    backgroundColor: '#D1FAE5',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  suggestionAmountItem: { flex: 1, alignItems: 'center' },
  suggestionAmountValue: { fontSize: 22, fontWeight: '800', color: '#065F46' },
  suggestionAmountLabel: { fontSize: 12, color: '#047857', marginTop: 2 },
  suggestionAmountDivider: { width: 1, height: 36, backgroundColor: '#6EE7B7' },
  equitySplit: { fontSize: 13, color: '#047857', fontWeight: '600', textAlign: 'center' },
  notice: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  noticeText: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  disclaimer: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: spacing.lg,
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
