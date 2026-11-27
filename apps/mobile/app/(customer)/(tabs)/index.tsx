import Ionicons from '@expo/vector-icons/Ionicons';
import type { CategoryDto, ProductSummaryDto } from '@simple-concepts/shared';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientFill } from '@/components/gradient-fill';
import { HomeIllustration } from '@/components/home-illustration';
import { ProductCard } from '@/components/product-card';
import { ErrorState, ProductGridSkeleton } from '@/components/screen-states';
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON } from '@/constants/catalog';
import { ICON_SIZE, colors } from '@/constants/theme';
import { useCategories, useFeaturedProducts, useNewProducts } from '@/features/catalog/use-catalog';
import { strings } from '@/lib/i18n';

const HEADER_TOP_PADDING = 12;

function CategoryTile({ category }: { category: CategoryDto }) {
  return (
    <View className="w-1/3 p-1">
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={category.name}
        className="min-h-24 items-center justify-center rounded-2xl border border-gray-200 bg-white p-2 active:opacity-80"
        onPress={() =>
          router.push({ pathname: '/category/[slug]', params: { slug: category.slug } })
        }>
        <Ionicons
          name={CATEGORY_ICONS[category.slug] ?? DEFAULT_CATEGORY_ICON}
          size={ICON_SIZE.medium}
          color={colors.brand}
        />
        <Text className="mt-1 text-center text-xs font-semibold text-gray-800" numberOfLines={2}>
          {category.name}
        </Text>
      </Pressable>
    </View>
  );
}

function ProductSection({ title, products }: { title: string; products: ProductSummaryDto[] }) {
  if (products.length === 0) return null;

  return (
    <View className="mt-4 px-2">
      <View className="flex-row items-center justify-between px-2">
        <Text accessibilityRole="header" className="text-lg font-bold text-brand">
          {title}
        </Text>
        <Pressable
          accessibilityRole="link"
          className="min-h-11 justify-center"
          onPress={() => router.push('/search')}>
          <Text className="font-semibold text-brand">{strings.home.seeAll}</Text>
        </Pressable>
      </View>
      <View className="flex-row flex-wrap">
        {products.map((product) => (
          <View key={product.id} className="w-1/2 p-1.5">
            <ProductCard product={product} />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { top } = useSafeAreaInsets();
  const categories = useCategories();
  const featured = useFeaturedProducts();
  const newest = useNewProducts();

  const isPending = categories.isPending || featured.isPending || newest.isPending;
  const isError = categories.isError || featured.isError || newest.isError;

  const retry = () => {
    categories.refetch();
    featured.refetch();
    newest.refetch();
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="pb-6">
      <View
        className="overflow-hidden bg-brand px-4 pb-5"
        style={{ paddingTop: top + HEADER_TOP_PADDING }}>
        <GradientFill name="header" />
        <Text accessibilityRole="header" className="text-2xl font-bold text-white">
          {strings.appName}
        </Text>
        <Text className="mt-0.5 text-sm text-gray-200">{strings.home.tagline}</Text>
        <Pressable
          accessibilityRole="search"
          accessibilityLabel={strings.home.searchPlaceholder}
          className="mt-3 min-h-12 flex-row items-center rounded-full bg-white px-4"
          onPress={() => router.push('/search')}>
          <Ionicons name="search-outline" size={ICON_SIZE.small} color={colors.muted} />
          <Text className="ml-2 text-gray-500" numberOfLines={1}>
            {strings.home.searchPlaceholder}
          </Text>
        </Pressable>
      </View>

      <HomeIllustration />

      <View className="mx-3 mt-3 overflow-hidden rounded-2xl bg-brand p-4">
        <GradientFill name="card" />
        <Text className="text-lg font-bold text-accent">{strings.home.heroTitle}</Text>
        <Text className="mt-1 text-sm text-white">{strings.home.heroBody}</Text>
        <View className="mt-2 flex-row items-center">
          <Ionicons name="shield-checkmark" size={ICON_SIZE.small} color={colors.accent} />
          <Text className="ml-1 text-sm font-semibold text-white">
            {strings.common.codAvailable}
          </Text>
        </View>
        <View className="mt-2 flex-row items-center">
          <Ionicons name="location" size={ICON_SIZE.small} color={colors.accent} />
          <Text className="ml-1 text-sm font-semibold text-white">
            {strings.home.storeLocation}
          </Text>
        </View>
        <Pressable
          accessibilityRole="link"
          className="mt-3 min-h-11 items-center justify-center overflow-hidden rounded-full bg-accent"
          onPress={() => router.push('/search')}>
          <GradientFill name="action" />
          <Text className="font-semibold text-brand">{strings.home.heroAction}</Text>
        </Pressable>
      </View>

      {isPending ? (
        <ProductGridSkeleton />
      ) : isError ? (
        <ErrorState onRetry={retry} />
      ) : (
        <>
          <View className="mt-4 px-2">
            <Text accessibilityRole="header" className="mb-1 px-2 text-lg font-bold text-brand">
              {strings.home.shopByCategory}
            </Text>
            <View className="flex-row flex-wrap">
              {categories.data.map((category) => (
                <CategoryTile key={category.id} category={category} />
              ))}
            </View>
          </View>
          <ProductSection title={strings.home.featured} products={featured.data} />
          <ProductSection title={strings.home.newArrivals} products={newest.data} />
        </>
      )}
    </ScrollView>
  );
}
