import Ionicons from '@expo/vector-icons/Ionicons';
import type { ProductSummaryDto } from '@simple-concepts/shared';
import { Image } from 'expo-image';
import { View } from 'react-native';

import { CAMERA_CATEGORY_SLUGS, CATEGORY_ICONS, DEFAULT_CATEGORY_ICON } from '@/constants/catalog';
import { ICON_SIZE, colors } from '@/constants/theme';
import { resolveImageUrl } from '@/lib/image-url';
import { strings } from '@/lib/i18n';

type ProductArtProps = {
  name: string;
  imageUrl: string | null;
  category: ProductSummaryDto['category'];
  height: number;
  iconSize?: number;
};

export function ProductArt({
  name,
  imageUrl,
  category,
  height,
  iconSize = ICON_SIZE.hero,
}: ProductArtProps) {
  if (imageUrl) {
    return (
      <Image
        accessibilityLabel={strings.product.imageOf(name)}
        cachePolicy="memory-disk"
        contentFit="contain"
        source={resolveImageUrl(imageUrl)}
        style={{ height, width: '100%' }}
      />
    );
  }

  const icon = CAMERA_CATEGORY_SLUGS.includes(category.slug)
    ? DEFAULT_CATEGORY_ICON
    : (CATEGORY_ICONS[category.slug] ??
      (category.parentSlug ? CATEGORY_ICONS[category.parentSlug] : undefined) ??
      DEFAULT_CATEGORY_ICON);

  return (
    <View
      accessibilityElementsHidden
      className="w-full items-center justify-center rounded-xl bg-brand-tint"
      importantForAccessibility="no-hide-descendants"
      style={{ height }}>
      <Ionicons name={icon} size={iconSize} color={colors.brand} />
    </View>
  );
}
