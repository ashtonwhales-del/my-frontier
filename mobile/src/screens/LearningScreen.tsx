import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { colors, spacing, radius, shadow } from '../theme';
import { STORAGE } from '../constants';
import { LESSONS, GAMES, Lesson, Game } from './LearningData';
import AdBanner from '../components/ads/SmartBanner';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Learning'> };

function TierHeader({ label, color }: { label: string; color: string }) {
  return (
    <View style={[sh.tierHeader, { borderLeftColor: color }]}>
      <Text style={[sh.tierLabel, { color }]}>{label}</Text>
    </View>
  );
}

export default function LearningScreen({ navigation }: Props) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [intUnlocked, setIntUnlocked] = useState(false);
  const [advUnlocked, setAdvUnlocked] = useState(false);

  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem(STORAGE.LESSONS_COMPLETE).then(raw => { if (raw) try { setCompleted(JSON.parse(raw)); } catch {} });
    AsyncStorage.getItem('learning_intermediate_unlocked').then(v => setIntUnlocked(v === 'true'));
    AsyncStorage.getItem('learning_advanced_unlocked').then(v => setAdvUnlocked(v === 'true'));
  }, []));

  const unlockTier = async (tier: 'intermediate' | 'advanced') => {
    const key = `learning_${tier}_unlocked`;
    await AsyncStorage.setItem(key, 'true');
    if (tier === 'intermediate') setIntUnlocked(true);
    else setAdvUnlocked(true);
  };

  function handleLessonPress(lesson: Lesson) {
    const pages = lesson.content.split('\n\n').filter(p => p.trim().length > 0);
    navigation.navigate('LessonReader' as any, {
      lessonId: lesson.id, title: lesson.title,
      pages: pages.length > 0 ? pages : [lesson.content], tier: lesson.tier,
    });
  }

  function handleGamePress(game: Game) {
    if (game.id === 'etf_matcher') navigation.navigate('ETFMatcherGame' as any);
    else if (game.id === 'risk_quiz') navigation.navigate('RiskQuizGame' as any);
    else navigation.navigate('Learning' as any);
  }

  const totalLessons = LESSONS.length;
  const doneCount = completed.length;

  return (
    <View style={sh.screen}>
      <View style={sh.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={sh.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={sh.headerCenter}>
          <Text style={sh.headerTitle}>Learning Center</Text>
          <Text style={sh.headerSub}>{doneCount}/{totalLessons} lessons complete</Text>
        </View>
      </View>

      <View style={sh.progressWrap}>
        <View style={[sh.progressBar, { width: `${totalLessons > 0 ? (doneCount / totalLessons) * 100 : 0}%` }]} />
      </View>

      <ScrollView contentContainerStyle={sh.content} showsVerticalScrollIndicator={false}>
        <TierHeader label="Beginner" color="#06D6A0" />
        {LESSONS.filter(l => l.tier === 'beginner').map(lesson => {
          const done = completed.includes(lesson.id);
          return (
            <TouchableOpacity key={lesson.id} style={[sh.card, done && sh.cardDone]} onPress={() => handleLessonPress(lesson)} activeOpacity={0.85}>
              <Text style={sh.lessonEmoji}>{lesson.emoji}</Text>
              <Text style={sh.lessonTitle}>{lesson.title}</Text>
              {done && <Text style={sh.doneCheck}>✓</Text>}
            </TouchableOpacity>
          );
        })}

        <AdBanner placement="banner" style={{ marginVertical: spacing.sm }} />

        <TouchableOpacity onPress={() => !intUnlocked && unlockTier('intermediate')}>
          <TierHeader label={intUnlocked ? "Intermediate ✓" : "Intermediate 🔒"} color="#4361EE" />
        </TouchableOpacity>
        {intUnlocked && LESSONS.filter(l => l.tier === 'intermediate').map(lesson => {
          const done = completed.includes(lesson.id);
          return (
            <TouchableOpacity key={lesson.id} style={[sh.card, done && sh.cardDone]} onPress={() => handleLessonPress(lesson)} activeOpacity={0.85}>
              <Text style={sh.lessonEmoji}>{lesson.emoji}</Text>
              <Text style={sh.lessonTitle}>{lesson.title}</Text>
              {done && <Text style={sh.doneCheck}>✓</Text>}
            </TouchableOpacity>
          );
        })}
        {!intUnlocked && <Text style={sh.lockHint}>Tap above to unlock</Text>}

        <TouchableOpacity onPress={() => !advUnlocked && unlockTier('advanced')}>
          <TierHeader label={advUnlocked ? "Advanced ✓" : "Advanced 🔒"} color="#7209B7" />
        </TouchableOpacity>
        {advUnlocked && LESSONS.filter(l => l.tier === 'advanced').map(lesson => {
          const done = completed.includes(lesson.id);
          return (
            <TouchableOpacity key={lesson.id} style={[sh.card, done && sh.cardDone]} onPress={() => handleLessonPress(lesson)} activeOpacity={0.85}>
              <Text style={sh.lessonEmoji}>{lesson.emoji}</Text>
              <Text style={sh.lessonTitle}>{lesson.title}</Text>
              {done && <Text style={sh.doneCheck}>✓</Text>}
            </TouchableOpacity>
          );
        })}

        <TierHeader label="Mini Games" color="#F59E0B" />
        {GAMES.map(game => (
          <TouchableOpacity key={game.id} style={sh.card} onPress={() => handleGamePress(game)} activeOpacity={0.85}>
            <Text style={sh.lessonEmoji}>{game.emoji}</Text>
            <View style={sh.gameInfo}>
              <Text style={sh.lessonTitle}>{game.title}</Text>
              <Text style={sh.gameDesc}>{game.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const sh = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingBottom: spacing.md, paddingHorizontal: spacing.md, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
  backBtn: { padding: spacing.sm },
  backText: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  headerSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  progressWrap: { height: 4, backgroundColor: colors.border },
  progressBar: { height: 4, backgroundColor: colors.primary },
  content: { padding: spacing.md, gap: spacing.sm },
  tierHeader: { borderLeftWidth: 4, paddingLeft: spacing.md, paddingVertical: 4, marginTop: spacing.md, marginBottom: spacing.xs },
  tierLabel: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, gap: spacing.md, ...shadow.sm },
  cardDone: { borderWidth: 1.5, borderColor: '#06D6A0' },
  lessonEmoji: { fontSize: 24, flexShrink: 0 },
  lessonTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  doneCheck: { fontSize: 18, color: '#06D6A0', fontWeight: '900' },
  lockHint: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginVertical: spacing.sm },
  gameInfo: { flex: 1 },
  gameDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
