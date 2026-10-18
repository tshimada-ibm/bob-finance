import { buildComparisonRows, percentChange } from './metrics';

describe('percentChange', () => {
  it('computes first-to-last change', () => {
    expect(percentChange([{ t: 'a', close: 100 }, { t: 'b', close: 110 }])).toBeCloseTo(10);
  });

  it('returns 0 for fewer than two points', () => {
    expect(percentChange([])).toBe(0);
    expect(percentChange([{ t: 'a', close: 100 }])).toBe(0);
  });
});

describe('buildComparisonRows', () => {
  it('rebases each series to 100 and merges rows by timestamp in ascending order', () => {
    const rows = buildComparisonRows([
      { symbol: 'AAA', points: [{ t: '2024-01-02T00:00:00Z', close: 20 }, { t: '2024-01-01T00:00:00Z', close: 10 }] },
      { symbol: 'BBB', points: [{ t: '2024-01-01T00:00:00Z', close: 50 }, { t: '2024-01-02T00:00:00Z', close: 25 }] },
    ]);
    // AAA's first listed point (20) is the base, so the later-sorted row is rebased against it.
    expect(rows.map((r) => r.t)).toEqual(['2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z']);
    expect(rows[1].BBB).toBe(50);
    expect(rows[0].BBB).toBe(100);
  });

  it('skips empty series', () => {
    expect(buildComparisonRows([{ symbol: 'AAA', points: [] }])).toEqual([]);
  });
});
