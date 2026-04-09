import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, SavedPortfolio } from '../types';
import { colors, spacing, radius, shadow } from '../theme';
import { checkHealth } from '../api';
import { STORAGE } from '../constants';
import { calcFrontierScore } from '../components/PortfolioScoreCard';
import MarketPulse from '../components/MarketPulse';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Welcome'>;
};

function daysSince(ts: number): number {
  return Math.floor((Date.now() - ts) / 86_400_000);
}

function gradeColor(grade: string): string {
  if (grade === 'A') return '#06D6A0';
  if (grade === 'B') return '#4361EE';
  if (grade === 'C') return '#FFB703';
  return '#EF233C';
}

// Shared logo mark component so it isn't duplicated
function LogoMark({ size = 140 }: { size?: number }) {
  const h = Math.round(size * 0.83);
  const mtnScale = size / 140;
  return (
    <View
      style={[
        logoStyles.mark,
        { width: size, height: h, borderRadius: size * 0.17 },
      ]}
    >
      <View style={logoStyles.skyUpper} />
      <View style={logoStyles.skyLower} />
      <View style={[logoStyles.star, { top: 12, left: 18 }]} />
      <View style={[logoStyles.star, { top: 8, left: 52 }]} />
      <View style={[logoStyles.star, { top: 16, right: 22 }]} />
      <View style={logoStyles.mountainRow}>
        <View style={[logoStyles.mtnLeft,   { borderLeftWidth: 30 * mtnScale, borderRightWidth: 30 * mtnScale, borderBottomWidth: 48 * mtnScale, marginRight: -12 * mtnScale }]} />
        <View style={[logoStyles.mtnCenter, { borderLeftWidth: 42 * mtnScale, borderRightWidth: 42 * mtnScale, borderBottomWidth: 74 * mtnScale }]} />
        <View style={[logoStyles.mtnRight,  { borderLeftWidth: 26 * mtnScale, borderRightWidth: 26 * mtnScale, borderBottomWidth: 42 * mtnScale, marginLeft: -12 * mtnScale }]} />
      </View>
      <View style={[logoStyles.horizon, { bottom: 20, left: 12, right: 12 }]} />
      <View style={logoStyles.peakDiamond} />
    </View>
  );
}

const logoStyles = StyleSheet.create({
  mark: {
    backgroundColor: '#0F1729',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    ...shadow.md,
  },
  skyUpper:  { position: 'absolute', top: 0, left: 0, right: 0, height: '62%', backgroundColor: '#0F1729' },
  skyLower:  { position: 'absolute', bottom: 0, left: 0, right: 0, height: '38%', backgroundColor: '#16213A' },
  star:      { position: 'absolute', width: 3, height: 3, backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 0.5 },
  mountainRow: { position: 'absolute', bottom: 22, left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
  mtnLeft:   { width: 0, height: 0, borderStyle: 'solid', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#312E81' },
  mtnCenter: { width: 0, height: 0, borderStyle: 'solid', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#4361EE', zIndex: 2 },
  mtnRight:  { width: 0, height: 0, borderStyle: 'solid', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#3730A3' },
  horizon:   { position: 'absolute', height: 2, backgroundColor: '#F59E0B', borderRadius: 1 },
  peakDiamond: { position: 'absolute', top: 16, alignSelf: 'center', width: 7, height: 7, backgroundColor: '#F59E0B', transform: [{ rotate: '45deg' }] },
});

export default function WelcomeScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [serverReady, setServerReady] = useState<boolean | null>(null);
  const [returningUser, setReturningUser] = useState<{
    name: string;
    lastPortfolio: SavedPortfolio;
  } | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();

    // Check for returning user
    (async () => {
      const [savedName, savedPortfoliosRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE.SAVED_NAME),
        AsyncStorage.getItem(STORAGE.SAVED_PORTFOLIOS),
      ]);
      if (savedName && savedPortfoliosRaw) {
        try {
          const portfolios: SavedPortfolio[] = JSON.parse(savedPortfoliosRaw);
          if (portfolios.length > 0) {
            const latest = portfolios.sort((a, b) => b.createdAt - a.createdAt)[0];
            setReturningUser({ name: savedName, lastPortfolio: latest });
            setName(savedName);
          }
        } catch {}
      } else if (savedName) {
        setName(savedName);
      }
    })();

    // Poll health check
    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval>;
    async function check() {
      const ok = await checkHealth();
      if (!isMounted) return;
      setServerReady(ok);
      if (ok) clearInterval(intervalId);
    }
    check();
    intervalId = setInterval(check, 5000);
    return () => { isMounted = false; clearInterval(intervalId); };
  }, []);

  async function handleBeginJourney() {
    const trimmed = name.trim();
    if (!trimmed) return;
    await AsyncStorage.setItem(STORAGE.SAVED_NAME, trimmed);
    navigation.navigate('Categories', { name: trimmed });
  }

  async function handleRecalculate() {
    if (!returningUser) return;
    const { lastPortfolio, name: savedName } = returningUser;
    // Re-run with same parameters — go straight to Results
    navigation.navigate('Results', { data: lastPortfolio.data });
  }

  function handleStartFresh() {
    setReturningUser(null);
    setName('');
  }

  const canContinue = name.trim().length > 0;

  // ── Returning user view ────────────────────────────────────────────────────
  if (returningUser) {
    const { lastPortfolio, name: savedName } = returningUser;
    const score = calcFrontierScore(lastPortfolio.result);
    const grade = lastPortfolio.result.scores.grade;
    const days = daysSince(lastPortfolio.createdAt);

    return (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {serverReady !== true && (
          <View style={styles.serverBanner}>
            <Text style={styles.serverBannerText}>
              {serverReady === null ? '⟳  Connecting to server…' : '⚠  Server unreachable — check your connection'}
            </Text>
          </View>
        )}
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.hero, { opacity: fadeAnim }]}>
            <LogoMark size={100} />
            <Text style={styles.appName}>
              <Text style={styles.appNameMy}>My </Text>
              <Text style={styles.appNameFrontier}>Frontier</Text>
            </Text>
          </Animated.View>

          <MarketPulse />

          <View style={styles.card}>
            <Text style={styles.welcomeBackTitle}>Welcome back, {savedName}! 👋</Text>
            <Text style={styles.welcomeBackSub}>
              {days === 0 ? "You ran your last portfolio today." : `It's been ${days} day${days !== 1 ? 's' : ''} since your last portfolio.`}
            </Text>

            {/* Last portfolio mini summary */}
            <View style={styles.lastPortfolioBox}>
              <View style={styles.lastPortfolioLeft}>
                <Text style={styles.lpName}>{lastPortfolio.name}</Text>
                <Text style={styles.lpMeta}>{lastPortfolio.result.profile.risk_label}</Text>
              </View>
              <View style={styles.lastPortfolioRight}>
                <Text style={[styles.lpGrade, { color: gradeColor(grade) }]}>{grade}</Text>
                <Text style={styles.lpScore}>{score}/100</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Categories', { name: returningUser.name })} activeOpacity={0.8}>
              <Text style={styles.buttonText}>Build a New Portfolio →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('WealthTracker')} activeOpacity={0.75}>
              <Text style={styles.secondaryBtnText}>📂 My Portfolios</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.recalcBtn} onPress={handleRecalculate} activeOpacity={0.7}>
              <Text style={styles.recalcBtnText}>⚡ Recalculate last portfolio with today's data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.laterBtn} onPress={handleStartFresh} activeOpacity={0.7}>
              <Text style={styles.laterText}>Start as new user</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>For educational purposes only. Not financial advice.</Text>
          <View style={styles.legalRow}>
            <TouchableOpacity onPress={() => navigation.navigate('Privacy')} activeOpacity={0.7}>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.legalSep}>·</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Terms')} activeOpacity={0.7}>
              <Text style={styles.legalLink}>Terms</Text>
            </TouchableOpacity>
            <Text style={styles.legalSep}>·</Text>
            <TouchableOpacity onPress={() => navigation.navigate('About')} activeOpacity={0.7}>
              <Text style={styles.legalLink}>About</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Normal first-time / new-analysis view ─────────────────────────────────
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {serverReady !== true && (
        <View style={styles.serverBanner}>
          <Text style={styles.serverBannerText}>
            {serverReady === null ? '⟳  Connecting to server…' : '⚠  Server unreachable — check your connection'}
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.hero, { opacity: fadeAnim }]}>
          <LogoMark size={140} />
          <Text style={styles.appName}>
            <Text style={styles.appNameMy}>My </Text>
            <Text style={styles.appNameFrontier}>Frontier</Text>
          </Text>
          <Text style={styles.tagline}>
            Built on the same math Wall Street uses —{'\n'}made simple for everyone.
          </Text>
        </Animated.View>

        {/* 3-step explainer */}
        <View style={styles.stepsRow}>
          {[
            { num: '1', label: 'Pick your\ninterests' },
            { num: '2', label: 'We run\nthe math' },
            { num: '3', label: 'Get your\nportfolio' },
          ].map((step, i, arr) => (
            <React.Fragment key={step.num}>
              <View style={styles.stepItem}>
                <View style={styles.stepCircle}>
                  <Text style={styles.stepNum}>{step.num}</Text>
                </View>
                <Text style={styles.stepLabel}>{step.label}</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.stepConnector} />}
            </React.Fragment>
          ))}
        </View>

        <MarketPulse />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Let's get started</Text>
          <Text style={styles.cardSubtitle}>What should we call you?</Text>

          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => canContinue && handleBeginJourney()}
          />

          <TouchableOpacity
            style={[styles.button, !canContinue && styles.buttonDisabled]}
            onPress={handleBeginJourney}
            disabled={!canContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Begin My Journey →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.portfoliosBtn}
            onPress={() => navigation.navigate('WealthTracker')}
            activeOpacity={0.75}
          >
            <Text style={styles.portfoliosBtnText}>📂 My Portfolios</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.portfoliosBtn, { marginTop: spacing.sm, borderColor: '#06D6A0' }]}
            onPress={() => navigation.navigate('Learning')}
            activeOpacity={0.75}
          >
            <Text style={[styles.portfoliosBtnText, { color: '#06D6A0' }]}>📚 Learning Center</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          For educational purposes only. Not financial advice.
        </Text>
        <Text style={styles.socialProof}>Used by investors in 50+ countries</Text>
        <View style={styles.legalRow}>
          <TouchableOpacity onPress={() => navigation.navigate('Privacy')} activeOpacity={0.7}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalSep}>·</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Terms')} activeOpacity={0.7}>
            <Text style={styles.legalLink}>Terms</Text>
          </TouchableOpacity>
          <Text style={styles.legalSep}>·</Text>
          <TouchableOpacity onPress={() => navigation.navigate('About')} activeOpacity={0.7}>
            <Text style={styles.legalLink}>About</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  serverBanner: {
    backgroundColor: '#FFF3CD',
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#FBBF24',
  },
  serverBannerText: { fontSize: 13, color: '#92400E', fontWeight: '500', textAlign: 'center' },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  appName: { fontSize: 38, fontWeight: '800', letterSpacing: -1, marginBottom: 2, marginTop: spacing.md },
  appNameMy: { color: colors.primary },
  appNameFrontier: { color: colors.textPrimary },
  tagline: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 23 },

  // 3-step explainer
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  stepItem: { alignItems: 'center', flex: 1 },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  stepNum: { color: '#fff', fontSize: 15, fontWeight: '800' },
  stepLabel: { fontSize: 11, color: colors.textSecondary, textAlign: 'center', lineHeight: 16 },
  stepConnector: {
    height: 2,
    width: 24,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
    flexShrink: 0,
  },

  card: { width: '100%', backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl, ...shadow.md },
  cardTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  cardSubtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.lg },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    backgroundColor: colors.bg,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    ...shadow.md,
    marginBottom: spacing.sm,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  portfoliosBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  portfoliosBtnText: { color: colors.primary, fontSize: 14, fontWeight: '600' },

  // Returning user styles
  welcomeBackTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  welcomeBackSub: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.md },
  lastPortfolioBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  lastPortfolioLeft: {},
  lpName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  lpMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  lastPortfolioRight: { alignItems: 'center' },
  lpGrade: { fontSize: 24, fontWeight: '900' },
  lpScore: { fontSize: 11, color: colors.textMuted },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  secondaryBtnText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  recalcBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  recalcBtnText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500', textDecorationLine: 'underline' },
  laterBtn: { alignItems: 'center', paddingVertical: spacing.sm, marginTop: spacing.xs },
  laterText: { color: colors.textMuted, fontSize: 13, fontWeight: '400' },

  disclaimer: { marginTop: spacing.xl, fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  socialProof: { marginTop: spacing.sm, fontSize: 12, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic' },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 6,
  },
  legalLink: { fontSize: 12, color: colors.primary, fontWeight: '500' },
  legalSep: { fontSize: 12, color: colors.textMuted },
});
