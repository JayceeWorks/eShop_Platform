import Ionicons from '@expo/vector-icons/Ionicons';
import { deliveryChargeFor, formatAddress, formatINR, type AddressDto } from '@simple-concepts/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TextField } from '@/components/admin/text-field';
import { RequireSignIn } from '@/components/require-sign-in';
import { ErrorState, MessageState } from '@/components/screen-states';
import { Button } from '@/components/ui/buttons';
import { Card, SectionTitle } from '@/components/ui/menu-row';
import { ICON_SIZE, colors } from '@/constants/theme';
import { useAddresses } from '@/features/account/use-account';
import { orderItemsFrom, summarizeCart } from '@/features/cart/cart-logic';
import { useCartStore } from '@/features/cart/cart-store';
import { useProductsByIds } from '@/features/catalog/use-catalog';
import { useCheckoutConfig, usePlaceOrder } from '@/features/orders/use-orders';
import { errorMessage } from '@/lib/api';
import { strings } from '@/lib/i18n';

const t = strings.checkout;
const BOTTOM_BAR_PADDING = 12;

function Radio({ selected }: { selected: boolean }) {
  return (
    <Ionicons
      color={selected ? colors.brand : colors.muted}
      name={selected ? 'radio-button-on' : 'radio-button-off'}
      size={ICON_SIZE.medium}
    />
  );
}

function AddressOption({
  address,
  selected,
  onSelect,
}: {
  address: AddressDto;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`${address.name}, ${formatAddress(address)}`}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      className={`mb-2 flex-row rounded-2xl border bg-white p-3 ${
        selected ? 'border-brand' : 'border-gray-200'
      }`}
      onPress={onSelect}>
      <Radio selected={selected} />
      <View className="ml-2 flex-1">
        <Text className="font-semibold text-gray-900">{address.name}</Text>
        <Text className="text-gray-700">{formatAddress(address)}</Text>
        <Text className="text-gray-600">+91 {address.phone}</Text>
      </View>
    </Pressable>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="mt-1 flex-row justify-between">
      <Text className={strong ? 'text-base font-bold text-brand' : 'text-gray-600'}>{label}</Text>
      <Text className={strong ? 'text-base font-bold text-brand' : 'text-gray-900'}>{value}</Text>
    </View>
  );
}

function Checkout() {
  const { bottom } = useSafeAreaInsets();
  const quantities = useCartStore((state) => state.quantities);
  const removeItems = useCartStore((state) => state.removeItems);
  const ids = Object.keys(quantities);
  const products = useProductsByIds(ids);
  const addresses = useAddresses();
  const config = useCheckoutConfig();
  const placeOrder = usePlaceOrder();
  const [chosenAddressId, setChosenAddressId] = useState<string | null>(null);
  const [installation, setInstallation] = useState(false);
  const [notes, setNotes] = useState('');

  if (ids.length === 0) {
    return (
      <MessageState
        actionLabel={strings.cart.startShopping}
        icon="cart-outline"
        onAction={() => router.replace('/')}
        title={strings.cart.empty}
      />
    );
  }
  if (products.isPending || addresses.isPending || config.isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }
  if (products.isError || addresses.isError || config.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void products.refetch();
          void addresses.refetch();
          void config.refetch();
        }}
      />
    );
  }

  const summary = summarizeCart(quantities, products.data);
  const items = orderItemsFrom(summary);
  const deliveryInPaise = deliveryChargeFor(summary.subtotalInPaise, config.data.deliveryRule);
  const totalInPaise = summary.subtotalInPaise + deliveryInPaise;
  const addressId =
    chosenAddressId ??
    addresses.data.find((address) => address.isDefault)?.id ??
    addresses.data[0]?.id ??
    null;
  const cartNeedsFixing =
    summary.unavailableIds.length > 0 || items.length !== summary.lines.length;
  const codEnabled = config.data.paymentMethods.includes('COD');
  const canPlace = !!addressId && items.length > 0 && !cartNeedsFixing && codEnabled;

  const place = () => {
    if (!addressId) return;
    placeOrder.mutate(
      {
        items,
        addressId,
        paymentMethod: 'COD',
        installationRequested: installation,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: (order) => {
          removeItems(items.map(({ productId }) => productId));
          router.replace({ pathname: '/orders/[id]', params: { id: order.id, placed: '1' } });
        },
      },
    );
  };

  return (
    <View className="flex-1">
      <ScrollView contentContainerClassName="px-4 pb-6" keyboardShouldPersistTaps="handled">
        <SectionTitle>{t.address}</SectionTitle>
        {addresses.data.map((address) => (
          <AddressOption
            key={address.id}
            address={address}
            selected={address.id === addressId}
            onSelect={() => setChosenAddressId(address.id)}
          />
        ))}
        <Button
          label={t.addAddress}
          variant="outline"
          onPress={() => router.push('/addresses/edit')}
        />

        <SectionTitle>{t.items(summary.itemCount)}</SectionTitle>
        <Card className="p-3">
          {summary.lines.map(({ product, quantity, lineTotalInPaise }) => (
            <View
              key={product.id}
              className="flex-row justify-between border-b border-gray-100 py-2">
              <Text className="mr-3 flex-1 text-gray-900" numberOfLines={2}>
                {product.name} × {quantity}
              </Text>
              <Text className="font-semibold text-gray-900">{formatINR(lineTotalInPaise)}</Text>
            </View>
          ))}
          {cartNeedsFixing ? (
            <Pressable
              accessibilityRole="link"
              className="mt-2 rounded-lg bg-amber-100 p-3"
              onPress={() => router.navigate('/cart')}>
              <Text className="text-amber-900">
                {strings.cart.unavailable(
                  summary.unavailableIds.length + summary.lines.length - items.length,
                )}{' '}
                <Text className="font-semibold underline">{strings.cart.title}</Text>
              </Text>
            </Pressable>
          ) : null}
        </Card>

        <SectionTitle>{t.payment}</SectionTitle>
        <Card className="flex-row items-center p-3">
          <Radio selected={codEnabled} />
          <View className="ml-2 flex-1">
            <Text className="font-semibold text-gray-900">{t.cod}</Text>
            <Text className="text-gray-600">{t.codBody}</Text>
          </View>
          <Ionicons color={colors.success} name="cash-outline" size={ICON_SIZE.medium} />
        </Card>

        <Pressable
          accessibilityHint={t.installationHint}
          accessibilityLabel={t.installation}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: installation }}
          className="mt-4 flex-row rounded-2xl border border-gray-200 bg-white p-3"
          onPress={() => setInstallation((value) => !value)}>
          <Ionicons
            color={colors.brand}
            name={installation ? 'checkbox' : 'square-outline'}
            size={ICON_SIZE.medium}
          />
          <View className="ml-2 flex-1">
            <Text className="font-semibold text-gray-900">{t.installation}</Text>
            <Text className="text-sm text-gray-600">{t.installationHint}</Text>
          </View>
        </Pressable>

        <View className="mt-4">
          <TextField
            label={t.notes}
            maxLength={500}
            multiline
            onChangeText={setNotes}
            value={notes}
          />
        </View>
      </ScrollView>

      <View
        className="border-t border-gray-200 bg-white px-4 pt-3"
        style={{ paddingBottom: bottom + BOTTOM_BAR_PADDING }}>
        <SummaryRow label={strings.cart.subtotal} value={formatINR(summary.subtotalInPaise)} />
        <SummaryRow
          label={strings.cart.delivery}
          value={deliveryInPaise === 0 ? t.free : formatINR(deliveryInPaise)}
        />
        <SummaryRow label={strings.cart.total} strong value={formatINR(totalInPaise)} />
        {placeOrder.isError ? (
          <Text accessibilityLiveRegion="polite" className="mt-2 text-red-700">
            {errorMessage(placeOrder.error)}
          </Text>
        ) : null}
        <View className="mt-3">
          <Button
            disabled={!canPlace}
            label={placeOrder.isPending ? t.placing : t.place(formatINR(totalInPaise))}
            loading={placeOrder.isPending}
            onPress={place}
          />
        </View>
      </View>
    </View>
  );
}

export default function CheckoutScreen() {
  return (
    <RequireSignIn>
      <Checkout />
    </RequireSignIn>
  );
}
