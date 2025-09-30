import { createError } from './errors';
import type { DateISO } from './types';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;

export function isIsoDate(value: string): value is DateISO {
  if (!ISO_DATE_REGEX.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function assertIsoDate(value: string, fieldName: string): asserts value is DateISO {
  if (!isIsoDate(value)) {
    throw createError('DATE_FORMAT_ERROR', `Invalid date format for '${fieldName}'`, { value });
  }
}

export function toEpoch(value: DateISO): number {
  const [year, month, day] = value.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

export function fromEpoch(epochMs: number): DateISO {
  const date = new Date(epochMs);
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function compareDate(a: DateISO, b: DateISO): number {
  return toEpoch(a) - toEpoch(b);
}

export function addDays(date: DateISO, days: number): DateISO {
  return fromEpoch(toEpoch(date) + days * MS_PER_DAY);
}

export function shiftYears(date: DateISO, deltaYears: number): DateISO {
  const [year, month, day] = date.split('-').map(Number);
  const targetYear = year + deltaYears;
  const tentative = new Date(Date.UTC(targetYear, month - 1, day));

  if (tentative.getUTCFullYear() === targetYear && tentative.getUTCMonth() === month - 1) {
    return fromEpoch(tentative.getTime());
  }

  // Clamp to the last valid date of the month (handles Feb 29 -> Feb 28).
  const lastDay = new Date(Date.UTC(targetYear, month, 0));
  return fromEpoch(lastDay.getTime());
}

export function diffDaysInclusive(start: DateISO, end: DateISO): number {
  return Math.floor((toEpoch(end) - toEpoch(start)) / MS_PER_DAY) + 1;
}

export function diffDaysExclusive(start: DateISO, end: DateISO): number {
  return Math.floor((toEpoch(end) - toEpoch(start)) / MS_PER_DAY);
}

export function enumerateDays(start: DateISO, end: DateISO): DateISO[] {
  const total = diffDaysInclusive(start, end);
  const days: DateISO[] = new Array(total);
  let cursor = toEpoch(start);
  for (let i = 0; i < total; i += 1) {
    days[i] = fromEpoch(cursor);
    cursor += MS_PER_DAY;
  }
  return days;
}

export function buildIndexer(origin: DateISO) {
  const originEpoch = toEpoch(origin);
  return (date: DateISO): number => {
    return Math.floor((toEpoch(date) - originEpoch) / MS_PER_DAY);
  };
}

export function minDate(...values: DateISO[]): DateISO {
  return values.reduce((min, current) => (compareDate(current, min) < 0 ? current : min));
}

export function maxDate(...values: DateISO[]): DateISO {
  return values.reduce((max, current) => (compareDate(current, max) > 0 ? current : max));
}
