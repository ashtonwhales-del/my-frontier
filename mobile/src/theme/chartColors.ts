import { AppPalette } from './colors';

// Returns `count` green shades for multi-series charts
// Darkest = largest value / first series, lightest = smallest
export function getGrowthShades(palette: AppPalette, count: number): string[] {
  if (count <= 0) return [];
  const base = palette.accent;
  const soft = palette.accentSoft;
  if (count === 1) return [base];
  const shades: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    shades.push(mixHex(base, soft, t));
  }
  return shades;
}

export function getSemanticDataColor(
  palette: AppPalette,
  value: number,
  options?: { zero?: 'neutral' | 'positive' }
): string {
  if (value > 0) return palette.accent;
  if (value < 0) return palette.signalRed;
  return options?.zero === 'positive' ? palette.accent : palette.textSecondary;
}

function mixHex(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ];
  };
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const mix = (x: number, y: number) => Math.round(x + (y - x) * t);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(mix(ar, br))}${toHex(mix(ag, bg))}${toHex(mix(ab, bb))}`;
}
