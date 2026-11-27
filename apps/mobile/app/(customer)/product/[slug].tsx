import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientFill } from '@/components/gradient-fill';
import { PriceBlock } from '@/components/price-block';
import { ProductArt } from '@/components/product-art';
import { ProductReviews } from '@/components/product-reviews';
import { ErrorState, MessageState } from '@/components/screen-states';
import { StockLabel } from '@/components/stock-label';
import { ICON_SIZE, MAX_APP_WIDTH, colors } from '@/constants/theme';
import { useCartStore } from '@/features/cart/cart-store';
import { useProduct } from '@/features/catalog/use-catalog';
import { ApiError } from '@/lib/api';
import { strings } from '@/lib/i18n';

const GALLERY_HEIGHT = 260;
const NOT_FOUND_STATUS = 404;
const BOTTOM_BAR_PADDING = 12;

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { bottom } = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const galleryWidth = Math.min(windowWidth, MAX_APP_WIDTH);
  const product = useProduct(slug);
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);

  if (product.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }
  if (product.isError) {
    if (product.error instanceof ApiError && product.error.status === NOT_FOUND_STATUS) {
      return <MessageState icon="alert-circle-outline" title={strings.product.notFound} />;
    }
    return <ErrorState onRetry={() => product.refetch()} />;
  }

  const item = product.data;
  const outOfStock = item.stockQty <= 0;
  const gallery: (string | null)[] = item.images.length > 0 ? item.images : [null];

  const goToCart = () => router.push('/cart');

  return (
    <View className="flex-1">
      <ScrollView className="flex-1" contentContainerClassName="pb-4">
        <ScrollView
          horizontal
          pagingEnabled
          className="bg-white"
          scrollEnabled={gallery.length > 1}
          showsHorizontalScrollIndicator={gallery.length > 1}>
          {gallery.map((url, index) => (
            <View key={url ?? index} className="p-3" style={{ width: galleryWidth }}>
              <ProductArt
                category={item.category}
                height={GALLERY_HEIGHT}
                iconSize={ICON_SIZE.hero * 2}
                imageUrl={url}
                name={item.name}
              />
            </View>
          ))}
        </ScrollView>

        <View className="bg-white px-4 pb-4">
          <Text className="text-sm text-gray-500">
            {strings.product.brandModel(item.brand, item.model)}
          </Text>
          <Text accessibilityRole="header" className="mt-1 text-xl font-bold text-gray-900">
            {item.name}
          </Text>
          <View className="mt-3">
            <PriceBlock large mrpInPaise={item.mrpInPaise} priceInPaise={item.priceInPaise} />
          </View>
          <View className="mt-2">
            <StockLabel stockQty={item.stockQty} />
          </View>
          <View className="mt-3 flex-row items-center rounded-lg bg-green-50 p-3">
            <Ionicons name="cash-outline" size={ICON_SIZE.medium} color={colors.success} />
            <Text className="ml-2 font-semibold text-green-800">{strings.common.codAvailable}</Text>
          </View>
        </View>

        <View className="mt-2 bg-white p-4">
          <Text accessibilityRole="header" className="mb-2 text-lg font-bold text-brand">
            {strings.product.specs}
          </Text>
          {item.specs.map(({ key, value }) => (
            <View key={key} className="flex-row border-b border-gray-100 py-2">
              <Text className="w-2/5 text-gray-600">{key}</Text>
              <Text className="flex-1 font-medium text-gray-900">{value}</Text>
            </View>
          ))}
        </View>

        <View className="mt-2 bg-white p-4">
          <Text accessibilityRole="header" className="mb-2 text-lg font-bold text-brand">
            {strings.product.description}
          </Text>
          <Text className="leading-6 text-gray-700">{item.description}</Text>
        </View>

        <ProductReviews slug={item.slug} />
      </ScrollView>

      <View
        className="flex-row border-t border-gray-200 bg-white px-3 pt-3"
        style={{ paddingBottom: bottom + BOTTOM_BAR_PADDING }}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: outOfStock }}
          className={`mr-2 min-h-12 flex-1 items-center justify-center rounded-full border border-brand ${
            outOfStock ? 'opacity-40' : ''
          }`}
          disabled={outOfStock}
          onPress={() => {
            if (added) {
              goToCart();
              return;
            }
            addItem(item.id, item.stockQty);
            setAdded(true);
          }}>
          <Text className="font-semibold text-brand">
            {added ? strings.product.addedToCart : strings.product.addToCart}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: outOfStock }}
          className={`min-h-12 flex-1 items-center justify-center overflow-hidden rounded-full bg-accent ${
            outOfStock ? 'opacity-40' : ''
          }`}
          disabled={outOfStock}
          onPress={() => {
            if (!useCartStore.getState().quantities[item.id]) addItem(item.id, item.stockQty);
            goToCart();
          }}>
          <GradientFill name="action" />
          <Text className="font-semibold text-brand">{strings.product.buyNow}</Text>
        </Pressable>
      </View>
    </View>
  );
}
