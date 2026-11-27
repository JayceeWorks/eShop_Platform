import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { OTP_LENGTH } from '@simple-concepts/shared';

/** Fixed code used in development until an SMS provider is connected (owner's choice, 2026-11-27). */
export const DEV_OTP_CODE = '123456';

export type OtpDelivery = {
  code: string;
  /** Returned to the app only in development, so testers can see which code to type. */
  devCode?: string;
};

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Creates and sends login codes. With no OTP_PROVIDER_KEY it runs in test mode: outside production
 * every number gets DEV_OTP_CODE; in production it refuses, so test codes can never go live.
 */
@Injectable()
export class OtpSender {
  private readonly logger = new Logger(OtpSender.name);

  isTestMode(): boolean {
    return !process.env.OTP_PROVIDER_KEY;
  }

  async send(phone: string): Promise<OtpDelivery> {
    if (this.isTestMode()) {
      if (isProduction()) {
        throw new ServiceUnavailableException('Login by SMS is not set up yet');
      }
      this.logger.log(
        `Test mode: login code for ••••${phone.slice(-4)} is ${DEV_OTP_CODE}`,
      );
      return { code: DEV_OTP_CODE, devCode: DEV_OTP_CODE };
    }
    const code = String(randomInt(0, 10 ** OTP_LENGTH)).padStart(
      OTP_LENGTH,
      '0',
    );
    await this.sendSms(phone, code);
    return { code };
  }

  // Connect the SMS provider here (for example MSG91 or Twilio) once the owner picks one.
  // Until then a key alone is not enough: refuse rather than pretend the code was sent.
  private sendSms(phone: string, code: string): Promise<void> {
    void phone;
    void code;
    return Promise.reject(
      new ServiceUnavailableException('SMS provider is not connected yet'),
    );
  }
}
