// @vitest-environment node
import request from 'supertest';
import type { Quote, Series } from '../src/types/market';
import { createApp } from './app';
import { ApiError } from './lib/errors';
import type { MarketDataProvider } from './providers/MarketDataProvider';

const quote = (symbol: string): Quote => ({
  symbol,
  name: symbol,
  price: 10,
  change: 1,
  changePct: 10,
  currency: 'USD',
  asOf: '2024-06-07T20:00:00.000Z',
});

const fake: MarketDataProvider = {
  getQuotes: async (symbols) => {
    if (symbols.includes('NOPE')) throw new ApiError('INVALID_SYMBOL', 'No market data found for "NOPE".');
    if (symbols.includes('DOWN')) throw new Error('internal detail that must not leak');
    return symbols.map(quote);
  },
  getHistory: async (symbols, window): Promise<Series[]> =>
    symbols.map((symbol) => ({ symbol, points: [{ t: `${window}-point`, close: 1 }] })),
};

const app = createApp(fake);

describe('GET /api/quotes', () => {
  it('returns normalized quotes for valid symbols', async () => {
    const res = await request(app).get('/api/quotes').query({ symbols: 'ibm,msft' });
    expect(res.status).toBe(200);
    expect(res.body.map((q: Quote) => q.symbol)).toEqual(['IBM', 'MSFT']);
  });

  it('returns 400 BAD_REQUEST when symbols is missing', async () => {
    const res = await request(app).get('/api/quotes');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });

  it('returns 400 INVALID_SYMBOL for a malformed ticker', async () => {
    const res = await request(app).get('/api/quotes').query({ symbols: 'IBM;DROP' });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: 'INVALID_SYMBOL' });
  });

  it('returns 400 INVALID_SYMBOL for a ticker the provider cannot find', async () => {
    const res = await request(app).get('/api/quotes').query({ symbols: 'NOPE' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ code: 'INVALID_SYMBOL', message: 'No market data found for "NOPE".' });
  });

  it('hides unexpected error details behind a 502', async () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app).get('/api/quotes').query({ symbols: 'DOWN' });
    expect(res.status).toBe(502);
    expect(res.body.code).toBe('UPSTREAM_ERROR');
    expect(JSON.stringify(res.body)).not.toContain('internal detail');
    quiet.mockRestore();
  });
});

describe('GET /api/history', () => {
  it('returns one series per symbol for the requested window', async () => {
    const res = await request(app).get('/api/history').query({ symbols: 'IBM,SAP', window: 'quarter' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { symbol: 'IBM', points: [{ t: 'quarter-point', close: 1 }] },
      { symbol: 'SAP', points: [{ t: 'quarter-point', close: 1 }] },
    ]);
  });

  it('rejects an unknown window', async () => {
    const res = await request(app).get('/api/history').query({ symbols: 'IBM', window: 'year' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });

  it('returns a JSON 404 for unknown API routes', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('BAD_REQUEST');
  });
});
