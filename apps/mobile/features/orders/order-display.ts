import { ORDER_PROGRESS, type OrderHistoryDto, type OrderStatus } from '@simple-concepts/shared';

export type TimelineStep = {
  status: OrderStatus;
  /** When the order reached this step, or null if it hasn't yet. */
  at: string | null;
  state: 'done' | 'current' | 'upcoming';
};

/**
 * Steps for the tracking timeline. A cancelled order shows the steps it reached, then Cancelled.
 */
export function buildTimeline(status: OrderStatus, history: OrderHistoryDto[]): TimelineStep[] {
  const reachedAt = new Map<OrderStatus, string>();
  for (const entry of history) reachedAt.set(entry.status, entry.at);

  if (status === 'CANCELLED') {
    const reached = ORDER_PROGRESS.filter((step) => reachedAt.has(step));
    return [
      ...reached.map((step) => ({
        status: step,
        at: reachedAt.get(step) ?? null,
        state: 'done' as const,
      })),
      { status: 'CANCELLED', at: reachedAt.get('CANCELLED') ?? null, state: 'current' },
    ];
  }

  const currentIndex = ORDER_PROGRESS.indexOf(status);
  return ORDER_PROGRESS.map((step, index) => ({
    status: step,
    at: reachedAt.get(step) ?? null,
    state:
      index < currentIndex || (index === currentIndex && step === 'DELIVERED')
        ? 'done'
        : index === currentIndex
          ? 'current'
          : 'upcoming',
  }));
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const HOURS_PER_HALF_DAY = 12;
const MINUTE_DIGITS = 2;

/** e.g. "27 Nov 2026". Formatted by hand because Intl support varies on Android. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** e.g. "27 Nov, 2:05 pm". */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const hours = date.getHours();
  const hour12 = hours % HOURS_PER_HALF_DAY || HOURS_PER_HALF_DAY;
  const minutes = String(date.getMinutes()).padStart(MINUTE_DIGITS, '0');
  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${hour12}:${minutes} ${
    hours < HOURS_PER_HALF_DAY ? 'am' : 'pm'
  }`;
}

/** Badge colours for each status. */
export function statusTone(status: OrderStatus): 'progress' | 'done' | 'cancelled' {
  if (status === 'DELIVERED') return 'done';
  if (status === 'CANCELLED' || status === 'RETURNED') return 'cancelled';
  return 'progress';
}
