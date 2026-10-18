import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createMarketDataClient, type MarketDataClient } from './index';

const ClientContext = createContext<MarketDataClient | null>(null);

export function MarketDataClientProvider({ client, children }: { client?: MarketDataClient; children: ReactNode }) {
  const value = useMemo(() => client ?? createMarketDataClient(), [client]);
  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
}

export function useMarketDataClient(): MarketDataClient {
  const client = useContext(ClientContext);
  if (!client) throw new Error('useMarketDataClient must be used inside <MarketDataClientProvider>');
  return client;
}
