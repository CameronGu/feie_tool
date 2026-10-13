import { addDays, calendarWindowEnd, diffDaysInclusive, maxDate, minDate, shiftYears } from './dates';
import { mergeIntervals } from './intervals';
import { buildForeignOccupancy, rangeSum } from './occupancy';
import type { Interval, LeapDayReview, NormalizedInput, QualifiedWindow } from './types';

export const REQUIRED_FOREIGN_DAYS = 330;

export function computeCoverageBounds(taxYearStart: string, taxYearEnd: string) {
  return {
    coverageStart: addDays(shiftYears(taxYearStart, -1), 1),
    coverageEnd: calendarWindowEnd(taxYearEnd)
  };
}

function overlap(start: string, end: string, input: NormalizedInput): Interval | null {
  const start_date = maxDate(start, input.taxYearStart);
  const end_date = minDate(end, input.taxYearEnd);
  return start_date <= end_date ? { start_date, end_date } : null;
}

/** Exhaustive ordinary-date periods. Ambiguous leap-day starts are evaluated separately. */
export function enumerateWindows(input: NormalizedInput, leapStartsOnly = false): QualifiedWindow[] {
  const { coverageStart, coverageEnd } = computeCoverageBounds(input.taxYearStart, input.taxYearEnd);
  const occupancy = buildForeignOccupancy(input.foreignPeriods, coverageStart, coverageEnd);
  const windows: QualifiedWindow[] = [];
  for (let start = coverageStart; start <= input.taxYearEnd; start = addDays(start, 1)) {
    if (start.endsWith('-02-29') !== leapStartsOnly) continue;
    const end = calendarWindowEnd(start, leapStartsOnly ? 'long' : 'short');
    const intersection = overlap(start, end, input);
    if (!intersection) continue;
    const overlapDays = diffDaysInclusive(intersection.start_date, intersection.end_date);
    windows.push({
      window_start: start,
      window_end: end,
      foreign_days: rangeSum(occupancy.prefix, occupancy.indexOf(start), occupancy.indexOf(end)),
      overlap_days: overlapDays,
      pro_rata_fraction: overlapDays / diffDaysInclusive(input.taxYearStart, input.taxYearEnd)
    });
  }
  return windows;
}

function coverageOf(windows: QualifiedWindow[], input: NormalizedInput): Interval[] {
  const intersections = windows.map(window => overlap(window.window_start, window.window_end, input))
    .filter((value): value is Interval => value !== null)
    .sort((a, b) => a.start_date.localeCompare(b.start_date) || a.end_date.localeCompare(b.end_date));
  return mergeIntervals(intersections);
}

function countCoverage(coverage: Interval[]): number {
  return coverage.reduce((total, interval) => total + diffDaysInclusive(interval.start_date, interval.end_date), 0);
}

/** Minimum interval cover: farthest end covering the first still-uncovered day. */
function supportingPeriods(windows: QualifiedWindow[], coverage: Interval[]): QualifiedWindow[] {
  const selected: QualifiedWindow[] = [];
  for (const segment of coverage) {
    let cursor = segment.start_date;
    while (cursor <= segment.end_date) {
      let best: QualifiedWindow | undefined;
      for (const window of windows) {
        if (window.window_start > cursor || window.window_end < cursor) continue;
        if (!best || window.window_end > best.window_end ||
          (window.window_end === best.window_end && window.window_start < best.window_start)) best = window;
      }
      if (!best) throw new Error('Qualifying coverage has no supporting period.');
      selected.push(best);
      cursor = addDays(best.window_end, 1);
    }
  }
  return selected;
}

export interface FeieComputationResult {
  qualified: boolean;
  /** Transitional single-period view; reports must use supportingWindows and qualifyingDays. */
  bestWindows: QualifiedWindow[];
  supportingWindows: QualifiedWindow[];
  qualifyingCoverage: Interval[];
  qualifyingDays: number;
  coverageFraction: number;
  qualifyingWindowCount: number;
  totalTaxYearDays: number;
  maxForeignDays: number;
  closestWindow: QualifiedWindow;
  leapDayReview?: LeapDayReview;
}

export function evaluateFeie(input: NormalizedInput): FeieComputationResult {
  const windows = enumerateWindows(input);
  const qualifying = windows.filter(window => window.foreign_days >= REQUIRED_FOREIGN_DAYS);
  const coverage = coverageOf(qualifying, input);
  const qualifyingDays = countCoverage(coverage);
  const totalTaxYearDays = diffDaysInclusive(input.taxYearStart, input.taxYearEnd);
  const ranked = [...windows].sort((a, b) => b.foreign_days - a.foreign_days ||
    b.overlap_days - a.overlap_days || a.window_start.localeCompare(b.window_start));
  const maxOverlap = qualifying.reduce((max, window) => Math.max(max, window.overlap_days), 0);
  const leapQualifying = enumerateWindows(input, true).filter(window => window.foreign_days >= REQUIRED_FOREIGN_DAYS);
  const alternativeCoverage = coverageOf([...qualifying, ...leapQualifying], input);
  const alternativeDays = countCoverage(alternativeCoverage);
  return {
    qualified: qualifyingDays > 0,
    bestWindows: qualifying.filter(window => window.overlap_days === maxOverlap),
    supportingWindows: supportingPeriods(qualifying, coverage),
    qualifyingCoverage: coverage,
    qualifyingDays,
    coverageFraction: qualifyingDays / totalTaxYearDays,
    qualifyingWindowCount: qualifying.length,
    totalTaxYearDays,
    maxForeignDays: ranked[0].foreign_days,
    closestWindow: ranked[0],
    leapDayReview: alternativeDays > qualifyingDays ? {
      alternative_coverage_days: alternativeDays,
      alternative_coverage: alternativeCoverage,
      additional_windows: leapQualifying
    } : undefined
  };
}

export function summarizePlanning(input: NormalizedInput): { remaining: number; optimalStarts: string[] } {
  const windows = enumerateWindows(input);
  const maxForeign = windows.reduce((max, window) => Math.max(max, window.foreign_days), 0);
  return {
    remaining: Math.max(0, REQUIRED_FOREIGN_DAYS - maxForeign),
    optimalStarts: windows.filter(window => window.foreign_days === maxForeign).map(window => window.window_start)
  };
}
