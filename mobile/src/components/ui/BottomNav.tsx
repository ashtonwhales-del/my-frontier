import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';

export type NavTab = 'Home' | 'Budget' | 'Portfolio' | 'Learn' | 'Profile';

interface BottomNavProps {
  active: NavTab;
  onSelect: (tab: NavTab) => void;
}

const TABS: { id: NavTab; emoji: string; label: string }[] = [
  { id: 'Home',      emoji: '🏠', label: 'Home' },
  { id: 'Budget',    emoji: '💰', label: 'Budget' },
  { id: 'Portfolio', emoji: '📊', label: 'Portfolio' },
  { id: 'Learn',     emoji: '📚', label: 'Learn' },
  { id: 'Profile',   emoji: '👤', label: 'Profile' },
];

export default function BottomNav({ active, onSelect }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map(tab => {
        const isActive = tab.id === active;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onSelect(tab.id)}
            activeOpacity={0.7}
          >
            {isActive && <View style={styles.activeLine} />}
            <Text style={styles.emoji}>{tab.emoji}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    height: 60,
    alignItems: 'center',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative', paddingTop: 6 },
  activeLine: { position: 'absolute', top: 0, left: '25%', right: '25%', height: 2, backgroundColor: Colors.brandBlue, borderRadius: 1 },
  emoji: { fontSize: 18, marginBottom: 2 },
  label: { fontSize: 10, fontWeight: '500', color: Colors.textTertiary },
  labelActive: { color: Colors.brandBlue, fontWeight: '700' },
});
