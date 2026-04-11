/**
 * HubScreen.tsx — Shared hub layout for Finance and Invest tabs
 */
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme';
import TabShell from './TabShell';
import type { NavTab } from './ui/BottomNav';

interface HubItem { icon: string; label: string; sub: string; screen: string; params?: any }
interface HubSection { title: string; items: HubItem[] }

interface Props { title: string; sections: HubSection[]; activeTab: NavTab; navigation: any }

export default function HubScreen({ title, sections, activeTab, navigation }: Props) {
  return (
    <TabShell active={activeTab} navigation={navigation}>
      <SafeAreaView style={s.root}>
        <Text style={s.title}>{title}</Text>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {sections.map(sec => (
            <View key={sec.title} style={s.section}>
              <Text style={s.sectionTitle}>{sec.title}</Text>
              <View style={s.row}>
                {sec.items.map(item => (
                  <TouchableOpacity key={item.label} style={s.card} onPress={() => navigation.navigate(item.screen as any, item.params)} activeOpacity={0.7}>
                    <Text style={s.icon}>{item.icon}</Text>
                    <Text style={s.label}>{item.label}</Text>
                    <Text style={s.sub}>{item.sub}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
          <View style={{ height: 80 }} />
        </ScrollView>
      </SafeAreaView>
    </TabShell>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  scroll: { paddingHorizontal: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  card: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, minHeight: 90 },
  icon: { fontSize: 28, marginBottom: 6 },
  label: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  sub: { fontSize: 12, color: colors.textMuted, lineHeight: 16 },
});
