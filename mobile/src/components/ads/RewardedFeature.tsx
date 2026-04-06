import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HoldingResult } from '../../types';
import { colors, spacing, radius, shadow } from '../../theme';
import { showRewardedAd } from './RewardedAd';
import StressTestModal from '../StressTestModal';

type Props = {
  holdings: HoldingResult[];
};

/**
 * "Stress Test Your Portfolio" premium unlock card.
 * Shows a locked teaser; watching a rewarded ad unlocks the stress test modal.
 */
export default function RewardedFeature({ holdings }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleWatch() {
    if (unlocked) {
      setModalVisible(true);
      return;
    }
    setLoading(true);
    showRewardedAd(() => {
      setLoading(false);
      setUnlocked(true);
      setModalVisible(true);
    });
    // Reset loading after a timeout in case the ad callback never fires
    setTimeout(() => setLoading(false), 15_000);
  }

  return (
    <>
      <View style={styles.card}>
        {/* Lock overlay badge */}
        {!unlocked && (
          <View style={styles.lockBadge}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        )}

        <Text style={styles.heading}>📊 Stress Test Your Portfolio</Text>
        <Text style={styles.subheading}>Most investors never see this until it's too late.</Text>

        <Text style={styles.body}>
          {unlocked
            ? 'Your stress test is unlocked. See exactly how your specific portfolio would have held up during the three crashes that ended most beginners\' investing journeys.'
            : 'Watch a short video to unlock: See how YOUR specific portfolio would have performed during the 2008 banking collapse, the 2020 COVID freefall, and the 2022 rate shock — with your actual ETF weights, not generic averages.'}
        </Text>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleWatch}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? 'Loading Ad…' : unlocked ? 'View Stress Test →' : '▶ Watch to Unlock'}
          </Text>
        </TouchableOpacity>
      </View>

      <StressTestModal
        visible={modalVisible}
        holdings={holdings}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.sm,
    borderLeftWidth: 4,
    borderLeftColor: '#7209B7',
    overflow: 'hidden',
  },
  lockBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  lockIcon: { fontSize: 20 },
  heading: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7209B7',
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  btn: {
    backgroundColor: '#7209B7',
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
