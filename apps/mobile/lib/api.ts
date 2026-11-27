import type { AuthSessionDto, PageMeta } from '@simple-concepts/shared';

import { API_BASE_URL } from '@/constants/config';
import { useSessionStore } from '@/features/auth/session-store';
import { strings } from '@/lib/i18n';

const UNKNOWN_ERROR_CODE = 'UNKNOWN_ERROR';
const UNKNOWN_ERROR_MESSAGE = 'Unexpected server response';
const UNAUTHORIZED = 401;

type ApiSuccess<T> = { data: T; meta?: PageMeta };
type ApiBody<T> = ApiSuccess<T> | { error: { code: string; message: string } };

export type ApiPage<T> = { items: T[]; meta: PageMeta };

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Sent as JSON. */
  body?: unknown;
  /** Sent as multipart form data instead of `body`. */
  formData?: FormData;
  /** Attach the logged-in user's token, refreshing it once if it has expired. */
  auth?: boolean;
};

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function send(path: string, options: RequestOptions, accessToken: string | null) {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body:
      options.formData ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
  });
}

async function parse<T>(response: Response): Promise<ApiSuccess<T>> {
  let body: ApiBody<T> | undefined;
  try {
    body = (await response.json()) as ApiBody<T>;
  } catch {
    body = undefined;
  }
  if (body && 'error' in body) {
    throw new ApiError(body.error.code, body.error.message, response.status);
  }
  if (!response.ok || !body) {
    throw new ApiError(UNKNOWN_ERROR_CODE, UNKNOWN_ERROR_MESSAGE, response.status);
  }
  return body;
}

let refreshing: Promise<string | null> | null = null;

/** Gets a new access token. Concurrent callers share one request. Signs out if it fails. */
function refreshAccessToken(): Promise<string | null> {
  refreshing ??= (async () => {
    const { refreshToken, setSession, signOut } = useSessionStore.getState();
    if (!refreshToken) return null;
    try {
      const session = (
        await parse<AuthSessionDto>(
          await send('/auth/refresh', { method: 'POST', body: { refreshToken } }, null),
        )
      ).data;
      await setSession(session);
      return session.accessToken;
    } catch {
      await signOut();
      return null;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiSuccess<T>> {
  if (!options.auth) return parse<T>(await send(path, options, null));

  const token = useSessionStore.getState().accessToken ?? (await refreshAccessToken());
  let response = await send(path, options, token);
  if (response.status === UNAUTHORIZED) {
    const fresh = await refreshAccessToken();
    if (fresh) response = await send(path, options, fresh);
  }
  return parse<T>(response);
}

export async function apiRequest<T>(path: string, options?: RequestOptions): Promise<T> {
  return (await request<T>(path, options)).data;
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path);
}

export async function apiGetPage<T>(path: string, options?: RequestOptions): Promise<ApiPage<T>> {
  const body = await request<T[]>(path, options);
  if (!body.meta) {
    throw new ApiError(UNKNOWN_ERROR_CODE, UNKNOWN_ERROR_MESSAGE, 200);
  }
  return { items: body.data, meta: body.meta };
}

/** A message to show the user for a failed request. */
export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : strings.common.loadError;
}
