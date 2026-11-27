import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AdminLoginInput, AuthSessionDto, AuthUserDto } from '@simple-concepts/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { TokenPayload, TokenType } from './auth.types';
import { hashPassword, verifyPassword } from './password';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const INVALID_LOGIN_MESSAGE = 'Wrong phone/email or password';
const INVALID_SESSION_MESSAGE = 'Please log in again';

const USER_FIELDS = {
  id: true,
  name: true,
  phone: true,
  email: true,
  role: true,
  isActive: true,
} as const;

function secretFor(type: TokenType): string {
  const secret =
    type === 'access' ? process.env.JWT_SECRET : process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error(`Missing ${type} token secret in environment`);
  return secret;
}

@Injectable()
export class AuthService {
  // Compared against when no user matches, so a wrong identifier takes as long as a wrong password.
  private readonly dummyHash = hashPassword('not-a-real-password');

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async adminLogin({
    identifier,
    password,
  }: AdminLoginInput): Promise<AuthSessionDto> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ phone: identifier }, { email: identifier.toLowerCase() }],
      },
      select: { ...USER_FIELDS, passwordHash: true },
    });
    const passwordOk = await verifyPassword(
      user?.passwordHash ?? (await this.dummyHash),
      password,
    );
    if (!user || !passwordOk || !user.isActive || user.role !== 'ADMIN') {
      throw new UnauthorizedException(INVALID_LOGIN_MESSAGE);
    }
    return this.issueSession(user);
  }

  async refresh(refreshToken: string): Promise<AuthSessionDto> {
    const payload = await this.verify(refreshToken, 'refresh');
    const user = await this.findActiveUser(payload.sub);
    if (!user) throw new UnauthorizedException(INVALID_SESSION_MESSAGE);
    return this.issueSession(user);
  }

  /** Starts a session for a user who has already proved who they are. */
  async sessionFor(userId: string): Promise<AuthSessionDto> {
    const user = await this.findActiveUser(userId);
    if (!user) throw new UnauthorizedException(INVALID_SESSION_MESSAGE);
    return this.issueSession(user);
  }

  async verify(token: string, type: TokenType): Promise<TokenPayload> {
    try {
      const payload = await this.jwt.verifyAsync<TokenPayload>(token, {
        secret: secretFor(type),
      });
      if (payload.type !== type) throw new Error('Wrong token type');
      return payload;
    } catch {
      throw new UnauthorizedException(INVALID_SESSION_MESSAGE);
    }
  }

  async findActiveUser(id: string): Promise<AuthUserDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_FIELDS,
    });
    if (!user?.isActive) return null;
    return this.toUser(user);
  }

  private async issueSession(user: AuthUserDto): Promise<AuthSessionDto> {
    const sign = (type: TokenType, expiresIn: number) =>
      this.jwt.signAsync(
        { sub: user.id, role: user.role, type } satisfies TokenPayload,
        { secret: secretFor(type), expiresIn },
      );
    const [accessToken, refreshToken] = await Promise.all([
      sign('access', ACCESS_TOKEN_TTL_SECONDS),
      sign('refresh', REFRESH_TOKEN_TTL_SECONDS),
    ]);
    return { accessToken, refreshToken, user: this.toUser(user) };
  }

  private toUser({ id, name, phone, email, role }: AuthUserDto): AuthUserDto {
    return { id, name, phone, email, role };
  }
}
