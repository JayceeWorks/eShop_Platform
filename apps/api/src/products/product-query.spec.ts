import { ProductListQuerySchema } from '@simple-concepts/shared';
import {
  PRODUCT_SUMMARY_SELECT,
  buildProductOrderBy,
  buildProductWhere,
} from './product-query';

const parse = (query: Record<string, string>) =>
  ProductListQuerySchema.parse(query);

describe('buildProductWhere', () => {
  it('only returns active products by default', () => {
    expect(buildProductWhere(parse({}))).toEqual({ isActive: true });
  });

  it('includes sub-categories when filtering by category', () => {
    expect(buildProductWhere(parse({ category: 'smart-home' })).AND).toEqual([
      {
        category: {
          OR: [{ slug: 'smart-home' }, { parent: { slug: 'smart-home' } }],
        },
      },
    ]);
  });

  it('filters by spec and price range', () => {
    const where = buildProductWhere(
      parse({
        placement: 'Outdoor',
        minPriceInPaise: '100',
        maxPriceInPaise: '200',
      }),
    );
    expect(where.priceInPaise).toEqual({ gte: 100, lte: 200 });
    expect(where.AND).toEqual([
      { specs: { some: { key: 'Placement', value: 'Outdoor' } } },
    ]);
  });

  it('requires every search term to match', () => {
    const where = buildProductWhere(parse({ q: 'dome  camera' }));
    expect(where.AND).toHaveLength(2);
  });
});

describe('buildProductOrderBy', () => {
  it('sorts by price with a stable tie-breaker', () => {
    expect(buildProductOrderBy('price_asc')).toEqual([
      { priceInPaise: 'asc' },
      { id: 'asc' },
    ]);
  });
});

describe('PRODUCT_SUMMARY_SELECT', () => {
  it('never selects cost price', () => {
    expect(JSON.stringify(PRODUCT_SUMMARY_SELECT)).not.toContain('costPrice');
  });
});
