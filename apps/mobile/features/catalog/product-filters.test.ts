import { countActiveFilters, toProductQueryString } from './product-filters';

describe('toProductQueryString', () => {
  it('includes paging and sort and omits empty values', () => {
    expect(toProductQueryString({ sort: 'newest', q: '', brand: undefined }, 2, 20)).toBe(
      'sort=newest&page=2&limit=20',
    );
  });

  it('expands a price range into paise bounds', () => {
    const query = toProductQueryString({ sort: 'price_asc', priceRangeId: 'from2kTo5k' }, 1, 20);
    expect(query).toContain('minPriceInPaise=200000');
    expect(query).toContain('maxPriceInPaise=500000');
    expect(query).not.toContain('priceRangeId');
  });

  it('encodes user text', () => {
    expect(toProductQueryString({ sort: 'newest', q: 'dome & bullet' }, 1, 20)).toContain(
      'q=dome%20%26%20bullet',
    );
  });
});

describe('countActiveFilters', () => {
  it('counts only selected filters', () => {
    expect(
      countActiveFilters({ brand: 'GuardPro', placement: undefined, resolution: '2 MP' }),
    ).toBe(2);
  });
});
