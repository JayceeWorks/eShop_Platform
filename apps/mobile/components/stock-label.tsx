import { getStockStatus } from '@simple-concepts/shared';
import { Text } from 'react-native';

import { strings } from '@/lib/i18n';

export function StockLabel({ stockQty }: { stockQty: number }) {
  const status = getStockStatus(stockQty);

  if (status === 'OUT_OF_STOCK') {
    return (
      <Text className="text-xs font-semibold text-red-700">
        {strings.product.stock.OUT_OF_STOCK}
      </Text>
    );
  }
  if (status === 'LOW_STOCK') {
    return (
      <Text className="text-xs font-semibold text-amber-800">
        {strings.product.stock.LOW_STOCK(stockQty)}
      </Text>
    );
  }
  return (
    <Text className="text-xs font-semibold text-green-700">{strings.product.stock.IN_STOCK}</Text>
  );
}
