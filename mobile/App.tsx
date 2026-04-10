import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

import { RootStackParamList } from './src/types';
import { STORAGE } from './src/constants';
import { Colors } from './src/theme/colors';
import { initializePurchases } from './src/services/purchaseService';
import { warmupServer } from './src/api';
import ErrorBoundary           from './src/components/ErrorBoundary';
import DisclaimerScreen        from './src/screens/DisclaimerScreen';
import OnboardingScreen        from './src/screens/OnboardingScreen';
import WelcomeScreen           from './src/screens/WelcomeScreen';
import CategoriesScreen        from './src/screens/CategoriesScreen';
import RiskToleranceScreen     from './src/screens/RiskToleranceScreen';
import InvestmentScreen        from './src/screens/InvestmentScreen';
import ResultsScreen           from './src/screens/ResultsScreen';
import AdvisorScreen           from './src/screens/AdvisorScreen';
import WealthTrackerScreen     from './src/screens/WealthTrackerScreen';
import PremiumScreen           from './src/screens/PremiumScreen';
import PrivacyPolicyScreen     from './src/screens/PrivacyPolicyScreen';
import TermsScreen             from './src/screens/TermsScreen';
import AboutScreen             from './src/screens/AboutScreen';
import LearningScreen          from './src/screens/LearningScreen';
import CompareScreen           from './src/screens/CompareScreen';
import BudgetScreen            from './src/screens/BudgetScreen';
import NetWorthScreen          from './src/screens/NetWorthScreen';
import DebtPayoffScreen        from './src/screens/DebtPayoffScreen';
import DebtPlannerScreen       from './src/screens/DebtPlannerScreen';
import SubscriptionAuditScreen from './src/screens/SubscriptionAuditScreen';
import MyPortfolioScreen       from './src/screens/MyPortfolioScreen';
import CurrentPortfolioScreen  from './src/screens/CurrentPortfolioScreen';
import CommunityScreen         from './src/screens/CommunityScreen';
import LessonReaderScreen      from './src/screens/LessonReaderScreen';
import ETFMatcherGame          from './src/screens/games/ETFMatcherGame';
import RiskQuizGame            from './src/screens/games/RiskQuizGame';
import FinancialHealthScreen   from './src/screens/FinancialHealthScreen';
import NetWorthTimelineScreen  from './src/screens/NetWorthTimelineScreen';
import ProfileScreen           from './src/screens/ProfileScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    initializePurchases();
    warmupServer();

    (async () => {
      const [disclaimerAccepted, onboardingComplete] = await Promise.all([
        AsyncStorage.getItem(STORAGE.DISCLAIMER_ACCEPTED),
        AsyncStorage.getItem(STORAGE.ONBOARDING_COMPLETE),
      ]);
      if (!disclaimerAccepted) setInitialRoute('Disclaimer');
      else if (!onboardingComplete) setInitialRoute('Onboarding');
      else setInitialRoute('Welcome');
    })();
  }, []);

  if (!initialRoute) {
    return <View style={{ flex: 1, backgroundColor: Colors.bgPrimary }} />;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{ headerShown: false, cardStyle: { backgroundColor: Colors.bgPrimary } }}
          >
            <Stack.Screen
              name="Disclaimer"
              component={DisclaimerScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen name="Onboarding"        component={OnboardingScreen} />
            <Stack.Screen name="Welcome"           component={WelcomeScreen} />
            <Stack.Screen name="Categories"        component={CategoriesScreen} />
            <Stack.Screen name="RiskTolerance"     component={RiskToleranceScreen} />
            <Stack.Screen name="Investment"        component={InvestmentScreen} />
            <Stack.Screen name="Results"           component={ResultsScreen} />
            <Stack.Screen name="Advisor"           component={AdvisorScreen} />
            <Stack.Screen name="WealthTracker"     component={WealthTrackerScreen} />
            <Stack.Screen name="Premium"           component={PremiumScreen} />
            <Stack.Screen name="Privacy"           component={PrivacyPolicyScreen} />
            <Stack.Screen name="Terms"             component={TermsScreen} />
            <Stack.Screen name="About"             component={AboutScreen} />
            <Stack.Screen name="Learning"          component={LearningScreen} />
            <Stack.Screen name="Compare"           component={CompareScreen} />
            <Stack.Screen name="Budget"            component={BudgetScreen} />
            <Stack.Screen name="NetWorth"          component={NetWorthScreen} />
            <Stack.Screen name="DebtPayoff"        component={DebtPayoffScreen} />
            <Stack.Screen name="DebtPlanner"       component={DebtPlannerScreen} />
            <Stack.Screen name="SubscriptionAudit" component={SubscriptionAuditScreen} />
            <Stack.Screen name="MyPortfolio"       component={MyPortfolioScreen} />
            <Stack.Screen name="CurrentPortfolio"  component={CurrentPortfolioScreen} />
            <Stack.Screen name="Community"         component={CommunityScreen} />
            <Stack.Screen name="LessonReader"      component={LessonReaderScreen} />
            <Stack.Screen name="ETFMatcherGame"    component={ETFMatcherGame} />
            <Stack.Screen name="RiskQuizGame"      component={RiskQuizGame} />
            <Stack.Screen name="FinancialHealth"   component={FinancialHealthScreen} />
            <Stack.Screen name="NetWorthTimeline"  component={NetWorthTimelineScreen} />
            <Stack.Screen name="Profile"           component={ProfileScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
