import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FeedbackInput, NotificationDto, ReviewInput, ReviewSummaryDto } from '@simple-concepts/shared';

import { ACCOUNT_KEY } from '@/features/account/use-account';
import { useSessionStore } from '@/features/auth/session-store';
import { apiGetPage, apiRequest } from '@/lib/api';

const PAGE_LIMIT = 20;
const NOTIFICATIONS_KEY = [...ACCOUNT_KEY, 'notifications'] as const;
/** How often the unread badge checks for new order updates while the app is open. */
const UNREAD_REFRESH_MS = 60_000;

export function useSendFeedback() {
  return useMutation({
    mutationFn: (input: FeedbackInput) =>
      apiRequest<{ id: string }>('/feedback', { method: 'POST', body: input, auth: true }),
  });
}

function reviewsKey(slug: string, signedIn: boolean) {
  return ['products', 'reviews', slug, signedIn ? 'mine' : 'public'] as const;
}

/** Reviews for a product. Signed-in customers also get their own review back. */
export function useReviews(slug: string) {
  const signedIn = useSessionStore((state) => state.status === 'signedIn');
  return useQuery({
    queryKey: reviewsKey(slug, signedIn),
    queryFn: () =>
      signedIn
        ? apiRequest<ReviewSummaryDto>(`/products/${slug}/reviews/me`, { auth: true })
        : apiRequest<ReviewSummaryDto>(`/products/${slug}/reviews`),
  });
}

export function useSaveReview(slug: string) {
  const queryClient = useQueryClient();
  const onSuccess = (summary: ReviewSummaryDto) => {
    queryClient.setQueryData(reviewsKey(slug, true), summary);
    return queryClient.invalidateQueries({ queryKey: reviewsKey(slug, false) });
  };
  return {
    save: useMutation({
      mutationFn: (input: ReviewInput) =>
        apiRequest<ReviewSummaryDto>(`/products/${slug}/reviews/me`, {
          method: 'PUT',
          body: input,
          auth: true,
        }),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: () =>
        apiRequest<ReviewSummaryDto>(`/products/${slug}/reviews/me`, {
          method: 'DELETE',
          auth: true,
        }),
      onSuccess,
    }),
  };
}

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: [...NOTIFICATIONS_KEY, 'list'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      apiGetPage<NotificationDto>(`/me/notifications?page=${pageParam}&limit=${PAGE_LIMIT}`, {
        auth: true,
      }),
    getNextPageParam: ({ meta }) => (meta.page < meta.totalPages ? meta.page + 1 : undefined),
    staleTime: 0,
  });
}

export function useUnreadCount() {
  const signedIn = useSessionStore(
    (state) => state.status === 'signedIn' && state.user?.role === 'CUSTOMER',
  );
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, 'unread'],
    queryFn: async () =>
      (await apiRequest<{ unread: number }>('/me/notifications/unread-count', { auth: true }))
        .unread,
    enabled: signedIn,
    refetchInterval: UNREAD_REFRESH_MS,
    staleTime: 0,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
  return {
    one: useMutation({
      mutationFn: (id: string) =>
        apiRequest<{ ok: true }>(`/me/notifications/${id}/read`, { method: 'POST', auth: true }),
      onSuccess,
    }),
    all: useMutation({
      mutationFn: () =>
        apiRequest<{ ok: true }>('/me/notifications/read-all', { method: 'POST', auth: true }),
      onSuccess,
    }),
  };
}
