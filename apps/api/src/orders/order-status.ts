import { BadRequestException } from '@nestjs/common';
import {
  canCustomerCancel,
  type OrderStatus,
  type UserRole,
} from '@simple-concepts/shared';

/**
 * The only place that decides which status changes are allowed.
 * PLACED → CONFIRMED → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED, and CANCELLED from any
 * step before DELIVERED (customers only before PACKED). Returns are Phase 2.
 */
const ADMIN_NEXT: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
  RETURN_REQUESTED: [],
  RETURNED: [],
};

export function nextStatuses(from: OrderStatus, role: UserRole): OrderStatus[] {
  if (role === 'ADMIN') return ADMIN_NEXT[from];
  return canCustomerCancel(from) ? ['CANCELLED'] : [];
}

export function assertTransition(
  from: OrderStatus,
  to: OrderStatus,
  role: UserRole,
): void {
  if (!nextStatuses(from, role).includes(to)) {
    throw new BadRequestException(
      role === 'CUSTOMER' && to === 'CANCELLED'
        ? 'This order can no longer be cancelled. Please call us for help.'
        : `An order cannot move from ${from} to ${to}`,
    );
  }
}

/** What the customer is told when their order reaches a status. */
export const STATUS_NOTICE: Partial<
  Record<OrderStatus, { title: string; body: string }>
> = {
  PLACED: {
    title: 'Order placed',
    body: 'We have received your order and will confirm it soon.',
  },
  CONFIRMED: {
    title: 'Order confirmed',
    body: 'Your order is confirmed and will be packed soon.',
  },
  PACKED: {
    title: 'Order packed',
    body: 'Your order is packed and ready to ship.',
  },
  SHIPPED: { title: 'Order shipped', body: 'Your order is on its way.' },
  OUT_FOR_DELIVERY: {
    title: 'Out for delivery',
    body: 'Your order arrives today. Please keep the cash ready.',
  },
  DELIVERED: {
    title: 'Order delivered',
    body: 'Your order was delivered. Tell us how we did!',
  },
  CANCELLED: {
    title: 'Order cancelled',
    body: 'Your order has been cancelled.',
  },
};
