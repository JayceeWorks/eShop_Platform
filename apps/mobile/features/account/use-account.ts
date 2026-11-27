import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AddressDto,
  AddressInput,
  AuthSessionDto,
  AuthUserDto,
  OtpRequestResultDto,
  OtpVerifyInput,
  ProfileUpdateData,
  ProfileUpdateInput,
} from '@simple-concepts/shared';

import { useSessionStore } from '@/features/auth/session-store';
import { apiRequest } from '@/lib/api';

export const ACCOUNT_KEY = ['account'] as const;
const ADDRESSES_KEY = [...ACCOUNT_KEY, 'addresses'] as const;

export function useRequestOtp() {
  return useMutation({
    mutationFn: (phone: string) =>
      apiRequest<OtpRequestResultDto>('/auth/otp/request', { method: 'POST', body: { phone } }),
  });
}

export function useVerifyOtp() {
  const setSession = useSessionStore((state) => state.setSession);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OtpVerifyInput) =>
      apiRequest<AuthSessionDto>('/auth/otp/verify', { method: 'POST', body: input }),
    onSuccess: async (session) => {
      // Drop anything cached for a previous user before showing this one's data.
      queryClient.removeQueries({ queryKey: ACCOUNT_KEY });
      await setSession(session);
    },
  });
}

/** Signs out and forgets this user's cached orders, addresses and notifications. */
export function useSignOut() {
  const signOut = useSessionStore((state) => state.signOut);
  const queryClient = useQueryClient();
  return async () => {
    await signOut();
    queryClient.removeQueries({ queryKey: ACCOUNT_KEY });
  };
}

export function useUpdateProfile() {
  const setUser = useSessionStore((state) => state.setUser);
  return useMutation({
    // The form gives null for a blank email; the API takes an empty string for "no email".
    mutationFn: ({ name, email }: ProfileUpdateData) =>
      apiRequest<AuthUserDto>('/me', {
        method: 'PUT',
        body: { name, email: email ?? '' } satisfies ProfileUpdateInput,
        auth: true,
      }),
    onSuccess: setUser,
  });
}

export function useDeleteAccount() {
  const signOut = useSignOut();
  return useMutation({
    mutationFn: () => apiRequest<{ ok: true }>('/me', { method: 'DELETE', auth: true }),
    onSuccess: signOut,
  });
}

export function useAddresses(enabled = true) {
  return useQuery({
    queryKey: ADDRESSES_KEY,
    queryFn: () => apiRequest<AddressDto[]>('/me/addresses', { auth: true }),
    enabled,
    staleTime: 0,
  });
}

export function useSaveAddress(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddressInput) =>
      apiRequest<AddressDto>(id ? `/me/addresses/${id}` : '/me/addresses', {
        method: id ? 'PUT' : 'POST',
        body: input,
        auth: true,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY }),
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ ok: true }>(`/me/addresses/${id}`, { method: 'DELETE', auth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY }),
  });
}
