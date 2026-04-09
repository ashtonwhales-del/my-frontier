import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { colors, spacing, radius, shadow } from '../theme';
import { STORAGE } from '../constants';
import { LESSONS, GAMES, Lesson, Game } from './LearningData';
import AdBanner from '../components/AdBanner';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Learning'> };

function LessonModal({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) {
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={modal.screen}>
        <View style={modal.header}>
          <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
            <Text style={modal.closeText}>←</Text>
          </TouchableOpacity>
          <Text style={modal.emoji}>{lesson.emoji}</Text>
          <Text style={modal.title}>{lesson.title}</Text>
          <View style={modal.tierBadge}>
            <Text style={modal.tierText}>{lesson.tier.toUpperCase()}</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={modal.body} showsVerticalScrollIndicator={false}>
          {lesson.content.split('\n\n').map((para, i) => (
            <Text key={i} style={modal.para}>{para}</Text>
          ))}
          <TouchableOpacity style={modal.doneBtn} onPress={onClose}>
            <Text style={modal.doneBtnText}>✓ Got it!</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function TierHeader({ label, color }: { label: string; color: string }) {
  return (
    <View style={[sh.tierHeader, { borderLeftColor: color }]}>
      <Text style={[sh.tierLabel, { color }]}>{label}</Text>
    </View>
  );
}

export default function LearningScreen({ navigation }: Props) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [openLesson, setOpenLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE.LESSONS_COMPLETE)
      .then(raw => raw ? setCompleted(JSON.parse(raw)) : null)
      .catch(() => null);
  }, []);

  function handleLessonPress(lesson: Lesson) {
    setOpenLesson(lesson);
  }

  async function handleLessonClose() {
    if (!openLesson) return;
    // Mark as complete
    if (!completed.includes(openLesson.id)) {
      const updated = [...completed, openLesson.id];
      setCompleted(updated);
      await AsyncStorage.setItem(STORAGE.LESSONS_COMPLETE, JSON.stringify(updated));
    }
    setOpenLesson(null);
  }

  function handleGamePress(game: Game) {
    Alert.alert(game.title, game.desc + '\n\nGame coming soon!');
  }

  const totalLessons = LESSONS.length;
  const doneCount = completed.length;

  return (
    <View style={sh.screen}>
      {/* Header */}
      <View style={sh.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={sh.backBtn}>
          <Text style={sh.backText}>←</Text>
        </TouchableOpacity>
        <View style={sh.headerCenter}>
          <Text style={sh.headerTitle}>📚 Learning Center</Text>
          <Text style={sh.headerSub}>{doneCount}/{totalLessons} lessons complete</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={sh.progressWrap}>
        <View style={[sh.progressBar, { width: `${(doneCount / totalLessons) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={sh.content} showsVerticalScrollIndicator={false}>
        {/* Beginner */}
        <TierHeader label="📦 Beginner — Free" color="#06D6A0" />
        {LESSONS.filter(l => l.tier === 'beginner').map((lesson, i) => {
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

        {/* Intermediate */}
        <TierHeader label="📈 Intermediate" color="#4361EE" />
        {LESSONS.filter(l => l.tier === 'intermediate').map(lesson => {
          const done = completed.includes(lesson.id);
          return (
            <TouchableOpacity key={lesson.id} style={[sh.card, done && sh.cardDone]} onPress={() => handleLessonPress(lesson)} activeOpacity={0.85}>
              <Text style={sh.lessonEmoji}>{lesson.emoji}</Text>
              <Text style={sh.lessonTitle}>{lesson.title}</Text>
              {done && <Text style={sh.doneCheck}>✓</Text>}
            </TouchableOpacity>
          );
        })}

        {/* Advanced */}
        <TierHeader label="🔬 Advanced" color="#7209B7" />
        {LESSONS.filter(l => l.tier === 'advanced').map(lesson => {
          const done = completed.includes(lesson.id);
          return (
            <TouchableOpacity key={lesson.id} style={[sh.card, done && sh.cardDone]} onPress={() => handleLessonPress(lesson)} activeOpacity={0.85}>
              <Text style={sh.lessonEmoji}>{lesson.emoji}</Text>
              <Text style={sh.lessonTitle}>{lesson.title}</Text>
              {done && <Text style={sh.doneCheck}>✓</Text>}
            </TouchableOpacity>
          );
        })}

        {/* Games */}
        <TierHeader label="🎮 Mini Games" color="#F59E0B" />
        {GAMES.map(game => (
          <TouchableOpacity key={game.id} style={sh.card} onPress={() => handleGamePress(game)} activeOpacity={0.85}>
            <Text style={sh.lessonEmoji}>{game.emoji}</Text>
            <View style={sh.gameInfo}>
              <Text style={sh.lessonTitle}>{game.title}</Text>
              <Text style={sh.gameDesc}>{game.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* All lessons and games are free */}

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {openLesson && <LessonModal lesson={openLesson} onClose={handleLessonClose} />}
    </View>
  );
}

const sh = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingBottom: spacing.md, paddingHorizontal: spacing.md, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
  backBtn: { padding: spacing.sm },
  backText: { fontSize: 22, color: colors.primary, fontWeight: '700' },
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
  cardLocked: { opacity: 0.75 },
  lessonEmoji: { fontSize: 24, flexShrink: 0 },
  lessonTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  lockedText: { color: colors.textSecondary },
  doneCheck: { fontSize: 18, color: '#06D6A0', fontWeight: '900' },
  lockIcon: { fontSize: 16 },
  gameInfo: { flex: 1 },
  gameDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  upgradeBtn: { backgroundColor: '#7209B7', borderRadius: radius.md, paddingVertical: 15, alignItems: 'center', marginTop: spacing.lg, ...shadow.md },
  upgradeBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

const modal = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingTop: 56, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  closeBtn: { marginBottom: spacing.sm },
  closeText: { fontSize: 22, color: colors.primary, fontWeight: '700' },
  emoji: { fontSize: 36, marginBottom: spacing.xs },
  title: { fontSize: 22, fontWeight: '900', color: colors.textPrimary, marginBottom: spacing.xs },
  tierBadge: { alignSelf: 'flex-start', backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  tierText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  body: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 60 },
  para: { fontSize: 15, color: colors.textPrimary, lineHeight: 24 },
  doneBtn: { backgroundColor: '#06D6A0', borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: spacing.lg },
  doneBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
});
