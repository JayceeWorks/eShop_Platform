import { z } from 'zod';

import type { AddressDto } from './account';
import { OrderStatusSchema, type OrderStatus, type PaymentMethod, type PaymentStatus } from './enums';

export const MAX_ORDER_LINES = 50;
export const MAX_LINE_QUANTITY = 99;
export const MAX_ORDER_NOTE_LENGTH = 500;

/**
 * Delivery charge rule. The owner chose free delivery for now (2026-11-27).
 * To charge later, set flatInPaise, and freeFromInPaise to waive it on bigger orders.
 */
export const DELIVERY_RULE: { flatInPaise: number; freeFromInPaise: number | null } = {
  flatInPaise: 0,
  freeFromInPaise: null,
};

export function deliveryChargeFor(subtotalInPaise: number, rule = DELIVERY_RULE): number {
  if (subtotalInPaise <= 0) return 0;
  if (rule.freeFromInPaise !== null && subtotalInPaise >= rule.freeFromInPaise) return 0;
  return rule.flatInPaise;
}

/** Steps shown on the tracking timeline, in order. Cancelled and return states are shown separately. */
export const ORDER_PROGRESS: readonly OrderStatus[] = [
  'PLACED',
  'CONFIRMED',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

/** Customers may cancel until the order is packed. */
export const CUSTOMER_CANCELLABLE: readonly OrderStatus[] = ['PLACED', 'CONFIRMED'];

export function canCustomerCancel(status: OrderStatus): boolean {
  return CUSTOMER_CANCELLABLE.includes(status);
}

export const PlaceOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.uuid(),
        quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
      }),
    )
    .min(1, { message: 'Your cart is empty' })
    .max(MAX_ORDER_LINES)
    .refine((items) => new Set(items.map(({ productId }) => productId)).size === items.length, {
      message: 'Each product can appear only once',
    }),
  addressId: z.uuid({ message: 'Choose a delivery address' }),
  paymentMethod: z.enum(['COD', 'ONLINE']),
  installationRequested: z.boolean().default(false),
  notes: z.string().trim().max(MAX_ORDER_NOTE_LENGTH).optional(),
});
export type PlaceOrderInput = z.input<typeof PlaceOrderSchema>;
export type PlaceOrderData = z.output<typeof PlaceOrderSchema>;

export const CancelOrderSchema = z.object({
  reason: z.string().trim().max(MAX_ORDER_NOTE_LENGTH).optional(),
});
export type CancelOrderInput = z.input<typeof CancelOrderSchema>;
export type CancelOrderData = z.output<typeof CancelOrderSchema>;

export const AdminOrderStatusSchema = z.object({
  status: OrderStatusSchema,
  note: z.string().trim().max(MAX_ORDER_NOTE_LENGTH).optional(),
});
export type AdminOrderStatusInput = z.input<typeof AdminOrderStatusSchema>;
export type AdminOrderStatusData = z.output<typeof AdminOrderStatusSchema>;

export const OrderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: OrderStatusSchema.optional(),
});
export type OrderListQuery = z.infer<typeof OrderListQuerySchema>;

export type CheckoutConfigDto = {
  paymentMethods: PaymentMethod[];
  deliveryRule: typeof DELIVERY_RULE;
};

export type OrderSummaryDto = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalInPaise: number;
  itemCount: number;
  firstItemName: string;
  imageUrl: string | null;
  createdAt: string;
};

export type OrderItemDto = {
  productId: string;
  productSlug: string;
  productName: string;
  sku: string;
  imageUrl: string | null;
  unitPriceInPaise: number;
  quantity: number;
  lineTotalInPaise: number;
};

export type OrderHistoryDto = { status: OrderStatus; note: string | null; at: string };

export type OrderDetailDto = Omit<OrderSummaryDto, 'firstItemName' | 'imageUrl' | 'itemCount'> & {
  items: OrderItemDto[];
  address: Omit<AddressDto, 'id' | 'isDefault'>;
  subtotalInPaise: number;
  deliveryChargeInPaise: number;
  payment: { method: PaymentMethod; status: PaymentStatus } | null;
  installationRequested: boolean;
  notes: string | null;
  history: OrderHistoryDto[];
  canCancel: boolean;
};

export type AdminOrderDto = OrderDetailDto & {
  customer: { id: string; name: string | null; phone: string };
  nextStatuses: OrderStatus[];
};

export type AdminOrderSummaryDto = OrderSummaryDto & {
  customer: { name: string | null; phone: string };
};
