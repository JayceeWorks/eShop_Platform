import type { PaymentMethod, PaymentStatus } from '@simple-concepts/shared';

export type PaymentRecord = {
  method: PaymentMethod;
  status: PaymentStatus;
  providerRef: string | null;
};

/**
 * Each payment method implements this. Phase 1 ships only COD; Razorpay (ONLINE) is added in
 * Phase 2 as another provider, without changing order logic.
 */
export interface PaymentProvider {
  readonly method: PaymentMethod;
  /** Called when an order is placed. */
  createPayment(order: {
    id: string;
    amountInPaise: number;
  }): Promise<PaymentRecord>;
  /** Called when the order is delivered. Returns the new payment status. */
  onDelivered(current: PaymentStatus): PaymentStatus;
  /** Called when an order is cancelled. Returns the new payment status. */
  refund(current: PaymentStatus): Promise<PaymentStatus>;
}
