import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardPage } from './DashboardPage';
import { MarketDataError, type MarketDataClient } from '../services';
import { MarketDataClientProvider } from '../services/MarketDataClientProvider';
import { MockMarketDataClient } from '../services/mockMarketDataClient';

function renderWith(client: MarketDataClient) {
  return render(
    <MarketDataClientProvider client={client}>
      <DashboardPage />
    </MarketDataClientProvider>,
  );
}

describe('DashboardPage', () => {
  it('renders a quote card per company and the comparison chart with ranking', async () => {
    renderWith(new MockMarketDataClient(() => new Date('2024-06-03T15:00:00Z'), 0));

    for (const symbol of ['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM']) {
      expect(await screen.findByLabelText(`${symbol} quote`)).toBeInTheDocument();
    }
    expect(await screen.findByRole('img', { name: /Relative performance/ })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('switches time window via the tabs', async () => {
    const user = userEvent.setup();
    renderWith(new MockMarketDataClient(undefined, 0));

    await screen.findByRole('img', { name: /Relative performance/ });
    await user.click(screen.getByRole('tab', { name: 'Last quarter' }));

    expect(screen.getByRole('tab', { name: 'Last quarter' })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByRole('region', { name: /Last quarter/ })).toBeInTheDocument();
  });

  it('shows an error with retry when the service fails', async () => {
    const failing: MarketDataClient = {
      getQuotes: () => Promise.reject(new MarketDataError('UPSTREAM_ERROR', 'boom')),
      getHistory: () => Promise.reject(new MarketDataError('UPSTREAM_ERROR', 'boom')),
    };
    renderWith(failing);

    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(2));
    expect(screen.getAllByRole('button', { name: 'Retry' })).toHaveLength(2);
  });
});
