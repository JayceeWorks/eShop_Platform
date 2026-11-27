import type { ProductSummaryDto } from '@simple-concepts/shared';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ICON_SIZE } from '@/constants/theme';

import { PriceBlock } from './price-block';
import { ProductArt } from './product-art';
import { StockLabel } from './stock-label';

const CARD_IMAGE_HEIGHT = 128;

export function ProductCard({ product }: { product: ProductSummaryDto }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={product.name}
      className="flex-1 rounded-2xl border border-gray-200 bg-white p-2 active:opacity-80"
      onPress={() => router.push({ pathname: '/product/[slug]', params: { slug: product.slug } })}>
      <ProductArt
        category={product.category}
        height={CARD_IMAGE_HEIGHT}
        iconSize={ICON_SIZE.hero - ICON_SIZE.medium}
        imageUrl={product.imageUrl}
        name={product.name}
      />
      <Text className="mt-2 text-xs text-gray-500" numberOfLines={1}>
        {product.brand}
      </Text>
      <Text className="mt-0.5 min-h-10 text-sm font-semibold text-gray-900" numberOfLines={2}>
        {product.name}
      </Text>
      <View className="mt-1">
        <PriceBlock mrpInPaise={product.mrpInPaise} priceInPaise={product.priceInPaise} />
      </View>
      <View className="mt-1">
        <StockLabel stockQty={product.stockQty} />
      </View>
    </Pressable>
  );
}
