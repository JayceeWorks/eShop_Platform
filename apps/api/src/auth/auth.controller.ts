import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  AdminLoginSchema,
  OtpRequestSchema,
  OtpVerifySchema,
  type OtpRequestData,
  type OtpVerifyData,
  RefreshTokenSchema,
  type AdminLoginInput,
  type RefreshTokenInput,
} from '@simple-concepts/shared';
import { SchemaPipe } from '../common/schema.pipe';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './auth.types';
import { CurrentUser } from './current-user';
import { CustomerAuthService } from './customer-auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

const LOGIN_ATTEMPTS_PER_MINUTE = 5;
const OTP_REQUESTS_PER_MINUTE = 5;
const OTP_VERIFIES_PER_MINUTE = 10;
const REFRESHES_PER_MINUTE = 30;
const ONE_MINUTE_MS = 60_000;
const OK = 200;

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly customerAuth: CustomerAuthService,
  ) {}

  @Post('admin/login')
  @HttpCode(OK)
  @Throttle({
    default: { limit: LOGIN_ATTEMPTS_PER_MINUTE, ttl: ONE_MINUTE_MS },
  })
  login(
    @Body(new SchemaPipe<AdminLoginInput>(AdminLoginSchema))
    body: AdminLoginInput,
  ) {
    return this.auth.adminLogin(body);
  }

  @Post('otp/request')
  @HttpCode(OK)
  @Throttle({ default: { limit: OTP_REQUESTS_PER_MINUTE, ttl: ONE_MINUTE_MS } })
  requestOtp(
    @Body(new SchemaPipe<OtpRequestData>(OtpRequestSchema))
    body: OtpRequestData,
  ) {
    return this.customerAuth.requestOtp(body.phone);
  }

  @Post('otp/verify')
  @HttpCode(OK)
  @Throttle({ default: { limit: OTP_VERIFIES_PER_MINUTE, ttl: ONE_MINUTE_MS } })
  verifyOtp(
    @Body(new SchemaPipe<OtpVerifyData>(OtpVerifySchema)) body: OtpVerifyData,
  ) {
    return this.customerAuth.verifyOtp(body);
  }

  @Post('refresh')
  @HttpCode(OK)
  @Throttle({ default: { limit: REFRESHES_PER_MINUTE, ttl: ONE_MINUTE_MS } })
  refresh(
    @Body(new SchemaPipe<RefreshTokenInput>(RefreshTokenSchema))
    body: RefreshTokenInput,
  ) {
    return this.auth.refresh(body.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.findActiveUser(user.id);
  }
}
