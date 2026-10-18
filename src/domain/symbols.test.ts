import { SYMBOL_PATTERN, checkSymbol, normalizeSymbol } from './symbols';
import { parseSymbols } from '../../server/lib/validate';

describe('normalizeSymbol', () => {
  it('trims and upper-cases', () => {
    expect(normalizeSymbol('  nvda ')).toBe('NVDA');
  });
});

describe('checkSymbol', () => {
  it('accepts a normal ticker, normalizing it', () => {
    expect(checkSymbol(' nvda ')).toEqual({ ok: true, symbol: 'NVDA' });
  });

  it.each(['BRK-B', '^GSPC', 'SAP.DE', 'EURUSD=X'])('accepts %s', (input) => {
    expect(checkSymbol(input)).toEqual({ ok: true, symbol: input });
  });

  it('asks for input when empty or blank', () => {
    for (const input of ['', '   ']) {
      expect(checkSymbol(input)).toEqual({ ok: false, message: 'Enter a ticker symbol, for example NVDA.' });
    }
  });

  it.each(['IBM;DROP', 'not a symbol', '../etc', 'WAYTOOLONGSYMBOLNAME', 'A,B'])('rejects %s with a message naming it', (input) => {
    const result = checkSymbol(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('not a valid ticker symbol');
  });
});

describe('browser and server agree', () => {
  const inputs = ['IBM', 'brk-b', '^GSPC', 'SAP.DE', 'IBM;DROP', 'not a symbol', '../etc', 'WAYTOOLONGSYMBOLNAME', '-X', '.X'];

  it.each(inputs)('gives the same verdict for %s', (input) => {
    const browserOk = checkSymbol(input).ok;
    let serverOk = true;
    try {
      parseSymbols(input);
    } catch {
      serverOk = false;
    }
    expect(browserOk).toBe(serverOk);
  });

  it('uses one shared pattern', () => {
    expect(SYMBOL_PATTERN.test('NVDA')).toBe(true);
  });
});
