// @vitest-environment node
import { normalizeQuote, normalizeSeries } from './normalize';

describe('normalizeQuote', () => {
  it('maps Yahoo fields to the Quote shape and rounds numbers', () => {
    const quote = normalizeQuote({
      symbol: 'ibm',
      shortName: 'International Business Machines',
      currency: 'USD',
      regularMarketPrice: 232.14159,
      regularMarketChange: -1.98321,
      regularMarketChangePercent: -0.845718,
      regularMarketTime: new Date('2026-10-16T20:00:02Z'),
    });
    expect(quote).toEqual({
      symbol: 'IBM',
      name: 'International Business Machines',
      price: 232.14,
      change: -1.98,
      changePct: -0.85,
      currency: 'USD',
      asOf: '2026-10-16T20:00:02.000Z',
    });
  });

  it('falls back to defaults for missing optional fields', () => {
    const quote = normalizeQuote({ symbol: 'SAP', regularMarketPrice: 100 });
    expect(quote).toMatchObject({ name: 'SAP', change: 0, changePct: 0, currency: 'USD' });
  });

  it('rejects a quote without a price', () => {
    expect(() => normalizeQuote({ symbol: 'IBM' })).toThrowError(/No price/);
  });
});

describe('normalizeSeries', () => {
  it('drops null bars, sorts ascending, and de-duplicates timestamps', () => {
    const series = normalizeSeries('ibm', [
      { date: new Date('2024-06-03T15:00:00Z'), close: 12.345 },
      { date: new Date('2024-06-03T14:00:00Z'), close: null },
      { date: new Date('2024-06-03T13:00:00Z'), close: 10 },
      { date: new Date('2024-06-03T15:00:00Z'), close: 12.5 },
      { date: new Date('invalid'), close: 5 },
      { date: new Date('2024-06-03T16:00:00Z'), close: Number.NaN },
    ]);
    expect(series).toEqual({
      symbol: 'IBM',
      points: [
        { t: '2024-06-03T13:00:00.000Z', close: 10 },
        { t: '2024-06-03T15:00:00.000Z', close: 12.5 },
      ],
    });
  });

  it('keeps only the most recent trading session in the exchange time zone', () => {
    const series = normalizeSeries(
      'IBM',
      [
        { date: new Date('2024-06-06T14:00:00Z'), close: 1 }, // Thu 10:00 New York
        { date: new Date('2024-06-07T13:35:00Z'), close: 2 }, // Fri 09:35 New York
        { date: new Date('2024-06-07T19:55:00Z'), close: 3 }, // Fri 15:55 New York
      ],
      { timeZone: 'America/New_York', lastSessionOnly: true },
    );
    expect(series.points.map((p) => p.close)).toEqual([2, 3]);
  });

  it('uses the exchange time zone, not UTC, to split sessions', () => {
    // 02:00 UTC on Saturday is still Friday evening in New York (after-hours bar of Friday's session).
    const series = normalizeSeries(
      'IBM',
      [
        { date: new Date('2024-06-07T18:00:00Z'), close: 1 },
        { date: new Date('2024-06-08T02:00:00Z'), close: 2 },
      ],
      { timeZone: 'America/New_York', lastSessionOnly: true },
    );
    expect(series.points).toHaveLength(2);
  });

  it('returns an empty series when there are no usable bars', () => {
    expect(normalizeSeries('IBM', [{ date: new Date('2024-06-03T15:00:00Z'), close: null }])).toEqual({
      symbol: 'IBM',
      points: [],
    });
  });
});
