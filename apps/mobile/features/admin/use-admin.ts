import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  type AdminLoginInput,
  type AdminProductDto,
  type AdminProductInput,
  type AdminProductStatus,
  type AuthSessionDto,
} from '@simple-concepts/shared';
import type { ImagePickerAsset } from 'expo-image-picker';
import { Platform } from 'react-native';

import { useSessionStore } from '@/features/auth/session-store';
import { apiGetPage, apiRequest } from '@/lib/api';
import { strings } from '@/lib/i18n';

const ADMIN_PAGE_LIMIT = 20;
const ADMIN_PRODUCTS_KEY = ['admin', 'products'] as const;
const DEFAULT_IMAGE_TYPE = 'image/jpeg';

export function useAdminLogin() {
  const setSession = useSessionStore((state) => state.setSession);
  return useMutation({
    mutationFn: (input: AdminLoginInput) =>
      apiRequest<AuthSessionDto>('/auth/admin/login', {
        method: 'POST',
        body: input,
      }),
    onSuccess: setSession,
  });
}

export function useAdminProducts(params: { q: string; status: AdminProductStatus }) {
  return useInfiniteQuery({
    queryKey: [...ADMIN_PRODUCTS_KEY, 'list', params],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const search = new URLSearchParams({
        page: String(pageParam),
        limit: String(ADMIN_PAGE_LIMIT),
        status: params.status,
      });
      if (params.q) search.set('q', params.q);
      return apiGetPage<AdminProductDto>(`/admin/products?${search.toString()}`, { auth: true });
    },
    getNextPageParam: ({ meta }) => (meta.page < meta.totalPages ? meta.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
}

export function useAdminProduct(id: string) {
  return useQuery({
    queryKey: [...ADMIN_PRODUCTS_KEY, 'detail', id],
    queryFn: () => apiRequest<AdminProductDto>(`/admin/products/${id}`, { auth: true }),
  });
}

/** Refreshes admin lists and the customer catalog after a change. */
function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY }),
      queryClient.invalidateQueries({ queryKey: ['products'] }),
    ]);
}

export function useSaveProduct(id?: string) {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (input: AdminProductInput) =>
      apiRequest<AdminProductDto>(id ? `/admin/products/${id}` : '/admin/products', {
        method: id ? 'PUT' : 'POST',
        body: input,
        auth: true,
      }),
    onSuccess: invalidate,
  });
}

export function useSetProductVisible(id: string) {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (visible: boolean) =>
      apiRequest<AdminProductDto>(
        visible ? `/admin/products/${id}/restore` : `/admin/products/${id}`,
        { method: visible ? 'POST' : 'DELETE', auth: true },
      ),
    onSuccess: invalidate,
  });
}

/** Checks a picked photo before upload. Returns an error message, or null if it's fine. */
export function checkPickedImage(asset: ImagePickerAsset): string | null {
  const type = asset.mimeType ?? DEFAULT_IMAGE_TYPE;
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(type)) return strings.admin.photoType;
  if (asset.fileSize !== undefined && asset.fileSize > MAX_UPLOAD_BYTES) {
    return strings.admin.photoTooLarge;
  }
  return null;
}

export async function uploadProductImage(asset: ImagePickerAsset): Promise<string> {
  const type = asset.mimeType ?? DEFAULT_IMAGE_TYPE;
  const name = asset.fileName ?? `photo.${type.split('/')[1]}`;
  const form = new FormData();
  if (Platform.OS === 'web') {
    form.append('file', await (await fetch(asset.uri)).blob(), name);
  } else {
    // React Native's FormData accepts a { uri, name, type } file object, which its types don't model.
    form.append('file', { uri: asset.uri, name, type } as unknown as Blob);
  }
  const { url } = await apiRequest<{ url: string }>('/admin/uploads/products', {
    method: 'POST',
    formData: form,
    auth: true,
  });
  return url;
}

export { errorMessage } from '@/lib/api';
