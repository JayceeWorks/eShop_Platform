import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { ProductBrowser } from '@/components/product-browser';
import { TabHeader } from '@/components/tab-header';
import { SEARCH_DEBOUNCE_MS } from '@/constants/catalog';
import { ICON_SIZE, colors } from '@/constants/theme';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { strings } from '@/lib/i18n';

export default function SearchScreen() {
  const [text, setText] = useState('');
  const query = useDebouncedValue(text.trim(), SEARCH_DEBOUNCE_MS);

  return (
    <View className="flex-1">
      <TabHeader title={strings.search.title}>
        <View className="mt-2 min-h-12 flex-row items-center rounded-full bg-white px-4">
          <Ionicons name="search-outline" size={ICON_SIZE.small} color={colors.muted} />
          <TextInput
            accessibilityLabel={strings.search.placeholder}
            autoCorrect={false}
            className="ml-2 min-h-12 flex-1 text-base text-gray-900"
            onChangeText={setText}
            placeholder={strings.search.placeholder}
            placeholderTextColor={colors.muted}
            returnKeyType="search"
            value={text}
          />
          {text ? (
            <Pressable
              accessibilityLabel={strings.search.clear}
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center"
              onPress={() => setText('')}>
              <Ionicons name="close-circle" size={ICON_SIZE.small} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      </TabHeader>
      <ProductBrowser query={query} />
    </View>
  );
}
