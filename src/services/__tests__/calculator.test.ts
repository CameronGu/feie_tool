import { describe, expect, it } from 'vitest';
import { calculateFeie } from '../calculator';

describe('calculateFeie', () => {
  it('uses a 365-day denominator for the ordinary 2025 calendar year', () => {
    const result = calculateFeie({ tax_year_start: '2025-01-01', tax_year_end: '2025-12-31', mode: 'FOREIGN_PERIODS',
      foreign_periods: [{ start_date: '2025-01-01', end_date: '2025-11-30' }] });
    expect(result.total_tax_year_days).toBe(365);
    expect(result.qualifying_days).toBe(365);
    expect(result.coverage_fraction).toBe(1);
    expect(result.closest_window?.foreign_days).toBe(334);
  });
  it('requires explicit foreign coverage in U.S. mode, including an empty visits list', () => {
    const result = calculateFeie({ tax_year_start: '2024-01-01', tax_year_end: '2024-12-31',
      mode: 'US_PERIODS', us_periods: [] });
    expect(result.qualified).toBe(false);
    expect(result.error?.code).toBe('MISSING_COVERAGE');
  });

  it('uses only the declared foreign coverage and subtracts U.S. exceptions', () => {
    const result = calculateFeie({ tax_year_start: '2024-01-01', tax_year_end: '2024-12-31',
      mode: 'US_PERIODS', foreign_coverage: { start_date: '2024-01-01', end_date: '2024-12-31' },
      us_periods: [{ start_date: '2024-06-01', end_date: '2024-07-31' }] });
    expect(result.qualified).toBe(false);
    expect(result.closest_window?.foreign_days).toBe(305);
  });

  it('accepts reusable history beyond the selected calculation horizon', () => {
    const result = calculateFeie({ tax_year_start: '2024-01-01', tax_year_end: '2024-12-31',
      mode: 'FOREIGN_PERIODS', foreign_periods: [
        { start_date: '2016-01-01', end_date: '2016-12-31' },
        { start_date: '2024-01-01', end_date: '2024-12-31' }
      ] });
    expect(result.error).toBeUndefined();
    expect(result.qualifying_days).toBe(366);
  });

  it('rejects partial-year bounds instead of treating them as an annual denominator', () => {
    const result = calculateFeie({ tax_year_start: '2024-07-01', tax_year_end: '2024-12-31',
      mode: 'FOREIGN_PERIODS', foreign_periods: [] });
    expect(result.error?.code).toBe('UNSUPPORTED_TAX_YEAR');
  });

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
