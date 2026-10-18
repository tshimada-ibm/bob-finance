import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarketDataError, type MarketDataClient } from '../../services';
import { MarketDataClientProvider } from '../../services/MarketDataClientProvider';
import { MockMarketDataClient } from '../../services/mockMarketDataClient';
import type { Series, TimeWindow } from '../../types/market';
import { SelectedCompanyPanel } from './SelectedCompanyPanel';

const mock = () => new MockMarketDataClient(() => new Date('2024-06-03T15:00:00Z'), 0);

function renderPanel(client: MarketDataClient, symbol: string, window: TimeWindow = 'week') {
  return render(
    <MarketDataClientProvider client={client}>
      <SelectedCompanyPanel key={symbol} symbol={symbol} window={window} />
    </MarketDataClientProvider>,
  );
}

const seriesFor = (symbol: string): Series => ({
  symbol,
  points: [
    { t: '2024-06-03T14:00:00.000Z', close: 100 },
    { t: '2024-06-03T15:00:00.000Z', close: 110 },
  ],
});

describe('SelectedCompanyPanel', () => {
  it('shows a loading state, then the price chart and period summary for the symbol', async () => {
    renderPanel(mock(), 'NVDA');

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: 'Price history for NVDA' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /NVDA price/ })).toBeInTheDocument();
    expect(screen.getByText(/Latest/)).toHaveTextContent(/over this period/);
  });

  it('shows a clear no-data message for a symbol the data source does not know', async () => {
    renderPanel(mock(), 'ZZZZ');

    expect(await screen.findByText(/No market data found for ZZZZ/)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument(); // a no-data case, not a failure
  });

  it('shows a no-data message when a known symbol has no price history', async () => {
    renderPanel(mock(), 'NODATA');

    expect(await screen.findByText(/No price data is available for NODATA/)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('treats a series with a single point as no data (nothing to draw)', async () => {
    const client: MarketDataClient = {
      getQuotes: async () => [],
      getHistory: async () => [{ symbol: 'ONE', points: [{ t: '2024-06-03T15:00:00.000Z', close: 5 }] }],
    };
    renderPanel(client, 'ONE');

    expect(await screen.findByText(/No price data is available for ONE/)).toBeInTheDocument();
  });

  it('never plots another company when the response lacks the requested symbol', async () => {
    const client: MarketDataClient = {
      getQuotes: async () => [],
      getHistory: async () => [seriesFor('IBM')], // asked for NVDA, got IBM
    };
    renderPanel(client, 'NVDA');

    expect(await screen.findByText(/No price data is available for NVDA/)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText(/IBM/)).not.toBeInTheDocument();
  });

  it('shows an error with Retry for service failures, and recovers', async () => {
    let attempt = 0;
    const client: MarketDataClient = {
      getQuotes: async () => [],
      getHistory: async (symbols) => {
        if (++attempt === 1) throw new MarketDataError('UPSTREAM_ERROR', 'Yahoo is down');
        return symbols.map(seriesFor);
      },
    };
    renderPanel(client, 'NVDA');

    expect(await screen.findByRole('alert')).toHaveTextContent('Yahoo is down');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('img', { name: 'Price history for NVDA' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('requests only the selected symbol and the active window', async () => {
    const getHistory = vi.fn(async (symbols: string[]) => symbols.map(seriesFor));
    renderPanel({ getQuotes: async () => [], getHistory }, 'NVDA', 'quarter');

    await waitFor(() => expect(getHistory).toHaveBeenCalled());
    expect(getHistory).toHaveBeenCalledWith(['NVDA'], 'quarter', expect.any(AbortSignal));
  });
});
