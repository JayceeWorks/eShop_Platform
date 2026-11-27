import { AdminProductInputSchema, slugifyProduct } from './admin';

const valid = {
  name: 'Dome Camera',
  categoryId: '6f1c2d4e-8a3b-4c5d-9e7f-0a1b2c3d4e5f',
  brand: 'SC Vision',
  model: 'D1',
  sku: 'SC-DOM-001',
  description: 'Indoor camera',
  priceInPaise: 149900,
  mrpInPaise: 199900,
  costPriceInPaise: 100000,
  stockQty: 10,
  isActive: true,
  isFeatured: false,
  specs: [{ key: 'Resolution', value: '2 MP' }],
  images: ['/uploads/products/a.jpg'],
};

describe('AdminProductInputSchema', () => {
  it('accepts a valid product', () => {
    expect(AdminProductInputSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a selling price above MRP', () => {
    const result = AdminProductInputSchema.safeParse({ ...valid, priceInPaise: 300000 });
    expect(result.success).toBe(false);
  });

  it('rejects duplicate spec names regardless of case', () => {
    const specs = [
      { key: 'Resolution', value: '2 MP' },
      { key: 'resolution', value: '4 MP' },
    ];
    expect(AdminProductInputSchema.safeParse({ ...valid, specs }).success).toBe(false);
  });

  it('rejects image links that are not ours or https', () => {
    const images = ['http://example.com/a.jpg'];
    expect(AdminProductInputSchema.safeParse({ ...valid, images }).success).toBe(false);
  });

  it('rejects fractional paise', () => {
    expect(AdminProductInputSchema.safeParse({ ...valid, priceInPaise: 1499.5 }).success).toBe(false);
  });
});

describe('slugifyProduct', () => {
  it('combines the name and SKU', () => {
    expect(slugifyProduct('Wi-Fi Camera (Pro)', 'SC-01')).toBe('wi-fi-camera-pro-sc-01');
  });
});
