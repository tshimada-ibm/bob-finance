import { MarketDataError } from './marketDataClient';
import { MockMarketDataClient } from './mockMarketDataClient';

const fixedNow = () => new Date('2024-06-03T15:00:00Z');

describe('MockMarketDataClient', () => {
  const client = new MockMarketDataClient(fixedNow, 0);

  it('is deterministic and returns ascending, non-empty series', async () => {
    const [a] = await client.getHistory(['IBM'], 'week');
    const [b] = await client.getHistory(['IBM'], 'week');
    expect(a).toEqual(b);
    expect(a.points.length).toBeGreaterThan(1);
    const times = a.points.map((p) => p.t);
    expect([...times].sort()).toEqual(times);
  });

  it('returns a quote per symbol', async () => {
    const quotes = await client.getQuotes(['IBM', 'MSFT']);
    expect(quotes.map((q) => q.symbol)).toEqual(['IBM', 'MSFT']);
    expect(quotes[0].price).toBeGreaterThan(0);
  });

  it('supports a newly configured company with no other code changes', async () => {
    const extended = new MockMarketDataClient(fixedNow, 0, [
      { symbol: 'ACN', name: 'Accenture', color: '#000000' }, // no mockBasePrice on purpose
    ]);

    const [quote] = await extended.getQuotes(['ACN']);
    const [series] = await extended.getHistory(['ACN'], 'quarter');

    expect(quote).toMatchObject({ symbol: 'ACN', name: 'Accenture' });
    expect(quote.price).toBeGreaterThan(0);
    expect(series.points.length).toBeGreaterThan(1);
    // Only configured companies are known: the defaults are not silently included.
    await expect(extended.getQuotes(['IBM'])).rejects.toMatchObject({ code: 'INVALID_SYMBOL' });
  });

  it('recognises the extra lookup tickers but still rejects unknown ones', async () => {
    const [nvda] = await client.getHistory(['NVDA'], 'week');
    expect(nvda.points.length).toBeGreaterThan(1);
    await expect(client.getHistory(['ZZZZ'], 'week')).rejects.toMatchObject({ code: 'INVALID_SYMBOL' });
  });

  it('models a valid symbol with no data: empty history, and no quote', async () => {
    const [series] = await client.getHistory(['NODATA'], 'quarter');
    expect(series.points).toEqual([]);
    await expect(client.getQuotes(['NODATA'])).rejects.toMatchObject({ code: 'UPSTREAM_ERROR' });
  });

  it('rejects unknown symbols with INVALID_SYMBOL', async () => {
    await expect(client.getQuotes(['NOPE'])).rejects.toMatchObject({
      code: 'INVALID_SYMBOL',
    });
    await expect(client.getHistory(['NOPE'], 'day')).rejects.toBeInstanceOf(MarketDataError);
  });
});
