import { describe, expect, it } from 'vitest';
import { enumerateWindows, evaluateFeie, summarizePlanning } from '../feie';
import { addDays, calendarWindowEnd, diffDaysInclusive, enumerateDays } from '../dates';
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
  it.each([329, 330])('counts exactly %i inclusive full foreign days', days => {
    const result = evaluateFeie({ ...baseInput, foreignPeriods: [{
      start_date: '2024-01-01', end_date: addDays('2024-01-01', days - 1)
    }] });
    expect(result.maxForeignDays).toBe(days);
    expect(result.qualified).toBe(days >= 330);
  });

  it('uses multiple periods when no single period can cover the year', () => {
    const input = { ...baseInput, foreignPeriods: [
      { start_date: '2023-01-01', end_date: '2024-05-31' },
      { start_date: '2024-08-01', end_date: '2025-12-31' }
    ] };
    const result = evaluateFeie(input);
    expect(result.bestWindows.every(window => window.overlap_days < 366)).toBe(true);
    expect(result.supportingWindows).toHaveLength(2);
    expect(result.qualifyingCoverage).toEqual([{ start_date: '2024-01-01', end_date: '2024-12-31' }]);
    expect(result.qualifyingDays).toBe(366);
    expect(result.coverageFraction).toBe(1);
    const covered = new Set(result.supportingWindows.flatMap(window =>
      enumerateDays(window.window_start, window.window_end).filter(day => day.startsWith('2024-'))));
    expect(covered.size).toBe(result.qualifyingDays);
    expect(evaluateFeie(input).supportingWindows).toEqual(result.supportingWindows);
  });

  it('keeps disjoint coverage segments separate and never counts a gap', () => {
    const result = evaluateFeie({ ...baseInput, foreignPeriods: [
      { start_date: '2023-01-01', end_date: '2024-03-31' },
      { start_date: '2024-10-01', end_date: '2025-12-31' }
    ] });
    expect(result.qualifyingCoverage).toHaveLength(2);
    expect(result.qualifyingDays).toBe(result.qualifyingCoverage.reduce((sum, segment) =>
      sum + diffDaysInclusive(segment.start_date, segment.end_date), 0));
    expect(result.qualifyingDays).toBeLessThan(366);
  });

  it('reports leap-day sensitivity rather than turning the longer convention into a proven result', () => {
    const result = evaluateFeie({ ...baseInput, foreignPeriods: [
      { start_date: '2024-02-29', end_date: '2025-01-22' },
      { start_date: '2025-02-28', end_date: '2025-02-28' }
    ] });
    expect(result.qualified).toBe(false);
    expect(result.maxForeignDays).toBe(329);
    expect(result.leapDayReview?.alternative_coverage_days).toBe(307);
    expect(result.leapDayReview?.additional_windows[0]).toMatchObject({
      window_start: '2024-02-29', window_end: '2025-02-28', foreign_days: 330
    });
  });

  it('agrees with an independent daily reference for sparse and dense histories', () => {
    for (const step of [1, 11, 17, 40]) {
      const history = enumerateDays('2023-01-01', '2025-12-31')
        .filter((_, index) => index % step !== 0);
      const fullDays = new Set(history);
      const input = { ...baseInput, foreignPeriods: history.map(day => ({ start_date: day, end_date: day })) };
      const referenceCoverage = new Set<string>();
      let referenceCount = 0;
      for (const start of enumerateDays('2023-01-01', '2024-12-31')) {
        if (start.endsWith('-02-29')) continue;
        const [year, month, day] = start.split('-').map(Number);
        const end = new Date(Date.UTC(year + 1, month - 1, day) - 86400000).toISOString().slice(0, 10);
        if (end < '2024-01-01') continue;
        const days = enumerateDays(start, end);
        if (days.filter(date => fullDays.has(date)).length < 330) continue;
        referenceCount += 1;
        days.filter(date => date.startsWith('2024-')).forEach(date => referenceCoverage.add(date));
      }
      const result = evaluateFeie(input);
      expect(result.qualifyingDays).toBe(referenceCoverage.size);
      expect(result.qualifyingWindowCount).toBe(referenceCount);
    }
  });

  it('includes the earliest period intersecting the selected year', () => {
    const result = evaluateFeie({
      ...baseInput,
      foreignPeriods: [{ start_date: '2023-01-02', end_date: '2023-11-27' }]
    });
    expect(result.qualified).toBe(true);
    expect(result.bestWindows[0]).toMatchObject({
      window_start: '2023-01-02', window_end: '2024-01-01', foreign_days: 330, overlap_days: 1
    });
  });

  it('rejects a passing period that does not intersect the selected year', () => {
    const result = evaluateFeie({
      ...baseInput,
      foreignPeriods: [{ start_date: '2025-02-05', end_date: '2025-12-31' }]
    });
    expect(result.qualified).toBe(false);
    expect(result.bestWindows).toEqual([]);
  });

  it('identifies qualifying windows', () => {
    const result = evaluateFeie(baseInput);
    expect(result.qualified).toBe(true);
    expect(result.bestWindows.length).toBeGreaterThan(0);
    expect(result.bestWindows[0].foreign_days).toBeGreaterThanOrEqual(330);
  });
});

describe('calendar period enumeration', () => {
  it.each([
    ['2023-03-01', '2024-02-29', 366],
    ['2024-03-01', '2025-02-28', 365],
    ['2024-02-28', '2025-02-27', 366],
    ['2024-12-31', '2025-12-30', 365]
  ])('%s ends on %s and contains %i days', (start, end, length) => {
    expect(calendarWindowEnd(start as string)).toBe(end);
    expect(diffDaysInclusive(start as string, end as string)).toBe(length);
  });

  it('makes both unresolved February 29 conventions explicit', () => {
    expect(calendarWindowEnd('2024-02-29', 'short')).toBe('2025-02-27');
    expect(calendarWindowEnd('2024-02-29', 'long')).toBe('2025-02-28');
  });

  it('enumerates every ordinary intersecting start including both extremes', () => {
    const windows = enumerateWindows(baseInput);
    expect(windows[0].window_start).toBe('2023-01-02');
    expect(windows.at(-1)?.window_start).toBe('2024-12-31');
    expect(windows).toHaveLength(729);
    expect(windows.every(window => window.overlap_days > 0)).toBe(true);
    expect(new Set(windows.map(window => window.window_start)).size).toBe(windows.length);
  });

  it('retains exact fractions rather than rounding calculation values', () => {
    const result = evaluateFeie({ ...baseInput, foreignPeriods: [
      { start_date: '2023-01-02', end_date: '2023-11-27' }
    ] });
    expect(result.qualifyingDays).toBe(1);
    expect(result.coverageFraction).toBe(1 / 366);
    expect(result.supportingWindows[0].pro_rata_fraction).toBe(1 / 366);
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
