import React from 'react';
import { StyleSheet } from 'react-native';
// TODO: restore for dev build ↓
// import { useEffect, useRef, useState } from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import {
//   NativeAd,
//   NativeAdView,
//   HeadlineView,
//   AdvertiserView,
//   TestIds,
// } from 'react-native-google-mobile-ads';
import { colors, spacing, radius, shadow } from '../../theme';

// TODO: restore for dev build — swap for real unit ID before launch
// const AD_UNIT_ID = TestIds.NATIVE;

/**
 * A native ad card styled to match the HoldingCard design exactly.
 * Renders a "Sponsored" label in the top-right and wraps content in
 * NativeAdView so the SDK can report impressions correctly.
 *
 * Fails silently — renders nothing if the ad cannot be loaded.
 */
export default function NativeAdCard() {
  // TODO: restore for dev build ↓
  // const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);
  // const adRef = useRef<NativeAd | null>(null);
  //
  // useEffect(() => {
  //   let cancelled = false;
  //   NativeAd.createForAdRequest(AD_UNIT_ID)
  //     .then(ad => {
  //       if (!cancelled) { adRef.current = ad; setNativeAd(ad); }
  //       else { ad.destroy(); }
  //     })
  //     .catch((err: unknown) => { console.warn('[NativeAdCard] Failed to load:', err); });
  //   return () => { cancelled = true; adRef.current?.destroy(); };
  // }, []);
  //
  // if (!nativeAd) return null;
  //
  // return (
  //   <NativeAdView nativeAd={nativeAd} style={styles.card}>
  //     <View style={styles.sponsoredRow}>
  //       <View style={styles.tickerBadge}><Text style={styles.ticker}>AD</Text></View>
  //       <View style={styles.flex} />
  //       <Text style={styles.sponsoredLabel}>Sponsored</Text>
  //     </View>
  //     <HeadlineView style={styles.headline} />
  //     <AdvertiserView style={styles.advertiser} />
  //     <View style={styles.barTrack}><View style={styles.barFill} /></View>
  //   </NativeAdView>
  // );

  return null; // Expo Go stub — AdMob requires a native build
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  sponsoredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tickerBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: spacing.sm,
  },
  ticker: { fontSize: 14, fontWeight: '800', color: colors.textMuted },
  flex: { flex: 1 },
  sponsoredLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  headline: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  advertiser: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  barTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: spacing.sm,
  },
  barFill: {
    width: '40%',
    height: 4,
    backgroundColor: colors.textMuted,
    borderRadius: 2,
  },
});
