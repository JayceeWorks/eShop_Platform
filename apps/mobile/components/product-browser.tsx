import Ionicons from '@expo/vector-icons/Ionicons';
import { ProductSortSchema, type ProductSort } from '@simple-concepts/shared';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';

import { ICON_SIZE, colors } from '@/constants/theme';
import {
  countActiveFilters,
  type ProductFilterSelection,
} from '@/features/catalog/product-filters';
import { useProductList } from '@/features/catalog/use-catalog';
import { strings } from '@/lib/i18n';

import { Chip } from './chip';
import { FilterSheet } from './filter-sheet';
import { ProductCard } from './product-card';
import { ErrorState, MessageState, ProductGridSkeleton } from './screen-states';

const LOAD_MORE_THRESHOLD = 0.5;

type ProductBrowserProps = {
  /** Locks results to this category and hides the category filter. */
  category?: string;
  query?: string;
};

export function ProductBrowser({ category, query }: ProductBrowserProps) {
  const [sort, setSort] = useState<ProductSort>('newest');
  const [selection, setSelection] = useState<ProductFilterSelection>({});
  const [sheetOpen, setSheetOpen] = useState(false);

  const products = useProductList({
    ...selection,
    category: category ?? selection.category,
    q: query || undefined,
    sort,
  });

  const items = products.data?.pages.flatMap((page) => page.items) ?? [];
  const total = products.data?.pages[0]?.meta.total ?? 0;
  const activeFilters = countActiveFilters(selection);

  return (
    <View className="flex-1">
      <View className="border-b border-gray-200 bg-white pt-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-3">
          {ProductSortSchema.options.map((option) => (
            <Chip
              key={option}
              label={strings.browse.sort[option]}
              selected={sort === option}
              onPress={() => setSort(option)}
            />
          ))}
        </ScrollView>
        <View className="flex-row items-center justify-between px-4 pb-2">
          <Text className="text-sm text-gray-600">
            {products.data ? strings.browse.results(total) : ' '}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="min-h-11 flex-row items-center"
            onPress={() => setSheetOpen(true)}>
            <Ionicons name="options-outline" size={ICON_SIZE.small} color={colors.brand} />
            <Text className="ml-1 font-semibold text-brand">
              {activeFilters > 0
                ? strings.browse.filtersWithCount(activeFilters)
                : strings.browse.filters}
            </Text>
          </Pressable>
        </View>
      </View>

      {products.isPending ? (
        <ProductGridSkeleton />
      ) : products.isError ? (
        <ErrorState onRetry={() => products.refetch()} />
      ) : items.length === 0 ? (
        <MessageState
          icon="search-outline"
          title={strings.browse.empty}
          actionLabel={activeFilters > 0 ? strings.browse.clearFilters : undefined}
          onAction={() => setSelection({})}
        />
      ) : (
        <FlatList
          contentContainerClassName="p-2"
          data={items}
          keyExtractor={({ id }) => id}
          numColumns={2}
          onEndReached={() => {
            if (products.hasNextPage && !products.isFetchingNextPage) products.fetchNextPage();
          }}
          onEndReachedThreshold={LOAD_MORE_THRESHOLD}
          ListFooterComponent={
            products.isFetchingNextPage ? <ActivityIndicator color={colors.brand} /> : undefined
          }
          renderItem={({ item }) => (
            <View className="w-1/2 p-1.5">
              <ProductCard product={item} />
            </View>
          )}
        />
      )}

      {sheetOpen ? (
        <FilterSheet
          fixedCategory={category}
          initial={selection}
          visible
          onApply={(next) => {
            setSelection(next);
            setSheetOpen(false);
          }}
          onClose={() => setSheetOpen(false)}
        />
      ) : null}
    </View>
  );
}
