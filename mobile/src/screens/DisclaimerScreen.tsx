import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  BackHandler,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { colors, spacing, radius, shadow } from '../theme';
import { STORAGE } from '../constants';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Disclaimer'>;
};

export default function DisclaimerScreen({ navigation }: Props) {
  // Block Android hardware back button — this screen cannot be dismissed
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, []),
  );

  async function requestNotificationPermission() {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }
      const { status } = await Notifications.requestPermissionsAsync();
      await AsyncStorage.setItem(STORAGE.NOTIFICATION_PREF, status);

      if (status === 'granted') {
        // Weekly reminder
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Your My Frontier portfolio is waiting',
            body: 'Markets moved this week. Time to check your plan?',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: 2, // Monday
            hour: 9,
            minute: 0,
          },
        });
        // 24-hour motivational notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Keep investing — it compounds! 📈',
            body: 'Did you know? Investors who review their portfolio monthly earn 23% more on average.',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 24 * 60 * 60,
            repeats: false,
          },
        });
      }
    } catch {
      // Notifications are non-critical — fail silently
    }
  }

  async function handleAccept() {
    await AsyncStorage.setItem(STORAGE.DISCLAIMER_ACCEPTED, 'true');
    await requestNotificationPermission();
    let onboardingComplete: string | null = null;
    try {
      const raw = await AsyncStorage.getItem(STORAGE.ONBOARDING_COMPLETE);
      // Validate — only accept the exact expected value; clear anything corrupted
      if (raw === 'true') {
        onboardingComplete = raw;
      } else if (raw !== null) {
        await AsyncStorage.removeItem(STORAGE.ONBOARDING_COMPLETE);
      }
    } catch {
      onboardingComplete = null;
    }
    navigation.replace(onboardingComplete ? 'Welcome' : 'Onboarding');
  }

  function handleExit() {
    BackHandler.exitApp(); // Android only; iOS has no programmatic exit
  }

  return (
    <View style={styles.screen}>
      {/* Logo mark */}
      <View style={styles.logoWrap}>
        <View style={styles.logoMark}>
          <View style={styles.skyUpper} />
          <View style={styles.skyLower} />
          <View style={[styles.star, { top: 10, left: 16 }]} />
          <View style={[styles.star, { top: 6, left: 46 }]} />
          <View style={[styles.star, { top: 14, right: 18 }]} />
          <View style={styles.mountainRow}>
            <View style={styles.mtnLeft} />
            <View style={styles.mtnCenter} />
            <View style={styles.mtnRight} />
          </View>
          <View style={styles.horizon} />
          <View style={styles.peakDiamond} />
        </View>
        <Text style={styles.logoText}>
          <Text style={{ color: colors.primary }}>My </Text>
          <Text style={{ color: colors.textPrimary }}>Frontier</Text>
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Before You Begin</Text>

        <View style={styles.bodyCard}>
          <Text style={styles.bodyText}>
            <Text style={styles.bold}>This app is for educational purposes only. It is not financial advice.</Text>
            {'\n\n'}
            My Frontier uses historical ETF price data from Yahoo Finance to demonstrate
            portfolio optimization concepts. This data may be delayed, inaccurate, or
            incomplete. Nothing in this app should be interpreted as a recommendation to
            buy or sell any security.
            {'\n\n'}
            <Text style={styles.bold}>Past performance does not guarantee future results.</Text>{' '}
            All portfolio projections and dollar amounts shown are estimates based on
            historical data and mathematical models. Actual results will differ.
            {'\n\n'}
            Investment involves risk, including the possible loss of principal. You should
            consult a licensed financial advisor before making any investment decisions.
            The app's calculations are performed on our server and are not stored or
            sold to third parties.
            {'\n\n'}
            By continuing, you confirm that you understand this app is a learning tool,
            not a licensed investment advisor.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} activeOpacity={0.8}>
          <Text style={styles.acceptText}>I Understand — Continue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exitBtn} onPress={handleExit} activeOpacity={0.7}>
          <Text style={styles.exitText}>Exit</Text>
        </TouchableOpacity>
        <View style={styles.legalRow}>
          <TouchableOpacity onPress={() => navigation.navigate('Privacy')} activeOpacity={0.7}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalSep}>·</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Terms')} activeOpacity={0.7}>
            <Text style={styles.legalLink}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0A0F1E' },
  logoWrap: { alignItems: 'center', paddingTop: 64, paddingBottom: spacing.lg },
  logoMark: {
    width: 80,
    height: 66,
    backgroundColor: '#0F1729',
    borderRadius: radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
    ...shadow.md,
  },
  skyUpper: { position: 'absolute', top: 0, left: 0, right: 0, height: '62%', backgroundColor: '#0F1729' },
  skyLower: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '38%', backgroundColor: '#16213A' },
  star: { position: 'absolute', width: 2, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 },
  mountainRow: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  mtnLeft: {
    width: 0, height: 0, borderStyle: 'solid',
    borderLeftWidth: 17, borderRightWidth: 17, borderBottomWidth: 28,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: '#312E81', marginRight: -7,
  },
  mtnCenter: {
    width: 0, height: 0, borderStyle: 'solid',
    borderLeftWidth: 24, borderRightWidth: 24, borderBottomWidth: 42,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: '#4361EE', zIndex: 2,
  },
  mtnRight: {
    width: 0, height: 0, borderStyle: 'solid',
    borderLeftWidth: 15, borderRightWidth: 15, borderBottomWidth: 24,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: '#3730A3', marginLeft: -7,
  },
  horizon: {
    position: 'absolute', bottom: 11, left: 7, right: 7,
    height: 1.5, backgroundColor: '#F59E0B', borderRadius: 1,
  },
  peakDiamond: {
    position: 'absolute', top: 9, alignSelf: 'center',
    width: 5, height: 5, backgroundColor: '#F59E0B',
    transform: [{ rotate: '45deg' }],
  },
  logoText: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  bodyCard: {
    backgroundColor: '#0F1629',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  bodyText: {
    fontSize: 16,
    color: '#94A3B8',
    lineHeight: 24,
  },
  bold: { fontWeight: '700', color: colors.textPrimary },
  footer: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#0A0F1E',
  },
  acceptBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadow.md,
  },
  acceptText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  exitBtn: {
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  exitText: { color: colors.textMuted, fontSize: 15, fontWeight: '500' },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  legalLink: { fontSize: 12, color: colors.primary, fontWeight: '500' },
  legalSep: { fontSize: 12, color: colors.textMuted },
});
