import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { GRADIENTS, type GradientName } from '@/constants/theme';

/** Fills its parent with a theme gradient. Put it first inside a View with overflow-hidden. */
export function GradientFill({ name }: { name: GradientName }) {
  const { colors, start, end } = GRADIENTS[name];
  return (
    <LinearGradient
      colors={colors}
      end={end}
      pointerEvents="none"
      start={start}
      style={StyleSheet.absoluteFill}
    />
  );
}
