/**
 * SmartBanner.tsx — Banner ad that respects ad rules.
 * DEV_MODE shows gold placeholder. Production shows real AdMob.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AD_DEV_MODE } from '../../constants/AdConfig';

interface Props { style?: object }

export function SmartBanner({ style }: Props) {
  return (
    <View style={[s.box, style]}>
      <Text style={s.text}>{AD_DEV_MODE ? 'AD PLACEMENT' : 'Advertisement'}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: { height: 50, borderWidth: 1, borderStyle: 'dashed', borderColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', marginVertical: 8, borderRadius: 4 },
  text: { color: '#F59E0B', fontSize: 11, fontWeight: '600', letterSpacing: 1 },
});
