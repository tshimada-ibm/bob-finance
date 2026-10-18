import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Company, Quote, Series } from '../../types/market';
import { QuoteCard } from '../cards/QuoteCard';
import { RankingTable } from '../tables/RankingTable';
import { ChartCard } from './ChartCard';

describe('ChartCard', () => {
  it('renders its children when idle', () => {
    render(
      <ChartCard title="Performance" subtitle="Rolling 3-month trend">
        <p>chart goes here</p>
      </ChartCard>,
    );
    expect(screen.getByRole('region', { name: 'Performance' })).toBeInTheDocument();
    expect(screen.getByText('Rolling 3-month trend')).toBeInTheDocument();
    expect(screen.getByText('chart goes here')).toBeInTheDocument();
  });

  it('shows a loading state instead of the children', () => {
    render(
      <ChartCard title="Performance" loading>
        <p>chart goes here</p>
      </ChartCard>,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('chart goes here')).not.toBeInTheDocument();
  });

  it('shows an empty state', () => {
    render(
      <ChartCard title="Performance" empty>
        <p>chart goes here</p>
      </ChartCard>,
    );
    expect(screen.getByText('No data available.')).toBeInTheDocument();
    expect(screen.queryByText('chart goes here')).not.toBeInTheDocument();
  });

  it('shows the error with a working retry, and the error wins over loading', async () => {
    const onRetry = vi.fn();
    render(
      <ChartCard title="Performance" loading error={new Error('Upstream down')} onRetry={onRetry}>
        <p>chart goes here</p>
      </ChartCard>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Upstream down');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('QuoteCard', () => {
  const base: Quote = {
    symbol: 'IBM',
    name: 'International Business Machines',
    price: 232.14,
    change: -1.98,
    changePct: -0.85,
    currency: 'USD',
    asOf: '2024-06-07T20:00:00.000Z',
  };

  it('shows price and a negative change without a plus sign', () => {
    render(<QuoteCard quote={base} />);
    expect(screen.getByText('$232.14')).toBeInTheDocument();
    const change = screen.getByText(/-1\.98/);
    expect(change).toHaveTextContent('-1.98 (-0.85%)');
    expect(change).toHaveClass('quote-card__change--down');
  });

  it('shows a positive change with a plus sign', () => {
    render(<QuoteCard quote={{ ...base, change: 2.5, changePct: 1.1 }} />);
    const change = screen.getByText(/2\.50/);
    expect(change).toHaveTextContent('+2.50 (+1.10%)');
    expect(change).toHaveClass('quote-card__change--up');
  });
});

describe('RankingTable', () => {
  const companies: Company[] = [
    { symbol: 'AAA', name: 'Alpha', color: '#000' },
    { symbol: 'BBB', name: 'Beta', color: '#111' },
    { symbol: 'CCC', name: 'Gamma', color: '#222' },
  ];
  const series: Series[] = [
    { symbol: 'AAA', points: [{ t: '1', close: 100 }, { t: '2', close: 90 }] }, // -10%
    { symbol: 'BBB', points: [{ t: '1', close: 100 }, { t: '2', close: 125 }] }, // +25%
    { symbol: 'CCC', points: [{ t: '1', close: 100 }, { t: '2', close: 102 }] }, // +2%
  ];

  it('ranks companies from best to worst performer with signed percentages', () => {
    render(<RankingTable series={series} companies={companies} />);

    const rows = screen.getAllByRole('row').slice(1); // drop header row
    expect(rows.map((r) => r.textContent)).toEqual(['1BBB Beta+25.00%', '2CCC Gamma+2.00%', '3AAA Alpha-10.00%']);
  });
});
