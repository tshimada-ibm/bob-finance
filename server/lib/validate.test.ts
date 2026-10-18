// @vitest-environment node
import { ApiError } from './errors';
import { MAX_SYMBOLS_PER_REQUEST, parseSymbols, parseWindow } from './validate';

describe('parseSymbols', () => {
  it('trims, upper-cases and de-duplicates', () => {
    expect(parseSymbols(' ibm, msft ,IBM,,sap ')).toEqual(['IBM', 'MSFT', 'SAP']);
  });

  it('accepts class-share, index and exchange-suffixed tickers', () => {
    expect(parseSymbols('BRK-B,^GSPC,SAP.DE')).toEqual(['BRK-B', '^GSPC', 'SAP.DE']);
  });

  it.each([undefined, '', '  ', ',', 42])('rejects missing input: %s', (input) => {
    expect(() => parseSymbols(input)).toThrowError(expect.objectContaining({ code: 'BAD_REQUEST' }));
  });

  it.each(['IBM;DROP', 'not a symbol', '../etc', 'WAYTOOLONGSYMBOLNAME'])('rejects malformed symbol %s', (input) => {
    expect(() => parseSymbols(input)).toThrowError(expect.objectContaining({ code: 'INVALID_SYMBOL' }));
  });

  it('enforces the per-request cap', () => {
    const many = Array.from({ length: MAX_SYMBOLS_PER_REQUEST + 1 }, (_, i) => `S${i}`).join(',');
    expect(() => parseSymbols(many)).toThrowError(ApiError);
  });
});

describe('parseWindow', () => {
  it('accepts the three supported windows', () => {
    expect(['day', 'week', 'quarter'].map(parseWindow)).toEqual(['day', 'week', 'quarter']);
  });

  it('rejects anything else', () => {
    expect(() => parseWindow('year')).toThrowError(expect.objectContaining({ code: 'BAD_REQUEST' }));
    expect(() => parseWindow(undefined)).toThrowError(ApiError);
  });
});
