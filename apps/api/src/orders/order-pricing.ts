import { ConflictException } from '@nestjs/common';
import { deliveryChargeFor } from '@simple-concepts/shared';

export type PricedProduct = {
  id: string;
  name: string;
  sku: string;
  priceInPaise: number;
  stockQty: number;
  isActive: boolean;
};

export type PricedLine = {
  productId: string;
  productName: string;
  sku: string;
  unitPriceInPaise: number;
  quantity: number;
  lineTotalInPaise: number;
};

export type OrderPricing = {
  lines: PricedLine[];
  subtotalInPaise: number;
  deliveryChargeInPaise: number;
  totalInPaise: number;
};

/**
 * Works out the order from the database's prices, ignoring anything the app says about totals.
 * Refuses products that are missing, hidden or short of stock.
 */
export function priceOrder(
  items: { productId: string; quantity: number }[],
  products: PricedProduct[],
): OrderPricing {
  const byId = new Map(products.map((product) => [product.id, product]));
  const lines = items.map(({ productId, quantity }) => {
    const product = byId.get(productId);
    if (!product?.isActive) {
      throw new ConflictException(
        'Some items in your cart are no longer available',
      );
    }
    if (product.stockQty < quantity) {
      throw new ConflictException(
        product.stockQty > 0
          ? `Only ${product.stockQty} of ${product.name} left in stock`
          : `${product.name} is out of stock`,
      );
    }
    return {
      productId,
      productName: product.name,
      sku: product.sku,
      unitPriceInPaise: product.priceInPaise,
      quantity,
      lineTotalInPaise: product.priceInPaise * quantity,
    };
  });
  const subtotalInPaise = lines.reduce(
    (total, line) => total + line.lineTotalInPaise,
    0,
  );
  const deliveryChargeInPaise = deliveryChargeFor(subtotalInPaise);
  return {
    lines,
    subtotalInPaise,
    deliveryChargeInPaise,
    totalInPaise: subtotalInPaise + deliveryChargeInPaise,
  };
}

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const ORDER_SEQUENCE_DIGITS = 4;

/** Date part of the order number, by Indian time, e.g. 20261127. */
export function orderDatePart(now: Date): string {
  return new Date(now.getTime() + IST_OFFSET_MS)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');
}

/** e.g. SC-20261127-0001. */
export function formatOrderNumber(datePart: string, sequence: number): string {
  return `SC-${datePart}-${String(sequence).padStart(ORDER_SEQUENCE_DIGITS, '0')}`;
}
