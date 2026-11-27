import { parseEnabledMethods } from './payments.service';

describe('parseEnabledMethods', () => {
  it('defaults to COD', () => {
    expect(parseEnabledMethods(undefined, ['COD'])).toEqual(['COD']);
    expect(parseEnabledMethods('not json', ['COD'])).toEqual(['COD']);
  });

  it('drops methods that have no provider yet', () => {
    expect(parseEnabledMethods('["COD","ONLINE"]', ['COD'])).toEqual(['COD']);
    expect(parseEnabledMethods('["ONLINE","CARD"]', ['COD', 'ONLINE'])).toEqual(
      ['ONLINE'],
    );
  });
});
