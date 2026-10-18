import { HttpMarketDataClient } from './httpMarketDataClient';
import { MarketDataError } from './marketDataClient';

function respond(body: unknown, init: ResponseInit = { status: 200 }) {
  return Promise.resolve(new Response(JSON.stringify(body), init));
}

describe('HttpMarketDataClient', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('requests quotes with a comma-joined symbol list', async () => {
    const fetchMock = vi.fn(() => respond([{ symbol: 'IBM' }]));
    vi.stubGlobal('fetch', fetchMock);

    const quotes = await new HttpMarketDataClient('/api').getQuotes(['IBM', 'MSFT']);

    expect(quotes).toEqual([{ symbol: 'IBM' }]);
    expect(fetchMock).toHaveBeenCalledWith('/api/quotes?symbols=IBM%2CMSFT', { signal: undefined });
  });

  it('requests history with the window parameter', async () => {
    const fetchMock = vi.fn(() => respond([]));
    vi.stubGlobal('fetch', fetchMock);

    await new HttpMarketDataClient('/api').getHistory(['IBM'], 'quarter');

    expect(fetchMock).toHaveBeenCalledWith('/api/history?symbols=IBM&window=quarter', { signal: undefined });
  });

  it('maps an INVALID_SYMBOL response to a MarketDataError with the server message', async () => {
    vi.stubGlobal('fetch', () => respond({ code: 'INVALID_SYMBOL', message: 'No market data found for "X".' }, { status: 400 }));

    const error = await new HttpMarketDataClient().getQuotes(['X']).catch((e) => e);

    expect(error).toBeInstanceOf(MarketDataError);
    expect(error).toMatchObject({ code: 'INVALID_SYMBOL', message: 'No market data found for "X".' });
  });

  it('maps other failures to UPSTREAM_ERROR, even when the body is not JSON', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('<html>Bad gateway</html>', { status: 502 })));

    await expect(new HttpMarketDataClient().getHistory(['IBM'], 'day')).rejects.toMatchObject({
      code: 'UPSTREAM_ERROR',
      message: 'Market data request failed (502).',
    });
  });

  it('maps a network failure to NETWORK_ERROR', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')));

    await expect(new HttpMarketDataClient().getQuotes(['IBM'])).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  it('lets aborts propagate unchanged so callers can ignore them', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new DOMException('Aborted', 'AbortError')));

    await expect(new HttpMarketDataClient().getQuotes(['IBM'])).rejects.toMatchObject({ name: 'AbortError' });
  });
});
