import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  LinearGradient,
  vec,
  Group,
  Circle,
  SkPath,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
  useDerivedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '../../context/ThemeContext';
import { haptic } from '../../utils/haptic';

export type AreaTone = 'positive' | 'negative' | 'neutral';

export interface AreaChartPoint {
  x: number | string;
  y: number;
}

export interface AreaChartProps {
  data: AreaChartPoint[];
  width: number;
  height: number;
  tone?: AreaTone;
  showGrid?: boolean;
  enableScrub?: boolean;
  onScrub?: (point: { x: number | string; y: number; index: number } | null) => void;
  yFormat?: (v: number) => string;
  xFormat?: (v: number | string) => string;
}

const PAD_L = 46;
const PAD_R = 10;
const PAD_T = 12;
const PAD_B = 24;

function buildLinePath(points: { x: number; y: number }[]): SkPath {
  const path = Skia.Path.Make();
  if (points.length === 0) return path;
  path.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = (p1.x - p0.x) / 2;
    path.cubicTo(p0.x + dx, p0.y, p0.x + dx, p1.y, p1.x, p1.y);
  }
  return path;
}

function buildAreaPath(
  points: { x: number; y: number }[],
  baseY: number,
): SkPath {
  const path = Skia.Path.Make();
  if (points.length === 0) return path;
  path.moveTo(points[0].x, baseY);
  path.lineTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = (p1.x - p0.x) / 2;
    path.cubicTo(p0.x + dx, p0.y, p0.x + dx, p1.y, p1.x, p1.y);
  }
  path.lineTo(points[points.length - 1].x, baseY);
  path.close();
  return path;
}

export default function AreaChart({
  data,
  width,
  height,
  tone = 'positive',
  showGrid = true,
  enableScrub = true,
  onScrub,
  yFormat = v => `${Math.round(v)}`,
  xFormat = v => String(v),
}: AreaChartProps) {
  const { palette } = useTheme();

  const innerW = Math.max(1, width - PAD_L - PAD_R);
  const innerH = Math.max(1, height - PAD_T - PAD_B);
  const baseY = PAD_T + innerH;

  const strokeColor =
    tone === 'positive' ? palette.accent
    : tone === 'negative' ? palette.signalRed
    : palette.textSecondary;

  const { points, yTicks, xTickIndices, minY, maxY } = useMemo(() => {
    if (data.length < 2) {
      return { points: [], yTicks: [] as number[], xTickIndices: [] as number[], minY: 0, maxY: 1 };
    }
    const ys = data.map(d => d.y);
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    const range = max - min || 1;
    const stepX = innerW / (data.length - 1);
    const pts = data.map((d, i) => ({
      x: PAD_L + i * stepX,
      y: PAD_T + innerH - ((d.y - min) / range) * innerH,
    }));
    const ticks = [min, min + range / 3, min + (2 * range) / 3, max];
    const n = data.length;
    const xIdx = n <= 4
      ? data.map((_, i) => i)
      : [0, Math.floor(n / 3), Math.floor((2 * n) / 3), n - 1];
    return { points: pts, yTicks: ticks, xTickIndices: xIdx, minY: min, maxY: max };
  }, [data, innerW, innerH]);

  const linePath = useMemo(() => buildLinePath(points), [points]);
  const areaPath = useMemo(() => buildAreaPath(points, baseY), [points, baseY]);

  // Mount draw-in animation
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
  }, [progress, data]);

  // Scrub state
  const scrubX = useSharedValue<number | null>(null);
  const scrubY = useSharedValue<number | null>(null);
  const scrubOpacity = useSharedValue(0);
  const [tooltipIndex, setTooltipIndex] = useState<number | null>(null);
  const lastIndex = useSharedValue<number>(-1);

  const handleSnap = (index: number) => {
    const p = points[index];
    if (!p) return;
    scrubX.value = p.x;
    scrubY.value = p.y;
    setTooltipIndex(index);
    onScrub?.({ x: data[index].x, y: data[index].y, index });
  };

  const handleEnd = () => {
    setTooltipIndex(null);
    onScrub?.(null);
  };

  const fireHaptic = () => haptic.selection();

  const pan = Gesture.Pan()
    .enabled(enableScrub && data.length >= 2)
    .onBegin(e => {
      'worklet';
      scrubOpacity.value = withTiming(1, { duration: 120 });
      const xClamped = Math.max(PAD_L, Math.min(PAD_L + innerW, e.x));
      const stepX = innerW / Math.max(1, data.length - 1);
      const idx = Math.round((xClamped - PAD_L) / stepX);
      if (idx !== lastIndex.value) {
        lastIndex.value = idx;
        runOnJS(fireHaptic)();
      }
      runOnJS(handleSnap)(idx);
    })
    .onUpdate(e => {
      'worklet';
      const xClamped = Math.max(PAD_L, Math.min(PAD_L + innerW, e.x));
      const stepX = innerW / Math.max(1, data.length - 1);
      const idx = Math.round((xClamped - PAD_L) / stepX);
      if (idx !== lastIndex.value) {
        lastIndex.value = idx;
        runOnJS(fireHaptic)();
        runOnJS(handleSnap)(idx);
      }
    })
    .onFinalize(() => {
      'worklet';
      scrubOpacity.value = withDelay(50, withTiming(0, { duration: 200 }));
      lastIndex.value = -1;
      runOnJS(handleEnd)();
    });

  const markerCx = useDerivedValue(() => scrubX.value ?? -10);
  const markerCy = useDerivedValue(() => scrubY.value ?? -10);
  const indicatorPath = useDerivedValue(() => {
    const x = scrubX.value;
    const p = Skia.Path.Make();
    if (x == null) return p;
    p.moveTo(x, PAD_T);
    p.lineTo(x, PAD_T + innerH);
    return p;
  });

  const fillTop = strokeColor + '4D';
  const fillBot = strokeColor + '00';

  if (data.length < 2) {
    return <View style={{ width, height }} />;
  }

  const tooltip = tooltipIndex != null ? data[tooltipIndex] : null;
  const tooltipPoint = tooltipIndex != null ? points[tooltipIndex] : null;

  return (
    <View style={{ width, height }}>
      <GestureDetector gesture={pan}>
        <View style={{ width, height }}>
          <Canvas style={{ width, height }}>
            {/* Gridlines */}
            {showGrid && yTicks.map((tick, i) => {
              const range = (maxY - minY) || 1;
              const y = PAD_T + innerH - ((tick - minY) / range) * innerH;
              const p = Skia.Path.Make();
              p.moveTo(PAD_L, y);
              p.lineTo(PAD_L + innerW, y);
              return (
                <Path
                  key={`grid-${i}`}
                  path={p}
                  style="stroke"
                  strokeWidth={1}
                  color={palette.borderSubtle}
                />
              );
            })}

            {/* Area fill */}
            <Group opacity={progress}>
              <Path path={areaPath} style="fill">
                <LinearGradient
                  start={vec(0, PAD_T)}
                  end={vec(0, baseY)}
                  colors={[fillTop, fillBot]}
                />
              </Path>
            </Group>

            {/* Line stroke */}
            <Path
              path={linePath}
              style="stroke"
              strokeWidth={2}
              strokeJoin="round"
              strokeCap="round"
              color={strokeColor}
              start={0}
              end={progress}
            />

            {/* Scrub indicator + marker */}
            <Group opacity={scrubOpacity}>
              <Path
                path={indicatorPath}
                style="stroke"
                strokeWidth={1}
                color={palette.textSecondary}
              />
              <Circle cx={markerCx} cy={markerCy} r={5} color={strokeColor} />
              <Circle cx={markerCx} cy={markerCy} r={2.5} color={palette.bgPrimary} />
            </Group>
          </Canvas>

          {/* Y axis labels (overlay) */}
          {yTicks.map((tick, i) => {
            const range = (maxY - minY) || 1;
            const y = PAD_T + innerH - ((tick - minY) / range) * innerH;
            return (
              <Text
                key={`yl-${i}`}
                style={[
                  styles.axisLabel,
                  {
                    color: palette.textTertiary,
                    top: y - 7,
                    left: 0,
                    width: PAD_L - 6,
                    textAlign: 'right',
                  },
                ]}
                numberOfLines={1}
              >
                {yFormat(tick)}
              </Text>
            );
          })}

          {/* X axis labels */}
          {xTickIndices.map(i => {
            const p = points[i];
            if (!p) return null;
            return (
              <Text
                key={`xl-${i}`}
                style={[
                  styles.axisLabel,
                  {
                    color: palette.textTertiary,
                    top: baseY + 6,
                    left: p.x - 28,
                    width: 56,
                    textAlign: 'center',
                  },
                ]}
                numberOfLines={1}
              >
                {xFormat(data[i].x)}
              </Text>
            );
          })}

          {/* Tooltip */}
          {tooltip && tooltipPoint && (
            <View
              pointerEvents="none"
              style={[
                styles.tooltip,
                {
                  backgroundColor: palette.bgElevated,
                  borderColor: palette.borderDefault,
                  left: Math.max(PAD_L, Math.min(PAD_L + innerW - 110, tooltipPoint.x - 55)),
                  top: Math.max(PAD_T, tooltipPoint.y - 54),
                },
              ]}
            >
              <Text style={[styles.tooltipX, { color: palette.textTertiary }]}>
                {xFormat(tooltip.x)}
              </Text>
              <Text style={[styles.tooltipY, { color: palette.textPrimary }]}>
                {yFormat(tooltip.y)}
              </Text>
            </View>
          )}
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  axisLabel: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '500',
  },
  tooltip: {
    position: 'absolute',
    width: 110,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  tooltipX: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  tooltipY: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
});
