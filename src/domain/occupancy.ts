import { addDays, buildIndexer, compareDate, diffDaysInclusive, fromEpoch, toEpoch } from './dates';
import type { DateISO, Interval } from './types';

export interface OccupancyInfo {
  origin: DateISO;
  end: DateISO;
  days: Uint8Array;
  prefix: Uint16Array;
  indexOf(date: DateISO): number;
  dateAt(index: number): DateISO;
}

export function buildForeignOccupancy(
  foreignPeriods: Interval[],
  coverageStart: DateISO,
  coverageEnd: DateISO
): OccupancyInfo {
  const totalDays = diffDaysInclusive(coverageStart, coverageEnd);
  const days = new Uint8Array(totalDays);
  const prefix = new Uint16Array(totalDays);
  const indexOf = buildIndexer(coverageStart);

  for (const interval of foreignPeriods) {
    const clampedStart = compareDate(interval.start_date, coverageStart) < 0 ? coverageStart : interval.start_date;
    const clampedEnd = compareDate(interval.end_date, coverageEnd) > 0 ? coverageEnd : interval.end_date;
    let startIndex = indexOf(clampedStart);
    let endIndex = indexOf(clampedEnd);

    if (startIndex < 0) {
      startIndex = 0;
    }
    if (endIndex >= totalDays) {
      endIndex = totalDays - 1;
    }

    for (let i = startIndex; i <= endIndex; i += 1) {
      days[i] = 1;
    }
  }

  let running = 0;
  for (let i = 0; i < totalDays; i += 1) {
    running += days[i];
    prefix[i] = running;
  }

  return {
    origin: coverageStart,
    end: coverageEnd,
    days,
    prefix,
    indexOf,
    dateAt(index: number) {
      return addDays(coverageStart, index);
    }
  };
}

export function rangeSum(prefix: Uint16Array, startIndex: number, endIndex: number): number {
  if (startIndex === 0) {
    return prefix[endIndex];
  }
  return prefix[endIndex] - prefix[startIndex - 1];
}
