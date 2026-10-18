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

  describe('user-selected company graph', () => {
    const ORIGINAL = ['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM'];

    function spyClient() {
      const inner = new MockMarketDataClient(() => new Date('2024-06-03T15:00:00Z'), 0);
      const getHistory = vi.fn(inner.getHistory.bind(inner));
      const getQuotes = vi.fn(inner.getQuotes.bind(inner));
      return { client: { getHistory, getQuotes } satisfies MarketDataClient, getHistory, getQuotes };
    }

    async function lookUp(user: ReturnType<typeof userEvent.setup>, text: string) {
      await user.type(screen.getByLabelText('Look up another company'), `${text}{Enter}`);
    }

    it('shows nothing extra until a company is chosen', async () => {
      renderWith(spyClient().client);
      await screen.findByRole('img', { name: /Relative performance/ });

      expect(screen.getByLabelText('Look up another company')).toBeInTheDocument();
      expect(screen.queryByRole('img', { name: /Price history/ })).not.toBeInTheDocument();
    });

    it('adds a graph for the chosen company and keeps every existing dashboard element', async () => {
      const user = userEvent.setup();
      const { client, getHistory, getQuotes } = spyClient();
      renderWith(client);
      await screen.findByRole('img', { name: /Relative performance/ });

      await lookUp(user, 'nvda');

      expect(await screen.findByRole('img', { name: 'Price history for NVDA' })).toBeInTheDocument();
      // Existing dashboards are all still there...
      for (const symbol of ORIGINAL) expect(screen.getByLabelText(`${symbol} quote`)).toBeInTheDocument();
      expect(screen.getByRole('img', { name: /Relative performance/ })).toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.queryByLabelText('NVDA quote')).not.toBeInTheDocument();
      // ...and the comparison never requested the extra symbol.
      const comparisonCalls = [...getHistory.mock.calls, ...getQuotes.mock.calls].filter(
        ([symbols]) => symbols.length > 1,
      );
      expect(comparisonCalls.length).toBeGreaterThan(0);
      for (const [symbols] of comparisonCalls) expect(symbols).toEqual(ORIGINAL);
    });

    it('shows a no-data message for an unknown symbol and leaves the dashboard working', async () => {
      const user = userEvent.setup();
      renderWith(spyClient().client);
      await screen.findByRole('img', { name: /Relative performance/ });

      await lookUp(user, 'zzzz');

      expect(await screen.findByText(/No market data found for ZZZZ/)).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByRole('img', { name: /Relative performance/ })).toBeInTheDocument();
      for (const symbol of ORIGINAL) expect(screen.getByLabelText(`${symbol} quote`)).toBeInTheDocument();
    });

    it('rejects a malformed ticker in the browser without any extra request', async () => {
      const user = userEvent.setup();
      const { client, getHistory } = spyClient();
      renderWith(client);
      await screen.findByRole('img', { name: /Relative performance/ });
      const callsBefore = getHistory.mock.calls.length;

      await lookUp(user, 'IBM;DROP');

      expect(screen.getByRole('alert')).toHaveTextContent('not a valid ticker symbol');
      expect(getHistory.mock.calls.length).toBe(callsBefore);
    });

    it('follows the time-window tab and replaces (not mixes) data when the company changes', async () => {
      const user = userEvent.setup();
      const { client, getHistory } = spyClient();
      renderWith(client);
      await screen.findByRole('img', { name: /Relative performance/ });

      await lookUp(user, 'nvda');
      await screen.findByRole('img', { name: 'Price history for NVDA' });
      await user.click(screen.getByRole('tab', { name: 'Last quarter' }));
      await waitFor(() => expect(getHistory).toHaveBeenCalledWith(['NVDA'], 'quarter', expect.anything()));

      await user.clear(screen.getByLabelText('Look up another company'));
      await lookUp(user, 'aapl');

      expect(await screen.findByRole('img', { name: 'Price history for AAPL' })).toBeInTheDocument();
      expect(screen.queryByRole('img', { name: 'Price history for NVDA' })).not.toBeInTheDocument();
    });

    it('removes the extra graph on Clear while the dashboard stays', async () => {
      const user = userEvent.setup();
      renderWith(spyClient().client);
      await screen.findByRole('img', { name: /Relative performance/ });
      await lookUp(user, 'nvda');
      await screen.findByRole('img', { name: 'Price history for NVDA' });

      await user.click(screen.getByRole('button', { name: 'Clear' }));

      expect(screen.queryByRole('img', { name: /Price history/ })).not.toBeInTheDocument();
      expect(screen.getByRole('img', { name: /Relative performance/ })).toBeInTheDocument();
    });

    it('a failure in the extra graph does not affect the main dashboard', async () => {
      const user = userEvent.setup();
      const inner = new MockMarketDataClient(() => new Date('2024-06-03T15:00:00Z'), 0);
      const client: MarketDataClient = {
        getQuotes: inner.getQuotes.bind(inner),
        getHistory: (symbols, window, signal) =>
          symbols.length === 1 && symbols[0] === 'NVDA'
            ? Promise.reject(new MarketDataError('UPSTREAM_ERROR', 'Yahoo is down'))
            : inner.getHistory(symbols, window, signal),
      };
      renderWith(client);
      await screen.findByRole('img', { name: /Relative performance/ });

      await lookUp(user, 'nvda');

      expect(await screen.findByRole('alert')).toHaveTextContent('Yahoo is down');
      expect(screen.getAllByRole('alert')).toHaveLength(1);
      expect(screen.getByRole('img', { name: /Relative performance/ })).toBeInTheDocument();
      for (const symbol of ORIGINAL) expect(screen.getByLabelText(`${symbol} quote`)).toBeInTheDocument();
    });
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
