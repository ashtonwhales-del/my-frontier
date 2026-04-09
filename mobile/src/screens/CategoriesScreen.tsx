/**
 * CategoriesScreen.tsx -- 3-step category funnel
 * Step 1: StyleSelector (pick investment style)
 * Step 2: CategoryPicker (refine sector picks)
 * Step 3: ContributionStep (weekly amount + 30yr projection)
 */
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { colors, spacing } from '../theme';
import StepProgressBar from '../components/StepProgressBar';
import StyleSelector, { InvestmentStyle } from '../components/categories/StyleSelector';
import CategoryPicker from '../components/categories/CategoryPicker';
import ContributionStep from '../components/categories/ContributionStep';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Categories'>;
  route: RouteProp<RootStackParamList, 'Categories'>;
};

export default function CategoriesScreen({ navigation, route }: Props) {
  const { name } = route.params;
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [investStyle, setInvestStyle] = useState<InvestmentStyle>('balanced');
  const [categories, setCategories] = useState<string[]>([]);

  function handleStyleSelect(style: InvestmentStyle) {
    setInvestStyle(style);
    setStep(2);
  }

  function handleCategoriesConfirm(cats: string[]) {
    setCategories(cats);
    setStep(3);
  }

  function handleBuild(weekly: number) {
    navigation.navigate('RiskTolerance', { name, categories });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {step > 1 ? null : (
          <StepProgressBar currentStep={1} totalSteps={4} labels={['Style', 'Sectors', 'Amount', 'Results']} />
        )}
        {step === 2 && (
          <StepProgressBar currentStep={2} totalSteps={4} labels={['Style', 'Sectors', 'Amount', 'Results']} />
        )}
        {step === 3 && (
          <StepProgressBar currentStep={3} totalSteps={4} labels={['Style', 'Sectors', 'Amount', 'Results']} />
        )}
      </View>

      {step === 1 && <StyleSelector onSelect={handleStyleSelect} />}
      {step === 2 && (
        <CategoryPicker
          style={investStyle}
          onConfirm={handleCategoriesConfirm}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <ContributionStep
          onBuild={handleBuild}
          onBack={() => setStep(2)}
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
