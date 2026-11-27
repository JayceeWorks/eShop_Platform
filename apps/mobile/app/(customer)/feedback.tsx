import Ionicons from '@expo/vector-icons/Ionicons';
import { FeedbackInputSchema } from '@simple-concepts/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { TextField } from '@/components/admin/text-field';
import { RequireSignIn } from '@/components/require-sign-in';
import { Button } from '@/components/ui/buttons';
import { Card } from '@/components/ui/menu-row';
import { StarInput } from '@/components/ui/stars';
import { ICON_SIZE, colors } from '@/constants/theme';
import { useSendFeedback } from '@/features/feedback/use-feedback';
import { errorMessage } from '@/lib/api';
import { strings } from '@/lib/i18n';

const t = strings.feedback;

/** Shop feedback. Opened from an order, it is linked to that order. */
function FeedbackForm() {
  const { orderId, orderNumber } = useLocalSearchParams<{
    orderId?: string;
    orderNumber?: string;
  }>();
  const send = useSendFeedback();
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ rating?: string; message?: string }>({});

  if (send.isSuccess) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Ionicons color={colors.success} name="checkmark-circle" size={ICON_SIZE.hero} />
        <Text
          accessibilityLiveRegion="polite"
          className="mb-6 mt-3 text-center text-lg font-bold text-brand">
          {t.thanks}
        </Text>
        <Button label={strings.common.done} onPress={() => router.back()} />
      </View>
    );
  }

  const submit = () => {
    const result = FeedbackInputSchema.safeParse({ rating, message, orderId });
    if (!result.success) {
      const next: typeof errors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (field === 'rating' || field === 'message') next[field] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    send.mutate(result.data);
  };

  return (
    <ScrollView contentContainerClassName="p-4" keyboardShouldPersistTaps="handled">
      <Card className="p-4">
        <Text className="mb-3 text-base text-gray-800">
          {orderNumber ? t.orderBody(orderNumber) : t.body}
        </Text>
        <Text className="text-sm font-semibold text-gray-700">{t.rating}</Text>
        <StarInput value={rating} onChange={setRating} />
        {errors.rating ? <Text className="mb-2 text-sm text-red-700">{errors.rating}</Text> : null}
        <View className="mt-2">
          <TextField
            error={errors.message}
            label={t.message}
            multiline
            onChangeText={setMessage}
            placeholder={t.messagePlaceholder}
            value={message}
          />
        </View>
        {send.isError ? (
          <Text accessibilityLiveRegion="polite" className="mb-3 text-red-700">
            {errorMessage(send.error)}
          </Text>
        ) : null}
        <Button label={t.send} loading={send.isPending} onPress={submit} />
      </Card>
    </ScrollView>
  );
}

export default function FeedbackScreen() {
  return (
    <RequireSignIn>
      <FeedbackForm />
    </RequireSignIn>
  );
}
