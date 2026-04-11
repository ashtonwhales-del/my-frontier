/**
 * FinanceHubScreen.tsx — Finance tab landing page
 * Central hub for all financial tools: budget, debt, bills, goals, housing, income.
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme';
import TabShell from '../components/TabShell';

const SECTIONS = [
  { title: 'Foundation', items: [
    { icon: '💰', label: 'Budget & Expenses', sub: 'Track where your money goes', screen: 'Budget' },
    { icon: '💳', label: 'Debt Repayment', sub: 'Pay off debt faster with smart strategies', screen: 'DebtPlanner' },
  ]},
  { title: 'Optimize', items: [
    { icon: '💡', label: 'Bill Negotiator', sub: 'Find where you are overpaying', screen: 'BillNegotiation' },
    { icon: '📊', label: 'Income Streams', sub: 'Track all your income sources', screen: 'Budget' },
  ]},
  { title: 'Plan', items: [
    { icon: '🎯', label: 'My Goals', sub: 'Save toward what matters most', screen: 'GoalBuckets' },
    { icon: '🏠', label: 'Housing Tool', sub: 'Rent smarter or plan to buy', screen: 'Housing' },
  ]},
];

export default function FinanceHubScreen() {
  const navigation = useNavigation<any>();
  return (
    <TabShell active="Finance">
      <View style={s.root}>
        <View style={s.header}>
          <Text style={s.title}>My Finances</Text>
        </View>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {SECTIONS.map(sec => (
            <View key={sec.title}>
              <Text style={s.sectionTitle}>{sec.title}</Text>
              <View style={s.row}>
                {sec.items.map(item => (
                  <TouchableOpacity key={item.label} style={s.card} onPress={() => navigation.navigate(item.screen)} activeOpacity={0.8}>
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
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  scroll: { padding: spacing.lg },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: spacing.md, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  card: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  cardIcon: { fontSize: 24, marginBottom: 8 },
  cardLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  cardSub: { fontSize: 12, color: colors.textMuted, lineHeight: 16 },
});
