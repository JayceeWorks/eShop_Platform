import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { AddressForm } from '@/components/account/address-form';
import { RequireSignIn } from '@/components/require-sign-in';
import { ErrorState } from '@/components/screen-states';
import { Card } from '@/components/ui/menu-row';
import { colors } from '@/constants/theme';
import { useAddresses, useSaveAddress } from '@/features/account/use-account';
import { errorMessage } from '@/lib/api';
import { strings } from '@/lib/i18n';

/** Add a new address, or edit one when an id is given. */
function EditAddress() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const addresses = useAddresses(!!id);
  const save = useSaveAddress(id);

  if (id && addresses.isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }
  if (id && addresses.isError) return <ErrorState onRetry={() => addresses.refetch()} />;
  const address = id ? addresses.data?.find((item) => item.id === id) : undefined;

  return (
    <ScrollView contentContainerClassName="p-4" keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: id ? strings.addresses.edit : strings.addresses.add }} />
      <Card className="p-4">
        <AddressForm
          address={address}
          error={save.isError ? errorMessage(save.error) : undefined}
          saving={save.isPending}
          onSave={(values) => {
            save.mutateAsync(values).then(
              () => router.back(),
              () => undefined,
            );
          }}
        />
      </Card>
    </ScrollView>
  );
}

export default function EditAddressScreen() {
  return (
    <RequireSignIn>
      <EditAddress />
    </RequireSignIn>
  );
}
