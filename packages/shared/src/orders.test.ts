import { PlaceOrderSchema, canCustomerCancel, deliveryChargeFor } from './orders';

const ID_A = '6f1c2b8e-0d7a-4c55-9a3e-2f0b1d4e5a61';
const ID_B = '7a2d3c9f-1e8b-4d66-8b4f-3a1c2e5f6b72';

describe('deliveryChargeFor', () => {
  it('is free under the current rule', () => {
    expect(deliveryChargeFor(150000)).toBe(0);
  });

  it('applies a flat fee below the free limit', () => {
    const rule = { flatInPaise: 9900, freeFromInPaise: 200000 };
    expect(deliveryChargeFor(150000, rule)).toBe(9900);
    expect(deliveryChargeFor(200000, rule)).toBe(0);
    expect(deliveryChargeFor(0, rule)).toBe(0);
  });
});

describe('canCustomerCancel', () => {
  it('allows cancelling only before packing', () => {
    expect(canCustomerCancel('PLACED')).toBe(true);
    expect(canCustomerCancel('CONFIRMED')).toBe(true);
    expect(canCustomerCancel('PACKED')).toBe(false);
    expect(canCustomerCancel('DELIVERED')).toBe(false);
  });
});

describe('PlaceOrderSchema', () => {
  const order = { items: [{ productId: ID_A, quantity: 2 }], addressId: ID_B, paymentMethod: 'COD' };

  it('accepts a valid order and ignores any totals sent by the app', () => {
    const parsed = PlaceOrderSchema.parse({ ...order, totalInPaise: 1 });
    expect(parsed).not.toHaveProperty('totalInPaise');
    expect(parsed.installationRequested).toBe(false);
  });

  it('rejects an empty cart, repeated products and bad quantities', () => {
    expect(PlaceOrderSchema.safeParse({ ...order, items: [] }).success).toBe(false);
    expect(
      PlaceOrderSchema.safeParse({
        ...order,
        items: [
          { productId: ID_A, quantity: 1 },
          { productId: ID_A, quantity: 1 },
        ],
      }).success,
    ).toBe(false);
    expect(
      PlaceOrderSchema.safeParse({ ...order, items: [{ productId: ID_A, quantity: 0 }] }).success,
    ).toBe(false);
  });
});
