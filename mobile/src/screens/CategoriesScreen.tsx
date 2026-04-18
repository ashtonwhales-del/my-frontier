/**
 * CategoriesScreen.tsx -- 2-step category funnel
 * Step 1: CategoryPicker (choose sectors)
 * Step 2: ContributionStep (weekly amount + 30yr projection)
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { colors, spacing } from '../theme';
import { useTheme } from '../context/ThemeContext';
import StepProgressBar from '../components/StepProgressBar';
import CategoryPicker from '../components/categories/CategoryPicker';
import ContributionStep from '../components/categories/ContributionStep';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Categories'>;
  route: RouteProp<RootStackParamList, 'Categories'>;
};

export default function CategoriesScreen({ navigation, route }: Props) {
  const { name } = route.params;
  const { palette } = useTheme();
  const [step, setStep] = useState<1 | 2>(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [userAge, setUserAge] = useState(30);

  useEffect(() => {
    AsyncStorage.getItem('userAge').then(v => {
      if (v) setUserAge(parseInt(v, 10) || 30);
    });
  }, []);

  function handleCategoriesConfirm(cats: string[]) {
    setCategories(cats);
    setStep(2);
  }

  function handleBuild(weekly: number, lumpSum: number = 0) {
    const aggressive = ['AI & Technology', 'Robotics & Innovation', 'Crypto & Blockchain', 'Healthcare & Biotech', 'Emerging & International Markets', 'Clean Energy & Environment', 'Quantum Computing'];
    const safe = ['Bonds & Fixed Income', 'Dividends & Income', 'Real Estate', 'Consumer & Retail', 'Money Market / Cash-like', 'Municipal Bonds', 'Preferred Stock'];
    const aggCount = categories.filter(c => aggressive.includes(c)).length;
    const safeCount = categories.filter(c => safe.includes(c)).length;
    const total = categories.length || 1;
    const aggRatio = aggCount / total;
    const safeRatio = safeCount / total;
    const riskTolerance = aggRatio > 0.5 ? 5 : aggRatio > 0.3 ? 4 : safeRatio > 0.5 ? 1 : safeRatio > 0.3 ? 2 : 3;

    navigation.navigate('Results', {
      data: {
        name,
        categories,
        riskTolerance,
        lumpSum,
        weeklyContribution: weekly,
        age: userAge,
      },
    });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bgPrimary }]} edges={['top', 'bottom']}>
      <StepProgressBar
        currentStep={step}
        totalSteps={2}
        labels={['Sectors', 'Amount']}
      />

      {step === 1 && (
        <CategoryPicker
          onConfirm={handleCategoriesConfirm}
          onBack={() => navigation.goBack()}
        />
      )}
      {step === 2 && (
        <ContributionStep
          onBuild={handleBuild}
          onBack={() => setStep(1)}
          lumpSum={0}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg },
});
