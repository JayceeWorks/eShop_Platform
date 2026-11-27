import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  FeedbackInputSchema,
  ReviewInputSchema,
  type FeedbackData,
  type ReviewData,
} from '@simple-concepts/shared';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { SchemaPipe } from '../common/schema.pipe';
import { FeedbackService } from './feedback.service';

const FEEDBACK_PER_MINUTE = 5;
const ONE_MINUTE_MS = 60_000;
const ADMIN_PAGE_LIMIT = 20;
const MAX_ADMIN_PAGE_LIMIT = 50;

function pageNumber(
  value: string | undefined,
  fallback: number,
  max: number,
): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1
    ? Math.min(parsed, max)
    : fallback;
}

@Controller('feedback')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @Post()
  @Throttle({ default: { limit: FEEDBACK_PER_MINUTE, ttl: ONE_MINUTE_MS } })
  send(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new SchemaPipe<FeedbackData>(FeedbackInputSchema)) body: FeedbackData,
  ) {
    return this.feedback.sendFeedback(user.id, body);
  }
}

@Controller('admin/feedback')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminFeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @Get()
  list(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.feedback.listFeedback(
      pageNumber(page, 1, Number.MAX_SAFE_INTEGER),
      pageNumber(limit, ADMIN_PAGE_LIMIT, MAX_ADMIN_PAGE_LIMIT),
    );
  }
}

@Controller('products/:slug/reviews')
export class ProductReviewsController {
  constructor(private readonly feedback: FeedbackService) {}

  @Get()
  list(@Param('slug') slug: string) {
    return this.feedback.reviews(slug);
  }

  /** Same as the list, plus the signed-in customer's own review. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  listWithMine(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
  ) {
    return this.feedback.reviews(slug, user.id);
  }

  @Put('me')
  @UseGuards(ThrottlerGuard, JwtAuthGuard)
  @Throttle({ default: { limit: FEEDBACK_PER_MINUTE, ttl: ONE_MINUTE_MS } })
  save(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
    @Body(new SchemaPipe<ReviewData>(ReviewInputSchema)) body: ReviewData,
  ) {
    return this.feedback.saveReview(user.id, slug, body);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('slug') slug: string) {
    return this.feedback.deleteReview(user.id, slug);
  }
}
