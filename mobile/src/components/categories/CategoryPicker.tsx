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
import { useTheme } from '../../context/ThemeContext';
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
  const { palette } = useTheme();
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
      <View style={[styles.loadWrap, { backgroundColor: palette.bgPrimary }]}>
        <ActivityIndicator size="large" color={palette.accent} />
        <Text style={[styles.loadText, { color: palette.textSecondary }]}>Loading sectors...</Text>
      </View>
    );
  }

  const groupedCats = new Set(GROUPS.flatMap(g => g.cats));
  const ungrouped = allCategories.filter(c =>
    !groupedCats.has(c) && (!search || c.toLowerCase().includes(search.toLowerCase()))
  );
  const selCount = selected.size;

  return (
    <View style={[styles.container, { backgroundColor: palette.bgPrimary }]}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={[styles.backText, { color: palette.accent }]}>Back</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: palette.textPrimary }]}>Choose Your Sectors</Text>
      <TextInput
        style={[styles.searchInput, { backgroundColor: palette.bgElevated, borderColor: palette.borderSubtle, color: palette.textPrimary }]}
        placeholder="Search categories..."
        placeholderTextColor={palette.textTertiary}
        value={search}
        onChangeText={setSearch}
      />
      {selCount > 0 && (
        <View style={[styles.badge, { backgroundColor: palette.accent }]}>
          <Text style={styles.badgeText}>{selCount} selected</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {GROUPS.map(group => {
          const visible = group.cats.filter(c => allCategories.includes(c) && (!search || c.toLowerCase().includes(search.toLowerCase())));
          if (!visible.length) return null;
          return (
            <View key={group.label}>
              <Text style={[styles.sectionLabel, { color: palette.textTertiary }]}>{group.label}</Text>
              <Text style={[styles.sectionHint, { color: palette.textSecondary }]}>{group.hint}</Text>
              <View style={styles.chipWrap}>
                {visible.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.chip,
                      { backgroundColor: palette.bgElevated, borderColor: palette.borderSubtle },
                      selected.has(cat) && { backgroundColor: palette.accent, borderColor: palette.accent, shadowColor: palette.accent },
                    ]}
                    onPress={() => toggle(cat)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipLabel, { color: palette.textPrimary }, selected.has(cat) && styles.chipLabelSel]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
        {!showAll && ungrouped.length > 0 ? (
          <TouchableOpacity style={[styles.addMoreBtn, { borderColor: palette.borderSubtle }]} onPress={() => setShowAll(true)} activeOpacity={0.75}>
            <Text style={[styles.addMoreText, { color: palette.accent }]}>+ Show {ungrouped.length} more sectors</Text>
          </TouchableOpacity>
        ) : ungrouped.length > 0 ? (
          <View>
            <Text style={[styles.sectionLabel, { color: palette.textTertiary }]}>ALL OTHER SECTORS</Text>
            <View style={styles.chipWrap}>
              {ungrouped.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    { backgroundColor: palette.bgElevated, borderColor: palette.borderSubtle },
                    selected.has(cat) && { backgroundColor: palette.accent, borderColor: palette.accent, shadowColor: palette.accent },
                  ]}
                  onPress={() => toggle(cat)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipLabel, { color: palette.textPrimary }, selected.has(cat) && styles.chipLabelSel]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}
        <View style={{ height: 80 }} />
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: palette.bgPrimary, borderTopColor: palette.borderSubtle }]}>
        <TouchableOpacity
          style={[styles.continueBtn, { backgroundColor: palette.accent }, !selCount && styles.btnDisabled]}
          onPress={() => onConfirm(Array.from(selected))}
          disabled={!selCount}
          activeOpacity={0.8}
        >
          <Text style={styles.continueBtnText}>
            {selCount ? 'Continue with ' + selCount + ' sector' + (selCount > 1 ? 's' : '') : 'Select at least one sector'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadText: { fontSize: 14 },
  backBtn: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  backText: { fontSize: 15, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  subtitle: { fontSize: 13, paddingHorizontal: spacing.lg, marginBottom: spacing.sm, lineHeight: 19 },
  searchInput: {
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 10,
    fontSize: 14,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: spacing.md, marginBottom: 2 },
  sectionHint: { fontSize: 12, marginBottom: spacing.sm },
  badge: { alignSelf: 'flex-start', marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  scrollContent: { paddingHorizontal: spacing.lg },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  addMoreBtn: { marginTop: spacing.sm, marginBottom: spacing.md, borderWidth: 1.5, borderRadius: radius.lg, borderStyle: 'dashed' as any, paddingVertical: 14, alignItems: 'center' as const },
  addMoreText: { fontSize: 14, fontWeight: '600' },
  chip: {
    borderRadius: radius.full,
    borderWidth: 1.5,
    paddingHorizontal: 16, paddingVertical: 10,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  chipSelected: {},
  chipLabel: { fontSize: 13, fontWeight: '600' },
  chipLabelSel: { color: '#FFFFFF' },
  footer: { padding: spacing.lg, paddingBottom: spacing.xl, borderTopWidth: 1 },
  continueBtn: { borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', ...shadow.md },
  btnDisabled: { opacity: 0.4 },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
