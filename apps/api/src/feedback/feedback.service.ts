import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  averageRating,
  reviewerName,
  type FeedbackData,
  type FeedbackDto,
  type PageMeta,
  type ReviewData,
  type ReviewDto,
  type ReviewSummaryDto,
} from '@simple-concepts/shared';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const REVIEWS_SHOWN = 20;

const REVIEW_SELECT = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  userId: true,
  user: { select: { name: true } },
} satisfies Prisma.ProductReviewSelect;

type ReviewRow = Prisma.ProductReviewGetPayload<{
  select: typeof REVIEW_SELECT;
}>;

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async sendFeedback(
    userId: string,
    input: FeedbackData,
  ): Promise<{ id: string }> {
    if (input.orderId) {
      const owned = await this.prisma.order.count({
        where: { id: input.orderId, userId },
      });
      if (!owned) throw new BadRequestException('Order not found');
    }
    return this.prisma.feedback.create({
      data: {
        userId,
        rating: input.rating,
        message: input.message,
        orderId: input.orderId ?? null,
      },
      select: { id: true },
    });
  }

  async listFeedback(
    page: number,
    limit: number,
  ): Promise<{ data: FeedbackDto[]; meta: PageMeta }> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.feedback.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          rating: true,
          message: true,
          createdAt: true,
          order: { select: { orderNumber: true } },
          user: { select: { name: true, phone: true } },
        },
      }),
      this.prisma.feedback.count(),
    ]);
    return {
      data: rows.map((row) => ({
        id: row.id,
        rating: row.rating,
        message: row.message,
        orderNumber: row.order?.orderNumber ?? null,
        customer: row.user,
        createdAt: row.createdAt.toISOString(),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async reviews(slug: string, userId?: string): Promise<ReviewSummaryDto> {
    const productId = await this.activeProductId(slug);
    const [rows, stats, mine] = await Promise.all([
      this.prisma.productReview.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        take: REVIEWS_SHOWN,
        select: REVIEW_SELECT,
      }),
      this.prisma.productReview.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: true,
      }),
      userId
        ? this.prisma.productReview.findUnique({
            where: { productId_userId: { productId, userId } },
            select: REVIEW_SELECT,
          })
        : null,
    ]);
    const verified = await this.verifiedBuyers(productId, [
      ...rows.map((row) => row.userId),
      ...(mine ? [mine.userId] : []),
    ]);
    const toDto = (row: ReviewRow): ReviewDto => ({
      id: row.id,
      rating: row.rating,
      comment: row.comment,
      authorName: reviewerName(row.user.name),
      isVerifiedBuyer: verified.has(row.userId),
      createdAt: row.createdAt.toISOString(),
    });
    return {
      average: averageRating(
        stats._avg.rating === null ? [] : [stats._avg.rating],
      ),
      count: stats._count,
      reviews: rows.map(toDto),
      mine: mine ? toDto(mine) : null,
    };
  }

  async saveReview(
    userId: string,
    slug: string,
    input: ReviewData,
  ): Promise<ReviewSummaryDto> {
    const productId = await this.activeProductId(slug);
    await this.prisma.productReview.upsert({
      where: { productId_userId: { productId, userId } },
      create: {
        productId,
        userId,
        rating: input.rating,
        comment: input.comment,
      },
      update: { rating: input.rating, comment: input.comment },
    });
    return this.reviews(slug, userId);
  }

  async deleteReview(userId: string, slug: string): Promise<ReviewSummaryDto> {
    const productId = await this.activeProductId(slug);
    await this.prisma.productReview.deleteMany({
      where: { productId, userId },
    });
    return this.reviews(slug, userId);
  }

  private async activeProductId(slug: string): Promise<string> {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product.id;
  }

  /** Reviewers who received this product in a delivered order. */
  private async verifiedBuyers(
    productId: string,
    userIds: string[],
  ): Promise<Set<string>> {
    if (userIds.length === 0) return new Set();
    const orders = await this.prisma.order.findMany({
      where: {
        userId: { in: [...new Set(userIds)] },
        status: 'DELIVERED',
        items: { some: { productId } },
      },
      distinct: ['userId'],
      select: { userId: true },
    });
    return new Set(orders.map((order) => order.userId));
  }
}
