import { z } from 'zod';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 50;
export const LOW_STOCK_THRESHOLD = 5;

const MAX_FILTER_TEXT_LENGTH = 100;
const PERCENT = 100;

/** Spec keys that the catalog can filter on. Products must use these exact keys. */
export const FILTERABLE_SPEC_KEYS = {
  resolution: 'Resolution',
  placement: 'Placement',
  connection: 'Connection',
} as const;

export const ProductSortSchema = z.enum(['newest', 'popular', 'price_asc', 'price_desc']);
export type ProductSort = z.infer<typeof ProductSortSchema>;

const optionalText = z.string().trim().min(1).max(MAX_FILTER_TEXT_LENGTH).optional();
const optionalPaise = z.coerce.number().int().min(0).optional();

export const ProductListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
    limit: z.coerce.number().int().min(1).max(MAX_PAGE_LIMIT).default(DEFAULT_PAGE_LIMIT),
    q: optionalText,
    category: optionalText,
    brand: optionalText,
    resolution: optionalText,
    placement: optionalText,
    connection: optionalText,
    minPriceInPaise: optionalPaise,
    maxPriceInPaise: optionalPaise,
    featured: z
      .literal('true')
      .transform(() => true)
      .optional(),
    ids: z
      .string()
      .transform((value) => value.split(','))
      .pipe(z.array(z.uuid()).min(1).max(MAX_PAGE_LIMIT))
      .optional(),
    sort: ProductSortSchema.default('newest'),
  })
  .refine(
    ({ minPriceInPaise: min, maxPriceInPaise: max }) =>
      min === undefined || max === undefined || min <= max,
    { message: 'minPriceInPaise must not exceed maxPriceInPaise' },
  );
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;

export const ProductFilterOptionsQuerySchema = z.object({ category: optionalText });
export type ProductFilterOptionsQuery = z.infer<typeof ProductFilterOptionsQuerySchema>;

export type PageMeta = { page: number; limit: number; total: number; totalPages: number };

export type CategoryDto = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  children: CategoryDto[];
};

/** Customer-facing product. Must never carry cost price. */
export type ProductSummaryDto = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  model: string;
  priceInPaise: number;
  mrpInPaise: number;
  stockQty: number;
  imageUrl: string | null;
  category: { name: string; slug: string; parentSlug: string | null };
};

export type ProductDetailDto = ProductSummaryDto & {
  sku: string;
  description: string;
  images: string[];
  specs: { key: string; value: string }[];
};

export type ProductFilterOptionsDto = {
  brands: string[];
  resolutions: string[];
  placements: string[];
  connections: string[];
};

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export function getStockStatus(stockQty: number): StockStatus {
  if (stockQty <= 0) return 'OUT_OF_STOCK';
  return stockQty <= LOW_STOCK_THRESHOLD ? 'LOW_STOCK' : 'IN_STOCK';
}

/** Whole-number discount, rounded down so the app never overstates a saving. */
export function discountPercent(priceInPaise: number, mrpInPaise: number): number {
  if (mrpInPaise <= 0 || priceInPaise >= mrpInPaise) return 0;
  return Math.floor(((mrpInPaise - priceInPaise) * PERCENT) / mrpInPaise);
}
