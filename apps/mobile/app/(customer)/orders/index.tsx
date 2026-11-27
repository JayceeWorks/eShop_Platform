import Ionicons from '@expo/vector-icons/Ionicons';
import { formatINR, type OrderSummaryDto } from '@simple-concepts/shared';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { StatusBadge } from '@/components/orders/order-status';
import { ProductArt } from '@/components/product-art';
import { RequireSignIn } from '@/components/require-sign-in';
import { ErrorState, MessageState } from '@/components/screen-states';
import { ICON_SIZE, colors } from '@/constants/theme';
import { formatDate } from '@/features/orders/order-display';
import { useMyOrders } from '@/features/orders/use-orders';
import { strings } from '@/lib/i18n';

const t = strings.orders;
const THUMB_HEIGHT = 64;
const LOAD_MORE_THRESHOLD = 0.5;
// Order lines keep a snapshot of the name, not the category, so the art falls back to a camera icon.
const UNKNOWN_CATEGORY = { name: '', slug: '', parentSlug: null };

function OrderRow({ order }: { order: OrderSummaryDto }) {
  return (
    <Pressable
      accessibilityLabel={`${t.number(order.orderNumber)}, ${t.status[order.status]}`}
      accessibilityRole="link"
      className="mb-3 flex-row items-center rounded-2xl border border-gray-200 bg-white p-3 active:opacity-80"
      onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order.id } })}>
      <View className="w-16">
        <ProductArt
          category={UNKNOWN_CATEGORY}
          height={THUMB_HEIGHT}
          iconSize={ICON_SIZE.medium}
          imageUrl={order.imageUrl}
          name={order.firstItemName}
        />
      </View>
      <View className="ml-3 flex-1">
        <StatusBadge status={order.status} />
        <Text className="mt-1 font-semibold text-gray-900" numberOfLines={1}>
          {t.itemsSummary(order.firstItemName, order.itemCount)}
        </Text>
        <Text className="text-xs text-gray-500">
          {order.orderNumber} · {formatDate(order.createdAt)}
        </Text>
        <Text className="mt-0.5 font-bold text-brand">{formatINR(order.totalInPaise)}</Text>
      </View>
      <Ionicons color={colors.muted} name="chevron-forward" size={ICON_SIZE.small} />
    </Pressable>
  );
}

function OrderList() {
  const orders = useMyOrders();
  const items = orders.data?.pages.flatMap((page) => page.items) ?? [];

  if (orders.isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }
  if (orders.isError) return <ErrorState onRetry={() => orders.refetch()} />;
  if (items.length === 0) {
    return (
      <MessageState
        actionLabel={strings.cart.startShopping}
        body={t.emptyBody}
        icon="cube-outline"
        onAction={() => router.navigate('/')}
        title={t.empty}
      />
    );
  }
  return (
    <FlatList
      contentContainerClassName="p-4"
      data={items}
      keyExtractor={({ id }) => id}
      onEndReached={() => {
        if (orders.hasNextPage && !orders.isFetchingNextPage) void orders.fetchNextPage();
      }}
      onEndReachedThreshold={LOAD_MORE_THRESHOLD}
      onRefresh={() => void orders.refetch()}
      refreshing={orders.isRefetching}
      renderItem={({ item }) => <OrderRow order={item} />}
    />
  );
}

export default function OrdersScreen() {
  return (
    <RequireSignIn>
      <OrderList />
    </RequireSignIn>
  );
}
