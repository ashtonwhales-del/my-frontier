/**
 * InvestHubScreen.tsx — Invest tab landing page
 * Central hub for portfolio building, tracking, and analysis.
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme';
import TabShell from '../components/TabShell';

const SECTIONS = [
  { title: 'Build', items: [
    { icon: '📊', label: 'Build Portfolio', sub: 'Use Efficient Frontier math', screen: 'Categories', params: { name: 'Investor' } },
    { icon: '💼', label: 'My Portfolios', sub: 'View and compare saved portfolios', screen: 'WealthTracker' },
  ]},
  { title: 'Track', items: [
    { icon: '📈', label: 'Real Holdings', sub: 'Track stocks you actually own', screen: 'CurrentPortfolio' },
    { icon: '🗓️', label: 'Net Worth Timeline', sub: 'See your wealth from now to 80', screen: 'NetWorthTimeline' },
  ]},
  { title: 'Analyze', items: [
    { icon: '⚖️', label: 'Compare Portfolios', sub: 'Side-by-side analysis', screen: 'Compare' },
    { icon: '🎓', label: 'Ask Alex', sub: 'Get portfolio guidance', screen: 'Advisor' },
  ]},
];

export default function InvestHubScreen() {
  const navigation = useNavigation<any>();
  return (
    <TabShell active="Invest">
      <View style={s.root}>
        <View style={s.header}>
          <Text style={s.title}>My Investments</Text>
        </View>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {SECTIONS.map(sec => (
            <View key={sec.title}>
              <Text style={s.sectionTitle}>{sec.title}</Text>
              <View style={s.row}>
                {sec.items.map(item => (
                  <TouchableOpacity key={item.label} style={s.card} onPress={() => navigation.navigate(item.screen, (item as any).params)} activeOpacity={0.8}>
                    <Text style={s.cardIcon}>{item.icon}</Text>
                    <Text style={s.cardLabel}>{item.label}</Text>
                    <Text style={s.cardSub}>{item.sub}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
    </TabShell>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingTop: 56, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  scroll: { padding: spacing.lg },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: spacing.md, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  card: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  cardIcon: { fontSize: 24, marginBottom: 8 },
  cardLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  cardSub: { fontSize: 12, color: colors.textMuted, lineHeight: 16 },
});
