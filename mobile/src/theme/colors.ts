// Design system color tokens — ALL components must use these, never raw hex strings

export const Colors = {
  // Backgrounds
  bgPrimary: '#0A0F1E',
  bgCard: '#0F1629',
  bgCardElevated: '#152035',
  bgInput: '#1A2640',

  // Borders
  borderSubtle: '#1E2A45',

  // Brand
  brandBlue: '#3B82F6',
  brandGold: '#F59E0B',

  // Semantic
  positive: '#10B981',
  positiveSubtle: '#064E3B',
  negative: '#EF4444',
  negativeSubtle: '#450A0A',

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#475569',
  textGold: '#FCD34D',

  // Gradients (pass to LinearGradient colors prop)
  gradientBlue: ['#1D4ED8', '#3B82F6'] as const,
  gradientGold: ['#D97706', '#F59E0B'] as const,

  // Legacy aliases — keeps existing screens working without edits
  primary: '#3B82F6',
  primaryDark: '#1D4ED8',
  accent: '#7209B7',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  bg: '#0A0F1E',
  card: '#0F1629',
  textMuted: '#475569',
  border: '#1E2A45',

  // Palette aliases for useTheme() migration
  bgElevated: '#0F1629',
  bgMuted: '#1A2640',
  borderDefault: '#1E2A45',
  signalRed: '#EF4444',
  signalAmber: '#F59E0B',
} as const;

export type ColorKey = keyof typeof Colors;

export const LightColors: Record<keyof typeof Colors, string | readonly string[]> = {
  bgPrimary: '#F8FAFC', bgCard: '#FFFFFF', bgCardElevated: '#F1F5F9', bgInput: '#E2E8F0',
  borderSubtle: '#E2E8F0',
  brandBlue: '#2563EB', brandGold: '#D97706',
  positive: '#059669', positiveSubtle: '#D1FAE5', negative: '#DC2626', negativeSubtle: '#FEE2E2',
  textPrimary: '#0F172A', textSecondary: '#334155', textTertiary: '#94A3B8', textGold: '#92400E',
  gradientBlue: ['#1D4ED8', '#3B82F6'] as const, gradientGold: ['#D97706', '#F59E0B'] as const,
  primary: '#2563EB', primaryDark: '#1D4ED8', accent: '#7209B7', success: '#059669',
  warning: '#D97706', danger: '#DC2626', bg: '#F8FAFC', card: '#FFFFFF', textMuted: '#64748B', border: '#E2E8F0',
  bgElevated: '#FFFFFF', bgMuted: '#E2E8F0', borderDefault: '#E2E8F0', signalRed: '#DC2626', signalAmber: '#D97706',
};

// ── Theme-aware palettes (used by ThemeContext) ────────────────────────────
// 14 semantic fields + brandBlue (used by all migrated components)

export const LightPalette = {
  bgPrimary:      '#FAFAF7',
  bgElevated:     '#FFFFFF',
  bgMuted:        '#F1EFE8',
  textPrimary:    '#0A0A0B',
  textSecondary:  '#5F5E5A',
  textTertiary:   '#888780',
  borderSubtle:   'rgba(10,10,11,0.08)',
  borderDefault:  'rgba(10,10,11,0.14)',
  accent:         '#047857',
  accentSoft:     '#D1FAE5',
  signalRed:      '#B91C1C',
  signalRedSoft:  '#FEE2E2',
  signalAmber:    '#B45309',
  signalAmberSoft:'#FEF3C7',
  brandBlue:      '#2563EB',
} as const;

export const DarkPalette = {
  bgPrimary:      '#0A0A0B',
  bgElevated:     '#141414',
  bgMuted:        '#1F1F1F',
  textPrimary:    '#FAFAF7',
  textSecondary:  '#A3A29E',
  textTertiary:   '#6B6A66',
  borderSubtle:   'rgba(250,250,247,0.08)',
  borderDefault:  'rgba(250,250,247,0.14)',
  accent:         '#00D67F',
  accentSoft:     '#052E20',
  signalRed:      '#F87171',
  signalRedSoft:  '#2A0E0E',
  signalAmber:    '#FBBF24',
  signalAmberSoft:'#2A1F07',
  brandBlue:      '#3B82F6',
} as const;

export type AppPalette = { [K in keyof typeof LightPalette]: string };
