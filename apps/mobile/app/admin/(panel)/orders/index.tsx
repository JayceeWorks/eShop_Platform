import Ionicons from '@expo/vector-icons/Ionicons';
import { formatINR, type AdminOrderSummaryDto, type OrderStatus } from '@simple-concepts/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, Pressable, Text, View } from 'react-native';

import { Chip } from '@/components/chip';
import { StatusBadge } from '@/components/orders/order-status';
import { ErrorState, MessageState } from '@/components/screen-states';
import { ICON_SIZE, colors } from '@/constants/theme';
import { formatDateTime } from '@/features/orders/order-display';
import { useAdminOrders } from '@/features/orders/use-orders';
import { strings } from '@/lib/i18n';

const t = strings.adminOrders;
const LOAD_MORE_THRESHOLD = 0.5;
const FILTERS: (OrderStatus | undefined)[] = [
  undefined,
  'PLACED',
  'CONFIRMED',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

function OrderRow({ order }: { order: AdminOrderSummaryDto }) {
  return (
    <Pressable
      accessibilityLabel={`${order.orderNumber}, ${strings.orders.status[order.status]}`}
      accessibilityRole="link"
      className="mb-2 flex-row items-center rounded-2xl border border-gray-200 bg-white p-3 active:opacity-80"
      onPress={() => router.push({ pathname: '/admin/orders/[id]', params: { id: order.id } })}>
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="font-bold text-gray-900">{order.orderNumber}</Text>
          <StatusBadge status={order.status} />
        </View>
        <Text className="mt-1 text-gray-700" numberOfLines={1}>
          {order.customer.name ?? strings.adminOrders.customer} · +91 {order.customer.phone}
        </Text>
        <Text className="text-sm text-gray-600" numberOfLines={1}>
          {strings.orders.itemsSummary(order.firstItemName, order.itemCount)}
        </Text>
        <View className="mt-1 flex-row justify-between">
          <Text className="font-bold text-brand">{formatINR(order.totalInPaise)}</Text>
          <Text className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</Text>
        </View>
      </View>
      <Ionicons
        className="ml-2"
        color={colors.muted}
        name="chevron-forward"
        size={ICON_SIZE.small}
      />
    </Pressable>
  );
}

export default function AdminOrdersScreen() {
  const [status, setStatus] = useState<OrderStatus | undefined>();
  const orders = useAdminOrders(status);
  const items = orders.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <View className="flex-1">
      <View className="border-b border-gray-200 bg-white">
        <ScrollView
          horizontal
          contentContainerClassName="px-3 py-2"
          showsHorizontalScrollIndicator={false}>
          {FILTERS.map((option) => (
            <Chip
              key={option ?? 'all'}
              label={option ? strings.orders.status[option] : t.all}
              selected={status === option}
              onPress={() => setStatus(option)}
            />
          ))}
        </ScrollView>
      </View>
      {orders.isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : orders.isError ? (
        <ErrorState onRetry={() => orders.refetch()} />
      ) : items.length === 0 ? (
        <MessageState icon="cube-outline" title={t.empty} />
      ) : (
        <FlatList
          contentContainerClassName="p-3"
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
      )}
    </View>
  );
}
