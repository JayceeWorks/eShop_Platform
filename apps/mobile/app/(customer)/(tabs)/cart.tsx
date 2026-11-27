import Ionicons from '@expo/vector-icons/Ionicons';
import { deliveryChargeFor, formatINR } from '@simple-concepts/shared';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { ProductArt } from '@/components/product-art';
import { ErrorState, MessageState } from '@/components/screen-states';
import { StockLabel } from '@/components/stock-label';
import { TabHeader } from '@/components/tab-header';
import { Button } from '@/components/ui/buttons';
import { ICON_SIZE, colors } from '@/constants/theme';
import { orderItemsFrom, summarizeCart, type CartLine } from '@/features/cart/cart-logic';
import { useCartStore } from '@/features/cart/cart-store';
import { useProductsByIds } from '@/features/catalog/use-catalog';
import { useSessionStore } from '@/features/auth/session-store';
import { strings } from '@/lib/i18n';

const LINE_IMAGE_HEIGHT = 80;

function QuantityButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: 'add' | 'remove';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={`h-11 w-11 items-center justify-center rounded-full border border-gray-300 ${
        disabled ? 'opacity-40' : ''
      }`}
      disabled={disabled}
      onPress={onPress}>
      <Ionicons name={icon} size={ICON_SIZE.small} color={colors.brand} />
    </Pressable>
  );
}

function CartLineRow({ line }: { line: CartLine }) {
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItems = useCartStore((state) => state.removeItems);
  const { product, quantity, lineTotalInPaise } = line;

  return (
    <View className="mb-3 flex-row rounded-2xl border border-gray-200 bg-white p-3">
      <View className="w-20">
        <ProductArt
          category={product.category}
          height={LINE_IMAGE_HEIGHT}
          iconSize={ICON_SIZE.large}
          imageUrl={product.imageUrl}
          name={product.name}
        />
      </View>
      <View className="ml-3 flex-1">
        <Pressable
          accessibilityRole="link"
          onPress={() =>
            router.push({ pathname: '/product/[slug]', params: { slug: product.slug } })
          }>
          <Text className="font-semibold text-gray-900" numberOfLines={2}>
            {product.name}
          </Text>
        </Pressable>
        <Text className="mt-0.5 font-bold text-brand">{formatINR(product.priceInPaise)}</Text>
        <StockLabel stockQty={product.stockQty} />
        <View className="mt-2 flex-row items-center">
          <QuantityButton
            disabled={quantity <= 1}
            icon="remove"
            label={strings.cart.decrease(product.name)}
            onPress={() => setQuantity(product.id, quantity - 1, product.stockQty)}
          />
          <Text
            accessibilityLabel={strings.cart.quantity(quantity)}
            className="w-9 text-center font-bold text-gray-900">
            {quantity}
          </Text>
          <QuantityButton
            disabled={quantity >= product.stockQty}
            icon="add"
            label={strings.cart.increase(product.name)}
            onPress={() => setQuantity(product.id, quantity + 1, product.stockQty)}
          />
          <Pressable
            accessibilityLabel={strings.cart.removeItem(product.name)}
            accessibilityRole="button"
            className="ml-auto min-h-11 justify-center px-2"
            onPress={() => removeItems([product.id])}>
            <Text className="font-semibold text-red-700">{strings.cart.remove}</Text>
          </Pressable>
        </View>
        {quantity > 0 ? (
          <Text className="mt-1 text-right text-sm text-gray-600">
            {formatINR(lineTotalInPaise)}
          </Text>
        ) : null}
      </View>
    </View>
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

export default function CartScreen() {
  const quantities = useCartStore((state) => state.quantities);
  const removeItems = useCartStore((state) => state.removeItems);
  const ids = Object.keys(quantities);
  const products = useProductsByIds(ids);
  const signedIn = useSessionStore((state) => state.status === 'signedIn');

  const renderBody = () => {
    if (ids.length === 0) {
      return (
        <MessageState
          icon="cart-outline"
          title={strings.cart.empty}
          body={strings.cart.emptyBody}
          actionLabel={strings.cart.startShopping}
          onAction={() => router.push('/')}
        />
      );
    }
    if (products.isPending) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand} />
        </View>
      );
    }
    if (products.isError) return <ErrorState onRetry={() => products.refetch()} />;

    const summary = summarizeCart(quantities, products.data);
    const deliveryInPaise = deliveryChargeFor(summary.subtotalInPaise);

    return (
      <>
        <FlatList
          className="flex-1"
          contentContainerClassName="p-3"
          data={summary.lines}
          keyExtractor={({ product }) => product.id}
          ListHeaderComponent={
            summary.unavailableIds.length > 0 ? (
              <View className="mb-3 flex-row items-center justify-between rounded-lg bg-amber-100 px-3">
                <Text className="flex-1 text-amber-900">
                  {strings.cart.unavailable(summary.unavailableIds.length)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  className="min-h-11 justify-center pl-2"
                  onPress={() => removeItems(summary.unavailableIds)}>
                  <Text className="font-semibold text-amber-900">
                    {strings.cart.removeUnavailable}
                  </Text>
                </Pressable>
              </View>
            ) : undefined
          }
          renderItem={({ item }) => <CartLineRow line={item} />}
        />
        <View className="border-t border-gray-200 bg-white p-4">
          <SummaryRow label={strings.cart.subtotal} value={formatINR(summary.subtotalInPaise)} />
          {summary.savingsInPaise > 0 ? (
            <SummaryRow label={strings.cart.savings} value={formatINR(summary.savingsInPaise)} />
          ) : null}
          <SummaryRow
            label={strings.cart.delivery}
            value={deliveryInPaise === 0 ? strings.cart.deliveryFree : formatINR(deliveryInPaise)}
          />
          <SummaryRow
            strong
            label={strings.cart.total}
            value={formatINR(summary.subtotalInPaise + deliveryInPaise)}
          />
          <Text className="mt-2 text-center text-sm font-semibold text-green-700">
            {strings.common.codAvailable}
          </Text>
          <View className="mt-2">
            <Button
              disabled={orderItemsFrom(summary).length === 0}
              label={signedIn ? strings.checkout.button : strings.cart.checkoutSignIn}
              onPress={() => router.push('/checkout')}
            />
          </View>
        </View>
      </>
    );
  };

  return (
    <View className="flex-1">
      <TabHeader title={strings.cart.title} />
      {renderBody()}
    </View>
  );
}
