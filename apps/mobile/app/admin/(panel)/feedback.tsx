import { ActivityIndicator, FlatList, Text, View } from 'react-native';

import { ErrorState, MessageState } from '@/components/screen-states';
import { StarRow } from '@/components/ui/stars';
import { colors } from '@/constants/theme';
import { formatDateTime } from '@/features/orders/order-display';
import { useAdminFeedback } from '@/features/orders/use-orders';
import { strings } from '@/lib/i18n';

const t = strings.adminOrders;
const LOAD_MORE_THRESHOLD = 0.5;

export default function AdminFeedbackScreen() {
  const feedback = useAdminFeedback();
  const items = feedback.data?.pages.flatMap((page) => page.items) ?? [];

  if (feedback.isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }
  if (feedback.isError) return <ErrorState onRetry={() => feedback.refetch()} />;
  if (items.length === 0)
    return <MessageState icon="chatbubbles-outline" title={t.feedbackEmpty} />;

  return (
    <FlatList
      contentContainerClassName="p-3"
      data={items}
      keyExtractor={({ id }) => id}
      onEndReached={() => {
        if (feedback.hasNextPage && !feedback.isFetchingNextPage) void feedback.fetchNextPage();
      }}
      onEndReachedThreshold={LOAD_MORE_THRESHOLD}
      onRefresh={() => void feedback.refetch()}
      refreshing={feedback.isRefetching}
      renderItem={({ item }) => (
        <View className="mb-2 rounded-2xl border border-gray-200 bg-white p-3">
          <View className="flex-row items-center justify-between">
            <StarRow rating={item.rating} />
            <Text className="text-xs text-gray-500">{formatDateTime(item.createdAt)}</Text>
          </View>
          <Text className="mt-2 text-gray-900">{item.message}</Text>
          <Text className="mt-2 text-sm text-gray-600">
            {item.customer.name ?? t.customer} · +91 {item.customer.phone}
            {item.orderNumber ? ` · ${item.orderNumber}` : ''}
          </Text>
        </View>
      )}
    />
  );
}
