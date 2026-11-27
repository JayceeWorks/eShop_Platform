import Ionicons from '@expo/vector-icons/Ionicons';
import type { OrderHistoryDto, OrderStatus } from '@simple-concepts/shared';
import { Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { buildTimeline, formatDateTime, statusTone } from '@/features/orders/order-display';
import { strings } from '@/lib/i18n';

const TONE_CLASSES = {
  progress: 'bg-brand-tint text-brand',
  done: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
} as const;
const DOT_SIZE = 14;
const CANCELLED_COLOR = '#B91C1C';

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Text
      className={`self-start overflow-hidden rounded-full px-3 py-0.5 text-xs font-bold ${
        TONE_CLASSES[statusTone(status)]
      }`}>
      {strings.orders.status[status]}
    </Text>
  );
}

/** Vertical tracking timeline: one row per step, with the time it was reached. */
export function StatusTimeline({
  status,
  history,
}: {
  status: OrderStatus;
  history: OrderHistoryDto[];
}) {
  const steps = buildTimeline(status, history);
  const notes = new Map(history.map((entry) => [entry.status, entry.note]));

  return (
    <View accessibilityRole="list">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const cancelled = step.status === 'CANCELLED';
        const reached = step.state !== 'upcoming';
        const dotColor = cancelled ? CANCELLED_COLOR : reached ? colors.brand : colors.border;
        const note = notes.get(step.status);
        return (
          <View
            key={step.status}
            accessibilityLabel={`${strings.orders.status[step.status]}${
              step.at ? `, ${formatDateTime(step.at)}` : ''
            }`}
            accessible
            className="flex-row">
            <View className="w-6 items-center">
              <View
                className="items-center justify-center rounded-full"
                style={{
                  width: DOT_SIZE,
                  height: DOT_SIZE,
                  backgroundColor: dotColor,
                  marginTop: 3,
                }}>
                {step.state === 'done' ? (
                  <Ionicons color={colors.white} name="checkmark" size={10} />
                ) : null}
              </View>
              {!isLast ? (
                <View
                  className="w-0.5 flex-1"
                  style={{ backgroundColor: step.state === 'done' ? colors.brand : colors.border }}
                />
              ) : null}
            </View>
            <View className={`ml-2 flex-1 ${isLast ? '' : 'pb-4'}`}>
              <Text
                className={`font-semibold ${
                  cancelled ? 'text-red-700' : reached ? 'text-gray-900' : 'text-gray-400'
                }`}>
                {strings.orders.status[step.status]}
              </Text>
              {step.at ? (
                <Text className="text-xs text-gray-500">{formatDateTime(step.at)}</Text>
              ) : null}
              {note ? <Text className="mt-0.5 text-sm text-gray-700">{note}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
