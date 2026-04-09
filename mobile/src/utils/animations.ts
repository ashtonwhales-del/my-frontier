import { Animated, Easing } from 'react-native';

/** Returns a scale Animated.Value + handlers for press-in/out */
export function pressScale(toValue = 0.97, speed = 50) {
  const scale = new Animated.Value(1);
  const onPressIn = () =>
    Animated.spring(scale, { toValue, useNativeDriver: true, speed }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed }).start();
  return { scale, onPressIn, onPressOut };
}

/** Returns an opacity Animated.Value pre-faded to 0, and a start() to fade in */
export function fadeIn(duration = 600) {
  const opacity = new Animated.Value(0);
  const start = () =>
    Animated.timing(opacity, { toValue: 1, duration, useNativeDriver: true }).start();
  return { opacity, start };
}

/** Returns a translateY Animated.Value pre-offet by dy, and a start() to slide up */
export function slideUp(dy = 24, duration = 400) {
  const translateY = new Animated.Value(dy);
  const start = () =>
    Animated.timing(translateY, {
      toValue: 0, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  return { translateY, start };
}

/** Animates a number value from start to end over duration — attach to Text via interpolate */
export function numberRoll(from: number, to: number, duration = 800) {
  const anim = new Animated.Value(from);
  const start = () =>
    Animated.timing(anim, { toValue: to, duration, useNativeDriver: false }).start();
  return { anim, start };
}

/** Repeating pulse on any Animated.Value (typically opacity or scale) */
export function pulse(value: Animated.Value, min = 0.6, max = 1.0, duration = 900) {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, { toValue: max, duration, useNativeDriver: true }),
      Animated.timing(value, { toValue: min, duration, useNativeDriver: true }),
    ])
  );
}

/** Stagger-reveal an array of Animated.Values from 0→1 with offset delay */
export function staggerChildren(
  values: Animated.Value[],
  delay = 80,
  duration = 300,
): Animated.CompositeAnimation {
  return Animated.stagger(
    delay,
    values.map(v =>
      Animated.timing(v, { toValue: 1, duration, useNativeDriver: true })
    )
  );
}
