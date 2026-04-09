/**
 * SavingsStreak.tsx
 * Tracks consecutive surplus budget months and awards streak badges.
 * Under 80 lines.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../theme/colors';
import { NumberScale, BodyScale } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { awardBadge } from '../../services/badgeService';

interface StreakData {
  streak: number;
  months: string[];
  lastMonth: string;
}

const STREAK_KEY = 'savingsStreak';

export default function SavingsStreak() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STREAK_KEY);
      const data: StreakData = raw ? JSON.parse(raw) : { streak: 0, months: [], lastMonth: '' };

      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      if (data.lastMonth !== currentMonth) {
        const budgetRaw = await AsyncStorage.getItem(`budgetData_${currentMonth}`);
        if (budgetRaw) {
          const budget = JSON.parse(budgetRaw);
          const income = budget.income ?? 0;
          const spent = Object.values(budget.categories ?? {}).reduce(
            (sum: number, v) => sum + (v as number), 0,
          );
          const isSurplus = income > 0 && spent < income;
          if (isSurplus) {
            const newStreak = data.streak + 1;
            const newData: StreakData = {
              streak: newStreak,
              months: [...data.months, currentMonth],
              lastMonth: currentMonth,
            };
            await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(newData));
            data.streak = newStreak;
            if (newStreak >= 3)  await awardBadge('streak_3');
            if (newStreak >= 6)  await awardBadge('streak_6');
            if (newStreak >= 12) await awardBadge('streak_12');
          }
        }
      }
      setStreak(data.streak);
    })();
  }, []);

  const flames = Array.from({ length: 6 }, (_, i) => (i < streak ? '🔥' : '🌑'));

  return (
    <View style={styles.container}>
      <Text style={styles.flames}>{flames.join('  ')}</Text>
      <Text style={styles.count}>
        {streak > 0 ? `🔥 ${streak} month streak` : 'Start your streak this month!'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: Spacing.md },
  flames:    { fontSize: 22, letterSpacing: 4, marginBottom: Spacing.sm },
  count:     { ...NumberScale.sm, color: Colors.brandGold },
});
