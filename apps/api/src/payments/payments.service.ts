import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentMethodSchema, type PaymentMethod } from '@simple-concepts/shared';
import { CodProvider } from './cod.provider';
import type { PaymentProvider } from './payment-provider';

const DEFAULT_METHODS: PaymentMethod[] = ['COD'];

/** Reads ENABLED_PAYMENT_METHODS, e.g. ["COD"]. Methods without a provider are ignored. */
export function parseEnabledMethods(
  raw: string | undefined,
  available: PaymentMethod[],
): PaymentMethod[] {
  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : DEFAULT_METHODS;
  } catch {
    parsed = DEFAULT_METHODS;
  }
  const list: unknown[] = Array.isArray(parsed) ? parsed : DEFAULT_METHODS;
  const methods = list
    .map((value) => PaymentMethodSchema.safeParse(value))
    .flatMap((result) => (result.success ? [result.data] : []))
    .filter((method) => available.includes(method));
  return [...new Set(methods)];
}

@Injectable()
export class PaymentsService {
  private readonly providers: Map<PaymentMethod, PaymentProvider>;

  constructor(cod: CodProvider) {
    this.providers = new Map<PaymentMethod, PaymentProvider>([
      [cod.method, cod],
    ]);
  }

  enabledMethods(): PaymentMethod[] {
    return parseEnabledMethods(process.env.ENABLED_PAYMENT_METHODS, [
      ...this.providers.keys(),
    ]);
  }

  /** The provider for a method the customer picked. Refuses methods that are switched off. */
  forCheckout(method: PaymentMethod): PaymentProvider {
    const provider = this.providers.get(method);
    if (!provider || !this.enabledMethods().includes(method)) {
      throw new BadRequestException('This payment method is not available');
    }
    return provider;
  }

  /** The provider for an existing payment, even if its method was later switched off. */
  forPayment(method: PaymentMethod): PaymentProvider | undefined {
    return this.providers.get(method);
  }
}
