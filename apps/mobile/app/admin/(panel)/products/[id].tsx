import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { ProductForm } from '@/components/admin/product-form';
import { ErrorState } from '@/components/screen-states';
import { colors } from '@/constants/theme';
import { toFormValues, toProductInput } from '@/features/admin/product-form-values';
import {
  errorMessage,
  useAdminProduct,
  useSaveProduct,
  useSetProductVisible,
} from '@/features/admin/use-admin';
import { strings } from '@/lib/i18n';

const t = strings.admin;

function VisibilityControls({ id, isActive }: { id: string; isActive: boolean }) {
  const setVisible = useSetProductVisible(id);
  const [confirming, setConfirming] = useState(false);

  if (!isActive) {
    return (
      <View className="mt-4 rounded-2xl bg-gray-100 p-4">
        <Text className="mb-3 text-center text-gray-700">{t.hiddenNotice}</Text>
        <Pressable
          accessibilityRole="button"
          className="min-h-12 items-center justify-center rounded-full border border-brand bg-white"
          disabled={setVisible.isPending}
          onPress={() => setVisible.mutate(true)}>
          <Text className="font-semibold text-brand">{t.restore}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="mt-4">
      {confirming ? (
        <View className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <Text className="mb-3 text-red-900">{t.hideConfirm}</Text>
          <View className="flex-row">
            <Pressable
              accessibilityRole="button"
              className="mr-2 min-h-12 flex-1 items-center justify-center rounded-full border border-gray-300 bg-white"
              onPress={() => setConfirming(false)}>
              <Text className="font-semibold text-gray-800">{t.cancel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              className="min-h-12 flex-1 items-center justify-center rounded-full bg-red-700"
              disabled={setVisible.isPending}
              onPress={() => {
                // mutateAsync, because saving remounts this screen and would drop a per-call callback.
                void setVisible.mutateAsync(false).then(
                  () => router.back(),
                  () => undefined,
                );
              }}>
              <Text className="font-semibold text-white">{t.hideYes}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          className="min-h-12 items-center justify-center rounded-full border border-red-700 bg-white"
          onPress={() => setConfirming(true)}>
          <Text className="font-semibold text-red-700">{t.hide}</Text>
        </Pressable>
      )}
      {setVisible.isError ? (
        <Text className="mt-2 text-center text-red-700">{errorMessage(setVisible.error)}</Text>
      ) : null}
    </View>
  );
}

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = useAdminProduct(id);
  const save = useSaveProduct(id);

  if (product.isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }
  if (product.isError) return <ErrorState onRetry={() => product.refetch()} />;

  return (
    <ProductForm
      key={product.data.updatedAt}
      initial={toFormValues(product.data)}
      onSubmit={async (values) => {
        await save.mutateAsync(toProductInput(values));
        router.back();
      }}
      footer={<VisibilityControls id={product.data.id} isActive={product.data.isActive} />}
    />
  );
}
