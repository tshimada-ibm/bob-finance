import { useState, type FormEvent } from 'react';
import { checkSymbol } from '../../domain/symbols';

interface SymbolSearchProps {
  /** Called with a normalized, format-valid ticker. */
  onSelect: (symbol: string) => void;
  onClear?: () => void;
  /** The currently shown ticker, if any (enables the Clear button). */
  selected?: string;
}

/** Ticker input with instant format validation. Network checks happen later, in the chart panel. */
export function SymbolSearch({ onSelect, onClear, selected }: SymbolSearchProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string>();

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = checkSymbol(value);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(undefined);
    setValue(result.symbol);
    onSelect(result.symbol);
  }

  function clear() {
    setValue('');
    setError(undefined);
    onClear?.();
  }

  return (
    <form className="card symbol-search" onSubmit={submit} noValidate>
      <label htmlFor="symbol-input">Look up another company</label>
      <div className="symbol-search__row">
        <input
          id="symbol-input"
          type="text"
          value={value}
          placeholder="Ticker, e.g. NVDA"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'symbol-error' : undefined}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="submit">Show chart</button>
        {selected && onClear && (
          <button type="button" onClick={clear}>
            Clear
          </button>
        )}
      </div>
      {error && (
        <p id="symbol-error" className="field-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
