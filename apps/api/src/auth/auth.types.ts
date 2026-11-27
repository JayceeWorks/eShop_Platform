import type { UserRole } from '@simple-concepts/shared';
import type { Request } from 'express';

export type TokenType = 'access' | 'refresh';

export type TokenPayload = { sub: string; role: UserRole; type: TokenType };

export type AuthenticatedUser = { id: string; role: UserRole };

export type AuthenticatedRequest = Request & { user?: AuthenticatedUser };
