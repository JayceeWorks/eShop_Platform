import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  MAX_PAGE_LIMIT,
  type CategoryDto,
  type ProductDetailDto,
  type ProductFilterOptionsDto,
  type ProductSummaryDto,
} from '@simple-concepts/shared';

import { BROWSE_PAGE_LIMIT, HOME_SECTION_LIMIT } from '@/constants/catalog';
import { apiGet, apiGetPage } from '@/lib/api';

import { toProductQueryString, type ProductListParams } from './product-filters';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiGet<CategoryDto[]>('/categories'),
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () =>
      apiGetPage<ProductSummaryDto>(`/products?featured=true&limit=${HOME_SECTION_LIMIT}`),
    select: (page) => page.items,
  });
}

export function useNewProducts() {
  return useQuery({
    queryKey: ['products', 'new'],
    queryFn: () =>
      apiGetPage<ProductSummaryDto>(`/products?sort=newest&limit=${HOME_SECTION_LIMIT}`),
    select: (page) => page.items,
  });
}

export function useProductList(params: ProductListParams) {
  return useInfiniteQuery({
    queryKey: ['products', 'list', params],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      apiGetPage<ProductSummaryDto>(
        `/products?${toProductQueryString(params, pageParam, BROWSE_PAGE_LIMIT)}`,
      ),
    getNextPageParam: ({ meta }) => (meta.page < meta.totalPages ? meta.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
}

export function useProductFilterOptions(category?: string) {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  return useQuery({
    queryKey: ['products', 'filters', category ?? null],
    queryFn: () => apiGet<ProductFilterOptionsDto>(`/products/filters${query}`),
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['products', 'detail', slug],
    queryFn: () => apiGet<ProductDetailDto>(`/products/${encodeURIComponent(slug)}`),
  });
}

async function fetchProductsByIds(ids: string[]): Promise<ProductSummaryDto[]> {
  const chunks: string[][] = [];
  for (let start = 0; start < ids.length; start += MAX_PAGE_LIMIT) {
    chunks.push(ids.slice(start, start + MAX_PAGE_LIMIT));
  }
  const pages = await Promise.all(
    chunks.map((chunk) =>
      apiGetPage<ProductSummaryDto>(`/products?ids=${chunk.join(',')}&limit=${chunk.length}`),
    ),
  );
  return pages.flatMap((page) => page.items);
}

export function useProductsByIds(ids: string[]) {
  const sortedIds = [...ids].sort();
  return useQuery({
    queryKey: ['products', 'byIds', sortedIds],
    queryFn: () => fetchProductsByIds(sortedIds),
    enabled: sortedIds.length > 0,
    placeholderData: keepPreviousData,
  });
}
