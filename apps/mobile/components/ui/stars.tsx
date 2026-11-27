import Ionicons from '@expo/vector-icons/Ionicons';
import { MAX_RATING } from '@simple-concepts/shared';
import { Pressable, View } from 'react-native';

import { ICON_SIZE } from '@/constants/theme';
import { strings } from '@/lib/i18n';

// Amber reads clearly as "stars" on both white and mint backgrounds.
const STAR_COLOR = '#D97706';
const EMPTY_STAR_COLOR = '#D1D5DB';
const LARGE_STAR_SIZE = 36;
const HALF = 0.5;
const STARS = Array.from({ length: MAX_RATING }, (_, index) => index + 1);

/** Read-only stars. Shows half stars for averages. */
export function StarRow({ rating, size = ICON_SIZE.small }: { rating: number; size?: number }) {
  return (
    <View accessibilityLabel={strings.reviews.outOf(rating)} className="flex-row" accessible>
      {STARS.map((star) => {
        const name = rating >= star ? 'star' : rating >= star - HALF ? 'star-half' : 'star-outline';
        return (
          <Ionicons
            key={star}
            color={rating >= star - HALF ? STAR_COLOR : EMPTY_STAR_COLOR}
            name={name}
            size={size}
          />
        );
      })}
    </View>
  );
}

/** Tap a star to choose a rating from 1 to 5. */
export function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <View accessibilityRole="radiogroup" className="flex-row">
      {STARS.map((star) => (
        <Pressable
          key={star}
          accessibilityLabel={strings.feedback.star(star)}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === star }}
          className="h-12 w-12 items-center justify-center"
          onPress={() => onChange(star)}>
          <Ionicons
            color={value >= star ? STAR_COLOR : EMPTY_STAR_COLOR}
            name={value >= star ? 'star' : 'star-outline'}
            size={LARGE_STAR_SIZE}
          />
        </Pressable>
      ))}
    </View>
  );
}
