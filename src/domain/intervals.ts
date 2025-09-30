import { addDays, assertIsoDate, compareDate, diffDaysInclusive } from './dates';
import { createError } from './errors';
import type { DateISO, Interval } from './types';

export interface NormalizeOptions {
  fieldName: string;
  bounds?: {
    min: DateISO;
    max: DateISO;
  };
}

export function normalizeIntervals(
  intervals: Interval[] | undefined,
  { fieldName, bounds }: NormalizeOptions
): Interval[] {
  if (!intervals || intervals.length === 0) {
    return [];
  }

  const sanitized = intervals.map((interval, index) => {
    if (!interval) {
      throw createError('INVALID_INTERVAL_BOUNDS', `Interval at index ${index} is missing`, {
        field: fieldName,
        index
      });
    }

    const { start_date, end_date } = interval;
    assertIsoDate(start_date, `${fieldName}[${index}].start_date`);
    assertIsoDate(end_date, `${fieldName}[${index}].end_date`);

    if (compareDate(start_date, end_date) > 0) {
      throw createError('INVALID_INTERVAL_BOUNDS', 'Interval start must be on or before end date.', {
        field: fieldName,
        index,
        interval
      });
    }

    if (bounds) {
      if (compareDate(start_date, bounds.min) < 0 || compareDate(end_date, bounds.max) > 0) {
        throw createError('INTERVAL_OUT_OF_RANGE', 'Interval lies outside allowed bounds.', {
          field: fieldName,
          index,
          interval,
          bounds
        });
      }
    }

    return {
      start_date,
      end_date
    } satisfies Interval;
  });

  sanitized.sort((a, b) => {
    const startCompare = compareDate(a.start_date, b.start_date);
    if (startCompare !== 0) {
      return startCompare;
    }
    return compareDate(a.end_date, b.end_date);
  });

  const result: Interval[] = [];
  for (const current of sanitized) {
    const last = result[result.length - 1];
    if (!last) {
      result.push(current);
      continue;
    }

    const duplicateStart = compareDate(last.start_date, current.start_date) === 0;
    const duplicateEnd = compareDate(last.end_date, current.end_date) === 0;
    if (duplicateStart && duplicateEnd) {
      throw createError('INTERVAL_DUPLICATE', 'Duplicate interval detected.', {
        field: fieldName,
        interval: current
      });
    }

    if (compareDate(current.start_date, addDays(last.end_date, 0)) <= 0) {
      throw createError('INTERVAL_OVERLAP', 'Intervals must be non-overlapping and strictly ordered.', {
        field: fieldName,
        last,
        current
      });
    }

    result.push(current);
  }

  return result;
}

export function mergeIntervals(intervals: Interval[]): Interval[] {
  if (intervals.length <= 1) {
    return intervals;
  }

  const merged: Interval[] = [];
  for (const interval of intervals) {
    const last = merged[merged.length - 1];
    if (!last) {
      merged.push(interval);
      continue;
    }

    if (compareDate(addDays(last.end_date, 1), interval.start_date) >= 0) {
      merged[merged.length - 1] = {
        start_date: last.start_date,
        end_date: compareDate(last.end_date, interval.end_date) >= 0 ? last.end_date : interval.end_date
      };
    } else {
      merged.push(interval);
    }
  }
  return merged;
}

export function invertPeriods(
  foreignPeriods: Interval[],
  coverageStart: DateISO,
  coverageEnd: DateISO
): Interval[] {
  if (foreignPeriods.length === 0) {
    return [{ start_date: coverageStart, end_date: coverageEnd }];
  }

  const normalized = mergeIntervals(foreignPeriods);
  const inverted: Interval[] = [];
  let cursor = coverageStart;

  for (const foreign of normalized) {
    if (compareDate(cursor, foreign.start_date) < 0) {
      inverted.push({
        start_date: cursor,
        end_date: addDays(foreign.start_date, -1)
      });
    }
    cursor = addDays(foreign.end_date, 1);
  }

  if (compareDate(cursor, coverageEnd) <= 0) {
    inverted.push({
      start_date: cursor,
      end_date: coverageEnd
    });
  }

  return inverted.filter(interval => diffDaysInclusive(interval.start_date, interval.end_date) > 0);
}
