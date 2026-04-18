import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
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
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import ErrorBoundary           from './src/components/ErrorBoundary';
import DisclaimerScreen        from './src/screens/DisclaimerScreen';
import OnboardingScreen        from './src/screens/OnboardingScreen';
import NewOnboardingScreen     from './src/screens/NewOnboardingScreen';
import WelcomeScreen           from './src/screens/WelcomeScreen';
import CategoriesScreen        from './src/screens/CategoriesScreen';
import ResultsScreen           from './src/screens/ResultsScreen';
import WealthTrackerScreen     from './src/screens/WealthTrackerScreen';
import PremiumScreen           from './src/screens/PremiumScreen';
import PrivacyPolicyScreen     from './src/screens/PrivacyPolicyScreen';
import TermsScreen             from './src/screens/TermsScreen';
import AboutScreen             from './src/screens/AboutScreen';
import CompareScreen           from './src/screens/CompareScreen';
import DebtPlannerScreen       from './src/screens/DebtPlannerScreen';
import CurrentPortfolioScreen  from './src/screens/CurrentPortfolioScreen';
import ProfileScreen           from './src/screens/ProfileScreen';

const Stack = createStackNavigator<RootStackParamList>();

function AppNavigator({ initialRoute }: { initialRoute: keyof RootStackParamList }) {
  const { palette, isDark } = useTheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false, cardStyle: { backgroundColor: palette.bgPrimary } }}
        >
          <Stack.Screen name="Disclaimer" component={DisclaimerScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="Onboarding"        component={OnboardingScreen} />
          <Stack.Screen name="NewOnboarding"     component={NewOnboardingScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="Welcome"           component={WelcomeScreen} />
          <Stack.Screen name="Categories"        component={CategoriesScreen} />
          <Stack.Screen name="Results"           component={ResultsScreen} />
          <Stack.Screen name="WealthTracker"     component={WealthTrackerScreen} />
          <Stack.Screen name="Premium"           component={PremiumScreen} />
          <Stack.Screen name="Privacy"           component={PrivacyPolicyScreen} />
          <Stack.Screen name="Terms"             component={TermsScreen} />
          <Stack.Screen name="About"             component={AboutScreen} />
          <Stack.Screen name="Compare"           component={CompareScreen} />
          <Stack.Screen name="DebtPlanner"       component={DebtPlannerScreen} />
          <Stack.Screen name="CurrentPortfolio"  component={CurrentPortfolioScreen} />
          <Stack.Screen name="Profile"           component={ProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    initializePurchases();
    warmupServer();

    (async () => {
      const [disclaimerAccepted, onboardingComplete, newOnboardingDone] = await Promise.all([
        AsyncStorage.getItem(STORAGE.DISCLAIMER_ACCEPTED),
        AsyncStorage.getItem(STORAGE.ONBOARDING_COMPLETE),
        AsyncStorage.getItem(STORAGE.NEW_ONBOARDING_COMPLETE),
      ]);
      if (!disclaimerAccepted) setInitialRoute('Disclaimer');
      else if (!onboardingComplete) setInitialRoute('Onboarding');
      else if (!newOnboardingDone) setInitialRoute('NewOnboarding');
      else setInitialRoute('Welcome');
    })();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 32, fontWeight: '900', color: Colors.brandGold, letterSpacing: 2 }}>MY FRONTIER</Text>
        <Text style={{ fontSize: 14, color: Colors.textTertiary, marginTop: 8 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppNavigator initialRoute={initialRoute} />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
