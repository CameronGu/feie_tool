import { describe, expect, it } from 'vitest';
import { EMPTY_HISTORY, fullDaysBetween, mergeHistory, normalizeHistory, parseHistory, serializeHistory, validateHistory,
  type RecordKind, type TravelHistory, type TravelRecord } from '../history';

function record(kind: RecordKind, start_date: string, end_date = start_date, id = 'r1'): TravelRecord {
  return { id, kind, start_date, end_date, status: 'completed', note: '' };
}
const history = (...records: TravelRecord[]): TravelHistory => ({ schema_version: 1, records });

describe('travel history normalization', () => {
  it('leaves every unrecorded date unknown', () => {
    const normalized = normalizeHistory(EMPTY_HISTORY, 2024, '2026-10-12', false);
    expect(normalized.input.foreignPeriods).toEqual([]);
    expect(normalized.segments).toHaveLength(1);
    expect(normalized.segments[0]).toMatchObject({ kind: 'unknown', basis: 'unrecorded' });
  });

  it('subtracts U.S., transit/territory and unknown exceptions from a bounded foreign declaration', () => {
    const data = history(record('foreign_assumption', '2024-01-01', '2024-12-31'),
      record('us', '2024-02-01', '2024-02-05', 'us'),
      record('nonqualifying', '2024-02-06', '2024-02-06', 'flight'),
      record('unknown', '2024-02-07', '2024-02-07', 'unknown'));
    const normalized = normalizeHistory(data, 2024, '2026-10-12', false);
    expect(normalized.input.foreignPeriods).toEqual([
      { start_date: '2024-01-01', end_date: '2024-01-31' },
      { start_date: '2024-02-08', end_date: '2024-12-31' }
    ]);
    expect(normalized.segments.find(segment => segment.start_date === '2024-02-06')?.kind).toBe('nonqualifying');
    expect(normalized.segments[0].kind).toBe('unknown');
  });

  it('never changes source records when changing the evaluation year', () => {
    const data = history(record('foreign', '2016-01-01', '2016-12-31'));
    const original = serializeHistory(data);
    normalizeHistory(data, 2024, '2026-10-12', false);
    normalizeHistory(data, 2027, '2026-10-12', true);
    expect(serializeHistory(data)).toBe(original);
  });

  it('preserves completed history while applying a separate proposed exception', () => {
    const data = history(record('foreign', '2024-01-01', '2024-12-31'),
      { ...record('us', '2024-05-01', '2024-05-05', 'proposal'), status: 'proposed' });
    const original = serializeHistory(data);
    expect(normalizeHistory(data, 2024, '2026-10-12', false).input.foreignPeriods).toHaveLength(1);
    const scenario = normalizeHistory(data, 2024, '2026-10-12', true);
    expect(scenario.input.foreignPeriods).toHaveLength(2);
    expect(scenario.segments.find(segment => segment.start_date === '2024-05-01')).toMatchObject({ kind: 'us', projected: true });
    expect(serializeHistory(data)).toBe(original);
  });

  it('does not treat today or future dates as completed full days even if a record says completed', () => {
    const data = history(record('foreign', '2024-01-01', '2024-12-31'));
    expect(normalizeHistory(data, 2024, '2024-06-01', false).input.foreignPeriods)
      .toEqual([{ start_date: '2024-01-01', end_date: '2024-05-31' }]);
    expect(normalizeHistory(data, 2024, '2024-06-01', true).segments
      .find(segment => segment.start_date === '2024-06-01')).toMatchObject({ kind: 'foreign', projected: true });
  });

  it('handles first/last full days without counting partial arrival/departure endpoints', () => {
    expect(fullDaysBetween('2024-06-11', '2024-06-15'))
      .toEqual({ start_date: '2024-06-12', end_date: '2024-06-14' });
    expect(() => fullDaysBetween('2024-06-11', '2024-06-12')).toThrow('no full foreign days');
  });
});

describe('backup integrity', () => {
  it('round trips a versioned history with notes, assumptions, exceptions and proposals', () => {
    const data = history({ ...record('foreign_assumption', '2023-01-01', '2025-12-31'), note: 'Declared range' },
      { ...record('nonqualifying', '2024-04-01', '2024-04-02', 'flight'), status: 'proposed' });
    expect(parseHistory(serializeHistory(data))).toEqual(data);
  });

  it.each([
    'invalid', '{}', '{"schema_version":2,"records":[]}',
    JSON.stringify(history(record('foreign', '2024-02-30'))),
    JSON.stringify(history(record('foreign', '2024-04-02', '2024-04-01'))),
    JSON.stringify(history(record('foreign', '2024-04-01'), record('us', '2024-04-01', '2024-04-01', 'r2'))),
    JSON.stringify(history(record('foreign', '2024-04-01'), record('us', '2024-04-03')))
  ])('rejects malformed/incompatible/conflicting data without mutating anything (%s)', text => {
    expect(() => parseHistory(text)).toThrow();
    expect(EMPTY_HISTORY.records).toEqual([]);
  });

  it('deduplicates identical imported ids and rejects conflicting ids or overlaps', () => {
    const original = history(record('foreign', '2024-01-01', '2024-05-31'));
    expect(mergeHistory(original, original)).toEqual(original);
    expect(() => mergeHistory(original, history(record('us', '2024-01-01')))).toThrow('different contents');
    expect(() => mergeHistory(original, history(record('us', '2024-02-01', '2024-02-02', 'new')))).toThrow('Overlapping');
    expect(mergeHistory(original, history(record('us', '2024-06-01', '2024-06-02', 'new'))).records).toHaveLength(2);
    expect(original.records).toHaveLength(1);
  });

  it('rejects oversized backups and notes and strips unknown properties', () => {
    expect(() => parseHistory(' '.repeat(2_000_001))).toThrow('too large');
    expect(() => validateHistory(history({ ...record('unknown', '2024-01-01'), note: 'a'.repeat(501) }))).toThrow();
    expect(validateHistory({ schema_version: 1, records: [{ ...record('unknown', '2024-01-01'), extra: 'discard' }] }).records[0])
      .not.toHaveProperty('extra');
  });
  it('never accepts an in-memory history too large to export and restore, including UTF-8 notes', () => {
    const records = Array.from({ length: 1500 }, (_, index) => {
      const date = new Date(Date.UTC(2000, 0, index + 1)).toISOString().slice(0, 10);
      return { ...record('unknown', date, date, `r-${index}`), note: '界'.repeat(500) };
    });
    expect(() => validateHistory(history(...records))).toThrow('2 MB backup limit');
    const small = history(...records.slice(0, 20));
    expect(parseHistory(serializeHistory(small))).toEqual(small);
  });
});
