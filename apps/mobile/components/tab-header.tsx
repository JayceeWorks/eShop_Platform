import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientFill } from './gradient-fill';

const HEADER_TOP_PADDING = 12;

export function TabHeader({ title, children }: { title: string; children?: ReactNode }) {
  const { top } = useSafeAreaInsets();

  return (
    <View
      className="overflow-hidden bg-brand px-4 pb-3"
      style={{ paddingTop: top + HEADER_TOP_PADDING }}>
      <GradientFill name="header" />
      <Text accessibilityRole="header" className="text-xl font-bold text-white">
        {title}
      </Text>
      {children}
    </View>
  );
}
