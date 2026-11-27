import { hashOtp, otpMatches } from './otp-code';

describe('otp code hashing', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  it('matches only the same phone and code', () => {
    const stored = hashOtp('9876543210', '123456');
    expect(stored).not.toContain('123456');
    expect(otpMatches('9876543210', '123456', stored)).toBe(true);
    expect(otpMatches('9876543210', '654321', stored)).toBe(false);
    expect(otpMatches('9876543211', '123456', stored)).toBe(false);
  });
});
