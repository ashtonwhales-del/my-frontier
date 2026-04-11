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
};
