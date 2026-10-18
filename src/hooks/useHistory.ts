import { useMarketDataClient } from '../services/MarketDataClientProvider';
import type { Series, TimeWindow } from '../types/market';
import { useAsyncData } from './useAsyncData';

export function useHistory(symbols: string[], window: TimeWindow) {
  const client = useMarketDataClient();
  return useAsyncData<Series[]>(
    (signal) => client.getHistory(symbols, window, signal),
    `history:${window}:${symbols.join(',')}`,
  );
}
