import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReviewDto } from '@simple-concepts/shared';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { StarRow } from '@/components/ui/stars';
import { ICON_SIZE, colors } from '@/constants/theme';
import { useReviews } from '@/features/feedback/use-feedback';
import { formatDate } from '@/features/orders/order-display';
import { strings } from '@/lib/i18n';

const t = strings.reviews;
const AVERAGE_STAR_SIZE = 20;

function ReviewItem({ review, own }: { review: ReviewDto; own?: boolean }) {
  return (
    <View className="border-b border-gray-100 py-3">
      <View className="flex-row items-center">
        <StarRow rating={review.rating} />
        <Text className="ml-2 font-semibold text-gray-900">
          {own ? t.yours : review.authorName}
        </Text>
        {review.isVerifiedBuyer ? (
          <View className="ml-2 flex-row items-center">
            <Ionicons color={colors.success} name="checkmark-circle" size={ICON_SIZE.small} />
            <Text className="ml-0.5 text-xs font-semibold text-green-800">{t.verified}</Text>
          </View>
        ) : null}
      </View>
      {review.comment ? <Text className="mt-1 text-gray-700">{review.comment}</Text> : null}
      <Text className="mt-1 text-xs text-gray-500">{formatDate(review.createdAt)}</Text>
    </View>
  );
}

/** Ratings and reviews block on the product page. */
export function ProductReviews({ slug }: { slug: string }) {
  const reviews = useReviews(slug);

  return (
    <View className="mt-2 bg-white p-4">
      <Text accessibilityRole="header" className="mb-2 text-lg font-bold text-brand">
        {t.title}
      </Text>
      {reviews.isPending ? (
        <ActivityIndicator color={colors.brand} />
      ) : reviews.isError ? (
        <Pressable accessibilityRole="button" onPress={() => void reviews.refetch()}>
          <Text className="text-gray-600">
            {strings.common.loadError}{' '}
            <Text className="font-semibold text-brand">{strings.common.retry}</Text>
          </Text>
        </Pressable>
      ) : (
        <>
          {reviews.data.count > 0 ? (
            <View className="mb-1 flex-row items-center">
              <Text className="mr-2 text-2xl font-bold text-gray-900">
                {reviews.data.average.toFixed(1)}
              </Text>
              <StarRow rating={reviews.data.average} size={AVERAGE_STAR_SIZE} />
              <Text className="ml-2 text-gray-600">{t.count(reviews.data.count)}</Text>
            </View>
          ) : (
            <Text className="text-gray-600">{t.none}</Text>
          )}
          {reviews.data.mine ? <ReviewItem own review={reviews.data.mine} /> : null}
          {reviews.data.reviews
            .filter((review) => review.id !== reviews.data.mine?.id)
            .map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))}
          <Pressable
            accessibilityRole="button"
            className="mt-3 min-h-11 flex-row items-center justify-center rounded-full border border-brand"
            onPress={() => router.push({ pathname: '/review/[slug]', params: { slug } })}>
            <Ionicons color={colors.brand} name="create-outline" size={ICON_SIZE.small} />
            <Text className="ml-1 font-semibold text-brand">
              {reviews.data.mine ? t.edit : t.write}
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
