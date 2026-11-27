import { z } from 'zod';

export const OTP_LENGTH = 6;
export const OTP_TTL_SECONDS = 5 * 60;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_SECONDS = 30;
export const MAX_ADDRESSES = 10;

/** Indian mobile number: 10 digits starting 6–9. Spaces, dashes and a +91 / 0 prefix are removed. */
export const PhoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, '').replace(/^(\+91|91(?=\d{10}$)|0(?=\d{10}$))/, ''))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit mobile number' }));

export const PersonNameSchema = z
  .string()
  .trim()
  .min(2, { message: 'Enter your name' })
  .max(80, { message: 'Name is too long' });

export const OtpCodeSchema = z
  .string()
  .trim()
  .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), { message: `Enter the ${OTP_LENGTH}-digit code` });

export const OtpRequestSchema = z.object({ phone: PhoneSchema });
export type OtpRequestInput = z.input<typeof OtpRequestSchema>;
export type OtpRequestData = z.output<typeof OtpRequestSchema>;

/** Sign in and sign up share one endpoint. A name is needed only when the number is new. */
export const OtpVerifySchema = z.object({
  phone: PhoneSchema,
  code: OtpCodeSchema,
  name: PersonNameSchema.optional(),
});
export type OtpVerifyInput = z.input<typeof OtpVerifySchema>;
export type OtpVerifyData = z.output<typeof OtpVerifySchema>;

export type OtpRequestResultDto = {
  /** Seconds until the code expires. */
  expiresInSeconds: number;
  resendInSeconds: number;
  /** Set only in development while no SMS provider is configured. */
  devCode?: string;
};

/** Error code sent when a valid code is entered for a number with no account and no name. */
export const ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND';

const optionalEmail = z
  .string()
  .trim()
  .max(120)
  .transform((value) => value.toLowerCase())
  .pipe(z.union([z.literal(''), z.email({ message: 'Enter a valid email' })]))
  .transform((value) => (value === '' ? null : value));

export const ProfileUpdateSchema = z.object({
  name: PersonNameSchema,
  email: optionalEmail,
});
export type ProfileUpdateInput = z.input<typeof ProfileUpdateSchema>;
export type ProfileUpdateData = z.output<typeof ProfileUpdateSchema>;

export const AddressInputSchema = z.object({
  name: PersonNameSchema,
  phone: PhoneSchema,
  street: z.string().trim().min(3, { message: 'Enter house number and street' }).max(200),
  area: z.string().trim().min(2, { message: 'Enter the area or locality' }).max(120),
  city: z.string().trim().min(2, { message: 'Enter the city or town' }).max(80),
  state: z.string().trim().min(2, { message: 'Enter the state' }).max(80),
  pinCode: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}$/, { message: 'Enter a valid 6-digit PIN code' }),
  isDefault: z.boolean().default(false),
});
export type AddressInput = z.input<typeof AddressInputSchema>;
export type AddressData = z.output<typeof AddressInputSchema>;

export type AddressDto = {
  id: string;
  name: string;
  phone: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault: boolean;
};

export function formatAddress(address: Omit<AddressDto, 'id' | 'isDefault' | 'name' | 'phone'>): string {
  return `${address.street}, ${address.area}, ${address.city}, ${address.state} - ${address.pinCode}`;
}
