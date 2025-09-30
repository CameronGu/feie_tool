import { describe, expect, it } from 'vitest';
import { evaluateFeie, summarizePlanning } from '../feie';
import type { NormalizedInput } from '../types';

const baseInput: NormalizedInput = {
  taxYearStart: '2024-01-01',
  taxYearEnd: '2024-12-31',
  taxYearDays: 366,
  foreignPeriods: [
    { start_date: '2024-01-01', end_date: '2024-11-30' }
  ],
  usPeriods: [
    { start_date: '2024-12-01', end_date: '2024-12-31' }
  ]
};

describe('evaluateFeie', () => {
  it('identifies qualifying windows', () => {
    const result = evaluateFeie(baseInput);
    expect(result.qualified).toBe(true);
    expect(result.bestWindows.length).toBeGreaterThan(0);
    expect(result.bestWindows[0].foreign_days).toBeGreaterThanOrEqual(330);
  });
});

describe('summarizePlanning', () => {
  it('computes remaining days when not qualified', () => {
    const input: NormalizedInput = {
      ...baseInput,
      foreignPeriods: [
        { start_date: '2024-01-01', end_date: '2024-05-01' }
      ],
      usPeriods: [
        { start_date: '2024-05-02', end_date: '2025-12-31' }
      ]
    };
    const planning = summarizePlanning(input);
    expect(planning.remaining).toBeGreaterThan(0);
    expect(Array.isArray(planning.optimalStarts)).toBe(true);
  });
});
