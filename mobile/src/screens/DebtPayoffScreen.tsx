/**
 * DebtPayoffScreen.tsx
 * Screen wrapper for the DebtPayoff component — resolves premium status and passes navigation.
 */
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { isPremium } from '../services/premiumService';
import DebtPayoff from '../components/budget/DebtPayoff';

export default function DebtPayoffScreen() {
  const navigation = useNavigation<any>();
  const [premium, setPremium] = useState(false);

  useEffect(() => {
    isPremium().then(setPremium);
  }, []);

  return <DebtPayoff isPremium={premium} navigation={navigation} />;
}
