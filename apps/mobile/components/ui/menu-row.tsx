import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import type { IconName } from '@/constants/catalog';
import { ICON_SIZE, colors } from '@/constants/theme';

type MenuRowProps = {
  icon: IconName;
  title: string;
  hint?: string;
  badge?: string;
  onPress: () => void;
};

export function MenuRow({ icon, title, hint, badge, onPress }: MenuRowProps) {
  return (
    <Pressable
      accessibilityHint={hint}
      accessibilityLabel={badge ? `${title}, ${badge}` : title}
      accessibilityRole="link"
      className="min-h-16 flex-row items-center border-b border-gray-100 px-4 py-3 active:bg-gray-50"
      onPress={onPress}>
      <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-tint">
        <Ionicons color={colors.brand} name={icon} size={ICON_SIZE.medium} />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-base font-semibold text-gray-900">{title}</Text>
        {hint ? <Text className="text-sm text-gray-500">{hint}</Text> : null}
      </View>
      {badge ? (
        <Text className="mr-2 overflow-hidden rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-brand">
          {badge}
        </Text>
      ) : null}
      <Ionicons color={colors.muted} name="chevron-forward" size={ICON_SIZE.small} />
    </Pressable>
  );
}

/** A white rounded card that groups rows or form fields. */
export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={`overflow-hidden rounded-2xl border border-gray-200 bg-white ${className}`}>
      {children}
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return (
    <Text accessibilityRole="header" className="mb-2 mt-4 text-lg font-bold text-brand">
      {children}
    </Text>
  );
}
