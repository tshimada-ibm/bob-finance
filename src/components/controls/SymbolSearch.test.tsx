import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SymbolSearch } from './SymbolSearch';

describe('SymbolSearch', () => {
  it('submits a normalized ticker on button click', async () => {
    const onSelect = vi.fn();
    render(<SymbolSearch onSelect={onSelect} />);

    await userEvent.type(screen.getByLabelText('Look up another company'), '  nvda ');
    await userEvent.click(screen.getByRole('button', { name: 'Show chart' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('NVDA');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('submits on Enter', async () => {
    const onSelect = vi.fn();
    render(<SymbolSearch onSelect={onSelect} />);

    await userEvent.type(screen.getByLabelText('Look up another company'), 'aapl{Enter}');

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('AAPL');
  });

  it('asks for input when empty, without calling onSelect', async () => {
    const onSelect = vi.fn();
    render(<SymbolSearch onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'Show chart' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a ticker symbol');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('rejects a malformed ticker with a message and marks the field invalid', async () => {
    const onSelect = vi.fn();
    render(<SymbolSearch onSelect={onSelect} />);
    const input = screen.getByLabelText('Look up another company');

    await userEvent.type(input, 'IBM;DROP{Enter}');

    expect(screen.getByRole('alert')).toHaveTextContent('"IBM;DROP" is not a valid ticker symbol');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('clears the error after a valid submission', async () => {
    render(<SymbolSearch onSelect={() => {}} />);
    const input = screen.getByLabelText('Look up another company');

    await userEvent.type(input, '!!{Enter}');
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, 'msft{Enter}');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows Clear only when a company is selected, and resets the field', async () => {
    const onClear = vi.fn();
    const { rerender } = render(<SymbolSearch onSelect={() => {}} onClear={onClear} />);
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();

    rerender(<SymbolSearch onSelect={() => {}} onClear={onClear} selected="NVDA" />);
    const input = screen.getByLabelText('Look up another company');
    await userEvent.type(input, 'nvda');
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('');
  });
});
