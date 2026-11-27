import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Chip } from '@/components/chip';
import { ProductBrowser } from '@/components/product-browser';
import { useCategories } from '@/features/catalog/use-catalog';
import { strings } from '@/lib/i18n';

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const categories = useCategories();
  const [childSlug, setChildSlug] = useState<string>();

  const all = categories.data ?? [];
  const parent = all.find((category) => category.slug === slug);
  const child = all
    .flatMap((category) => category.children)
    .find((category) => category.slug === slug);
  const title = parent?.name ?? child?.name ?? '';
  const children = parent?.children ?? [];

  return (
    <View className="flex-1">
      <Stack.Screen options={{ title }} />
      {children.length > 0 ? (
        <View className="border-b border-gray-200 bg-white pt-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-3">
            <Chip
              label={strings.categories.all}
              selected={!childSlug}
              onPress={() => setChildSlug(undefined)}
            />
            {children.map((item) => (
              <Chip
                key={item.id}
                label={item.name}
                selected={childSlug === item.slug}
                onPress={() => setChildSlug(item.slug)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}
      {/* Remount on change so filters from one sub-category don't hide another's products. */}
      <ProductBrowser key={childSlug ?? slug} category={childSlug ?? slug} />
    </View>
  );
}
