import { isIsoDate } from '../../domain/dates';
import type { DateISO, Interval } from '../../domain/types';

export interface PeriodLike {
  start_date: string;
  end_date: string;
}

export function sanitizePeriodRows<T extends PeriodLike>(rows: T[]): Interval[] {
  return rows
    .filter(row =>
      row.start_date.length > 0 &&
      row.end_date.length > 0 &&
      isIsoDate(row.start_date) &&
      isIsoDate(row.end_date)
    )
    .map(row => ({
      start_date: row.start_date as DateISO,
      end_date: row.end_date as DateISO
    }));
}
