// @vitest-environment node
import { ApiError } from '../lib/errors';
import { YahooProvider, type YahooGateway } from './YahooProvider';

const NOW = new Date('2024-06-07T20:00:00Z');

function gateway(overrides: Partial<YahooGateway> = {}): YahooGateway {
  return {
    quotes: async (symbols) =>
      symbols.map((symbol) => ({ symbol, shortName: symbol, regularMarketPrice: 100, currency: 'USD' })),
    chart: async () => ({
      timeZone: 'America/New_York',
      bars: [
        { date: new Date('2024-06-06T15:00:00Z'), close: 1 },
        { date: new Date('2024-06-07T15:00:00Z'), close: 2 },
        { date: new Date('2024-06-07T16:00:00Z'), close: null },
        { date: new Date('2024-06-07T17:00:00Z'), close: 3 },
      ],
    }),
    ...overrides,
  };
}

describe('YahooProvider.getQuotes', () => {
  it('returns normalized quotes in the requested order', async () => {
    const quotes = await new YahooProvider(gateway()).getQuotes(['MSFT', 'IBM']);
    expect(quotes.map((q) => q.symbol)).toEqual(['MSFT', 'IBM']);
  });

  it('reports a symbol Yahoo did not return as INVALID_SYMBOL', async () => {
    const provider = new YahooProvider(gateway({ quotes: async () => [] }));
    await expect(provider.getQuotes(['NOPE'])).rejects.toMatchObject({ code: 'INVALID_SYMBOL' });
  });

  it('maps network/library failures to UPSTREAM_ERROR', async () => {
    const provider = new YahooProvider(gateway({ quotes: async () => Promise.reject(new Error('fetch failed')) }));
    await expect(provider.getQuotes(['IBM'])).rejects.toMatchObject({ code: 'UPSTREAM_ERROR' });
  });
});

describe('YahooProvider.getHistory', () => {
  it('keeps only the last session for the day window', async () => {
    const [series] = await new YahooProvider(gateway(), () => NOW).getHistory(['IBM'], 'day');
    expect(series.points.map((p) => p.close)).toEqual([2, 3]);
  });

  it('keeps every valid bar for the week and quarter windows', async () => {
    const provider = new YahooProvider(gateway(), () => NOW);
    for (const window of ['week', 'quarter'] as const) {
      const [series] = await provider.getHistory(['IBM'], window);
      expect(series.points.map((p) => p.close)).toEqual([1, 2, 3]);
    }
  });

  it('asks Yahoo for the interval and start date configured for each window', async () => {
    const calls: Array<[string, string, string]> = [];
    const provider = new YahooProvider(
      gateway({
        chart: async (symbol, period1, interval) => {
          calls.push([symbol, period1.toISOString(), interval]);
          return { bars: [] };
        },
      }),
      () => NOW,
    );
    await provider.getHistory(['IBM'], 'day');
    await provider.getHistory(['IBM'], 'week');
    await provider.getHistory(['IBM'], 'quarter');
    expect(calls).toEqual([
      ['IBM', '2024-06-02T20:00:00.000Z', '5m'],
      ['IBM', '2024-05-31T20:00:00.000Z', '30m'],
      ['IBM', '2024-03-07T20:00:00.000Z', '1d'],
    ]);
  });

  it('maps "No data found" to INVALID_SYMBOL', async () => {
    const provider = new YahooProvider(
      gateway({ chart: async () => Promise.reject(new Error('No data found, symbol may be delisted')) }),
    );
    await expect(provider.getHistory(['ZZZZ'], 'week')).rejects.toMatchObject({ code: 'INVALID_SYMBOL' });
  });

  it('passes ApiError through untouched and wraps unknown errors', async () => {
    const own = new ApiError('INVALID_SYMBOL', 'custom');
    const a = new YahooProvider(gateway({ chart: async () => Promise.reject(own) }));
    await expect(a.getHistory(['IBM'], 'week')).rejects.toBe(own);

    const b = new YahooProvider(gateway({ chart: async () => Promise.reject(new Error('socket hang up')) }));
    await expect(b.getHistory(['IBM'], 'week')).rejects.toMatchObject({ code: 'UPSTREAM_ERROR' });
  });
});
