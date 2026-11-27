import { z } from 'zod';

import type { ProductDetailDto } from './catalog';
import type { UserRole } from './enums';

export const MAX_PRODUCT_IMAGES = 8;
export const MAX_PRODUCT_SPECS = 20;
export const MAX_STOCK_QTY = 100_000;
/** ₹1 crore. Guards against typos such as an extra zero. */
export const MAX_PRICE_IN_PAISE = 1_00_00_000 * 100;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 200;

export const AdminLoginSchema = z.object({
  /** Phone number or email. */
  identifier: z.string().trim().min(3).max(100),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH),
});
export type AdminLoginInput = z.infer<typeof AdminLoginSchema>;

export const RefreshTokenSchema = z.object({ refreshToken: z.string().min(1) });
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

export type AuthUserDto = {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  role: UserRole;
};

export type AuthSessionDto = {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDto;
};

/** Stored image paths are either served by our API (/static, /uploads) or full https URLs. */
export const ProductImageUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine(
    (url) => url.startsWith('/static/') || url.startsWith('/uploads/') || url.startsWith('https://'),
    { message: 'Image must be an uploaded photo or an https link' },
  );

const paise = z.number().int().min(0).max(MAX_PRICE_IN_PAISE);

export const AdminProductInputSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    categoryId: z.uuid(),
    brand: z.string().trim().min(1).max(60),
    model: z.string().trim().min(1).max(60),
    sku: z
      .string()
      .trim()
      .min(2)
      .max(40)
      .regex(/^[A-Za-z0-9-]+$/, { message: 'SKU can use letters, numbers and hyphens' }),
    description: z.string().trim().min(1).max(2000),
    priceInPaise: paise.min(1),
    mrpInPaise: paise.min(1),
    costPriceInPaise: paise,
    stockQty: z.number().int().min(0).max(MAX_STOCK_QTY),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    specs: z
      .array(z.object({ key: z.string().trim().min(1).max(50), value: z.string().trim().min(1).max(200) }))
      .max(MAX_PRODUCT_SPECS)
      .refine((specs) => new Set(specs.map(({ key }) => key.toLowerCase())).size === specs.length, {
        message: 'Each specification name must be different',
      }),
    images: z.array(ProductImageUrlSchema).max(MAX_PRODUCT_IMAGES),
  })
  .refine(({ priceInPaise, mrpInPaise }) => priceInPaise <= mrpInPaise, {
    message: 'Selling price cannot be more than MRP',
    path: ['priceInPaise'],
  });
export type AdminProductInput = z.infer<typeof AdminProductInputSchema>;

export const AdminProductStatusSchema = z.enum(['all', 'active', 'hidden']);
export type AdminProductStatus = z.infer<typeof AdminProductStatusSchema>;

export const AdminProductListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().trim().min(1).max(100).optional(),
  status: AdminProductStatusSchema.default('all'),
});
export type AdminProductListQuery = z.infer<typeof AdminProductListQuerySchema>;

/** Admin-only view of a product. Includes cost price, so never send it to customers. */
export type AdminProductDto = ProductDetailDto & {
  categoryId: string;
  costPriceInPaise: number;
  isActive: boolean;
  isFeatured: boolean;
  updatedAt: string;
};

export function slugifyProduct(name: string, sku: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base}-${sku.toLowerCase()}`;
}
