import { BadRequestException } from '@nestjs/common';
import { assertTransition, nextStatuses } from './order-status';

describe('order status rules', () => {
  it('lets the admin move an order one step forward or cancel it', () => {
    expect(nextStatuses('PLACED', 'ADMIN')).toEqual(['CONFIRMED', 'CANCELLED']);
    expect(nextStatuses('OUT_FOR_DELIVERY', 'ADMIN')).toEqual([
      'DELIVERED',
      'CANCELLED',
    ]);
    expect(() => assertTransition('PLACED', 'SHIPPED', 'ADMIN')).toThrow(
      BadRequestException,
    );
  });

  it('does not change delivered or cancelled orders', () => {
    expect(nextStatuses('DELIVERED', 'ADMIN')).toEqual([]);
    expect(nextStatuses('CANCELLED', 'ADMIN')).toEqual([]);
    expect(() => assertTransition('DELIVERED', 'CANCELLED', 'ADMIN')).toThrow();
  });

  it('lets customers cancel only before packing', () => {
    expect(() =>
      assertTransition('PLACED', 'CANCELLED', 'CUSTOMER'),
    ).not.toThrow();
    expect(() =>
      assertTransition('CONFIRMED', 'CANCELLED', 'CUSTOMER'),
    ).not.toThrow();
    expect(() => assertTransition('PACKED', 'CANCELLED', 'CUSTOMER')).toThrow(
      'This order can no longer be cancelled',
    );
    expect(() => assertTransition('PLACED', 'CONFIRMED', 'CUSTOMER')).toThrow();
  });
});
