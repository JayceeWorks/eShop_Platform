import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { PRICE_RANGES } from '@/constants/catalog';
import { ICON_SIZE, colors } from '@/constants/theme';
import type { ProductFilterSelection } from '@/features/catalog/product-filters';
import { useCategories, useProductFilterOptions } from '@/features/catalog/use-catalog';
import { strings } from '@/lib/i18n';

import { Chip } from './chip';

type Option = { value: string; label: string };

function toOptions(values: string[] = []): Option[] {
  return values.map((value) => ({ value, label: value }));
}

function FilterGroup({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: Option[];
  selected?: string;
  onSelect: (value?: string) => void;
}) {
  if (options.length === 0) return null;

  return (
    <View className="mb-4">
      <Text className="mb-2 font-bold text-brand">{title}</Text>
      <View className="flex-row flex-wrap">
        {options.map(({ value, label }) => (
          <Chip
            key={value}
            label={label}
            selected={selected === value}
            onPress={() => onSelect(selected === value ? undefined : value)}
          />
        ))}
      </View>
    </View>
  );
}

type FilterSheetProps = {
  visible: boolean;
  initial: ProductFilterSelection;
  fixedCategory?: string;
  onApply: (selection: ProductFilterSelection) => void;
  onClose: () => void;
};

export function FilterSheet({
  visible,
  initial,
  fixedCategory,
  onApply,
  onClose,
}: FilterSheetProps) {
  const [draft, setDraft] = useState(initial);
  const categories = useCategories();
  const options = useProductFilterOptions(fixedCategory ?? draft.category);

  const update = (key: keyof ProductFilterSelection) => (value?: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[85%] w-full max-w-[480px] self-center rounded-t-2xl bg-white">
          <View className="flex-row items-center justify-between border-b border-gray-200 p-4">
            <Text accessibilityRole="header" className="text-lg font-bold text-brand">
              {strings.filters.title}
            </Text>
            <Pressable
              accessibilityLabel={strings.filters.close}
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center"
              onPress={onClose}>
              <Ionicons name="close" size={ICON_SIZE.medium} color={colors.brand} />
            </Pressable>
          </View>

          <ScrollView className="px-4 pt-4">
            {fixedCategory ? null : (
              <FilterGroup
                title={strings.filters.category}
                options={(categories.data ?? []).map(({ slug, name }) => ({
                  value: slug,
                  label: name,
                }))}
                selected={draft.category}
                onSelect={update('category')}
              />
            )}
            <FilterGroup
              title={strings.filters.price}
              options={PRICE_RANGES.map(({ id, label }) => ({ value: id, label }))}
              selected={draft.priceRangeId}
              onSelect={update('priceRangeId')}
            />
            <FilterGroup
              title={strings.filters.brand}
              options={toOptions(options.data?.brands)}
              selected={draft.brand}
              onSelect={update('brand')}
            />
            <FilterGroup
              title={strings.filters.resolution}
              options={toOptions(options.data?.resolutions)}
              selected={draft.resolution}
              onSelect={update('resolution')}
            />
            <FilterGroup
              title={strings.filters.placement}
              options={toOptions(options.data?.placements)}
              selected={draft.placement}
              onSelect={update('placement')}
            />
            <FilterGroup
              title={strings.filters.connection}
              options={toOptions(options.data?.connections)}
              selected={draft.connection}
              onSelect={update('connection')}
            />
          </ScrollView>

          <View className="flex-row border-t border-gray-200 p-4">
            <Pressable
              accessibilityRole="button"
              className="mr-2 min-h-12 flex-1 items-center justify-center rounded-full border border-brand"
              onPress={() => setDraft({})}>
              <Text className="font-semibold text-brand">{strings.filters.clear}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              className="min-h-12 flex-1 items-center justify-center rounded-full bg-brand"
              onPress={() => onApply(draft)}>
              <Text className="font-semibold text-white">{strings.filters.apply}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
