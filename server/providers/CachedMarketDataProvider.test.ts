// @vitest-environment node
import type { Quote } from '../../src/types/market';
import { CachedMarketDataProvider } from './CachedMarketDataProvider';
import type { MarketDataProvider } from './MarketDataProvider';

const quote: Quote = { symbol: 'IBM', name: 'IBM', price: 1, change: 0, changePct: 0, currency: 'USD', asOf: 'x' };

function counting(fail = false) {
  const calls = { quotes: 0, history: 0 };
  const inner: MarketDataProvider = {
    getQuotes: async () => {
      calls.quotes++;
      if (fail && calls.quotes === 1) throw new Error('boom');
      return [quote];
    },
    getHistory: async () => {
      calls.history++;
      return [];
    },
  };
  return { calls, inner };
}

describe('CachedMarketDataProvider', () => {
  it('serves repeated requests from cache until the TTL expires', async () => {
    let now = 0;
    const { calls, inner } = counting();
    const cached = new CachedMarketDataProvider(inner, () => now);

    await cached.getQuotes(['IBM']);
    await cached.getQuotes(['IBM']);
    expect(calls.quotes).toBe(1);

    now = 61_000; // quote TTL is 60s
    await cached.getQuotes(['IBM']);
    expect(calls.quotes).toBe(2);
  });

  it('shares one in-flight request between concurrent callers', async () => {
    const { calls, inner } = counting();
    const cached = new CachedMarketDataProvider(inner, () => 0);
    await Promise.all([cached.getHistory(['IBM'], 'week'), cached.getHistory(['IBM'], 'week')]);
    expect(calls.history).toBe(1);
  });

  it('keys by window and symbol list', async () => {
    const { calls, inner } = counting();
    const cached = new CachedMarketDataProvider(inner, () => 0);
    await cached.getHistory(['IBM'], 'week');
    await cached.getHistory(['IBM'], 'quarter');
    await cached.getHistory(['IBM', 'MSFT'], 'week');
    expect(calls.history).toBe(3);
  });

  it('does not cache failures', async () => {
    const { calls, inner } = counting(true);
    const cached = new CachedMarketDataProvider(inner, () => 0);
    await expect(cached.getQuotes(['IBM'])).rejects.toThrow('boom');
    await expect(cached.getQuotes(['IBM'])).resolves.toEqual([quote]);
    expect(calls.quotes).toBe(2);
  });
});
