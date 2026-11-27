import { AddressInputSchema, OtpCodeSchema, PhoneSchema, ProfileUpdateSchema } from './account';

describe('PhoneSchema', () => {
  it.each([
    ['9876543210', '9876543210'],
    ['+91 98765 43210', '9876543210'],
    ['919876543210', '9876543210'],
    ['09876543210', '9876543210'],
    ['98765-43210', '9876543210'],
  ])('accepts %s', (input, expected) => {
    expect(PhoneSchema.parse(input)).toBe(expected);
  });

  it.each(['12345', '5876543210', '98765432100', 'abcdefghij'])('rejects %s', (input) => {
    expect(PhoneSchema.safeParse(input).success).toBe(false);
  });
});

describe('OtpCodeSchema', () => {
  it('needs exactly six digits', () => {
    expect(OtpCodeSchema.safeParse('123456').success).toBe(true);
    expect(OtpCodeSchema.safeParse('12345').success).toBe(false);
    expect(OtpCodeSchema.safeParse('12345a').success).toBe(false);
  });
});

describe('ProfileUpdateSchema', () => {
  it('treats a blank email as none and lower-cases others', () => {
    expect(ProfileUpdateSchema.parse({ name: 'Ravi', email: '' }).email).toBeNull();
    expect(ProfileUpdateSchema.parse({ name: 'Ravi', email: 'Ravi@Mail.com' }).email).toBe(
      'ravi@mail.com',
    );
    expect(ProfileUpdateSchema.safeParse({ name: 'Ravi', email: 'nope' }).success).toBe(false);
  });
});

describe('AddressInputSchema', () => {
  const address = {
    name: 'Ravi Kumar',
    phone: '9876543210',
    street: '12 Market Street',
    area: 'Bazaar',
    city: 'Ramanathapuram',
    state: 'Tamil Nadu',
    pinCode: '623501',
  };

  it('accepts a full address', () => {
    expect(AddressInputSchema.parse(address).isDefault).toBe(false);
  });

  it('rejects a bad PIN code', () => {
    expect(AddressInputSchema.safeParse({ ...address, pinCode: '023501' }).success).toBe(false);
    expect(AddressInputSchema.safeParse({ ...address, pinCode: '62350' }).success).toBe(false);
  });
});
