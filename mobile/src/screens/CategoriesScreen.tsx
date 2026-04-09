/**
 * CategoriesScreen.tsx -- 2-step category funnel
 * Step 1: CategoryPicker (choose sectors)
 * Step 2: ContributionStep (weekly amount + 30yr projection)
 */
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { colors, spacing } from '../theme';
import StepProgressBar from '../components/StepProgressBar';
import CategoryPicker from '../components/categories/CategoryPicker';
import ContributionStep from '../components/categories/ContributionStep';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Categories'>;
  route: RouteProp<RootStackParamList, 'Categories'>;
};

export default function CategoriesScreen({ navigation, route }: Props) {
  const { name } = route.params;
  const [step, setStep] = useState<1 | 2>(1);
  const [categories, setCategories] = useState<string[]>([]);

  function handleCategoriesConfirm(cats: string[]) {
    setCategories(cats);
    setStep(2);
  }

  function handleBuild(weekly: number) {
    navigation.navigate('RiskTolerance', { name, categories });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <StepProgressBar
          currentStep={step}
          totalSteps={4}
          labels={['Sectors', 'Amount', 'Risk', 'Results']}
        />
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingTop: 56, paddingHorizontal: spacing.lg },
});
