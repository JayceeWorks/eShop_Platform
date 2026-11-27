import { ProductListQuerySchema, discountPercent, getStockStatus } from './catalog';

describe('discountPercent', () => {
  it('rounds down', () => {
    expect(discountPercent(149900, 199900)).toBe(25);
  });

  it('returns 0 when there is no discount or no MRP', () => {
    expect(discountPercent(1000, 1000)).toBe(0);
    expect(discountPercent(1200, 1000)).toBe(0);
    expect(discountPercent(1000, 0)).toBe(0);
  });
});

describe('getStockStatus', () => {
  it('classifies stock levels', () => {
    expect(getStockStatus(0)).toBe('OUT_OF_STOCK');
    expect(getStockStatus(5)).toBe('LOW_STOCK');
    expect(getStockStatus(6)).toBe('IN_STOCK');
  });
});

describe('ProductListQuerySchema', () => {
  it('applies paging and sort defaults', () => {
    expect(ProductListQuerySchema.parse({})).toMatchObject({
      page: 1,
      limit: 20,
      sort: 'newest',
    });
  });

  it('rejects an inverted price range', () => {
    const result = ProductListQuerySchema.safeParse({
      minPriceInPaise: '500',
      maxPriceInPaise: '100',
    });
    expect(result.success).toBe(false);
  });

  it('rejects ids that are not UUIDs', () => {
    expect(ProductListQuerySchema.safeParse({ ids: 'abc,def' }).success).toBe(false);
  });
});
