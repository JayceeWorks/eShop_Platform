import type { ProductSummaryDto } from '@simple-concepts/shared';

export type CartQuantities = Record<string, number>;

export type CartLine = {
  product: ProductSummaryDto;
  quantity: number;
  lineTotalInPaise: number;
};

export type CartSummary = {
  lines: CartLine[];
  unavailableIds: string[];
  itemCount: number;
  subtotalInPaise: number;
  savingsInPaise: number;
};

/** Keeps a quantity between 0 and available stock. */
export function clampQuantity(quantity: number, stockQty: number): number {
  return Math.max(0, Math.min(Math.trunc(quantity), stockQty));
}

/**
 * Display-only totals from current server prices. Quantities are capped to current stock.
 * The server must recalculate everything when an order is placed.
 */
export function summarizeCart(
  quantities: CartQuantities,
  products: ProductSummaryDto[],
): CartSummary {
  const productsById = new Map(products.map((product) => [product.id, product]));
  const lines: CartLine[] = [];
  const unavailableIds: string[] = [];
  let itemCount = 0;
  let subtotalInPaise = 0;
  let savingsInPaise = 0;

  for (const [productId, requested] of Object.entries(quantities)) {
    const product = productsById.get(productId);
    if (!product) {
      unavailableIds.push(productId);
      continue;
    }
    const quantity = clampQuantity(requested, product.stockQty);
    const lineTotalInPaise = product.priceInPaise * quantity;
    lines.push({ product, quantity, lineTotalInPaise });
    itemCount += quantity;
    subtotalInPaise += lineTotalInPaise;
    savingsInPaise += Math.max(0, product.mrpInPaise - product.priceInPaise) * quantity;
  }

  return { lines, unavailableIds, itemCount, subtotalInPaise, savingsInPaise };
}

/** The lines to send when placing an order. Out-of-stock lines (quantity 0) are left out. */
export function orderItemsFrom(summary: CartSummary): { productId: string; quantity: number }[] {
  return summary.lines
    .filter(({ quantity }) => quantity > 0)
    .map(({ product, quantity }) => ({ productId: product.id, quantity }));
}
