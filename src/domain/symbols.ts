/**
 * Ticker-symbol format rules, shared by the browser (instant feedback) and the server (authoritative check).
 * Allows index tickers (^GSPC), class shares (BRK-B), exchange suffixes (SAP.DE) and FX/futures (EURUSD=X).
 */
export const SYMBOL_PATTERN = /^\^?[A-Z0-9][A-Z0-9.=-]{0,14}$/;

export type SymbolCheck = { ok: true; symbol: string } | { ok: false; message: string };

/** Trims and upper-cases a single ticker typed by a user. Does not validate. */
export function normalizeSymbol(raw: string): string {
  return raw.trim().toUpperCase();
}

/** Validates one user-entered ticker and returns the normalized symbol or a user-facing message. */
export function checkSymbol(raw: string): SymbolCheck {
  const symbol = normalizeSymbol(raw);
  if (symbol === '') return { ok: false, message: 'Enter a ticker symbol, for example NVDA.' };
  if (!SYMBOL_PATTERN.test(symbol)) {
    return { ok: false, message: `"${symbol}" is not a valid ticker symbol. Use letters and numbers, for example NVDA.` };
  }
  return { ok: true, symbol };
}
