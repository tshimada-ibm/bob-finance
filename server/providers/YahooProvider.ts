import YahooFinance from 'yahoo-finance2';
import type { Quote, Series, TimeWindow } from '../../src/types/market';
import { ApiError } from '../lib/errors';
import { normalizeQuote, normalizeSeries, type RawBar, type RawQuote } from '../lib/normalize';
import { WINDOW_QUERIES, type ChartInterval } from '../lib/windows';
import type { MarketDataProvider } from './MarketDataProvider';

/** Thin seam over yahoo-finance2 so the provider can be tested without the network. */
export interface YahooGateway {
  quotes(symbols: string[]): Promise<RawQuote[]>;
  chart(symbol: string, period1: Date, interval: ChartInterval): Promise<{ timeZone?: string; bars: RawBar[] }>;
}

export function createYahooGateway(): YahooGateway {
  const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
  return {
    // quote() with an array omits unknown symbols instead of throwing.
    quotes: async (symbols) =>
      ((await yf.quote(symbols)) ?? []).map((q) => ({
        symbol: q.symbol,
        shortName: q.shortName,
        longName: q.longName,
        currency: q.currency,
        regularMarketPrice: q.regularMarketPrice,
        regularMarketChange: q.regularMarketChange,
        regularMarketChangePercent: q.regularMarketChangePercent,
        regularMarketTime: q.regularMarketTime,
      })),
    chart: async (symbol, period1, interval) => {
      // Regular trading hours only: pre/post-market bars would skew the day view and misalign symbols.
      const result = await yf.chart(symbol, { period1, interval, includePrePost: false, return: 'array' });
      return { timeZone: result.meta.exchangeTimezoneName, bars: result.quotes };
    },
  };
}

/** Yahoo reports unknown tickers on chart() with this message; everything else is treated as upstream failure. */
const UNKNOWN_SYMBOL = /no data found|not found|delisted/i;

function toApiError(symbol: string, err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  const message = err instanceof Error ? err.message : String(err);
  return UNKNOWN_SYMBOL.test(message)
    ? new ApiError('INVALID_SYMBOL', `No market data found for "${symbol}".`)
    : new ApiError('UPSTREAM_ERROR', `Yahoo Finance request failed for ${symbol}: ${message}`);
}

export class YahooProvider implements MarketDataProvider {
  constructor(
    private readonly gateway: YahooGateway = createYahooGateway(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    let raw: RawQuote[];
    try {
      raw = await this.gateway.quotes(symbols);
    } catch (err) {
      throw toApiError(symbols.join(','), err);
    }
    const bySymbol = new Map(raw.map((q) => [q.symbol.toUpperCase(), q]));
    return symbols.map((symbol) => {
      const quote = bySymbol.get(symbol);
      if (!quote) throw new ApiError('INVALID_SYMBOL', `No market data found for "${symbol}".`);
      return normalizeQuote(quote);
    });
  }

  async getHistory(symbols: string[], window: TimeWindow): Promise<Series[]> {
    const query = WINDOW_QUERIES[window];
    const from = query.from(this.now());
    return Promise.all(
      symbols.map(async (symbol) => {
        try {
          const { timeZone, bars } = await this.gateway.chart(symbol, from, query.interval);
          return normalizeSeries(symbol, bars, { timeZone, lastSessionOnly: query.lastSessionOnly });
        } catch (err) {
          throw toApiError(symbol, err);
        }
      }),
    );
  }
}
