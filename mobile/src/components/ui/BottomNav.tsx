/**
 * BottomNav.tsx
 * Dark tab bar with Ionicons. Active tab: blue icon + label + 3px top line.
 * Inactive tabs: muted icon only (no label).
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

export type NavTab = 'Home' | 'Portfolio' | 'Debt' | 'Profile';

interface BottomNavProps {
  active: NavTab;
  onSelect: (tab: NavTab) => void;
}

interface TabDef {
  id: NavTab;
  label: string;
  iconActive: keyof typeof Ionicons.glyphMap;
  iconInactive: keyof typeof Ionicons.glyphMap;
}

const TABS: TabDef[] = [
  { id: 'Home',      label: 'Home',      iconActive: 'home',        iconInactive: 'home-outline' },
  { id: 'Portfolio', label: 'Portfolio', iconActive: 'pie-chart',   iconInactive: 'pie-chart-outline' },
  { id: 'Debt',      label: 'Debt',      iconActive: 'card',        iconInactive: 'card-outline' },
  { id: 'Profile',   label: 'Profile',   iconActive: 'person',      iconInactive: 'person-outline' },
];

export default function BottomNav({ active, onSelect }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8), backgroundColor: palette.bgPrimary, borderTopColor: palette.borderSubtle }]}>
      {TABS.map(tab => {
        const isActive = tab.id === active;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onSelect(tab.id)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isActive && <View style={[styles.activeLine, { backgroundColor: palette.brandBlue }]} />}
            <Ionicons
              name={isActive ? tab.iconActive : tab.iconInactive}
              size={26}
              color={isActive ? palette.brandBlue : palette.textTertiary}
            />
            {isActive && (
              <Text style={[styles.label, { color: palette.brandBlue }]}>{tab.label}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    minHeight: 65,
    alignItems: 'flex-start',
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    minHeight: 50,
    position: 'relative',
    paddingTop: 4,
    gap: 3,
  },
  activeLine: {
    position: 'absolute',
    top: -8,
    left: '20%',
    right: '20%',
    height: 3,
    borderRadius: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
