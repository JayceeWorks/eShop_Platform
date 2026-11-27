import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DELIVERY_RULE,
  canCustomerCancel,
  type AddressDto,
  type AdminOrderDto,
  type AdminOrderSummaryDto,
  type CheckoutConfigDto,
  type OrderDetailDto,
  type OrderListQuery,
  type OrderStatus,
  type OrderSummaryDto,
  type PageMeta,
  type PlaceOrderData,
  type UserRole,
} from '@simple-concepts/shared';
import { Prisma } from '../generated/prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from '../payments/payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { formatOrderNumber, orderDatePart, priceOrder } from './order-pricing';
import { assertTransition, nextStatuses } from './order-status';

const UNIQUE_VIOLATION = 'P2002';
const ORDER_NUMBER_RETRIES = 3;

const FIRST_IMAGE = {
  images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } },
} as const;

const ORDER_SUMMARY_SELECT = {
  id: true,
  orderNumber: true,
  status: true,
  totalInPaise: true,
  createdAt: true,
  user: { select: { name: true, phone: true } },
  items: {
    orderBy: { productName: 'asc' },
    select: {
      productName: true,
      quantity: true,
      product: { select: FIRST_IMAGE },
    },
  },
} satisfies Prisma.OrderSelect;

const ORDER_DETAIL_SELECT = {
  id: true,
  orderNumber: true,
  userId: true,
  status: true,
  addressSnapshot: true,
  subtotalInPaise: true,
  deliveryChargeInPaise: true,
  totalInPaise: true,
  installationRequested: true,
  notes: true,
  createdAt: true,
  user: { select: { id: true, name: true, phone: true } },
  items: {
    orderBy: { productName: 'asc' },
    select: {
      productId: true,
      productName: true,
      sku: true,
      unitPriceInPaise: true,
      quantity: true,
      lineTotalInPaise: true,
      product: { select: { slug: true, ...FIRST_IMAGE } },
    },
  },
  payment: { select: { method: true, status: true } },
  statusHistory: {
    orderBy: { createdAt: 'asc' },
    select: { toStatus: true, note: true, createdAt: true },
  },
} satisfies Prisma.OrderSelect;

type OrderSummaryRow = Prisma.OrderGetPayload<{
  select: typeof ORDER_SUMMARY_SELECT;
}>;
type OrderDetailRow = Prisma.OrderGetPayload<{
  select: typeof ORDER_DETAIL_SELECT;
}>;
type Address = Omit<AddressDto, 'id' | 'isDefault'>;

function toSummary(row: OrderSummaryRow): OrderSummaryDto {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    totalInPaise: row.totalInPaise,
    itemCount: row.items.reduce((total, item) => total + item.quantity, 0),
    firstItemName: row.items[0]?.productName ?? '',
    imageUrl: row.items[0]?.product.images[0]?.url ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function toDetail(row: OrderDetailRow): OrderDetailDto {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    totalInPaise: row.totalInPaise,
    createdAt: row.createdAt.toISOString(),
    items: row.items.map((item) => ({
      productId: item.productId,
      productSlug: item.product.slug,
      productName: item.productName,
      sku: item.sku,
      imageUrl: item.product.images[0]?.url ?? null,
      unitPriceInPaise: item.unitPriceInPaise,
      quantity: item.quantity,
      lineTotalInPaise: item.lineTotalInPaise,
    })),
    // Written by placeOrder from a validated address, so its shape is known.
    address: row.addressSnapshot as Address,
    subtotalInPaise: row.subtotalInPaise,
    deliveryChargeInPaise: row.deliveryChargeInPaise,
    payment: row.payment,
    installationRequested: row.installationRequested,
    notes: row.notes,
    history: row.statusHistory.map((entry) => ({
      status: entry.toStatus,
      note: entry.note,
      at: entry.createdAt.toISOString(),
    })),
    canCancel: canCustomerCancel(row.status),
  };
}

function pageMeta(page: number, limit: number, total: number): PageMeta {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === UNIQUE_VIOLATION
  );
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
    private readonly notifications: NotificationsService,
  ) {}

  checkoutConfig(): CheckoutConfigDto {
    return {
      paymentMethods: this.payments.enabledMethods(),
      deliveryRule: DELIVERY_RULE,
    };
  }

  async place(userId: string, input: PlaceOrderData): Promise<OrderDetailDto> {
    const provider = this.payments.forCheckout(input.paymentMethod);
    const address = await this.prisma.address.findFirst({
      where: { id: input.addressId, userId },
      select: {
        name: true,
        phone: true,
        street: true,
        area: true,
        city: true,
        state: true,
        pinCode: true,
      },
    });
    if (!address) throw new BadRequestException('Choose a delivery address');

    for (let attempt = 1; ; attempt += 1) {
      try {
        const orderId = await this.prisma.$transaction(async (tx) => {
          const products = await tx.product.findMany({
            where: {
              id: { in: input.items.map(({ productId }) => productId) },
            },
            select: {
              id: true,
              name: true,
              sku: true,
              priceInPaise: true,
              stockQty: true,
              isActive: true,
            },
          });
          const pricing = priceOrder(input.items, products);

          // Reduce stock only if enough is still there, so two buyers can't take the last unit.
          for (const line of pricing.lines) {
            const { count } = await tx.product.updateMany({
              where: {
                id: line.productId,
                isActive: true,
                stockQty: { gte: line.quantity },
              },
              data: { stockQty: { decrement: line.quantity } },
            });
            if (count === 0) {
              throw new ConflictException(
                `${line.productName} just sold out. Please update your cart.`,
              );
            }
          }

          const now = new Date();
          const datePart = orderDatePart(now);
          const todaysOrders = await tx.order.count({
            where: { orderNumber: { startsWith: `SC-${datePart}-` } },
          });
          const order = await tx.order.create({
            data: {
              orderNumber: formatOrderNumber(datePart, todaysOrders + 1),
              userId,
              addressSnapshot: address,
              subtotalInPaise: pricing.subtotalInPaise,
              deliveryChargeInPaise: pricing.deliveryChargeInPaise,
              totalInPaise: pricing.totalInPaise,
              installationRequested: input.installationRequested,
              notes: input.notes || null,
              items: { create: pricing.lines },
              statusHistory: {
                create: { toStatus: 'PLACED', changedById: userId },
              },
            },
            select: { id: true, userId: true, orderNumber: true },
          });
          const payment = await provider.createPayment({
            id: order.id,
            amountInPaise: pricing.totalInPaise,
          });
          await tx.payment.create({
            data: {
              orderId: order.id,
              amountInPaise: pricing.totalInPaise,
              ...payment,
            },
          });
          await this.notifications.notifyOrderStatus(tx, order, 'PLACED');
          return order.id;
        });
        return this.getForCustomer(userId, orderId);
      } catch (error) {
        // Two orders placed in the same moment can pick the same number. Try again.
        if (isUniqueViolation(error) && attempt < ORDER_NUMBER_RETRIES)
          continue;
        throw error;
      }
    }
  }

  async listForCustomer(
    userId: string,
    { page, limit, status }: OrderListQuery,
  ): Promise<{ data: OrderSummaryDto[]; meta: PageMeta }> {
    const where = { userId, ...(status ? { status } : {}) };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: ORDER_SUMMARY_SELECT,
      }),
      this.prisma.order.count({ where }),
    ]);
    return { data: rows.map(toSummary), meta: pageMeta(page, limit, total) };
  }

  async getForCustomer(userId: string, id: string): Promise<OrderDetailDto> {
    const row = await this.prisma.order.findFirst({
      where: { id, userId },
      select: ORDER_DETAIL_SELECT,
    });
    if (!row) throw new NotFoundException('Order not found');
    return toDetail(row);
  }

  async cancelForCustomer(
    userId: string,
    id: string,
    reason?: string,
  ): Promise<OrderDetailDto> {
    const owned = await this.prisma.order.count({ where: { id, userId } });
    if (!owned) throw new NotFoundException('Order not found');
    await this.changeStatus(
      id,
      'CANCELLED',
      { id: userId, role: 'CUSTOMER' },
      reason,
    );
    return this.getForCustomer(userId, id);
  }

  async listForAdmin({
    page,
    limit,
    status,
  }: OrderListQuery): Promise<{
    data: AdminOrderSummaryDto[];
    meta: PageMeta;
  }> {
    const where = status ? { status } : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: ORDER_SUMMARY_SELECT,
      }),
      this.prisma.order.count({ where }),
    ]);
    return {
      data: rows.map((row) => ({ ...toSummary(row), customer: row.user })),
      meta: pageMeta(page, limit, total),
    };
  }

  async getForAdmin(id: string): Promise<AdminOrderDto> {
    const row = await this.prisma.order.findUnique({
      where: { id },
      select: ORDER_DETAIL_SELECT,
    });
    if (!row) throw new NotFoundException('Order not found');
    return {
      ...toDetail(row),
      customer: row.user,
      nextStatuses: nextStatuses(row.status, 'ADMIN'),
    };
  }

  async changeStatusAsAdmin(
    adminId: string,
    id: string,
    status: OrderStatus,
    note?: string,
  ): Promise<AdminOrderDto> {
    await this.changeStatus(id, status, { id: adminId, role: 'ADMIN' }, note);
    return this.getForAdmin(id);
  }

  /**
   * Every status change goes through here: checks the rule, logs history, puts stock back on
   * cancel, settles COD on delivery and tells the customer.
   */
  private async changeStatus(
    id: string,
    to: OrderStatus,
    actor: { id: string; role: UserRole },
    note?: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        select: {
          id: true,
          userId: true,
          orderNumber: true,
          status: true,
          items: { select: { productId: true, quantity: true } },
          payment: { select: { method: true, status: true } },
        },
      });
      if (!order) throw new NotFoundException('Order not found');
      assertTransition(order.status, to, actor.role);

      // Only succeeds if nobody changed the status since we read it.
      const { count } = await tx.order.updateMany({
        where: { id, status: order.status },
        data: { status: to },
      });
      if (count === 0)
        throw new ConflictException(
          'This order was just updated. Please refresh.',
        );

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: order.status,
          toStatus: to,
          changedById: actor.id,
          note: note || null,
        },
      });

      const provider = order.payment
        ? this.payments.forPayment(order.payment.method)
        : undefined;
      if (to === 'CANCELLED') {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQty: { increment: item.quantity } },
          });
        }
        if (order.payment && provider) {
          await tx.payment.update({
            where: { orderId: id },
            data: { status: await provider.refund(order.payment.status) },
          });
        }
      }
      if (to === 'DELIVERED' && order.payment && provider) {
        await tx.payment.update({
          where: { orderId: id },
          data: { status: provider.onDelivered(order.payment.status) },
        });
      }
      // A customer's own cancel reason is for the shop, not repeated back to them.
      const shopNote = actor.role === 'ADMIN' ? note : undefined;
      await this.notifications.notifyOrderStatus(tx, order, to, shopNote);
    });
  }
}
