import { describe, expect, it } from 'vitest';
import { assessTravel } from '../travelCalculator';
import { EMPTY_HISTORY, type TravelHistory, type RecordKind, type RecordStatus } from '../../domain/history';

function history(kind: RecordKind, status: RecordStatus = 'completed', end = '2025-12-31'): TravelHistory {
  return { schema_version: 1, records: [{ id: 'r1', kind, status, start_date: '2023-01-01', end_date: end, note: '' }] };
}

describe('evidence-aware physical-presence assessment', () => {
  it('reports empty data as incomplete rather than qualified', () => {
    expect(assessTravel(EMPTY_HISTORY, 2024, '2026-10-12').status).toBe('incomplete');
  });
  it('distinguishes recorded presence from explicit assumptions', () => {
    expect(assessTravel(history('foreign'), 2024, '2026-10-12').status).toBe('met');
    const assumed = assessTravel(history('foreign_assumption'), 2024, '2026-10-12');
    expect(assumed.status).toBe('conditional');
    expect(assumed.assumedForeignDays).toBeGreaterThan(330);
  });
  it('compares a proposal while leaving confirmed history unchanged', () => {
    const proposed = history('foreign', 'proposed');
    expect(assessTravel(proposed, 2024, '2026-10-12').status).toBe('incomplete');
    expect(assessTravel(proposed, 2024, '2026-10-12', true).status).toBe('projected');
    expect(proposed.records[0].status).toBe('proposed');
  });
  it('marks future foreign days as projected even if mistakenly recorded as completed', () => {
    const future = history('foreign');
    future.records[0].start_date = '2024-01-01';
    expect(assessTravel(future, 2024, '2024-06-01').calculation.qualified).toBe(false);
    expect(assessTravel(future, 2024, '2024-06-01', true).status).toBe('projected');
  });
  it('can establish an unsuccessful result when the full candidate horizon is known nonqualifying', () => {
    const result = assessTravel(history('us'), 2024, '2026-10-12');
    expect(result.status).toBe('not-met');
    expect(result.calculation.maxForeignDays).toBe(0);
  });
  it('takes calculation foreign days from exactly the normalized reportable segments', () => {
    const result = assessTravel(history('foreign_assumption'), 2024, '2026-10-12');
    expect(result.normalized.input.foreignPeriods).toEqual(result.normalized.segments.filter(segment => segment.kind === 'foreign')
      .map(({ start_date, end_date }) => ({ start_date, end_date })));
  });
});

it('C01: proves failure despite one unresolved date, using candidate upper bounds', () => {
  const data: TravelHistory = { schema_version: 1, records: [
    { id: 'a', kind: 'us', status: 'completed', start_date: '2023-01-02', end_date: '2024-01-01', note: '' },
    { id: 'b', kind: 'us', status: 'completed', start_date: '2024-01-03', end_date: '2025-12-30', note: '' }
  ] };
  const result = assessTravel(data, 2024, '2026-10-13');
  expect(result.status).toBe('not-met');
  expect(result.calculation.maxForeignDays).toBe(0);
  expect(result.maxPossibleForeignDays).toBe(1);
});

it('C01: excludes future dates from the completed upper bound but allows them in comparison', () => {
  const data: TravelHistory = { schema_version: 1, records: [
    { id: 'us-before', kind: 'us', status: 'completed', start_date: '2024-01-02', end_date: '2024-12-31', note: '' },
    { id: 'foreign', kind: 'foreign', status: 'completed', start_date: '2025-01-01', end_date: '2025-11-25', note: '' },
    { id: 'us-after', kind: 'us', status: 'completed', start_date: '2025-11-26', end_date: '2026-10-12', note: '' }
  ] };
  const result = assessTravel(data, 2025, '2026-10-13');
  expect(result.calculation.maxForeignDays).toBe(329);
  expect(result.maxPossibleForeignDays).toBe(329);
  expect(result.status).toBe('not-met');
  expect(assessTravel(data, 2025, '2026-10-13', true).maxPossibleForeignDays).toBeGreaterThanOrEqual(329);
});

it('keeps failure inconclusive when unresolved elapsed days could reach 330', () => {
  const data: TravelHistory = { schema_version: 1, records: [{ id: 'f', kind: 'foreign', status: 'completed',
    start_date: '2025-01-01', end_date: '2025-11-25', note: '' }] };
  const result = assessTravel(data, 2025, '2026-10-13');
  expect(result.status).toBe('incomplete');
  expect(result.maxPossibleForeignDays).toBeGreaterThanOrEqual(330);
});
