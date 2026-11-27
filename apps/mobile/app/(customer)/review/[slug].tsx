import { ReviewInputSchema } from '@simple-concepts/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { TextField } from '@/components/admin/text-field';
import { RequireSignIn } from '@/components/require-sign-in';
import { ErrorState } from '@/components/screen-states';
import { Button } from '@/components/ui/buttons';
import { Card } from '@/components/ui/menu-row';
import { StarInput } from '@/components/ui/stars';
import { colors } from '@/constants/theme';
import { useReviews, useSaveReview } from '@/features/feedback/use-feedback';
import { errorMessage } from '@/lib/api';
import { strings } from '@/lib/i18n';

const t = strings.reviews;

function ReviewForm({
  slug,
  initialRating,
  initialComment,
  hasReview,
}: {
  slug: string;
  initialRating: number;
  initialComment: string;
  hasReview: boolean;
}) {
  const { save, remove } = useSaveReview(slug);
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [ratingError, setRatingError] = useState<string>();
  const failed = save.error ?? remove.error;

  const submit = () => {
    const result = ReviewInputSchema.safeParse({ rating, comment });
    if (!result.success) {
      setRatingError(result.error.issues[0]?.message);
      return;
    }
    setRatingError(undefined);
    save.mutate(result.data, { onSuccess: () => router.back() });
  };

  return (
    <ScrollView contentContainerClassName="p-4" keyboardShouldPersistTaps="handled">
      <Card className="p-4">
        <Text className="text-sm font-semibold text-gray-700">{strings.feedback.rating}</Text>
        <StarInput value={rating} onChange={setRating} />
        {ratingError ? <Text className="mb-2 text-sm text-red-700">{ratingError}</Text> : null}
        <View className="mt-2">
          <TextField
            label={t.comment}
            maxLength={1000}
            multiline
            onChangeText={setComment}
            placeholder={t.commentPlaceholder}
            value={comment}
          />
        </View>
        {failed ? (
          <Text accessibilityLiveRegion="polite" className="mb-3 text-red-700">
            {errorMessage(failed)}
          </Text>
        ) : null}
        <View className="gap-3">
          <Button label={t.save} loading={save.isPending} onPress={submit} />
          {hasReview ? (
            <Button
              label={t.remove}
              loading={remove.isPending}
              variant="danger"
              onPress={() => remove.mutate(undefined, { onSuccess: () => router.back() })}
            />
          ) : null}
        </View>
      </Card>
    </ScrollView>
  );
}

function ReviewLoader() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const reviews = useReviews(slug);

  if (reviews.isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }
  if (reviews.isError) return <ErrorState onRetry={() => reviews.refetch()} />;
  const mine = reviews.data.mine;
  return (
    <ReviewForm
      hasReview={!!mine}
      initialComment={mine?.comment ?? ''}
      initialRating={mine?.rating ?? 0}
      slug={slug}
    />
  );
}

export default function ReviewScreen() {
  return (
    <RequireSignIn>
      <ReviewLoader />
    </RequireSignIn>
  );
}
