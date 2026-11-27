import Ionicons from '@expo/vector-icons/Ionicons';
import type { NotificationDto } from '@simple-concepts/shared';
import { Stack, router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { RequireSignIn } from '@/components/require-sign-in';
import { ErrorState, MessageState } from '@/components/screen-states';
import { ICON_SIZE, colors } from '@/constants/theme';
import { useMarkNotificationsRead, useNotifications } from '@/features/feedback/use-feedback';
import { formatDateTime } from '@/features/orders/order-display';
import { strings } from '@/lib/i18n';

const t = strings.notifications;
const LOAD_MORE_THRESHOLD = 0.5;

function NotificationRow({
  item,
  onOpen,
}: {
  item: NotificationDto;
  onOpen: (item: NotificationDto) => void;
}) {
  const unread = item.readAt === null;
  return (
    <Pressable
      accessibilityLabel={`${unread ? `${t.unreadLabel}. ` : ''}${item.title}. ${item.body}`}
      accessibilityRole={item.orderId ? 'link' : 'text'}
      className={`mb-2 flex-row rounded-2xl border p-4 ${
        unread ? 'border-accent bg-white' : 'border-gray-200 bg-white/70'
      }`}
      onPress={() => onOpen(item)}>
      <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-tint">
        <Ionicons color={colors.brand} name="cube-outline" size={ICON_SIZE.medium} />
      </View>
      <View className="ml-3 flex-1">
        <Text className={`text-gray-900 ${unread ? 'font-bold' : 'font-semibold'}`}>
          {item.title}
        </Text>
        <Text className="mt-0.5 text-gray-700">{item.body}</Text>
        <Text className="mt-1 text-xs text-gray-500">{formatDateTime(item.createdAt)}</Text>
      </View>
      {unread ? <View className="ml-2 mt-1 h-2.5 w-2.5 rounded-full bg-accent" /> : null}
    </Pressable>
  );
}

function NotificationList() {
  const notifications = useNotifications();
  const markRead = useMarkNotificationsRead();
  const items = notifications.data?.pages.flatMap((page) => page.items) ?? [];
  const hasUnread = items.some((item) => item.readAt === null);

  const open = (item: NotificationDto) => {
    if (item.readAt === null) markRead.one.mutate(item.id);
    if (item.orderId) router.push({ pathname: '/orders/[id]', params: { id: item.orderId } });
  };

  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          headerRight: hasUnread
            ? () => (
                <Pressable
                  accessibilityRole="button"
                  className="min-h-11 justify-center px-2"
                  onPress={() => markRead.all.mutate()}>
                  <Text className="font-semibold text-white">{t.markAll}</Text>
                </Pressable>
              )
            : undefined,
        }}
      />
      {notifications.isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : notifications.isError ? (
        <ErrorState onRetry={() => notifications.refetch()} />
      ) : items.length === 0 ? (
        <MessageState body={t.emptyBody} icon="notifications-outline" title={t.empty} />
      ) : (
        <FlatList
          contentContainerClassName="p-4"
          data={items}
          keyExtractor={({ id }) => id}
          onEndReached={() => {
            if (notifications.hasNextPage && !notifications.isFetchingNextPage) {
              void notifications.fetchNextPage();
            }
          }}
          onEndReachedThreshold={LOAD_MORE_THRESHOLD}
          onRefresh={() => void notifications.refetch()}
          refreshing={notifications.isRefetching}
          renderItem={({ item }) => <NotificationRow item={item} onOpen={open} />}
        />
      )}
    </View>
  );
}

export default function NotificationsScreen() {
  return (
    <RequireSignIn>
      <NotificationList />
    </RequireSignIn>
  );
}
