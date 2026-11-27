import { ConflictException } from '@nestjs/common';
import {
  formatOrderNumber,
  orderDatePart,
  priceOrder,
  type PricedProduct,
} from './order-pricing';

const camera: PricedProduct = {
  id: 'a',
  name: 'Dome Camera',
  sku: 'CAM-1',
  priceInPaise: 149900,
  stockQty: 3,
  isActive: true,
};
const lock: PricedProduct = {
  ...camera,
  id: 'b',
  name: 'Smart Lock',
  sku: 'LCK-1',
  priceInPaise: 899900,
};

describe('priceOrder', () => {
  it('totals the lines from database prices with free delivery', () => {
    const result = priceOrder(
      [
        { productId: 'a', quantity: 2 },
        { productId: 'b', quantity: 1 },
      ],
      [camera, lock],
    );
    expect(result.lines[0]).toMatchObject({
      unitPriceInPaise: 149900,
      lineTotalInPaise: 299800,
    });
    expect(result.subtotalInPaise).toBe(1199700);
    expect(result.deliveryChargeInPaise).toBe(0);
    expect(result.totalInPaise).toBe(1199700);
  });

  it('refuses more than the stock', () => {
    expect(() =>
      priceOrder([{ productId: 'a', quantity: 4 }], [camera]),
    ).toThrow('Only 3 of Dome Camera left in stock');
    expect(() =>
      priceOrder(
        [{ productId: 'a', quantity: 1 }],
        [{ ...camera, stockQty: 0 }],
      ),
    ).toThrow('Dome Camera is out of stock');
  });

  it('refuses hidden or missing products', () => {
    expect(() =>
      priceOrder(
        [{ productId: 'a', quantity: 1 }],
        [{ ...camera, isActive: false }],
      ),
    ).toThrow(ConflictException);
    expect(() =>
      priceOrder([{ productId: 'zz', quantity: 1 }], [camera]),
    ).toThrow(ConflictException);
  });
});

describe('order numbers', () => {
  it('uses the Indian date', () => {
    // 20:00 UTC on 26 Nov is 01:30 on 27 Nov in India.
    expect(orderDatePart(new Date('2026-11-26T20:00:00Z'))).toBe('20261127');
    expect(formatOrderNumber('20261127', 7)).toBe('SC-20261127-0007');
  });
});
