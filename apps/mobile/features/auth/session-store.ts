import type { AuthSessionDto, AuthUserDto } from '@simple-concepts/shared';
import { create } from 'zustand';

import { clearStoredSession, readStoredSession, writeStoredSession } from '@/lib/token-storage';

type StoredSession = { refreshToken: string; user: AuthUserDto };

type SessionState = {
  status: 'unknown' | 'signedOut' | 'signedIn';
  user: AuthUserDto | null;
  /** Kept in memory only. A fresh one is fetched with the refresh token when needed. */
  accessToken: string | null;
  refreshToken: string | null;
  restore: () => Promise<void>;
  setSession: (session: AuthSessionDto) => Promise<void>;
  /** Updates the stored user after a profile change. */
  setUser: (user: AuthUserDto) => Promise<void>;
  signOut: () => Promise<void>;
};

function parseStored(value: string | null): StoredSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<StoredSession>;
    return parsed.refreshToken && parsed.user ? (parsed as StoredSession) : null;
  } catch {
    return null;
  }
}

export const useSessionStore = create<SessionState>((set, get) => ({
  status: 'unknown',
  user: null,
  accessToken: null,
  refreshToken: null,
  restore: async () => {
    const stored = parseStored(await readStoredSession().catch(() => null));
    set(
      stored
        ? {
            status: 'signedIn',
            user: stored.user,
            refreshToken: stored.refreshToken,
          }
        : {
            status: 'signedOut',
            user: null,
            refreshToken: null,
            accessToken: null,
          },
    );
  },
  setSession: async ({ accessToken, refreshToken, user }) => {
    set({ status: 'signedIn', user, accessToken, refreshToken });
    await writeStoredSession(JSON.stringify({ refreshToken, user } satisfies StoredSession));
  },
  setUser: async (user) => {
    const { refreshToken } = get();
    set({ user });
    if (refreshToken) {
      await writeStoredSession(JSON.stringify({ refreshToken, user } satisfies StoredSession));
    }
  },
  signOut: async () => {
    set({
      status: 'signedOut',
      user: null,
      accessToken: null,
      refreshToken: null,
    });
    await clearStoredSession();
  },
}));
