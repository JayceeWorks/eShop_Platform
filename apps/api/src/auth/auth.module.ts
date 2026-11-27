import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CustomerAuthService } from './customer-auth.service';
import { OtpSender } from './otp-sender';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

const DEFAULT_REQUESTS_PER_MINUTE = 100;
const ONE_MINUTE_MS = 60_000;
const TOO_MANY_REQUESTS_MESSAGE = 'Too many tries. Please wait a minute and try again.';

@Global()
@Module({
  // Secrets are passed per call, read from the environment after main.ts loads .env.
  imports: [
    JwtModule.register({}),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: ONE_MINUTE_MS, limit: DEFAULT_REQUESTS_PER_MINUTE }],
      errorMessage: TOO_MANY_REQUESTS_MESSAGE,
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    CustomerAuthService,
    OtpSender,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
