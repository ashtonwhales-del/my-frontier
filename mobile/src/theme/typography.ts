import { TextStyle } from 'react-native';

// Financial number scale
export const NumberScale = {
  xl:  { fontSize: 48, fontWeight: '700' } as TextStyle,
  lg:  { fontSize: 32, fontWeight: '700' } as TextStyle,
  md:  { fontSize: 24, fontWeight: '600' } as TextStyle,
  sm:  { fontSize: 18, fontWeight: '600' } as TextStyle,
};

// Heading scale
export const HeadingScale = {
  xl: { fontSize: 28, fontWeight: '700' } as TextStyle,
  lg: { fontSize: 22, fontWeight: '700' } as TextStyle,
  md: { fontSize: 18, fontWeight: '600' } as TextStyle,
};

// Body scale
export const BodyScale = {
  lg: { fontSize: 16, fontWeight: '400', lineHeight: 24 } as TextStyle,
  md: { fontSize: 14, fontWeight: '400', lineHeight: 20 } as TextStyle,
  sm: { fontSize: 12, fontWeight: '400' } as TextStyle,
};

// Label style
export const LabelStyle: TextStyle = {
  fontSize: 11,
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: 0.8,
};
