import { ApiError, TIME_WINDOW_IDS } from './errors';
import type { TimeWindow } from '../../src/types/market';

/** Upper bound per request. IBM + 4 competitors = 5; headroom is left for user-selected symbols. */
export const MAX_SYMBOLS_PER_REQUEST = 10;

const SYMBOL_PATTERN = /^\^?[A-Z0-9][A-Z0-9.=-]{0,14}$/;

/** Parses "ibm, msft" into ["IBM", "MSFT"]: trimmed, upper-cased, de-duplicated, format-checked. */
export function parseSymbols(raw: unknown): string[] {
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new ApiError('BAD_REQUEST', 'Query parameter "symbols" is required, e.g. symbols=IBM,MSFT.');
  }
  const symbols = [...new Set(raw.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean))];
  if (symbols.length === 0) {
    throw new ApiError('BAD_REQUEST', 'Query parameter "symbols" is required, e.g. symbols=IBM,MSFT.');
  }
  if (symbols.length > MAX_SYMBOLS_PER_REQUEST) {
    throw new ApiError('BAD_REQUEST', `At most ${MAX_SYMBOLS_PER_REQUEST} symbols are allowed per request.`);
  }
  const bad = symbols.find((s) => !SYMBOL_PATTERN.test(s));
  if (bad) throw new ApiError('INVALID_SYMBOL', `"${bad}" is not a valid ticker symbol.`);
  return symbols;
}

export function parseWindow(raw: unknown): TimeWindow {
  if (typeof raw === 'string' && (TIME_WINDOW_IDS as readonly string[]).includes(raw)) {
    return raw as TimeWindow;
  }
  throw new ApiError('BAD_REQUEST', `Query parameter "window" must be one of: ${TIME_WINDOW_IDS.join(', ')}.`);
}
