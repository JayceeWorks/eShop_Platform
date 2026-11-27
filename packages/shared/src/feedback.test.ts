import { FeedbackInputSchema, averageRating, reviewerName } from './feedback';

describe('reviewerName', () => {
  it('shows only the first name', () => {
    expect(reviewerName('Ravi Kumar')).toBe('Ravi');
    expect(reviewerName('  ')).toBe('Customer');
    expect(reviewerName(null)).toBe('Customer');
  });
});

describe('averageRating', () => {
  it('rounds to one decimal place', () => {
    expect(averageRating([])).toBe(0);
    expect(averageRating([5, 4, 4])).toBe(4.3);
  });
});

describe('FeedbackInputSchema', () => {
  it('needs a 1–5 star rating and a message', () => {
    expect(FeedbackInputSchema.safeParse({ rating: 5, message: 'Great service' }).success).toBe(true);
    expect(FeedbackInputSchema.safeParse({ rating: 0, message: 'Great service' }).success).toBe(false);
    expect(FeedbackInputSchema.safeParse({ rating: 6, message: 'Great service' }).success).toBe(false);
    expect(FeedbackInputSchema.safeParse({ rating: 4, message: '' }).success).toBe(false);
  });
});
