/**
 * RewardedAdButton.tsx — Button that simulates rewarded video in dev mode.
 * Production: plays real rewarded video then calls onRewarded.
 */
import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { AD_DEV_MODE } from '../../constants/AdConfig';
import { colors, radius, spacing } from '../../theme';

interface Props { label: string; onRewarded: () => void; style?: object }

export function RewardedAdButton({ label, onRewarded, style }: Props) {
  const [watching, setWatching] = useState(false);
  const handlePress = () => {
    if (AD_DEV_MODE) {
      setWatching(true);
      Alert.alert('Watch Ad', 'A video ad would play here in production.', [
        { text: 'Continue', onPress: () => { setWatching(false); onRewarded(); } },
      ]);
    } else {
      setWatching(true);
      // Real rewarded ad integration here
    }
  };
  return (
    <TouchableOpacity style={[s.btn, style]} onPress={handlePress} disabled={watching}>
      <Text style={s.label}>{watching ? 'Loading...' : label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: { backgroundColor: '#7209B7', borderRadius: radius.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, alignItems: 'center' },
  label: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
