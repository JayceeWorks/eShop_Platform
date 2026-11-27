import Ionicons from '@expo/vector-icons/Ionicons';
import type { CategoryDto } from '@simple-concepts/shared';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { ErrorState, MessageState } from '@/components/screen-states';
import { TabHeader } from '@/components/tab-header';
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON } from '@/constants/catalog';
import { ICON_SIZE, colors } from '@/constants/theme';
import { useCategories } from '@/features/catalog/use-catalog';
import { strings } from '@/lib/i18n';

function openCategory(slug: string) {
  router.push({ pathname: '/category/[slug]', params: { slug } });
}

function CategoryRow({ category }: { category: CategoryDto }) {
  return (
    <View className="mb-3 overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <Pressable
        accessibilityRole="link"
        className="min-h-16 flex-row items-center p-3 active:opacity-80"
        onPress={() => openCategory(category.slug)}>
        <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-tint">
          <Ionicons
            name={CATEGORY_ICONS[category.slug] ?? DEFAULT_CATEGORY_ICON}
            size={ICON_SIZE.medium}
            color={colors.brand}
          />
        </View>
        <Text className="ml-3 flex-1 text-base font-bold text-brand">{category.name}</Text>
        <Ionicons name="chevron-forward" size={ICON_SIZE.small} color={colors.muted} />
      </Pressable>
      {category.children.map((child) => (
        <Pressable
          key={child.id}
          accessibilityRole="link"
          className="min-h-12 flex-row items-center border-t border-gray-100 px-4 active:opacity-80"
          onPress={() => openCategory(child.slug)}>
          <Ionicons
            name={CATEGORY_ICONS[child.slug] ?? DEFAULT_CATEGORY_ICON}
            size={ICON_SIZE.small}
            color={colors.muted}
          />
          <Text className="ml-3 flex-1 text-gray-800">{child.name}</Text>
          <Ionicons name="chevron-forward" size={ICON_SIZE.small} color={colors.muted} />
        </Pressable>
      ))}
    </View>
  );
}

export default function CategoriesScreen() {
  const categories = useCategories();

  return (
    <View className="flex-1">
      <TabHeader title={strings.categories.title} />
      {categories.isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : categories.isError ? (
        <ErrorState onRetry={() => categories.refetch()} />
      ) : categories.data.length === 0 ? (
        <MessageState icon="grid-outline" title={strings.categories.empty} />
      ) : (
        <FlatList
          contentContainerClassName="p-3"
          data={categories.data}
          keyExtractor={({ id }) => id}
          renderItem={({ item }) => <CategoryRow category={item} />}
        />
      )}
    </View>
  );
}
