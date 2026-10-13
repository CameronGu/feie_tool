import { addDays, diffDaysInclusive, enumerateDays, isIsoDate } from './dates';
import { computeCoverageBounds } from './feie';
import type { Interval, NormalizedInput } from './types';

export const HISTORY_VERSION = 1;
export const MAX_RECORDS = 5000;
export const RECORD_KINDS = ['foreign', 'foreign_assumption', 'us', 'nonqualifying', 'unknown'] as const;
export type RecordKind = typeof RECORD_KINDS[number];
export type RecordStatus = 'completed' | 'proposed';

export interface TravelRecord extends Interval {
  id: string;
  kind: RecordKind;
  status: RecordStatus;
  note: string;
}

export interface TravelHistory {
  schema_version: typeof HISTORY_VERSION;
  records: TravelRecord[];
}

export interface PresenceSegment extends Interval {
  kind: 'foreign' | 'us' | 'nonqualifying' | 'unknown';
  basis: 'recorded' | 'assumed' | 'unrecorded';
  projected: boolean;
  record_ids: string[];
}

export interface NormalizedHistory {
  input: NormalizedInput;
  segments: PresenceSegment[];
  horizon: Interval;
  as_of: string;
  includes_proposals: boolean;
  records: TravelRecord[];
}

export const EMPTY_HISTORY: TravelHistory = { schema_version: HISTORY_VERSION, records: [] };

export function validateHistory(value: unknown): TravelHistory {
  if (!value || typeof value !== 'object' || !('schema_version' in value) || value.schema_version !== HISTORY_VERSION) {
    throw new Error('Unsupported backup version. Expected FEIE travel history version 1.');
  }
  if (!('records' in value) || !Array.isArray(value.records) || value.records.length > MAX_RECORDS) {
    throw new Error(`A backup must contain an array of at most ${MAX_RECORDS} travel records.`);
  }
  const ids = new Set<string>();
  const records: TravelRecord[] = value.records.map((row: unknown, index: number) => {
    if (!row || typeof row !== 'object') throw new Error(`Record ${index + 1} is invalid.`);
    const record = row as Record<string, unknown>;
    if (typeof record.id !== 'string' || !record.id || record.id.length > 100 || ids.has(record.id)) {
      throw new Error(`Record ${index + 1} has an invalid or repeated identifier.`);
    }
    ids.add(record.id);
    if (typeof record.start_date !== 'string' || typeof record.end_date !== 'string' ||
      !isIsoDate(record.start_date) || !isIsoDate(record.end_date) || record.start_date > record.end_date ||
      record.start_date < '1900-01-01' || record.end_date > '2100-12-31') {
      throw new Error(`Record ${index + 1} needs ordered calendar dates between 1900 and 2100.`);
    }
    if (!RECORD_KINDS.includes(record.kind as RecordKind) ||
      (record.status !== 'completed' && record.status !== 'proposed') ||
      typeof record.note !== 'string' || record.note.length > 500) {
      throw new Error(`Record ${index + 1} has an invalid type, status or note (maximum 500 characters).`);
    }
    return { id: record.id, start_date: record.start_date, end_date: record.end_date,
      kind: record.kind as RecordKind, status: record.status, note: record.note };
  });
  records.sort((a, b) => a.start_date.localeCompare(b.start_date) || a.end_date.localeCompare(b.end_date) || a.id.localeCompare(b.id));
  // Declarations supply a baseline; explicit records override it. Proposals form a separate scenario layer.
  for (const status of ['completed', 'proposed'] as const) {
    for (const assumed of [false, true]) {
      const layer = records.filter(record => record.status === status && (record.kind === 'foreign_assumption') === assumed);
      for (let index = 1; index < layer.length; index += 1) {
        if (layer[index].start_date <= layer[index - 1].end_date) {
          throw new Error(`Overlapping ${status} ${assumed ? 'foreign declarations' : 'travel records'}: ${layer[index - 1].start_date}–${layer[index - 1].end_date} and ${layer[index].start_date}–${layer[index].end_date}. Edit or split the ranges first.`);
        }
      }
    }
  }
  return { schema_version: HISTORY_VERSION, records };
}

export function parseHistory(text: string): TravelHistory {
  if (text.length > 2_000_000) throw new Error('Backup is too large (maximum 2 MB).');
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Error('This file is not valid JSON. Choose an FEIE travel-history backup.'); }
  return validateHistory(value);
}

export function serializeHistory(history: TravelHistory): string {
  return JSON.stringify(validateHistory(history), null, 2);
}

export function mergeHistory(current: TravelHistory, imported: TravelHistory): TravelHistory {
  const existing = new Map(current.records.map(record => [record.id, record]));
  for (const record of imported.records) {
    const previous = existing.get(record.id);
    if (previous && JSON.stringify(previous) !== JSON.stringify(record)) {
      throw new Error('A record identifier has different contents in this backup. Review it or explicitly replace the history.');
    }
    existing.set(record.id, record);
  }
  return validateHistory({ schema_version: HISTORY_VERSION, records: [...existing.values()] });
}

export function normalizeHistory(history: TravelHistory, taxYear: number, asOf: string, includeProposals: boolean): NormalizedHistory {
  if (!Number.isInteger(taxYear) || taxYear < 1901 || taxYear > 2099 || !isIsoDate(asOf)) {
    throw new Error('Choose a calendar year between 1901 and 2099 and a valid calculation date.');
  }
  const validated = validateHistory(history);
  const taxYearStart = `${taxYear}-01-01`;
  const taxYearEnd = `${taxYear}-12-31`;
  const { coverageStart, coverageEnd } = computeCoverageBounds(taxYearStart, taxYearEnd);
  const records = validated.records.filter(record => (includeProposals || record.status === 'completed') &&
    record.end_date >= coverageStart && record.start_date <= coverageEnd);
  const segments: PresenceSegment[] = [];
  const priority = (record: TravelRecord) => (record.status === 'proposed' ? 2 : 0) + (record.kind === 'foreign_assumption' ? 0 : 1);
  for (const day of enumerateDays(coverageStart, coverageEnd)) {
    const matches = records.filter(record => record.start_date <= day && record.end_date >= day && (includeProposals || day < asOf));
    matches.sort((a, b) => priority(b) - priority(a));
    const record = matches[0];
    const segment: PresenceSegment = {
      start_date: day, end_date: day,
      kind: record?.kind === 'foreign_assumption' ? 'foreign' : record?.kind ?? 'unknown',
      basis: !record ? 'unrecorded' : record.kind === 'foreign_assumption' ? 'assumed' : 'recorded',
      projected: Boolean(record && (record.status === 'proposed' || day >= asOf)),
      record_ids: record ? [record.id] : []
    };
    const last = segments.at(-1);
    if (last && last.kind === segment.kind && last.basis === segment.basis && last.projected === segment.projected &&
      last.record_ids.join() === segment.record_ids.join()) last.end_date = day;
    else segments.push(segment);
  }
  const foreignPeriods = segments.filter(segment => segment.kind === 'foreign').map(({ start_date, end_date }) => ({ start_date, end_date }));
  return {
    input: { taxYearStart, taxYearEnd, taxYearDays: diffDaysInclusive(taxYearStart, taxYearEnd), foreignPeriods, usPeriods: [] },
    segments,
    horizon: { start_date: coverageStart, end_date: coverageEnd },
    as_of: asOf,
    includes_proposals: includeProposals,
    records
  };
}

export function segmentDaysWithin(segment: PresenceSegment, interval: Interval): number {
  const start = segment.start_date > interval.start_date ? segment.start_date : interval.start_date;
  const end = segment.end_date < interval.end_date ? segment.end_date : interval.end_date;
  return start <= end ? diffDaysInclusive(start, end) : 0;
}

export function recordFromDates(kind: RecordKind, start_date: string, end_date: string, status: RecordStatus = 'completed', note = ''): TravelRecord {
  return { id: crypto.randomUUID(), kind, start_date, end_date, status, note };
}

/** Exclude flight endpoints for ordinary arrival/departure travel; users may enter full days directly. */
export function fullDaysBetween(arrival: string, departure: string): Interval {
  if (!isIsoDate(arrival) || !isIsoDate(departure) || addDays(arrival, 1) > addDays(departure, -1)) {
    throw new Error('This stay contains no full foreign days between arrival and departure.');
  }
  return { start_date: addDays(arrival, 1), end_date: addDays(departure, -1) };
}
