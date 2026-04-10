import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors as Colors, spacing as Spacing, radius as Radius } from '../../theme';

interface Question {
  text: string;
  answers: { label: string; score: number }[];
}

const QUESTIONS: Question[] = [
  {
    text: 'Market drops 25% in a month. What do you do?',
    answers: [
      { label: 'Sell everything', score: 1 },
      { label: 'Hold and wait', score: 3 },
      { label: 'Buy more', score: 5 },
    ],
  },
  {
    text: 'You win $10,000. How do you invest it?',
    answers: [
      { label: 'Savings account', score: 1 },
      { label: 'Index fund', score: 3 },
      { label: 'Growth stocks', score: 5 },
    ],
  },
  {
    text: "Your friend's crypto doubled. You feel:",
    answers: [
      { label: "Relieved you didn't risk it", score: 1 },
      { label: 'Curious', score: 3 },
      { label: 'FOMO', score: 5 },
    ],
  },
  {
    text: 'You prefer investments that:',
    answers: [
      { label: 'Never lose value', score: 1 },
      { label: 'Grow steadily', score: 3 },
      { label: 'Have huge potential', score: 5 },
    ],
  },
  {
    text: 'How long until you need this money?',
    answers: [
      { label: 'Less than 3 years', score: 1 },
      { label: '5-10 years', score: 3 },
      { label: '15+ years', score: 5 },
    ],
  },
];

interface Profile {
  name: string;
  icon: string;
  color: string;
  description: string;
}

function getProfile(avg: number): Profile {
  if (avg <= 2) {
    return {
      name: 'Conservative Investor',
      icon: '\u{1F6E1}\u{FE0F}',
      color: Colors.brandBlue,
      description: 'You value stability and prefer to protect your capital over chasing big gains.',
    };
  }
  if (avg <= 3.5) {
    return {
      name: 'Moderate Investor',
      icon: '\u{2696}\u{FE0F}',
      color: Colors.positive,
      description: 'You balance growth with safety, accepting some risk for better long-term returns.',
    };
  }
  return {
    name: 'Aggressive Investor',
    icon: '\u{1F680}',
    color: Colors.brandGold,
    description: 'You pursue maximum growth and are comfortable with big swings along the way.',
  };
}

export default function RiskQuizGame() {
  const navigation = useNavigation();
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState<number[]>([]);

  const finished = scores.length === QUESTIONS.length;
  const avg = finished ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const profile = finished ? getProfile(avg) : null;

  const handleAnswer = (score: number) => {
    const next = [...scores, score];
    setScores(next);
    if (next.length < QUESTIONS.length) {
      setCurrentQ(currentQ + 1);
    }
  };

  const question = QUESTIONS[currentQ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Risk Quiz</Text>
        <Text style={styles.progress}>
          {finished ? 'Done' : `${currentQ + 1}/${QUESTIONS.length}`}
        </Text>
      </View>

      {finished && profile ? (
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <Text style={styles.resultIcon}>{profile.icon}</Text>
          <Text style={[styles.resultName, { color: profile.color }]}>{profile.name}</Text>
          <Text style={styles.resultDesc}>{profile.description}</Text>
          <Text style={styles.avgScore}>Average score: {avg.toFixed(1)} / 5</Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.ctaText}>Build a portfolio matching this profile</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.questionContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(currentQ / QUESTIONS.length) * 100}%` }]} />
          </View>
          <Text style={styles.questionText}>{question.text}</Text>
          {question.answers.map((answer, i) => (
            <TouchableOpacity
              key={i}
              style={styles.answerBtn}
              onPress={() => handleAnswer(answer.score)}
              activeOpacity={0.7}
            >
              <Text style={styles.answerText}>{answer.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    paddingTop: 56,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  title: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  progress: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600', width: 44, textAlign: 'right' },
  progressBar: {
    height: 4,
    backgroundColor: Colors.bgCardElevated,
    borderRadius: 2,
    marginBottom: Spacing.xxxl,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.brandBlue,
    borderRadius: 2,
  },
  questionContainer: { flex: 1, paddingTop: Spacing.xl },
  questionText: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: Spacing.xxxl,
  },
  answerBtn: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  answerText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  resultContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  resultIcon: { fontSize: 64, marginBottom: Spacing.lg },
  resultName: { fontSize: 28, fontWeight: '800', marginBottom: Spacing.md },
  resultDesc: {
    color: Colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  avgScore: { color: Colors.textTertiary, fontSize: 14, marginBottom: Spacing.xxxl },
  ctaBtn: {
    backgroundColor: Colors.brandBlue,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.xl,
  },
  ctaText: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
});
