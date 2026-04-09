import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors as Colors } from '../../theme';
import { LabelStyle } from '../../theme/typography';

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export default function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.action}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { ...LabelStyle, color: Colors.textSecondary },
  action: { fontSize: 12, fontWeight: '600', color: Colors.brandBlue },
});
