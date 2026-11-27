import { formatAddress, type AddressDto } from '@simple-concepts/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { RequireSignIn } from '@/components/require-sign-in';
import { ErrorState, MessageState } from '@/components/screen-states';
import { Button } from '@/components/ui/buttons';
import { colors } from '@/constants/theme';
import { useAddresses, useDeleteAddress } from '@/features/account/use-account';
import { errorMessage } from '@/lib/api';
import { strings } from '@/lib/i18n';

const t = strings.addresses;

function AddressCard({ address }: { address: AddressDto }) {
  const remove = useDeleteAddress();
  const [confirming, setConfirming] = useState(false);

  return (
    <View className="mb-3 rounded-2xl border border-gray-200 bg-white p-4">
      <View className="flex-row items-center">
        <Text className="flex-1 font-semibold text-gray-900">{address.name}</Text>
        {address.isDefault ? (
          <Text className="overflow-hidden rounded-full bg-brand-tint px-2 text-xs font-bold text-brand">
            {t.defaultBadge}
          </Text>
        ) : null}
      </View>
      <Text className="mt-1 text-gray-700">{formatAddress(address)}</Text>
      <Text className="mt-1 text-gray-600">+91 {address.phone}</Text>
      {confirming ? (
        <View className="mt-3 gap-2">
          <Text className="text-red-800">{t.deleteConfirm}</Text>
          {remove.isError ? (
            <Text className="text-red-700">{errorMessage(remove.error)}</Text>
          ) : null}
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                label={t.delete}
                loading={remove.isPending}
                variant="dangerFill"
                onPress={() => remove.mutate(address.id)}
              />
            </View>
            <View className="flex-1">
              <Button
                label={strings.admin.cancel}
                variant="outline"
                onPress={() => setConfirming(false)}
              />
            </View>
          </View>
        </View>
      ) : (
        <View className="mt-2 flex-row">
          <Pressable
            accessibilityLabel={`${t.edit}: ${address.name}`}
            accessibilityRole="button"
            className="mr-4 min-h-11 justify-center"
            onPress={() =>
              router.push({ pathname: '/addresses/edit', params: { id: address.id } })
            }>
            <Text className="font-semibold text-brand">{t.edit}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`${t.delete}: ${address.name}`}
            accessibilityRole="button"
            className="min-h-11 justify-center"
            onPress={() => setConfirming(true)}>
            <Text className="font-semibold text-red-700">{t.delete}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function AddressList() {
  const addresses = useAddresses();

  if (addresses.isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }
  if (addresses.isError) return <ErrorState onRetry={() => addresses.refetch()} />;

  return (
    <View className="flex-1">
      {addresses.data.length === 0 ? (
        <MessageState icon="location-outline" title={t.empty} />
      ) : (
        <FlatList
          contentContainerClassName="p-4"
          data={addresses.data}
          keyExtractor={({ id }) => id}
          renderItem={({ item }) => <AddressCard address={item} />}
        />
      )}
      <View className="border-t border-gray-200 bg-white p-4">
        <Button label={t.add} onPress={() => router.push('/addresses/edit')} />
      </View>
    </View>
  );
}

export default function AddressesScreen() {
  return (
    <RequireSignIn>
      <AddressList />
    </RequireSignIn>
  );
}
