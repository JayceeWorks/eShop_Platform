import { formatINR } from './money';

describe('formatINR', () => {
  it.each([
    [0, '₹0.00'],
    [5, '₹0.05'],
    [99900, '₹999.00'],
    [149900, '₹1,499.00'],
    [12500000, '₹1,25,000.00'],
    [1234567899, '₹1,23,45,678.99'],
    [-149900, '-₹1,499.00'],
  ])('formats %i paise as %s', (paise, expected) => {
    expect(formatINR(paise)).toBe(expected);
  });

  it.each([10.5, Number.NaN, Number.POSITIVE_INFINITY])('rejects %d', (value) => {
    expect(() => formatINR(value)).toThrow(RangeError);
  });
});
