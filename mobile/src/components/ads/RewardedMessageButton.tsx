/**
 * RewardedMessageButton.tsx
 * Button that shows rewarded ad and grants +5 Alex messages.
 * Grants +5 messages when user watches a rewarded ad.
 */
import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE } from '../../constants';
import { DEV_MODE } from '../../services/premiumService';
import { colors, spacing, radius, shadow } from '../../theme';

const MESSAGES_TO_GRANT = 5;

interface Props {
  onMessagesGranted: (newRemaining: number) => void;
}

export default function RewardedMessageButton({ onMessagesGranted }: Props) {
  const [loading, setLoading] = useState(false);

  async function grantMessages() {
    const raw = await AsyncStorage.getItem(STORAGE.ADVISOR_MSGS_REMAINING);
    const current = raw ? parseInt(raw, 10) : 0;
    const newVal = current + MESSAGES_TO_GRANT;
    await AsyncStorage.setItem(STORAGE.ADVISOR_MSGS_REMAINING, String(newVal));
    onMessagesGranted(newVal);
  }

  async function handlePress() {
    if (DEV_MODE) {
      await grantMessages();
      return;
    }

    setLoading(true);
    try {
      const { showRewardedAd } = require('./RewardedAd');
      showRewardedAd(async () => {
        await grantMessages();
      });
    } catch {
      // No native module, grant directly
      await grantMessages();
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableOpacity style={styles.btn} onPress={handlePress} disabled={loading} activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={styles.text}>Watch a short video for 5 more messages</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#7209B7',
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    ...shadow.md,
  },
  text: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
