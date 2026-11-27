import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ACCOUNT_NOT_FOUND,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_SECONDS,
  OTP_TTL_SECONDS,
  type AuthSessionDto,
  type OtpRequestResultDto,
} from '@simple-concepts/shared';
import { appError } from '../common/http-exception.filter';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { hashOtp, otpMatches } from './otp-code';
import { OtpSender } from './otp-sender';

const MS_PER_SECOND = 1000;

/** Phone + OTP sign-in and sign-up for customers. */
@Injectable()
export class CustomerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly sender: OtpSender,
  ) {}

  async requestOtp(
    phone: string,
    now = new Date(),
  ): Promise<OtpRequestResultDto> {
    const latest = await this.prisma.otpRequest.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    const waitMs = latest
      ? latest.createdAt.getTime() +
        OTP_RESEND_SECONDS * MS_PER_SECOND -
        now.getTime()
      : 0;
    if (waitMs > 0) {
      throw new HttpException(
        `Please wait ${Math.ceil(waitMs / MS_PER_SECOND)} seconds before asking for a new code`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const { code, devCode } = await this.sender.send(phone);
    // A new code replaces any earlier unused one.
    await this.prisma.$transaction([
      this.prisma.otpRequest.updateMany({
        where: { phone, consumedAt: null },
        data: { consumedAt: now },
      }),
      this.prisma.otpRequest.create({
        data: {
          phone,
          codeHash: hashOtp(phone, code),
          expiresAt: new Date(now.getTime() + OTP_TTL_SECONDS * MS_PER_SECOND),
          createdAt: now,
        },
      }),
    ]);
    return {
      expiresInSeconds: OTP_TTL_SECONDS,
      resendInSeconds: OTP_RESEND_SECONDS,
      ...(devCode ? { devCode } : {}),
    };
  }

  async verifyOtp(
    { phone, code, name }: { phone: string; code: string; name?: string },
    now = new Date(),
  ): Promise<AuthSessionDto> {
    const request = await this.prisma.otpRequest.findFirst({
      where: { phone, consumedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
    });
    if (!request) {
      throw new BadRequestException(
        'This code has expired. Ask for a new one.',
      );
    }
    if (request.attempts >= OTP_MAX_ATTEMPTS) {
      throw new HttpException(
        'Too many wrong tries. Ask for a new code.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (!otpMatches(phone, code, request.codeHash)) {
      await this.prisma.otpRequest.update({
        where: { id: request.id },
        data: { attempts: { increment: 1 } },
      });
      const left = OTP_MAX_ATTEMPTS - request.attempts - 1;
      throw new BadRequestException(
        left > 0
          ? `Wrong code. ${left} ${left === 1 ? 'try' : 'tries'} left.`
          : 'Wrong code. Ask for a new code.',
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { phone },
      select: { id: true, role: true, isActive: true },
    });
    if (existing && existing.role !== 'CUSTOMER') {
      throw new ForbiddenException(
        'Please use the admin login for this account',
      );
    }
    if (existing && !existing.isActive) {
      throw new UnauthorizedException('This account is closed');
    }
    // The code stays valid, so the app can ask for a name and send it again.
    if (!existing && !name) {
      throw new NotFoundException(
        appError(
          ACCOUNT_NOT_FOUND,
          'No account uses this number yet. Create one to continue.',
        ),
      );
    }

    // Marking the code used only if it is still unused stops two requests from both signing in.
    const consumed = await this.prisma.otpRequest.updateMany({
      where: { id: request.id, consumedAt: null },
      data: { consumedAt: now },
    });
    if (consumed.count === 0) {
      throw new BadRequestException(
        'This code has already been used. Ask for a new one.',
      );
    }

    const user =
      existing ??
      (await this.prisma.user.upsert({
        where: { phone },
        update: {},
        create: { phone, name: name ?? null, role: 'CUSTOMER' },
        select: { id: true },
      }));
    if (existing && name) {
      await this.prisma.user.updateMany({
        where: { id: existing.id, name: null },
        data: { name },
      });
    }
    return this.auth.sessionFor(user.id);
  }
}
