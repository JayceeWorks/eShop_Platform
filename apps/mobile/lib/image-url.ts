import { API_ORIGIN } from '@/constants/config';

/** Product images are stored as paths on our API (/static, /uploads) or as full https URLs. */
export function resolveImageUrl(url: string): string {
  return url.startsWith('/') ? `${API_ORIGIN}${url}` : url;
}
