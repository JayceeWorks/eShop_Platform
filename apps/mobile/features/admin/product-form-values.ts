import type { AdminProductDto, AdminProductInput } from '@simple-concepts/shared';
import { z } from 'zod';

const PAISE_PER_RUPEE = 100;
const PAISE_DIGITS = 2;
const RUPEE_PATTERN = /^\d+(\.\d{1,2})?$/;
const WHOLE_NUMBER_PATTERN = /^\d+$/;

/** Parses "1,499.50" or "₹1499" into paise without floating-point maths. Returns null if invalid. */
export function rupeesToPaise(text: string): number | null {
  const cleaned = text.replace(/[₹,\s]/g, '');
  if (!RUPEE_PATTERN.test(cleaned)) return null;
  const [rupees, paise = ''] = cleaned.split('.');
  return Number(rupees) * PAISE_PER_RUPEE + Number(paise.padEnd(PAISE_DIGITS, '0'));
}

export function paiseToRupeeText(paise: number): string {
  const rupees = Math.trunc(paise / PAISE_PER_RUPEE);
  const rest = paise % PAISE_PER_RUPEE;
  return rest === 0 ? String(rupees) : `${rupees}.${String(rest).padStart(PAISE_DIGITS, '0')}`;
}

const required = (label: string) => z.string().trim().min(1, `Enter the ${label}`);
const rupeeField = (label: string) =>
  z
    .string()
    .refine((value) => rupeesToPaise(value) !== null, `Enter the ${label} in rupees, like 1499`);

export const ProductFormSchema = z
  .object({
    name: required('product name'),
    categoryId: z.string().min(1, 'Choose a category'),
    brand: required('brand'),
    model: required('model number'),
    sku: required('SKU').regex(/^[A-Za-z0-9-]+$/, 'Use letters, numbers and hyphens only'),
    description: required('description'),
    price: rupeeField('selling price'),
    mrp: rupeeField('MRP'),
    costPrice: rupeeField('cost price'),
    stockQty: z.string().trim().regex(WHOLE_NUMBER_PATTERN, 'Enter a whole number, like 10'),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    specs: z.array(z.object({ key: z.string(), value: z.string() })),
    images: z.array(z.string()),
  })
  .refine(
    ({ price, mrp }) => {
      const p = rupeesToPaise(price);
      const m = rupeesToPaise(mrp);
      return p === null || m === null || p <= m;
    },
    { message: 'Selling price cannot be more than MRP', path: ['price'] },
  );

export type ProductFormValues = z.infer<typeof ProductFormSchema>;

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  name: '',
  categoryId: '',
  brand: '',
  model: '',
  sku: '',
  description: '',
  price: '',
  mrp: '',
  costPrice: '',
  stockQty: '0',
  isActive: true,
  isFeatured: false,
  specs: [{ key: 'Warranty', value: '' }],
  images: [],
};

export function toFormValues(product: AdminProductDto): ProductFormValues {
  return {
    name: product.name,
    categoryId: product.categoryId,
    brand: product.brand,
    model: product.model,
    sku: product.sku,
    description: product.description,
    price: paiseToRupeeText(product.priceInPaise),
    mrp: paiseToRupeeText(product.mrpInPaise),
    costPrice: paiseToRupeeText(product.costPriceInPaise),
    stockQty: String(product.stockQty),
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    specs: product.specs,
    images: product.images,
  };
}

/** Call only with values that passed ProductFormSchema. Blank spec rows are dropped. */
export function toProductInput(values: ProductFormValues): AdminProductInput {
  const paise = (text: string) => rupeesToPaise(text) ?? 0;
  return {
    name: values.name.trim(),
    categoryId: values.categoryId,
    brand: values.brand.trim(),
    model: values.model.trim(),
    sku: values.sku.trim().toUpperCase(),
    description: values.description.trim(),
    priceInPaise: paise(values.price),
    mrpInPaise: paise(values.mrp),
    costPriceInPaise: paise(values.costPrice),
    stockQty: Number(values.stockQty),
    isActive: values.isActive,
    isFeatured: values.isFeatured,
    specs: values.specs
      .map(({ key, value }) => ({ key: key.trim(), value: value.trim() }))
      .filter(({ key, value }) => key && value),
    images: values.images,
  };
}
