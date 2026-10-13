import { addDays, isIsoDate } from '../domain/dates';

export interface CutoffContext {
  basis: 'device-local' | 'manual' | 'demonstration' | 'provided-date';
  device_time_zone?: string;
}

/** Select the calendar boundary locally; all subsequent date arithmetic stays UTC/date-only. */
export function deviceCutoff(now = new Date(), timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (name: string) => parts.find(value => value.type === name)!.value;
  const asOf = `${part('year')}-${part('month')}-${part('day')}`;
  return { asOf, lastCompletedDay: addDays(asOf, -1), basis: 'device-local' as const, device_time_zone: timeZone };
}

/** A manual travel-calendar adjustment cannot include a day still unfinished everywhere. */
export function latestCompletedDay(now = new Date()): string {
  const latestCalendarDate = new Date(now.getTime() + 14 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return addDays(latestCalendarDate, -1);
}

export function manualCutoff(lastCompletedDay: string, now = new Date()) {
  if (!isIsoDate(lastCompletedDay) || lastCompletedDay < '1900-01-01' || lastCompletedDay > latestCompletedDay(now)) {
    throw new Error('Choose a valid completed calendar day. Future days cannot be marked completed.');
  }
  return { asOf: addDays(lastCompletedDay, 1), lastCompletedDay, basis: 'manual' as const,
    device_time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone };
}
