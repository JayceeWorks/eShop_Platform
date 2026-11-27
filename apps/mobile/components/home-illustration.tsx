import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { strings } from '@/lib/i18n';

// The artwork is drawn on a 400 × 300 canvas.
const ILLUSTRATION_ASPECT_RATIO = 4 / 3;

export function HomeIllustration() {
  return (
    <View className="mx-3 mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <Image
        accessibilityLabel={strings.home.illustrationLabel}
        contentFit="contain"
        source={require('@/assets/images/home-security.svg')}
        style={{ width: '100%', aspectRatio: ILLUSTRATION_ASPECT_RATIO }}
      />
      <View className="px-4 pb-4">
        <Text className="text-lg font-bold text-brand">{strings.home.illustrationTitle}</Text>
        <Text className="mt-1 text-sm text-gray-600">{strings.home.illustrationBody}</Text>
      </View>
    </View>
  );
}
