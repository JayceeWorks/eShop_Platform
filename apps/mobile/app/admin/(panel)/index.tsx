import Ionicons from '@expo/vector-icons/Ionicons';
import { formatINR, type AdminProductDto, type AdminProductStatus } from '@simple-concepts/shared';
import { Stack, router, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';

import { Chip } from '@/components/chip';
import { GradientFill } from '@/components/gradient-fill';
import { ProductArt } from '@/components/product-art';
import { ErrorState, MessageState } from '@/components/screen-states';
import { SEARCH_DEBOUNCE_MS } from '@/constants/catalog';
import { ICON_SIZE, colors } from '@/constants/theme';
import { useSessionStore } from '@/features/auth/session-store';
import { useAdminProducts } from '@/features/admin/use-admin';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { strings } from '@/lib/i18n';

const t = strings.admin;
const THUMB_HEIGHT = 64;
const LOAD_MORE_THRESHOLD = 0.5;
const STATUSES: AdminProductStatus[] = ['all', 'active', 'hidden'];

function ProductRow({ product }: { product: AdminProductDto }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={product.name}
      className="mb-2 flex-row items-center rounded-2xl border border-gray-200 bg-white p-3 active:opacity-80"
      onPress={() =>
        router.push({
          pathname: '/admin/products/[id]',
          params: { id: product.id },
        })
      }>
      <View className="w-16">
        <ProductArt
          category={product.category}
          height={THUMB_HEIGHT}
          iconSize={ICON_SIZE.medium}
          imageUrl={product.imageUrl}
          name={product.name}
        />
      </View>
      <View className="ml-3 flex-1">
        <Text className="font-semibold text-gray-900" numberOfLines={1}>
          {product.name}
        </Text>
        <Text className="text-xs text-gray-500" numberOfLines={1}>
          {product.sku} · {product.brand}
        </Text>
        <View className="mt-1 flex-row flex-wrap items-center">
          <Text className="mr-3 font-bold text-brand">{formatINR(product.priceInPaise)}</Text>
          <Text
            className={`mr-2 text-xs ${product.stockQty === 0 ? 'text-red-700' : 'text-gray-600'}`}>
            {t.stock(product.stockQty)}
          </Text>
          {!product.isActive ? (
            <Text className="mr-1 rounded-full bg-gray-200 px-2 text-xs font-semibold text-gray-700">
              {t.hiddenBadge}
            </Text>
          ) : null}
          {product.isFeatured ? (
            <Text className="rounded-full bg-brand-tint px-2 text-xs font-semibold text-brand">
              {t.featuredBadge}
            </Text>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={ICON_SIZE.small} color={colors.muted} />
    </Pressable>
  );
}

export default function AdminProductsScreen() {
  const signOut = useSessionStore((state) => state.signOut);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<AdminProductStatus>('all');
  const q = useDebouncedValue(text.trim(), SEARCH_DEBOUNCE_MS);
  const products = useAdminProducts({ q, status });
  const items = products.data?.pages.flatMap((page) => page.items) ?? [];
  const total = products.data?.pages[0]?.meta.total ?? 0;

  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              className="min-h-11 justify-center px-2"
              onPress={() => {
                void signOut().then(() => router.replace('/admin/login'));
              }}>
              <Text className="font-semibold text-white">{t.logOut}</Text>
            </Pressable>
          ),
        }}
      />
      <View className="border-b border-gray-200 bg-white px-3 pb-1 pt-3">
        <View className="mb-3 flex-row gap-2">
          {(
            [
              { label: t.orders, icon: 'receipt-outline', path: '/admin/orders' },
              { label: t.feedback, icon: 'chatbubbles-outline', path: '/admin/feedback' },
            ] as const
          ).map(({ label, icon, path }) => (
            <Pressable
              key={path}
              accessibilityRole="link"
              className="min-h-12 flex-1 flex-row items-center justify-center rounded-2xl bg-brand-tint"
              onPress={() => router.push(path as Href)}>
              <Ionicons name={icon} size={ICON_SIZE.medium} color={colors.brand} />
              <Text className="ml-2 font-semibold text-brand">{label}</Text>
            </Pressable>
          ))}
        </View>
        <View className="min-h-12 flex-row items-center rounded-full border border-gray-300 bg-white px-4">
          <Ionicons name="search-outline" size={ICON_SIZE.small} color={colors.muted} />
          <TextInput
            accessibilityLabel={t.searchPlaceholder}
            autoCorrect={false}
            className="ml-2 min-h-12 flex-1 text-base text-gray-900"
            onChangeText={setText}
            placeholder={t.searchPlaceholder}
            placeholderTextColor={colors.muted}
            value={text}
          />
        </View>
        <View className="mt-2 flex-row items-center justify-between">
          <View className="flex-row">
            {STATUSES.map((option) => (
              <Chip
                key={option}
                label={t.status[option]}
                selected={status === option}
                onPress={() => setStatus(option)}
              />
            ))}
          </View>
        </View>
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="text-sm text-gray-600">{products.data ? t.count(total) : ' '}</Text>
          <Pressable
            accessibilityRole="button"
            className="min-h-11 flex-row items-center overflow-hidden rounded-full bg-primary px-4"
            onPress={() => router.push('/admin/products/new')}>
            <GradientFill name="primary" />
            <Ionicons name="add" size={ICON_SIZE.small} color={colors.white} />
            <Text className="ml-1 font-semibold text-white">{t.addProduct}</Text>
          </Pressable>
        </View>
      </View>

      {products.isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : products.isError ? (
        <ErrorState onRetry={() => products.refetch()} />
      ) : items.length === 0 ? (
        <MessageState icon="cube-outline" title={t.empty} />
      ) : (
        <FlatList
          contentContainerClassName="p-3"
          data={items}
          keyExtractor={({ id }) => id}
          onEndReached={() => {
            if (products.hasNextPage && !products.isFetchingNextPage) products.fetchNextPage();
          }}
          onEndReachedThreshold={LOAD_MORE_THRESHOLD}
          renderItem={({ item }) => <ProductRow product={item} />}
        />
      )}
    </View>
  );
}
