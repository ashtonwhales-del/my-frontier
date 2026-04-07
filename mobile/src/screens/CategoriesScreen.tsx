import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { fetchCategories } from '../api';
import { colors, spacing, radius, shadow } from '../theme';
import StepProgressBar from '../components/StepProgressBar';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Categories'>;
  route: RouteProp<RootStackParamList, 'Categories'>;
};

// Emoji icons — keys must match the category names returned by the API exactly.
// Each emoji is unique; no two entries share the same character.
// Duplicate check (Africa 🌍 → 🌴; Emerging & International Markets retains 🌍).
const CATEGORY_ICONS: Record<string, string> = {
  // ── Core categories (match SECTOR_TO_ETFS keys exactly) ──────────────────
  'AI & Technology':                  '💻',
  'Bonds & Fixed Income':             '🏛️',
  'Clean Energy & Environment':       '⚡',
  'Commodities & Resources':          '🪙',
  'Consumer & Retail':                '🛒',
  'Crypto & Blockchain':              '₿',
  'Dividends & Income':               '💰',
  'Emerging & International Markets': '🌍',
  'Financials':                       '🏦',
  'Healthcare & Biotech':             '🏥',
  'Industrials & Defense':            '🏭',
  'Leveraged & Alternative':          '⚖️',
  'Real Estate':                      '🏠',
  'Robotics & Innovation':            '🤖',
  'Sector Specific':                  '🎯',
  'Small & Mid Cap':                  '📦',
  // ── Extended / etf_universe_extra categories ─────────────────────────────
  '3D Printing':                              '🖨️',
  'Africa':                                   '🌴',  // continent, no flag; was 🌍 (duplicate) → fixed
  'Airlines & Travel':                        '✈️',
  'Aluminum':                                 '🔩',
  'Asset Managers':                           '💼',
  'Banks':                                    '🏧',
  'Battery Technology':                       '🔋',
  'Blockchain':                               '🔗',
  'Brazil':                                   '🇧🇷',
  'Brokers & Exchanges':                      '🏪',
  'Buffered ETFs':                            '🛡️',
  'Catholic Values':                          '✝️',
  'Chemicals':                                '⚗️',
  'China':                                    '🇨🇳',
  'Cloud Computing':                          '☁️',
  'Coal':                                     '🪨',
  'Convertible Bonds':                        '🔄',
  'Copper':                                   '🟤',
  'Covered Calls':                            '📋',
  'Cybersecurity':                            '🔐',
  'Decentralized Finance (DeFi-adjacent)':    '🏗️',
  'Dividend Growth':                          '📈',
  'E-commerce':                               '🛍️',
  'ESG & Ethical':                            '🌱',
  'Electric Vehicles':                        '🚗',
  'Europe':                                   '🇪🇺',
  'Farming & Agriculture':                    '🌾',
  'Fertilizers':                              '🌿',
  'Floating Rate':                            '🌊',
  'Frontier Markets':                         '🗺️',
  'Gaming':                                   '🎮',
  'Gen Z':                                    '📱',
  'Genomics':                                 '🧬',
  'Gold Miners':                              '🥇',
  'Hemp & Cannabis':                          '🍃',
  'High Yield':                               '📉',
  'Homebuilders':                             '🏘️',
  'Hospitals':                                '🏨',
  'India':                                    '🇮🇳',
  'Infrastructure':                           '🌉',
  'Insurance':                                '☂️',
  'Investment Grade Corporate':               '🏢',
  'Islamic Finance':                          '☪️',
  'Israel':                                   '🇮🇱',
  'Japan':                                    '🇯🇵',
  'Latin America':                            '🌎',
  'Lithium':                                  '🔌',
  'Longevity / Aging':                        '🧓',
  'Medical Devices':                          '🩺',
  'Metaverse':                                '🥽',
  'Millennials':                              '🧑',
  'Money Market / Cash-like':                 '💵',
  'Mortgage Backed':                          '🏡',
  'Municipal Bonds':                          '🏙️',
  'Natural Gas':                              '🔥',
  'Nuclear Energy':                           '☢️',
  'Obesity & Weight Loss':                    '⚕️',
  'Oil & Gas Exploration':                    '🛢️',
  'Oil Services':                             '⛽',
  'Payments & Fintech':                       '💳',
  'Pet Care':                                 '🐾',
  'Pharmaceuticals':                          '💊',
  'Preferred Stock':                          '⭐',
  'REITs by type':                            '🏬',
  'Rare Earth Metals':                        '💎',
  'Senior Loans':                             '📜',
  'Shipping':                                 '🚢',
  'Silver Miners':                            '🥈',
  'Social Media':                             '📲',
  'Southeast Asia':                           '🌏',
  'Space':                                    '🛸',
  'Sports Betting':                           '🎰',
  'Steel':                                    '🔧',
  'Timber':                                   '🌲',
  'Transportation':                           '🚛',
  'Treasury Inflation Protected':             '🗝️',
  'Ultra Short Term':                         '⏱️',
  'Uranium':                                  '⚛️',
  'Veterinary':                               '🐶',
  'Vietnam':                                  '🇻🇳',
  'Water':                                    '💧',
  'Women & Diversity':                        '👩',
  'Quantum Computing':                        '🔬',
};

// Accent colors — same key set as CATEGORY_ICONS
const CATEGORY_ACCENTS: Record<string, string> = {
  'AI & Technology':                  '#4361EE',
  'Healthcare & Biotech':             '#7209B7',
  'Clean Energy & Environment':       '#06D6A0',
  'Robotics & Innovation':            '#FB923C',
  'Real Estate':                      '#60A5FA',
  'Commodities & Resources':          '#F59E0B',
  'Financials':                       '#10B981',
  'Consumer & Retail':                '#EC4899',
  'Industrials & Defense':            '#6B7280',
  'Emerging & International Markets': '#8B5CF6',
  'Bonds & Fixed Income':             '#0EA5E9',
  'Dividends & Income':               '#F97316',
  'Small & Mid Cap':                  '#14B8A6',
  'Sector Specific':                  '#EF4444',
  'Crypto & Blockchain':              '#FBBF24',
  'Leveraged & Alternative':          '#84CC16',
  'Quantum Computing':                '#7C3AED',
};

const FALLBACK_ACCENTS = [
  '#4361EE', '#7209B7', '#06D6A0', '#FB923C', '#60A5FA',
  '#F59E0B', '#10B981', '#EC4899', '#8B5CF6', '#0EA5E9',
];

if (__DEV__) {
  // Verify every mapped category has a unique icon at startup
  const seen = new Set<string>();
  Object.entries(CATEGORY_ICONS).forEach(([name, emoji]) => {
    if (seen.has(emoji)) console.warn(`DUPLICATE ICON: "${emoji}" used by "${name}"`);
    seen.add(emoji);
  });
  console.log(`CATEGORY_ICONS: ${Object.keys(CATEGORY_ICONS).length} entries, ${seen.size} unique emojis`);
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const H_PAD = spacing.lg;
const GAP = spacing.sm;
const CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - GAP) / 2;

export default function CategoriesScreen({ navigation, route }: Props) {
  const { name } = route.params;
  const [categories, setCategories] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories()
      .then(cats => {
        setCategories(cats);
        if (__DEV__) {
          const iconKeys = new Set(Object.keys(CATEGORY_ICONS));
          cats.forEach(cat => {
            if (!iconKeys.has(cat))
              console.warn(`ICON MISSING: API returned category "${cat}" with no entry in CATEGORY_ICONS — will show fallback 📊`);
          });
          const apiSet = new Set(cats);
          Object.keys(CATEGORY_ICONS).forEach(key => {
            if (!apiSet.has(key))
              console.warn(`UNUSED ICON KEY: "${key}" in CATEGORY_ICONS was not returned by the API`);
          });
        }
      })
      .catch(() =>
        Alert.alert(
          'Connection Error',
          'Could not reach the API at http://192.168.1.60:8000. Make sure the server is running.',
        )
      )
      .finally(() => setLoading(false));
  }, []);

  function toggle(cat: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  // Pair categories into rows of two for the grid
  const rows: string[][] = [];
  for (let i = 0; i < categories.length; i += 2) {
    rows.push(categories.slice(i, i + 2));
  }

  const canContinue = selected.size > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
      <StepProgressBar currentStep={1} totalSteps={4} labels={['Categories', 'Risk Level', 'Investment', 'Results']} />

      <Text style={styles.title}>Choose Your Future</Text>
      <Text style={styles.subtitle}>
        Which sectors do you believe offer the most long-term growth potential and stability?
      </Text>

      {selected.size > 0 && (
        <View style={styles.selectionBadge}>
          <Text style={styles.selectionBadgeText}>
            {selected.size} sector{selected.size > 1 ? 's' : ''} selected
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading sectors…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {row.map((cat, colIdx) => {
                // Look up icon and accent separately — no nested object, no fallback object
                const icon   = CATEGORY_ICONS[cat]   ?? '📊';
                const accent = CATEGORY_ACCENTS[cat] ?? FALLBACK_ACCENTS[(rowIdx * 2 + colIdx) % FALLBACK_ACCENTS.length];
                const isSelected = selected.has(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.card,
                      { width: CARD_WIDTH },
                      isSelected && { backgroundColor: accent, borderColor: accent },
                    ]}
                    onPress={() => toggle(cat)}
                    activeOpacity={0.75}
                  >
                    {/* Left accent bar (unselected) */}
                    {!isSelected && (
                      <View style={[styles.accentBar, { backgroundColor: accent }]} />
                    )}

                    {/* Check badge (selected) */}
                    {isSelected && (
                      <View style={styles.checkOverlay}>
                        <Text style={styles.checkOverlayText}>✓</Text>
                      </View>
                    )}

                    {/* 52×52 circle with emoji rendered as plain Text — no images */}
                    <View style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isSelected
                          ? 'rgba(255,255,255,0.25)'
                          : accent + '25',
                      },
                    ]}>
                      <Text style={styles.cardIcon}>{icon}</Text>
                    </View>

                    <Text
                      style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}
                      numberOfLines={2}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {/* Spacer if odd category at end */}
              {row.length === 1 && <View style={{ width: CARD_WIDTH }} />}
            </View>
          ))}
          <View style={{ height: spacing.xl }} />
        </ScrollView>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !canContinue && styles.buttonDisabled]}
          onPress={() =>
            navigation.navigate('RiskTolerance', {
              name,
              categories: Array.from(selected),
            })
          }
          disabled={!canContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {canContinue
              ? `Continue with ${selected.size} sector${selected.size > 1 ? 's' : ''} →`
              : 'Select at least one sector'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingTop: 56,
    paddingBottom: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  backText: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    paddingHorizontal: H_PAD,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: H_PAD,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  selectionBadge: {
    alignSelf: 'flex-start',
    marginHorizontal: H_PAD,
    marginBottom: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  selectionBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  grid: {
    paddingHorizontal: H_PAD,
    paddingTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: GAP,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 100,
    overflow: 'hidden',
    ...shadow.sm,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  checkOverlay: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOverlayText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  cardIcon: { fontSize: 28 },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  cardLabelSelected: { color: '#fff', fontWeight: '700' },
  footer: {
    padding: H_PAD,
    paddingBottom: spacing.xl,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadow.md,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
