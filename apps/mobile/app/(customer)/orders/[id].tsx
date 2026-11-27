import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, Text, View } from 'react-native';

import { TextField } from '@/components/admin/text-field';
import { OrderSummary } from '@/components/orders/order-summary';
import { StatusBadge, StatusTimeline } from '@/components/orders/order-status';
import { RequireSignIn } from '@/components/require-sign-in';
import { ErrorState, MessageState } from '@/components/screen-states';
import { Button } from '@/components/ui/buttons';
import { Card, SectionTitle } from '@/components/ui/menu-row';
import { SHOP_PHONE } from '@/constants/config';
import { ICON_SIZE, colors } from '@/constants/theme';
import { formatDateTime } from '@/features/orders/order-display';
import { useCancelOrder, useMyOrder } from '@/features/orders/use-orders';
import { ApiError, errorMessage } from '@/lib/api';
import { strings } from '@/lib/i18n';

const t = strings.orders;
const NOT_FOUND = 404;

function OrderDetail() {
  const { id, placed } = useLocalSearchParams<{ id: string; placed?: string }>();
  const order = useMyOrder(id);
  const cancel = useCancelOrder(id);
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState('');

  if (order.isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }
  if (order.isError) {
    if (order.error instanceof ApiError && order.error.status === NOT_FOUND) {
      return <MessageState icon="alert-circle-outline" title={strings.common.loadError} />;
    }
    return <ErrorState onRetry={() => order.refetch()} />;
  }

  const data = order.data;

  return (
    <ScrollView contentContainerClassName="px-4 pb-8" keyboardShouldPersistTaps="handled">
      {placed === '1' && data.status === 'PLACED' ? (
        <View className="mt-4 flex-row rounded-2xl bg-green-50 p-4">
          <Ionicons color={colors.success} name="checkmark-circle" size={ICON_SIZE.large} />
          <View className="ml-3 flex-1">
            <Text accessibilityLiveRegion="polite" className="text-lg font-bold text-green-900">
              {t.placedBanner}
            </Text>
            <Text className="text-green-900">{t.placedBody}</Text>
          </View>
        </View>
      ) : null}

      <View className="mt-4">
        <Text accessibilityRole="header" className="text-xl font-bold text-brand">
          {t.number(data.orderNumber)}
        </Text>
        <Text className="mb-2 text-gray-600">{t.placedOn(formatDateTime(data.createdAt))}</Text>
        <StatusBadge status={data.status} />
      </View>

      <SectionTitle>{t.tracking}</SectionTitle>
      <Card className="p-4">
        <StatusTimeline history={data.history} status={data.status} />
      </Card>

      <OrderSummary order={data} />

      <View className="mt-6 gap-3">
        {data.status === 'DELIVERED' ? (
          <Button
            label={t.feedback}
            onPress={() =>
              router.push({
                pathname: '/feedback',
                params: { orderId: data.id, orderNumber: data.orderNumber },
              })
            }
          />
        ) : null}
        {SHOP_PHONE ? (
          <Button
            label={t.callUs}
            variant="outline"
            onPress={() => void Linking.openURL(`tel:${SHOP_PHONE}`)}
          />
        ) : null}
        {data.canCancel && !confirming ? (
          <Button label={t.cancel} variant="danger" onPress={() => setConfirming(true)} />
        ) : null}
      </View>

      {data.canCancel && confirming ? (
        <View className="mt-3 gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <Text className="text-red-900">{t.cancelConfirm}</Text>
          <TextField
            label={t.cancelReason}
            maxLength={500}
            onChangeText={setReason}
            value={reason}
          />
          {cancel.isError ? (
            <Text accessibilityLiveRegion="polite" className="text-red-800">
              {errorMessage(cancel.error)}
            </Text>
          ) : null}
          <Button
            label={t.cancelYes}
            loading={cancel.isPending}
            variant="dangerFill"
            onPress={() =>
              cancel.mutate(reason.trim() || undefined, { onSuccess: () => setConfirming(false) })
            }
          />
          <Button label={t.keep} variant="outline" onPress={() => setConfirming(false)} />
        </View>
      ) : null}
    </ScrollView>
  );
}

export default function OrderDetailScreen() {
  return (
    <RequireSignIn>
      <OrderDetail />
    </RequireSignIn>
  );
}
