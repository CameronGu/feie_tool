import { describe, expect, it } from 'vitest';
import { calculateFeie } from '../calculator';

describe('calculateFeie', () => {
  it('returns error for invalid date', () => {
    const result = calculateFeie({
      tax_year_start: '2024-01-01',
      tax_year_end: 'invalid-date',
      mode: 'US_PERIODS',
      us_periods: []
    } as any);
    expect(result.qualified).toBe(false);
    expect(result.error?.code).toBe('DATE_FORMAT_ERROR');
  });

  it('qualifies when foreign periods exceed threshold', () => {
    const result = calculateFeie({
      tax_year_start: '2024-01-01',
      tax_year_end: '2024-12-31',
      mode: 'FOREIGN_PERIODS',
      foreign_periods: [
        { start_date: '2024-01-01', end_date: '2024-11-30' }
      ]
    });
    expect(result.qualified).toBe(true);
    expect(result.best_windows?.length).toBeGreaterThan(0);
  });

  it('reports remaining days when not qualified', () => {
    const result = calculateFeie({
      tax_year_start: '2024-01-01',
      tax_year_end: '2024-12-31',
      mode: 'FOREIGN_PERIODS',
      foreign_periods: [
        { start_date: '2024-01-01', end_date: '2024-02-01' }
      ],
      planning_mode: true
    });
    expect(result.qualified).toBe(false);
    expect(result.planning_info?.us_days_remaining).toBeGreaterThan(0);
    expect(result.planning_info?.optimal_starts).toBeInstanceOf(Array);
  });
});
