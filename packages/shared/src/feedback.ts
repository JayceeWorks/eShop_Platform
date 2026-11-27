import { z } from 'zod';

export const MIN_RATING = 1;
export const MAX_RATING = 5;
export const MAX_FEEDBACK_LENGTH = 1000;

const rating = z
  .number()
  .int()
  .min(MIN_RATING, { message: 'Choose a star rating' })
  .max(MAX_RATING);

export const FeedbackInputSchema = z.object({
  rating,
  message: z
    .string()
    .trim()
    .min(3, { message: 'Tell us a little more' })
    .max(MAX_FEEDBACK_LENGTH),
  orderId: z.uuid().optional(),
});
export type FeedbackInput = z.input<typeof FeedbackInputSchema>;
export type FeedbackData = z.output<typeof FeedbackInputSchema>;

export const ReviewInputSchema = z.object({
  rating,
  comment: z.string().trim().max(MAX_FEEDBACK_LENGTH).default(''),
});
export type ReviewInput = z.input<typeof ReviewInputSchema>;
export type ReviewData = z.output<typeof ReviewInputSchema>;

export type ReviewDto = {
  id: string;
  rating: number;
  comment: string;
  /** First name only, to keep reviewers' details private. */
  authorName: string;
  isVerifiedBuyer: boolean;
  createdAt: string;
};

export type ReviewSummaryDto = {
  average: number;
  count: number;
  reviews: ReviewDto[];
  /** The signed-in customer's own review, if any. */
  mine: ReviewDto | null;
};

export type FeedbackDto = {
  id: string;
  rating: number;
  message: string;
  orderNumber: string | null;
  customer: { name: string | null; phone: string };
  createdAt: string;
};

export type NotificationDto = {
  id: string;
  title: string;
  body: string;
  orderId: string | null;
  readAt: string | null;
  createdAt: string;
};

/** Shows a reviewer as their first name, or "Customer" if they have no name. */
export function reviewerName(name: string | null): string {
  const first = name?.trim().split(/\s+/)[0];
  return first ? first : 'Customer';
}

/** Average rounded to one decimal place, 0 when there are no ratings. */
export function averageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((total, value) => total + value, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}
