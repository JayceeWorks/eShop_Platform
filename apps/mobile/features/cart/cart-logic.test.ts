import type { ProductSummaryDto } from '@simple-concepts/shared';

import { clampQuantity, orderItemsFrom, summarizeCart } from './cart-logic';
import { useCartStore } from './cart-store';

function product(id: string, priceInPaise: number, mrpInPaise: number, stockQty: number) {
  return {
    id,
    name: id,
    slug: id,
    brand: 'Brand',
    model: 'Model',
    priceInPaise,
    mrpInPaise,
    stockQty,
    imageUrl: null,
    category: { name: 'Category', slug: 'category', parentSlug: null },
  } satisfies ProductSummaryDto;
}

describe('clampQuantity', () => {
  it('stays between zero and stock', () => {
    expect(clampQuantity(5, 3)).toBe(3);
    expect(clampQuantity(-1, 3)).toBe(0);
    expect(clampQuantity(2, 3)).toBe(2);
  });
});

describe('summarizeCart', () => {
  it('totals in paise using server prices', () => {
    const summary = summarizeCart({ a: 2, b: 1 }, [
      product('a', 149900, 199900, 10),
      product('b', 29900, 29900, 10),
    ]);
    expect(summary.itemCount).toBe(3);
    expect(summary.subtotalInPaise).toBe(329700);
    expect(summary.savingsInPaise).toBe(100000);
  });

  it('caps quantity at current stock', () => {
    const summary = summarizeCart({ a: 5 }, [product('a', 1000, 1000, 2)]);
    expect(summary.lines[0].quantity).toBe(2);
    expect(summary.subtotalInPaise).toBe(2000);
  });

  it('excludes out-of-stock and missing products from totals', () => {
    const summary = summarizeCart({ a: 1, gone: 1 }, [product('a', 1000, 1000, 0)]);
    expect(summary.subtotalInPaise).toBe(0);
    expect(summary.unavailableIds).toEqual(['gone']);
  });
});

describe('useCartStore', () => {
  beforeEach(() => useCartStore.setState({ quantities: {} }));

  it('does not add beyond stock', () => {
    const { addItem } = useCartStore.getState();
    addItem('a', 2);
    addItem('a', 2);
    addItem('a', 2);
    expect(useCartStore.getState().quantities.a).toBe(2);
  });

  it('does not add an out-of-stock product', () => {
    useCartStore.getState().addItem('a', 0);
    expect(useCartStore.getState().quantities).toEqual({});
  });

  it('removes an item when quantity reaches zero', () => {
    useCartStore.getState().addItem('a', 2);
    useCartStore.getState().setQuantity('a', 0, 2);
    expect(useCartStore.getState().quantities).toEqual({});
  });
});

describe('orderItemsFrom', () => {
  it('sends only lines that can be bought, capped to stock', () => {
    const summary = summarizeCart({ a: 5, b: 1, gone: 1 }, [
      product('a', 1000, 1000, 2),
      product('b', 1000, 1000, 0),
    ]);
    expect(orderItemsFrom(summary)).toEqual([{ productId: 'a', quantity: 2 }]);
  });
});
