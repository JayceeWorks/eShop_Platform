import { Injectable } from '@nestjs/common';
import type { PaymentStatus } from '@simple-concepts/shared';
import type { PaymentProvider, PaymentRecord } from './payment-provider';

/** Cash on Delivery: payment stays PENDING until the admin marks the order delivered. */
@Injectable()
export class CodProvider implements PaymentProvider {
  readonly method = 'COD' as const;

  createPayment(): Promise<PaymentRecord> {
    return Promise.resolve({
      method: 'COD',
      status: 'PENDING',
      providerRef: null,
    });
  }

  onDelivered(): PaymentStatus {
    return 'PAID';
  }

  // No money changes hands before delivery, so there is nothing to refund.
  refund(current: PaymentStatus): Promise<PaymentStatus> {
    return Promise.resolve(current);
  }
}
