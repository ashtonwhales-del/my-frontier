import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { colors, spacing, radius, shadow } from '../theme';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Onboarding'>;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  { id: 0 },
  { id: 1 },
  { id: 2 },
];

async function completeOnboarding(navigation: Props['navigation']) {
  try {
    await AsyncStorage.setItem('onboardingComplete', 'true');
  } catch {
    // Storage failure is non-fatal — proceed to Welcome and user can re-onboard next launch
  }
  navigation.replace('Welcome');
}

// Reusable inline logo mark (scaled down)
function LogoMark() {
  return (
    <View style={logo.mark}>
      <View style={logo.skyUpper} />
      <View style={logo.skyLower} />
      <View style={[logo.star, { top: 14, left: 22 }]} />
      <View style={[logo.star, { top: 9, left: 60 }]} />
      <View style={[logo.star, { top: 18, right: 26 }]} />
      <View style={logo.mountainRow}>
        <View style={logo.mtnLeft} />
        <View style={logo.mtnCenter} />
        <View style={logo.mtnRight} />
      </View>
      <View style={logo.horizon} />
      <View style={logo.peakDiamond} />
    </View>
  );
}

const logo = StyleSheet.create({
  mark: {
    width: 120,
    height: 100,
    backgroundColor: '#0F1729',
    borderRadius: radius.xl,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    ...shadow.md,
  },
  skyUpper: { position: 'absolute', top: 0, left: 0, right: 0, height: '62%', backgroundColor: '#0F1729' },
  skyLower: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '38%', backgroundColor: '#16213A' },
  star: { position: 'absolute', width: 3, height: 3, backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 1 },
  mountainRow: {
    position: 'absolute', bottom: 19, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center',
  },
  mtnLeft: {
    width: 0, height: 0, borderStyle: 'solid',
    borderLeftWidth: 26, borderRightWidth: 26, borderBottomWidth: 42,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: '#312E81', marginRight: -10,
  },
  mtnCenter: {
    width: 0, height: 0, borderStyle: 'solid',
    borderLeftWidth: 36, borderRightWidth: 36, borderBottomWidth: 64,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: '#4361EE', zIndex: 2,
  },
  mtnRight: {
    width: 0, height: 0, borderStyle: 'solid',
    borderLeftWidth: 22, borderRightWidth: 22, borderBottomWidth: 36,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: '#3730A3', marginLeft: -10,
  },
  horizon: {
    position: 'absolute', bottom: 17, left: 10, right: 10,
    height: 2, backgroundColor: '#F59E0B', borderRadius: 1,
  },
  peakDiamond: {
    position: 'absolute', top: 14, alignSelf: 'center',
    width: 6, height: 6, backgroundColor: '#F59E0B',
    transform: [{ rotate: '45deg' }],
  },
});

export default function OnboardingScreen({ navigation }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  function goToSlide(index: number) {
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setCurrentSlide(index);
  }

  function handleScroll(e: any) {
    const slide = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentSlide(slide);
  }

  const isLast = currentSlide === SLIDES.length - 1;

  return (
    <View style={styles.screen}>
      {/* Skip button */}
      <TouchableOpacity
        style={styles.skipBtn}
        onPress={() => completeOnboarding(navigation)}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {/* Slide 1 — Welcome */}
        <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
          <LogoMark />
          <Text style={styles.slideTitle}>Welcome to{'\n'}My Frontier</Text>
          <Text style={styles.slideSubtitle}>
            Build a personalized investment portfolio in minutes, using the same Nobel
            Prize-winning optimization theory as professional fund managers.
          </Text>
        </View>

        {/* Slide 2 — How it works */}
        <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
          <Text style={styles.slideTitleNoTop}>How It Works</Text>
          <Text style={styles.slideSubtitle}>Three simple steps to your portfolio:</Text>
          <View style={styles.stepsContainer}>
            {[
              { num: '1', title: 'Choose your interests', desc: 'Pick the ETF categories that match your goals — tech, clean energy, real estate, and more.' },
              { num: '2', title: 'Set your comfort level', desc: 'Tell us how much risk you\'re comfortable with, from very conservative to very aggressive.' },
              { num: '3', title: 'Get your portfolio', desc: 'We fetch 10 years of real market data and run mean-variance optimization to build your personal allocation.' },
            ].map(step => (
              <View key={step.num} style={styles.stepRow}>
                <View style={styles.stepNumBadge}>
                  <Text style={styles.stepNum}>{step.num}</Text>
                </View>
                <View style={styles.stepBody}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Slide 3 — Privacy */}
        <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
          <Text style={styles.privacyEmoji}>🔒</Text>
          <Text style={styles.slideTitle}>Your Data Stays{'\n'}Private</Text>
          <View style={styles.privacyCard}>
            {[
              { icon: '👤', text: 'No account required. We don\'t know who you are.' },
              { icon: '🚫', text: 'We never sell your data. No tracking, no ads profiling.' },
              { icon: '⚡', text: 'Portfolio calculations happen on our server in real-time and are never stored after your session.' },
              { icon: '📊', text: 'Market data is sourced from Yahoo Finance. Results are for education only.' },
            ].map((item, i) => (
              <View key={i} style={styles.privacyRow}>
                <Text style={styles.privacyIcon}>{item.icon}</Text>
                <Text style={styles.privacyText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Dots indicator */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goToSlide(i)} activeOpacity={0.7}>
            <View style={[styles.dot, i === currentSlide && styles.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom action */}
      <View style={styles.footer}>
        {isLast ? (
          <TouchableOpacity
            style={styles.getStartedBtn}
            onPress={() => completeOnboarding(navigation)}
            activeOpacity={0.8}
          >
            <Text style={styles.getStartedText}>Get Started →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => goToSlide(currentSlide + 1)}
            activeOpacity={0.8}
          >
            <Text style={styles.nextText}>Next →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: spacing.lg,
    zIndex: 10,
    padding: spacing.sm,
  },
  skipText: { fontSize: 15, color: colors.textSecondary, fontWeight: '600' },
  scrollView: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
    paddingBottom: 20,
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    lineHeight: 40,
  },
  slideTitleNoTop: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  slideSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  stepsContainer: { width: '100%', gap: spacing.md },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadow.sm,
  },
  stepNumBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNum: { color: '#fff', fontSize: 16, fontWeight: '800' },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 3 },
  stepDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  privacyEmoji: { fontSize: 56, marginBottom: spacing.md },
  privacyCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.sm,
  },
  privacyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  privacyIcon: { fontSize: 20, width: 28, textAlign: 'center', marginTop: 1 },
  privacyText: { flex: 1, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 48,
  },
  getStartedBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadow.md,
  },
  getStartedText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  nextBtn: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  nextText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
});
