import { Injectable, NotFoundException } from '@nestjs/common';
import type { NotificationDto, OrderStatus, PageMeta } from '@simple-concepts/shared';
import type { Prisma } from '../generated/prisma/client';
import { STATUS_NOTICE } from '../orders/order-status';
import { PrismaService } from '../prisma/prisma.service';

type Db = Prisma.TransactionClient | PrismaService;

const NOTIFICATION_SELECT = {
  id: true,
  title: true,
  body: true,
  orderId: true,
  readAt: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect;

type NotificationRow = Prisma.NotificationGetPayload<{
  select: typeof NOTIFICATION_SELECT;
}>;

function toDto(row: NotificationRow): NotificationDto {
  return {
    ...row,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

/** In-app notifications. Push notifications (Expo / FCM) will be sent from here later. */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Tells the customer their order reached a new status. Runs inside the caller's transaction. */
  async notifyOrderStatus(
    db: Db,
    order: { id: string; userId: string; orderNumber: string },
    status: OrderStatus,
    note?: string | null,
  ): Promise<void> {
    const notice = STATUS_NOTICE[status];
    if (!notice) return;
    const extra = note ? ` Note from the shop: ${note}` : '';
    await db.notification.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        title: `${notice.title} · ${order.orderNumber}`,
        body: `${notice.body}${extra}`,
      },
    });
  }

  async list(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ data: NotificationDto[]; meta: PageMeta & { unread: number } }> {
    const where = { userId };
    const [rows, total, unread] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: NOTIFICATION_SELECT,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return {
      data: rows.map(toDto),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        unread,
      },
    };
  }

  async unreadCount(userId: string): Promise<{ unread: number }> {
    return {
      unread: await this.prisma.notification.count({
        where: { userId, readAt: null },
      }),
    };
  }

  async markRead(userId: string, id: string): Promise<{ ok: true }> {
    const { count } = await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    if (count === 0) {
      const exists = await this.prisma.notification.count({
        where: { id, userId },
      });
      if (!exists) throw new NotFoundException('Notification not found');
    }
    return { ok: true };
  }

  async markAllRead(userId: string): Promise<{ ok: true }> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }
}
