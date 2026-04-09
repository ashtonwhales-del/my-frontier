import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AD_UNIT_IDS } from '../config/ads';
import { DEV_MODE, isPremium } from '../services/premiumService';

// react-native-google-mobile-ads is a native module — unavailable in Expo Go.
// In a dev build or production build, BannerAd renders natively (AdMob handles sizing).
// In Expo Go, this falls back to a visible placeholder so layouts don't collapse.
let RNGMAModule: any = null;
try {
  RNGMAModule = require('react-native-google-mobile-ads');
} catch {
  // Running in Expo Go — native module not available
}

type Props = {
  placement: keyof typeof AD_UNIT_IDS;
  style?: object;
};

export default function AdBanner({ placement, style }: Props) {
  const [skip, setSkip] = useState(DEV_MODE);
  useEffect(() => { if (!DEV_MODE) isPremium().then(p => setSkip(p)); }, []);
  if (skip) return null;
  if (RNGMAModule) {
    const { BannerAd, BannerAdSize } = RNGMAModule;
    // AdMob handles all sizing internally — no wrapper View needed.
    return <BannerAd unitId={AD_UNIT_IDS[placement]} size={BannerAdSize.BANNER} />;
  }

  // Expo Go fallback — visible placeholder so the layout slot is reserved
  return (
    <View style={[styles.container, style]}>
      <View style={styles.yellowStrip} />
      <View style={styles.inner}>
        <Text style={styles.label}>ADVERTISEMENT</Text>
        <Text style={styles.placeholder}>{__DEV__ ? `[Dev] ${placement}` : ''}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    height: 50,
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  yellowStrip: {
    width: 3,
    backgroundColor: '#F5C518',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 9,
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  placeholder: {
    fontSize: 12,
    color: '#AAAAAA',
    fontWeight: '500',
  },
});
