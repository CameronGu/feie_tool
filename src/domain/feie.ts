import { addDays, compareDate, diffDaysInclusive, maxDate, minDate, shiftYears } from './dates';
import { buildForeignOccupancy, rangeSum } from './occupancy';
import type { NormalizedInput, QualifiedWindow } from './types';

interface WindowComputation {
  windowStart: string;
  windowEnd: string;
  foreignDays: number;
  overlapDays: number;
}

const REQUIRED_FOREIGN_DAYS = 330;

function computeCoverageBounds(taxYearStart: string, taxYearEnd: string) {
  const coverageStart = addDays(shiftYears(taxYearStart, -1), 2);
  const coverageEnd = shiftYears(taxYearEnd, 1);
  return { coverageStart, coverageEnd };
}

function computeOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): number {
  const start = maxDate(aStart, bStart);
  const end = minDate(aEnd, bEnd);
  if (compareDate(start, end) > 0) {
    return 0;
  }
  return diffDaysInclusive(start, end);
}

function enumerateWindows(input: NormalizedInput): WindowComputation[] {
  const { taxYearStart, taxYearEnd, foreignPeriods } = input;
  const { coverageStart, coverageEnd } = computeCoverageBounds(taxYearStart, taxYearEnd);
  const occupancy = buildForeignOccupancy(foreignPeriods, coverageStart, coverageEnd);
  const windows: WindowComputation[] = [];
  const totalDays = occupancy.days.length;

  for (let startIndex = 0; startIndex < totalDays; startIndex += 1) {
    const startDate = occupancy.dateAt(startIndex);
    const windowEndDate = addDays(shiftYears(startDate, 1), -1);

    if (compareDate(windowEndDate, coverageEnd) > 0) {
      break;
    }

    const endIndex = occupancy.indexOf(windowEndDate);
    if (endIndex >= totalDays) {
      break;
    }

    const foreignDays = rangeSum(occupancy.prefix, startIndex, endIndex);
    const overlapDays = computeOverlap(startDate, windowEndDate, taxYearStart, taxYearEnd);

    windows.push({
      windowStart: startDate,
      windowEnd: windowEndDate,
      foreignDays,
      overlapDays
    });
  }

  return windows;
}

export interface FeieComputationResult {
  qualified: boolean;
  bestWindows: QualifiedWindow[];
  totalTaxYearDays: number;
  maxForeignDays: number;
}

export function evaluateFeie(input: NormalizedInput): FeieComputationResult {
  const windows = enumerateWindows(input);
  const taxYearDays = diffDaysInclusive(input.taxYearStart, input.taxYearEnd);

  let qualified = false;
  let maxOverlap = 0;
  let maxForeignDays = 0;
  const best: QualifiedWindow[] = [];

  for (const window of windows) {
    if (window.foreignDays >= REQUIRED_FOREIGN_DAYS) {
      qualified = true;
    }

    if (window.foreignDays > maxForeignDays) {
      maxForeignDays = window.foreignDays;
    }

    if (!qualified || window.foreignDays < REQUIRED_FOREIGN_DAYS) {
      continue;
    }

    if (window.overlapDays > maxOverlap) {
      maxOverlap = window.overlapDays;
      best.length = 0;
    }

    if (window.overlapDays === maxOverlap) {
      best.push({
        window_start: window.windowStart,
        window_end: window.windowEnd,
        foreign_days: window.foreignDays,
        overlap_days: window.overlapDays,
        pro_rata_fraction: Number((window.overlapDays / taxYearDays).toFixed(4))
      });
    }
  }

  best.sort((a, b) => (a.window_start < b.window_start ? -1 : a.window_start > b.window_start ? 1 : 0));

  return {
    qualified,
    bestWindows: best,
    totalTaxYearDays: taxYearDays,
    maxForeignDays
  };
}

export function computePlanningStarts(windows: WindowComputation[]): string[] {
  if (windows.length === 0) {
    return [];
  }
  let maxForeign = 0;
  for (const window of windows) {
    if (window.foreignDays > maxForeign) {
      maxForeign = window.foreignDays;
    }
  }
  const bestStarts = windows
    .filter(window => window.foreignDays === maxForeign)
    .map(window => window.windowStart);
  bestStarts.sort();
  return Array.from(new Set(bestStarts));
}

export function summarizePlanning(input: NormalizedInput): { remaining: number; optimalStarts: string[] } {
  const windows = enumerateWindows(input);
  let maxForeign = 0;
  for (const window of windows) {
    if (window.foreignDays > maxForeign) {
      maxForeign = window.foreignDays;
    }
  }
  const remaining = Math.max(0, REQUIRED_FOREIGN_DAYS - maxForeign);
  const optimalStarts = computePlanningStarts(windows);
  return { remaining, optimalStarts };
}
