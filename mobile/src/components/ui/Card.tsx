import React from 'react';
import { View, ViewStyle, StyleProp, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Radius, Shadow } from '../../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glow?: 'blue' | 'gold' | 'none';
  elevated?: boolean;
}

export default function Card({ children, style, glow = 'none', elevated = false }: CardProps) {
  const glowStyle = glow === 'blue' ? Shadow.blueGlow : glow === 'gold' ? Shadow.goldGlow : Shadow.card;
  return (
    <View style={[styles.card, elevated && styles.elevated, glowStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 16,
  },
  elevated: {
    backgroundColor: Colors.bgCardElevated,
  },
});
