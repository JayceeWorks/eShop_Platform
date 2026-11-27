import { formatAddress, formatINR, type OrderDetailDto } from '@simple-concepts/shared';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ProductArt } from '@/components/product-art';
import { Card, SectionTitle } from '@/components/ui/menu-row';
import { ICON_SIZE } from '@/constants/theme';
import { strings } from '@/lib/i18n';

const t = strings.orders;
const THUMB_HEIGHT = 56;
const UNKNOWN_CATEGORY = { name: '', slug: '', parentSlug: null };

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="mt-1 flex-row justify-between">
      <Text className={strong ? 'font-bold text-brand' : 'text-gray-600'}>{label}</Text>
      <Text className={strong ? 'font-bold text-brand' : 'text-gray-900'}>{value}</Text>
    </View>
  );
}

/** Items, address and bill of an order. Shared by the customer and admin order screens. */
export function OrderSummary({
  order,
  linkItems = true,
}: {
  order: OrderDetailDto;
  linkItems?: boolean;
}) {
  return (
    <View>
      <SectionTitle>{t.items}</SectionTitle>
      <Card>
        {order.items.map((item) => (
          <Pressable
            key={item.productId}
            accessibilityRole={linkItems ? 'link' : 'text'}
            className="flex-row items-center border-b border-gray-100 p-3"
            disabled={!linkItems}
            onPress={() =>
              router.push({ pathname: '/product/[slug]', params: { slug: item.productSlug } })
            }>
            <View className="w-14">
              <ProductArt
                category={UNKNOWN_CATEGORY}
                height={THUMB_HEIGHT}
                iconSize={ICON_SIZE.medium}
                imageUrl={item.imageUrl}
                name={item.productName}
              />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-semibold text-gray-900" numberOfLines={2}>
                {item.productName}
              </Text>
              <Text className="text-sm text-gray-600">
                {t.qty(item.quantity)} × {formatINR(item.unitPriceInPaise)}
              </Text>
            </View>
            <Text className="font-semibold text-gray-900">{formatINR(item.lineTotalInPaise)}</Text>
          </Pressable>
        ))}
      </Card>

      <SectionTitle>{t.deliverTo}</SectionTitle>
      <Card className="p-3">
        <Text className="font-semibold text-gray-900">{order.address.name}</Text>
        <Text className="text-gray-700">{formatAddress(order.address)}</Text>
        <Text className="text-gray-600">+91 {order.address.phone}</Text>
        {order.installationRequested ? (
          <Text className="mt-2 font-semibold text-brand">✓ {t.installation}</Text>
        ) : null}
        {order.notes ? (
          <Text className="mt-2 text-gray-700">
            {t.note}: {order.notes}
          </Text>
        ) : null}
      </Card>

      <SectionTitle>{t.bill}</SectionTitle>
      <Card className="p-3">
        <Row label={t.subtotal} value={formatINR(order.subtotalInPaise)} />
        <Row
          label={t.delivery}
          value={
            order.deliveryChargeInPaise === 0
              ? strings.checkout.free
              : formatINR(order.deliveryChargeInPaise)
          }
        />
        <Row label={t.total} strong value={formatINR(order.totalInPaise)} />
        {order.payment ? (
          <Text className="mt-2 text-sm text-gray-600">
            {t.payment(
              t.paymentMethod[order.payment.method],
              t.paymentStatus[order.payment.status],
            )}
          </Text>
        ) : null}
      </Card>
    </View>
  );
}
