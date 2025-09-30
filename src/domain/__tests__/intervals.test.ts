import { describe, expect, it } from 'vitest';
import { normalizeIntervals, invertPeriods } from '../intervals';

const bounds = { min: '2023-01-01', max: '2025-12-31' } as const;

describe('normalizeIntervals', () => {
  it('sorts and validates intervals', () => {
    const normalized = normalizeIntervals(
      [
        { start_date: '2024-03-10', end_date: '2024-03-20' },
        { start_date: '2024-01-01', end_date: '2024-01-05' }
      ],
      { fieldName: 'test', bounds }
    );
    expect(normalized).toEqual([
      { start_date: '2024-01-01', end_date: '2024-01-05' },
      { start_date: '2024-03-10', end_date: '2024-03-20' }
    ]);
  });

  it('throws on overlap', () => {
    try {
      normalizeIntervals(
        [
          { start_date: '2024-01-01', end_date: '2024-01-10' },
          { start_date: '2024-01-05', end_date: '2024-01-12' }
        ],
        { fieldName: 'overlap', bounds }
      );
      throw new Error('expected to throw');
    } catch (error) {
      expect((error as any).code).toBe('INTERVAL_OVERLAP');
    }
  });
});

describe('invertPeriods', () => {
  it('inverts to complementary intervals', () => {
    const inverted = invertPeriods(
      [
        { start_date: '2024-03-01', end_date: '2024-03-10' },
        { start_date: '2024-05-01', end_date: '2024-05-05' }
      ],
      bounds.min,
      bounds.max
    );
    expect(inverted[0]).toEqual({ start_date: '2023-01-01', end_date: '2024-02-29' });
    expect(inverted[inverted.length - 1]).toEqual({ start_date: '2024-05-06', end_date: '2025-12-31' });
  });
});
