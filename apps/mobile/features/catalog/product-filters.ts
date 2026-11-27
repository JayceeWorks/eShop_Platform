import type { ProductSort } from '@simple-concepts/shared';

import { PRICE_RANGES } from '@/constants/catalog';

export type ProductFilterSelection = {
  category?: string;
  brand?: string;
  priceRangeId?: string;
  resolution?: string;
  placement?: string;
  connection?: string;
};

export type ProductListParams = ProductFilterSelection & {
  q?: string;
  sort: ProductSort;
};

export function toProductQueryString(
  { priceRangeId, ...params }: ProductListParams,
  page: number,
  limit: number,
): string {
  const range = PRICE_RANGES.find(({ id }) => id === priceRangeId);
  const entries: [string, string | number | undefined][] = [
    ...Object.entries(params),
    ['minPriceInPaise', range?.minPriceInPaise],
    ['maxPriceInPaise', range?.maxPriceInPaise],
    ['page', page],
    ['limit', limit],
  ];
  return entries
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');
}

export function countActiveFilters(selection: ProductFilterSelection): number {
  return Object.values(selection).filter(Boolean).length;
}
