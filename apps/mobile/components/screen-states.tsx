import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import type { IconName } from '@/constants/catalog';
import { ICON_SIZE, colors } from '@/constants/theme';
import { strings } from '@/lib/i18n';

const SKELETON_CARD_COUNT = 4;

export function ProductGridSkeleton() {
  return (
    <View accessibilityLabel="Loading" className="flex-row flex-wrap p-2">
      {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
        <View key={index} className="w-1/2 p-1.5">
          <View className="rounded-2xl border border-gray-200 bg-white p-2">
            <View className="h-32 rounded-lg bg-gray-200" />
            <View className="mt-3 h-3 w-4/5 rounded bg-gray-200" />
            <View className="mt-2 h-3 w-1/2 rounded bg-gray-200" />
            <View className="mt-3 h-4 w-2/3 rounded bg-gray-200" />
          </View>
        </View>
      ))}
    </View>
  );
}

type MessageStateProps = {
  icon: IconName;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function MessageState({ icon, title, body, actionLabel, onAction }: MessageStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Ionicons name={icon} size={ICON_SIZE.hero} color={colors.muted} />
      <Text className="mt-4 text-center text-lg font-bold text-brand">{title}</Text>
      {body ? <Text className="mt-1 text-center text-gray-600">{body}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          className="mt-5 min-h-12 justify-center rounded-full bg-brand px-6"
          onPress={onAction}>
          <Text className="font-semibold text-white">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <MessageState
      icon="cloud-offline-outline"
      title={strings.common.loadError}
      actionLabel={strings.common.retry}
      onAction={onRetry}
    />
  );
}
