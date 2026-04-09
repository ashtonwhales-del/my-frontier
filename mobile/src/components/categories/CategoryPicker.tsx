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
  const [showMore, setShowMore] = useState(investStyle === 'custom');

  useEffect(() => {
    fetchCategories()
      .then(cats => {
        const sorted = [...cats].sort((a, b) => a.localeCompare(b));
        setAllCategories(sorted);
        if (investStyle !== 'custom') {
          const recs = STYLE_CATEGORIES[investStyle]?.filter(c => cats.includes(c)) ?? [];
          setSelected(new Set(recs));
        }
      })
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

  const recommended = investStyle !== 'custom'
    ? (STYLE_CATEGORIES[investStyle] ?? []).filter(c => allCategories.includes(c))
    : [];
  const extra = allCategories.filter(c =>
    !recommended.includes(c) && (!search || c.toLowerCase().includes(search.toLowerCase()))
  );
  const selCount = selected.size;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>
        {investStyle === 'custom' ? 'Pick Your Sectors' : 'Your Recommended Sectors'}
      </Text>
      {selCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{selCount} selected</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.chips} showsVerticalScrollIndicator={false}>
        {recommended.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>RECOMMENDED FOR YOU</Text>
            {recommended.map(cat => (
              <TouchableOpacity key={cat} style={[styles.chip, selected.has(cat) && styles.chipSelected]} onPress={() => toggle(cat)} activeOpacity={0.75}>
                <Text style={[styles.chipLabel, selected.has(cat) && styles.chipLabelSel]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
        {!showMore && recommended.length > 0 ? (
          <TouchableOpacity style={styles.addMoreBtn} onPress={() => setShowMore(true)} activeOpacity={0.75}>
            <Text style={styles.addMoreText}>+ Add more sectors ({extra.length} available)</Text>
          </TouchableOpacity>
        ) : (
          <>
            {recommended.length > 0 && <Text style={styles.sectionLabel}>ALL SECTORS</Text>}
            <TextInput style={styles.searchInput} placeholder="Search categories..." placeholderTextColor={colors.textMuted} value={search} onChangeText={setSearch} />
            {extra.map(cat => (
              <TouchableOpacity key={cat} style={[styles.chip, selected.has(cat) && styles.chipSelected]} onPress={() => toggle(cat)} activeOpacity={0.75}>
                <Text style={[styles.chipLabel, selected.has(cat) && styles.chipLabelSel]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
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
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: spacing.md, marginBottom: spacing.xs, paddingHorizontal: spacing.lg },
  badge: { alignSelf: 'flex-start', marginHorizontal: spacing.lg, marginBottom: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  chips: { paddingHorizontal: spacing.lg, gap: spacing.xs },
  addMoreBtn: { marginTop: spacing.md, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg, borderStyle: 'dashed' as any, paddingVertical: 14, alignItems: 'center' as const },
  addMoreText: { fontSize: 14, fontWeight: '600', color: colors.primary },
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
