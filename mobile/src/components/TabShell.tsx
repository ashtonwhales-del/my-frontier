/**
 * TabShell.tsx
 * Wraps a screen's content with the BottomNav tab bar.
 * Use in any "hub" screen (Welcome, Budget, WealthTracker, Community, Profile).
 *
 * Usage:
 *   <TabShell active="Home" navigation={navigation}>
 *     {/* screen content *}
 *   </TabShell>
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BottomNav, { NavTab } from './ui/BottomNav';
import { Colors } from '../theme/colors';

// Maps BottomNav tab IDs to Stack screen names
const TAB_ROUTES: Record<NavTab, string> = {
  Home:      'Welcome',
  Finance:   'FinanceHub',
  Invest:    'InvestHub',
  Learn:     'Learning',
  Community: 'Community',
};

interface TabShellProps {
  active: NavTab;
  children: React.ReactNode;
  /** Pass the screen's own navigation prop, or omit to use hook */
  navigation?: { navigate: (route: string) => void };
}

export default function TabShell({ active, children, navigation: navProp }: TabShellProps) {
  const hookNav = useNavigation<any>();
  const nav = navProp ?? hookNav;

  const handleSelect = (tab: NavTab) => {
    if (tab === active) return; // already here
    nav.navigate(TAB_ROUTES[tab]);
  };

  return (
    <View style={styles.shell}>
      <View style={styles.content}>{children}</View>
      <BottomNav active={active} onSelect={handleSelect} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell:   { flex: 1, backgroundColor: Colors.bgPrimary },
  content: { flex: 1 },
});
