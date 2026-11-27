import { discountPercent, formatINR } from '@simple-concepts/shared';
import { Text, View } from 'react-native';

import { strings } from '@/lib/i18n';

type PriceBlockProps = {
  priceInPaise: number;
  mrpInPaise: number;
  large?: boolean;
};

export function PriceBlock({ priceInPaise, mrpInPaise, large = false }: PriceBlockProps) {
  const discount = discountPercent(priceInPaise, mrpInPaise);

  return (
    <View>
      <Text className={`font-bold text-brand ${large ? 'text-3xl' : 'text-base'}`}>
        {formatINR(priceInPaise)}
      </Text>
      {discount > 0 ? (
        <View className="mt-0.5 flex-row flex-wrap items-center">
          <Text
            accessibilityLabel={`${strings.product.mrp} ${formatINR(mrpInPaise)}`}
            className={`mr-2 text-gray-500 line-through ${large ? 'text-base' : 'text-xs'}`}>
            {formatINR(mrpInPaise)}
          </Text>
          <Text className={`font-semibold text-green-700 ${large ? 'text-base' : 'text-xs'}`}>
            {discount}% {strings.common.off}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
