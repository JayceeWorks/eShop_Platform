import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  AdminOrderDto,
  AdminOrderStatusInput,
  AdminOrderSummaryDto,
  CheckoutConfigDto,
  FeedbackDto,
  OrderDetailDto,
  OrderStatus,
  OrderSummaryDto,
  PlaceOrderInput,
} from '@simple-concepts/shared';

import { ACCOUNT_KEY } from '@/features/account/use-account';
import { apiGet, apiGetPage, apiRequest } from '@/lib/api';

const PAGE_LIMIT = 20;
const ORDERS_KEY = [...ACCOUNT_KEY, 'orders'] as const;
const NOTIFICATIONS_KEY = [...ACCOUNT_KEY, 'notifications'] as const;
const ADMIN_ORDERS_KEY = ['admin', 'orders'] as const;

function nextPage({ meta }: { meta: { page: number; totalPages: number } }) {
  return meta.page < meta.totalPages ? meta.page + 1 : undefined;
}

export function useCheckoutConfig() {
  return useQuery({
    queryKey: ['checkout', 'config'],
    queryFn: () => apiGet<CheckoutConfigDto>('/checkout/config'),
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PlaceOrderInput) =>
      apiRequest<OrderDetailDto>('/orders', { method: 'POST', body: input, auth: true }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ORDERS_KEY }),
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
        // Stock changed.
        queryClient.invalidateQueries({ queryKey: ['products'] }),
      ]),
  });
}

export function useMyOrders() {
  return useInfiniteQuery({
    queryKey: [...ORDERS_KEY, 'list'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      apiGetPage<OrderSummaryDto>(`/orders?page=${pageParam}&limit=${PAGE_LIMIT}`, { auth: true }),
    getNextPageParam: nextPage,
    staleTime: 0,
  });
}

export function useMyOrder(id: string) {
  return useQuery({
    queryKey: [...ORDERS_KEY, 'detail', id],
    queryFn: () => apiRequest<OrderDetailDto>(`/orders/${id}`, { auth: true }),
    staleTime: 0,
  });
}

export function useCancelOrder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) =>
      apiRequest<OrderDetailDto>(`/orders/${id}/cancel`, {
        method: 'POST',
        body: { reason: reason || undefined },
        auth: true,
      }),
    onSuccess: (order) => {
      queryClient.setQueryData([...ORDERS_KEY, 'detail', id], order);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ORDERS_KEY }),
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
      ]);
    },
  });
}

export function useAdminOrders(status: OrderStatus | undefined) {
  return useInfiniteQuery({
    queryKey: [...ADMIN_ORDERS_KEY, 'list', status ?? 'all'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      apiGetPage<AdminOrderSummaryDto>(
        `/admin/orders?page=${pageParam}&limit=${PAGE_LIMIT}${status ? `&status=${status}` : ''}`,
        { auth: true },
      ),
    getNextPageParam: nextPage,
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: [...ADMIN_ORDERS_KEY, 'detail', id],
    queryFn: () => apiRequest<AdminOrderDto>(`/admin/orders/${id}`, { auth: true }),
    staleTime: 0,
  });
}

export function useSetOrderStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminOrderStatusInput) =>
      apiRequest<AdminOrderDto>(`/admin/orders/${id}/status`, {
        method: 'POST',
        body: input,
        auth: true,
      }),
    onSuccess: (order) => {
      queryClient.setQueryData([...ADMIN_ORDERS_KEY, 'detail', id], order);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: [...ADMIN_ORDERS_KEY, 'list'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
      ]);
    },
  });
}

export function useAdminFeedback() {
  return useInfiniteQuery({
    queryKey: ['admin', 'feedback'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      apiGetPage<FeedbackDto>(`/admin/feedback?page=${pageParam}&limit=${PAGE_LIMIT}`, {
        auth: true,
      }),
    getNextPageParam: nextPage,
    staleTime: 0,
  });
}
