import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  LinearGradient,
  vec,
  Group,
  SkPath,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

export type SparklineTone = 'positive' | 'negative' | 'neutral' | 'auto';

export interface SparklineProps {
  data: number[];
  width: number;
  height: number;
  tone?: SparklineTone;
  fillGradient?: boolean;
  strokeWidth?: number;
}

function buildSmoothPath(points: { x: number; y: number }[]): SkPath {
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

function buildAreaPath(points: { x: number; y: number }[], height: number): SkPath {
  const path = Skia.Path.Make();
  if (points.length === 0) return path;
  path.moveTo(points[0].x, height);
  path.lineTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = (p1.x - p0.x) / 2;
    path.cubicTo(p0.x + dx, p0.y, p0.x + dx, p1.y, p1.x, p1.y);
  }
  path.lineTo(points[points.length - 1].x, height);
  path.close();
  return path;
}

export default function Sparkline({
  data,
  width,
  height,
  tone = 'auto',
  fillGradient = true,
  strokeWidth = 2,
}: SparklineProps) {
  const { palette } = useTheme();

  const strokeColor = useMemo(() => {
    let resolved: SparklineTone = tone;
    if (tone === 'auto') {
      if (data.length < 2) resolved = 'neutral';
      else {
        const delta = data[data.length - 1] - data[0];
        resolved = delta >= 0 ? 'positive' : 'negative';
      }
    }
    if (resolved === 'positive') return palette.accent;
    if (resolved === 'negative') return palette.signalRed;
    return palette.textSecondary;
  }, [tone, data, palette]);

  const points = useMemo(() => {
    if (data.length < 2) return [];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padY = strokeWidth + 1;
    const innerH = Math.max(1, height - padY * 2);
    const stepX = data.length === 1 ? 0 : width / (data.length - 1);
    return data.map((v, i) => ({
      x: i * stepX,
      y: padY + innerH - ((v - min) / range) * innerH,
    }));
  }, [data, width, height, strokeWidth]);

  const linePath = useMemo(() => buildSmoothPath(points), [points]);
  const areaPath = useMemo(() => buildAreaPath(points, height), [points, height]);

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [progress, data]);

  if (data.length < 2) return <View style={{ width, height }} />;

  const fillTop = strokeColor + '4D'; // ~30%
  const fillBot = strokeColor + '00'; // 0%

  return (
    <View style={{ width, height }}>
      <Canvas style={{ width, height }}>
        {fillGradient && (
          <Group opacity={progress}>
            <Path path={areaPath} style="fill">
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, height)}
                colors={[fillTop, fillBot]}
              />
            </Path>
          </Group>
        )}
        <Path
          path={linePath}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeJoin="round"
          strokeCap="round"
          color={strokeColor}
          start={0}
          end={progress}
        />
      </Canvas>
    </View>
  );
}
