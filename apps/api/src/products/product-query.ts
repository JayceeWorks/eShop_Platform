import { FILTERABLE_SPEC_KEYS, type ProductListQuery } from '@simple-concepts/shared';
import type { Prisma } from '../generated/prisma/client';

const SEARCH_FIELDS = ['name', 'brand', 'model', 'sku', 'description'] as const;

/** Allow-list of customer-visible columns. Cost price must never be added here. */
export const PRODUCT_SUMMARY_SELECT = {
  id: true,
  name: true,
  slug: true,
  brand: true,
  model: true,
  priceInPaise: true,
  mrpInPaise: true,
  stockQty: true,
  images: {
    orderBy: { sortOrder: 'asc' },
    take: 1,
    select: { url: true },
  },
  category: {
    select: {
      name: true,
      slug: true,
      parent: { select: { slug: true } },
    },
  },
} satisfies Prisma.ProductSelect;

export type ProductSummaryRow = Prisma.ProductGetPayload<{
  select: typeof PRODUCT_SUMMARY_SELECT;
}>;

export function categoryWhere(slug: string): Prisma.ProductWhereInput {
  return { category: { OR: [{ slug }, { parent: { slug } }] } };
}

function specWhere(key: string, value: string): Prisma.ProductWhereInput {
  return { specs: { some: { key, value } } };
}

export function searchWhere(query: string): Prisma.ProductWhereInput[] {
  return query
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => ({
      OR: SEARCH_FIELDS.map((field) => ({
        [field]: { contains: term, mode: 'insensitive' as const },
      })),
    }));
}

export function buildProductWhere(
  query: ProductListQuery,
): Prisma.ProductWhereInput {
  const conditions: Prisma.ProductWhereInput[] = [];

  if (query.q) conditions.push(...searchWhere(query.q));
  if (query.category) conditions.push(categoryWhere(query.category));
  if (query.resolution) {
    conditions.push(
      specWhere(FILTERABLE_SPEC_KEYS.resolution, query.resolution),
    );
  }
  if (query.placement) {
    conditions.push(specWhere(FILTERABLE_SPEC_KEYS.placement, query.placement));
  }
  if (query.connection) {
    conditions.push(
      specWhere(FILTERABLE_SPEC_KEYS.connection, query.connection),
    );
  }

  const hasPriceFilter =
    query.minPriceInPaise !== undefined || query.maxPriceInPaise !== undefined;

  return {
    isActive: true,
    ...(query.brand ? { brand: query.brand } : {}),
    ...(query.featured ? { isFeatured: true } : {}),
    ...(query.ids ? { id: { in: query.ids } } : {}),
    ...(hasPriceFilter
      ? {
          priceInPaise: {
            gte: query.minPriceInPaise,
            lte: query.maxPriceInPaise,
          },
        }
      : {}),
    ...(conditions.length > 0 ? { AND: conditions } : {}),
  };
}

export function buildProductOrderBy(
  sort: ProductListQuery['sort'],
): Prisma.ProductOrderByWithRelationInput[] {
  // The id tie-breaker keeps pagination stable when values are equal.
  const tieBreaker = { id: 'asc' } as const;
  switch (sort) {
    case 'price_asc':
      return [{ priceInPaise: 'asc' }, tieBreaker];
    case 'price_desc':
      return [{ priceInPaise: 'desc' }, tieBreaker];
    case 'popular':
      return [
        { orderItems: { _count: 'desc' } },
        { isFeatured: 'desc' },
        tieBreaker,
      ];
    case 'newest':
      return [{ createdAt: 'desc' }, tieBreaker];
  }
}
