/**
 * CategoryPicker.tsx -- Step 2 of category funnel
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { colors, spacing, radius, shadow } from '../../theme';
import { fetchCategories } from '../../api';
import { InvestmentStyle } from './StyleSelector';

const STYLE_CATEGORIES: Record<Exclude<InvestmentStyle, "custom">, string[]> = {
  safe: [
    'Bonds & Fixed Income', 'Dividends & Income', 'Real Estate',
    'Healthcare & Biotech', 'Consumer & Retail', 'Investment Grade Corporate',
    'Municipal Bonds', 'Preferred Stock', 'Ultra Short Term',
    'Money Market / Cash-like', 'Floating Rate', 'Treasury Inflation Protected',
  ],
  balanced: [
    'AI & Technology', 'Healthcare & Biotech', 'Real Estate',
    'Emerging & International Markets', 'Financials', 'Clean Energy & Environment',
    'Dividends & Income', 'Bonds & Fixed Income', 'Consumer & Retail',
    'Industrials & Defense', 'Small & Mid Cap', 'Commodities & Resources',
  ],
  aggressive: [
    'AI & Technology', 'Robotics & Innovation', 'Crypto & Blockchain',
    'Emerging & International Markets', 'Healthcare & Biotech', 'Clean Energy & Environment',
    'Quantum Computing', 'Space', 'Genomics',
    'Electric Vehicles', 'Cybersecurity', 'Metaverse',
  ],
};

interface Props {
  style: InvestmentStyle;
  onConfirm: (categories: string[]) => void;
  onBack: () => void;
}

export default function CategoryPicker({ style: investStyle, onConfirm, onBack }: Props) {
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCategories()
      .then(cats => {
        const sorted = [...cats].sort((a, b) => a.localeCompare(b));
        setAllCategories(sorted);
        if (investStyle !== 'custom') {
          setSelected(new Set(STYLE_CATEGORIES[investStyle]?.filter(c => cats.includes(c)) ?? []));
        }
      })
      .catch(() => Alert.alert('Error', 'Could not load categories.'))
      .finally(() => setLoading(false));
  }, []);

  const displayCats = investStyle === 'custom'
    ? allCategories.filter(c => !search || c.toLowerCase().includes(search.toLowerCase()))
    : (STYLE_CATEGORIES[investStyle] ?? []).filter(c => allCategories.includes(c));

  function toggle(cat: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  if (loading) {
    return (
      <View style={styles.loadWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadText}>Loading sectors...</Text>
      </View>
    );
  }

  const selCount = selected.size;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>
        {investStyle === 'custom' ? 'Pick Your Sectors' : 'Refine Your Picks'}
      </Text>
      <Text style={styles.subtitle}>
        {investStyle === 'custom'
          ? 'Search and select from all 98 categories'
          : 'Pre-selected sectors match your style. Adjust as you like.'}
      </Text>
      {investStyle === 'custom' && (
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      )}
      {selCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{selCount} selected</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.chips} showsVerticalScrollIndicator={false}>
        {displayCats.map(cat => {
          const isSel = selected.has(cat);
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, isSel && styles.chipSelected]}
              onPress={() => toggle(cat)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipLabel, isSel && styles.chipLabelSel]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 80 }} />
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !selCount && styles.btnDisabled]}
          onPress={() => onConfirm(Array.from(selected))}
          disabled={!selCount}
          activeOpacity={0.8}
        >
          <Text style={styles.continueBtnText}>
            {selCount ? 'Continue with ' + selCount + ' sectors' : 'Select at least one sector'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadText: { fontSize: 14, color: colors.textSecondary },
  backBtn: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  backText: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  subtitle: { fontSize: 13, color: colors.textSecondary, paddingHorizontal: spacing.lg, marginBottom: spacing.sm, lineHeight: 19 },
  searchInput: {
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 10,
    fontSize: 14, color: colors.textPrimary,
  },
  badge: { alignSelf: 'flex-start', marginHorizontal: spacing.lg, marginBottom: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  chips: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  chipSelected: { backgroundColor: '#3B82F622', borderColor: colors.primary },
  chipLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  chipLabelSel: { color: colors.primary },
  footer: { padding: spacing.lg, paddingBottom: spacing.xl, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
  continueBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', ...shadow.md },
  btnDisabled: { opacity: 0.4 },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
