import React from 'react';
import { View, ViewStyle, StyleProp, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Radius, Shadow } from '../../theme/spacing';
import { useTheme } from '../../context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glow?: 'blue' | 'gold' | 'none';
  elevated?: boolean;
}

export default function Card({ children, style, glow = 'none', elevated = false }: CardProps) {
  const { palette } = useTheme();
  const glowStyle = glow === 'blue' ? Shadow.blueGlow : glow === 'gold' ? Shadow.goldGlow : Shadow.card;
  return (
    <View style={[
      styles.card,
      { backgroundColor: elevated ? Colors.bgCardElevated : palette.bgElevated, borderColor: palette.borderSubtle },
      glowStyle,
      style,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 16,
  },
});
