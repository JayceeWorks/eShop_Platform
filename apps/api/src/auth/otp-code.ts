import { createHmac, timingSafeEqual } from 'node:crypto';

function otpSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing JWT_SECRET in environment');
  return secret;
}

/** Codes are stored as keyed hashes, so a database leak does not reveal live codes. */
export function hashOtp(phone: string, code: string): string {
  return createHmac('sha256', otpSecret())
    .update(`${phone}:${code}`)
    .digest('hex');
}

export function otpMatches(
  phone: string,
  code: string,
  storedHash: string,
): boolean {
  const expected = Buffer.from(storedHash, 'hex');
  const actual = Buffer.from(hashOtp(phone, code), 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
