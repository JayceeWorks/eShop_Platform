import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, Text, View } from 'react-native';

import { TextField } from '@/components/admin/text-field';
import { OrderSummary } from '@/components/orders/order-summary';
import { StatusBadge, StatusTimeline } from '@/components/orders/order-status';
import { ErrorState } from '@/components/screen-states';
import { Button } from '@/components/ui/buttons';
import { Card, SectionTitle } from '@/components/ui/menu-row';
import { colors } from '@/constants/theme';
import { formatDateTime } from '@/features/orders/order-display';
import { useAdminOrder, useSetOrderStatus } from '@/features/orders/use-orders';
import { errorMessage } from '@/lib/api';
import { strings } from '@/lib/i18n';

const t = strings.adminOrders;

export default function AdminOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useAdminOrder(id);
  const setStatus = useSetOrderStatus(id);
  const [note, setNote] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (order.isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }
  if (order.isError) return <ErrorState onRetry={() => order.refetch()} />;

  const data = order.data;
  const forward = data.nextStatuses.filter((status) => status !== 'CANCELLED');
  const canCancel = data.nextStatuses.includes('CANCELLED');
  const move = (status: (typeof data.nextStatuses)[number]) =>
    setStatus.mutate(
      { status, note: note.trim() || undefined },
      {
        onSuccess: () => {
          setNote('');
          setConfirmCancel(false);
        },
      },
    );

  return (
    <ScrollView contentContainerClassName="px-4 pb-8" keyboardShouldPersistTaps="handled">
      <View className="mt-4">
        <Text accessibilityRole="header" className="text-xl font-bold text-brand">
          {data.orderNumber}
        </Text>
        <Text className="mb-2 text-gray-600">{formatDateTime(data.createdAt)}</Text>
        <StatusBadge status={data.status} />
      </View>

      <SectionTitle>{t.customer}</SectionTitle>
      <Card className="p-3">
        <Text className="font-semibold text-gray-900">{data.customer.name ?? '—'}</Text>
        <Text className="mb-2 text-gray-700">+91 {data.customer.phone}</Text>
        <Button
          label={t.call}
          variant="outline"
          onPress={() => void Linking.openURL(`tel:+91${data.customer.phone}`)}
        />
      </Card>

      <SectionTitle>{strings.orders.tracking}</SectionTitle>
      <Card className="p-4">
        <StatusTimeline history={data.history} status={data.status} />
        {data.nextStatuses.length === 0 ? (
          <Text className="mt-3 text-gray-600">{t.done}</Text>
        ) : (
          <View className="mt-4 gap-3">
            <TextField
              label={t.note}
              maxLength={500}
              note={t.noteHint}
              onChangeText={setNote}
              value={note}
            />
            {setStatus.isError ? (
              <Text accessibilityLiveRegion="polite" className="text-red-700">
                {errorMessage(setStatus.error)}
              </Text>
            ) : null}
            {forward.map((status) => (
              <Button
                key={status}
                label={t.moveTo(strings.orders.status[status])}
                loading={setStatus.isPending && setStatus.variables?.status === status}
                disabled={setStatus.isPending}
                onPress={() => move(status)}
              />
            ))}
            {canCancel && !confirmCancel ? (
              <Button label={t.cancel} variant="danger" onPress={() => setConfirmCancel(true)} />
            ) : null}
            {canCancel && confirmCancel ? (
              <View className="gap-3 rounded-2xl border border-red-200 bg-red-50 p-3">
                <Text className="text-red-900">{strings.orders.cancelConfirm}</Text>
                <Button
                  label={strings.orders.cancelYes}
                  loading={setStatus.isPending && setStatus.variables?.status === 'CANCELLED'}
                  variant="dangerFill"
                  onPress={() => move('CANCELLED')}
                />
                <Button
                  label={strings.orders.keep}
                  variant="outline"
                  onPress={() => setConfirmCancel(false)}
                />
              </View>
            ) : null}
          </View>
        )}
      </Card>

      <OrderSummary linkItems={false} order={data} />
    </ScrollView>
  );
}
