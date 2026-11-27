import {
  EMPTY_PRODUCT_FORM,
  ProductFormSchema,
  paiseToRupeeText,
  rupeesToPaise,
  toProductInput,
} from './product-form-values';

describe('rupeesToPaise', () => {
  it('parses rupees with optional paise, commas and the ₹ sign', () => {
    expect(rupeesToPaise('1499')).toBe(149900);
    expect(rupeesToPaise('₹1,25,000')).toBe(12500000);
    expect(rupeesToPaise('1499.5')).toBe(149950);
    expect(rupeesToPaise('0.07')).toBe(7);
  });

  it('rejects invalid amounts', () => {
    expect(rupeesToPaise('')).toBeNull();
    expect(rupeesToPaise('12.345')).toBeNull();
    expect(rupeesToPaise('-5')).toBeNull();
    expect(rupeesToPaise('abc')).toBeNull();
  });
});

describe('paiseToRupeeText', () => {
  it('formats for editing and round-trips', () => {
    expect(paiseToRupeeText(149900)).toBe('1499');
    expect(paiseToRupeeText(149950)).toBe('1499.50');
    expect(rupeesToPaise(paiseToRupeeText(7))).toBe(7);
  });
});

const filled = {
  ...EMPTY_PRODUCT_FORM,
  name: ' Dome Camera ',
  categoryId: 'cat-1',
  brand: 'SC Vision',
  model: 'D1',
  sku: 'sc-dom-01',
  description: 'Indoor camera',
  price: '1499',
  mrp: '1999',
  costPrice: '1000',
  stockQty: '12',
  specs: [
    { key: 'Resolution', value: '2 MP' },
    { key: 'Warranty', value: '' },
  ],
};

describe('ProductFormSchema', () => {
  it('rejects a selling price above MRP', () => {
    const result = ProductFormSchema.safeParse({ ...filled, price: '2500' });
    expect(result.success).toBe(false);
  });

  it('rejects a fractional stock quantity', () => {
    expect(ProductFormSchema.safeParse({ ...filled, stockQty: '1.5' }).success).toBe(false);
  });
});

describe('toProductInput', () => {
  it('converts rupees to paise, trims text and drops blank specs', () => {
    expect(toProductInput(filled)).toMatchObject({
      name: 'Dome Camera',
      sku: 'SC-DOM-01',
      priceInPaise: 149900,
      mrpInPaise: 199900,
      costPriceInPaise: 100000,
      stockQty: 12,
      specs: [{ key: 'Resolution', value: '2 MP' }],
    });
  });
});
