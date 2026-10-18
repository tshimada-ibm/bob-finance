import { useMarketDataClient } from '../services/MarketDataClientProvider';
import type { Quote } from '../types/market';
import { useAsyncData } from './useAsyncData';

export function useQuotes(symbols: string[]) {
  const client = useMarketDataClient();
  return useAsyncData<Quote[]>((signal) => client.getQuotes(symbols, signal), `quotes:${symbols.join(',')}`);
}
