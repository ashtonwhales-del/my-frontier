/**
 * CategoryPicker.tsx -- Grouped category selector with search
 * Shows all categories organized by group, no pre-selection.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { colors, spacing, radius, shadow } from '../../theme';
import { fetchCategories } from '../../api';

// Category groupings for display
const GROUPS: { label: string; hint: string; cats: string[] }[] = [
  { label: 'BROAD MARKET', hint: 'Include at least one', cats: [
    'AI & Technology', 'Small & Mid Cap', 'Emerging & International Markets', 'Consumer & Retail', 'Financials', 'Industrials & Defense',
  ]},
  { label: 'GROWTH', hint: 'Higher risk, higher potential', cats: [
    'Robotics & Innovation', 'Clean Energy & Environment', 'Quantum Computing', 'Crypto & Blockchain', 'Healthcare & Biotech',
  ]},
  { label: 'INCOME', hint: 'Steady returns', cats: [
    'Bonds & Fixed Income', 'Dividends & Income', 'Real Estate',
  ]},
  { label: 'ALTERNATIVE', hint: 'Diversifiers', cats: [
    'Commodities & Resources', 'Leveraged & Alternative', 'Sector Specific',
  ]},
];

interface Props {
  onConfirm: (categories: string[]) => void;
  onBack: () => void;
}

export default function CategoryPicker({ onConfirm, onBack }: Props) {
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then(cats => setAllCategories([...cats].sort((a, b) => a.localeCompare(b))))
      .catch(() => Alert.alert('Error', 'Could not load categories.'))
      .finally(() => setLoading(false));
  }, []);

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

  const groupedCats = new Set(GROUPS.flatMap(g => g.cats));
  const ungrouped = allCategories.filter(c =>
    !groupedCats.has(c) && (!search || c.toLowerCase().includes(search.toLowerCase()))
  );
  const selCount = selected.size;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Choose Your Sectors</Text>
      <TextInput style={styles.searchInput} placeholder="Search categories..." placeholderTextColor={colors.textMuted} value={search} onChangeText={setSearch} />
      {selCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{selCount} selected</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {GROUPS.map(group => {
          const visible = group.cats.filter(c => allCategories.includes(c) && (!search || c.toLowerCase().includes(search.toLowerCase())));
          if (!visible.length) return null;
          return (
            <View key={group.label}>
              <Text style={styles.sectionLabel}>{group.label}</Text>
              <Text style={styles.sectionHint}>{group.hint}</Text>
              <View style={styles.chipWrap}>
                {visible.map(cat => (
                  <TouchableOpacity key={cat} style={[styles.chip, selected.has(cat) && styles.chipSelected]} onPress={() => toggle(cat)} activeOpacity={0.75}>
                    <Text style={[styles.chipLabel, selected.has(cat) && styles.chipLabelSel]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
        {!showAll && ungrouped.length > 0 ? (
          <TouchableOpacity style={styles.addMoreBtn} onPress={() => setShowAll(true)} activeOpacity={0.75}>
            <Text style={styles.addMoreText}>+ Show {ungrouped.length} more sectors</Text>
          </TouchableOpacity>
        ) : ungrouped.length > 0 ? (
          <View>
            <Text style={styles.sectionLabel}>ALL OTHER SECTORS</Text>
            <View style={styles.chipWrap}>
              {ungrouped.map(cat => (
                <TouchableOpacity key={cat} style={[styles.chip, selected.has(cat) && styles.chipSelected]} onPress={() => toggle(cat)} activeOpacity={0.75}>
                  <Text style={[styles.chipLabel, selected.has(cat) && styles.chipLabelSel]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}
        <View style={{ height: 80 }} />
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.continueBtn, !selCount && styles.btnDisabled]} onPress={() => onConfirm(Array.from(selected))} disabled={!selCount} activeOpacity={0.8}>
          <Text style={styles.continueBtnText}>
            {selCount ? 'Continue with ' + selCount + ' sector' + (selCount > 1 ? 's' : '') : 'Select at least one sector'}
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
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: spacing.md, marginBottom: 2 },
  sectionHint: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
  badge: { alignSelf: 'flex-start', marginHorizontal: spacing.lg, marginBottom: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  scrollContent: { paddingHorizontal: spacing.lg },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  addMoreBtn: { marginTop: spacing.sm, marginBottom: spacing.md, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg, borderStyle: 'dashed' as any, paddingVertical: 14, alignItems: 'center' as const },
  addMoreText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  chip: {
    backgroundColor: colors.card, borderRadius: radius.full,
    borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  chipLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  chipLabelSel: { color: '#FFFFFF' },
  footer: { padding: spacing.lg, paddingBottom: spacing.xl, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
  continueBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', ...shadow.md },
  btnDisabled: { opacity: 0.4 },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
