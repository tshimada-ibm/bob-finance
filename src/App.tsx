import { MarketDataClientProvider } from './services/MarketDataClientProvider';
import { DashboardPage } from './pages/DashboardPage';

export function App() {
  return (
    <MarketDataClientProvider>
      <DashboardPage />
    </MarketDataClientProvider>
  );
}
