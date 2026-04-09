/**
 * SubscriptionAuditScreen.tsx
 * Screen wrapper for the SubscriptionAudit component — manages state and premium check.
 */
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isPremium } from '../services/premiumService';
import SubscriptionAudit from '../components/budget/SubscriptionAudit';

const STORAGE_KEY = 'subscriptionAuditData';

interface Subscription {
  name: string;
  monthlyCost: number;
  keep: boolean;
}

const DEFAULT_SUBS: Subscription[] = [
  { name: 'Netflix',  monthlyCost: 15.99, keep: true },
  { name: 'Spotify',  monthlyCost: 9.99,  keep: true },
  { name: 'Gym',      monthlyCost: 40,    keep: true },
];

export default function SubscriptionAuditScreen() {
  const navigation = useNavigation<any>();
  const [premium, setPremium] = useState(false);
  const [subs, setSubs] = useState<Subscription[]>(DEFAULT_SUBS);

  useEffect(() => {
    isPremium().then(setPremium);
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) { try { setSubs(JSON.parse(raw)); } catch {} }
    });
  }, []);

  const handleUpdate = (updated: Subscription[]) => {
    setSubs(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <SubscriptionAudit
      subscriptions={subs}
      onUpdate={handleUpdate}
      isPremium={premium}
      navigation={navigation}
    />
  );
}
