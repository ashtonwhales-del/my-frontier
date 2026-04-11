/**
 * NewOnboardingScreen.tsx — 3-slide intro for first launch
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { Colors } from '../theme/colors';
import { Spacing, Radius } from '../theme/spacing';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'NewOnboarding'> };

const SLIDES = [
  { emoji: '📊', title: 'Institutional Math, For Everyone', body: 'The same Efficient Frontier mathematics used by hedge funds — completely free.' },
  { emoji: '💼', title: 'Your Complete Financial Picture', body: 'Budget, debt, goals, housing, and investing — all connected in one place.' },
  { emoji: '🚀', title: 'Start Building Wealth Today', body: '30 lessons. Nobel Prize math. Real tools. No experience required.' },
];

export default function NewOnboardingScreen({ navigation }: Props) {
  const [page, setPage] = useState(0);
  const slide = SLIDES[page];

  const handleNext = async () => {
    if (page < SLIDES.length - 1) { setPage(p => p + 1); return; }
    await AsyncStorage.setItem('newOnboardingComplete', 'true');
    navigation.replace('Welcome');
  };

  return (
    <View style={s.root}>
      <View style={s.content}>
        <Text style={s.emoji}>{slide.emoji}</Text>
        <Text style={s.title}>{slide.title}</Text>
        <Text style={s.body}>{slide.body}</Text>
      </View>
      <View style={s.footer}>
        <View style={s.dots}>
          {SLIDES.map((_, i) => <View key={i} style={[s.dot, i === page && s.dotActive]} />)}
        </View>
        <TouchableOpacity style={s.btn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={s.btnText}>{page < SLIDES.length - 1 ? 'Next' : 'Get Started'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgPrimary, justifyContent: 'space-between' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emoji: { fontSize: 80, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 16, letterSpacing: -0.5 },
  body: { fontSize: 17, color: Colors.textSecondary, textAlign: 'center', lineHeight: 26 },
  footer: { alignItems: 'center', paddingBottom: 60, gap: 24 },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.borderSubtle },
  dotActive: { backgroundColor: Colors.brandBlue, width: 24 },
  btn: { backgroundColor: Colors.brandBlue, borderRadius: Radius.xl, paddingVertical: 18, paddingHorizontal: 48 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
