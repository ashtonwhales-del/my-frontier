// Re-exports new design system — backward-compatible with all existing screen imports
export { Colors as colors, type ColorKey } from './theme/colors';
export { Spacing as spacing, Radius as radius } from './theme/spacing';
export { NumberScale, HeadingScale, BodyScale, LabelStyle } from './theme/typography';

// Merged shadow — includes both legacy (sm, md) and new (card, blueGlow, goldGlow) keys
export const shadow = {
  sm:       { shadowColor: '#000',    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 4,  elevation: 3  },
  md:       { shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2,  shadowRadius: 12, elevation: 6  },
  card:     { shadowColor: '#000',    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,  shadowRadius: 12, elevation: 8  },
  blueGlow: { shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4,  shadowRadius: 20, elevation: 12 },
  goldGlow: { shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 10 },
} as const;
