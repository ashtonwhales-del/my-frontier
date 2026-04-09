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

  // DEV_MODE / premium: show gold dashed placeholder so dev can see placements
  if (skip) {
    return (
      <View style={[styles.devPlaceholder, style]}>
        <Text style={styles.devText}>AD PLACEMENT ({placement})</Text>
      </View>
    );
  }

  if (RNGMAModule) {
    const { BannerAd, BannerAdSize } = RNGMAModule;
    return <BannerAd unitId={AD_UNIT_IDS[placement]} size={BannerAdSize.BANNER} />;
  }

  // Expo Go fallback — visible placeholder
  return (
    <View style={[styles.devPlaceholder, style]}>
      <Text style={styles.devText}>AD PLACEMENT ({placement})</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  devPlaceholder: {
    height: 60,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    borderRadius: 8,
    alignSelf: 'stretch',
  },
  devText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
