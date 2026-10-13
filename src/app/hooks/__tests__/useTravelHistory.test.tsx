import { act, renderHook } from '@testing-library/react';
import { StrictMode, type ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTravelHistory } from '../useTravelHistory';
import { STORAGE_KEY } from '../../../services/historyStorage';
import type { TravelRecord } from '../../../domain/history';

const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>;
const record: TravelRecord = { id: 'old-history', kind: 'foreign', status: 'completed',
  start_date: '2016-01-01', end_date: '2016-12-31', note: 'Reusable history' };

beforeEach(() => localStorage.clear());

describe('persistent travel state in StrictMode', () => {
  it('retains exact records across year changes and entry views', () => {
    const { result } = renderHook(useTravelHistory, { wrapper });
    act(() => result.current.saveRecord(record));
    act(() => result.current.setYear(2027));
    act(() => result.current.setEntryView('us'));
    act(() => result.current.setEntryView('foreign'));
    expect(result.current.history.records).toEqual([record]);
  });
  it('restores saved records after unmount/reload and supports correction, deletion and undo', () => {
    const first = renderHook(useTravelHistory, { wrapper });
    act(() => first.result.current.saveRecord(record));
    first.unmount();
    const next = renderHook(useTravelHistory, { wrapper });
    expect(next.result.current.history.records).toEqual([record]);
    act(() => next.result.current.saveRecord({ ...record, end_date: '2016-11-30' }));
    expect(next.result.current.history.records[0].end_date).toBe('2016-11-30');
    act(() => next.result.current.deleteRecord(record.id));
    expect(next.result.current.history.records).toEqual([]);
    act(() => next.result.current.undo());
    expect(next.result.current.history.records[0].end_date).toBe('2016-11-30');
  });
  it('does not overwrite corrupt saved data before an explicit reset/replace action', () => {
    localStorage.setItem(STORAGE_KEY, 'unreadable');
    const { result } = renderHook(useTravelHistory, { wrapper });
    act(() => result.current.saveRecord(record));
    expect(localStorage.getItem(STORAGE_KEY)).toBe('unreadable');
    expect(result.current.recoveryData).toBe('unreadable');
    act(() => result.current.reset());
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).records).toEqual([]);
  });
  it('validates imports before changing state and does not overwrite on merge', () => {
    const { result } = renderHook(useTravelHistory, { wrapper });
    act(() => result.current.saveRecord(record));
    expect(() => result.current.importHistory({ schema_version: 1, records: [{ ...record, kind: 'us' }] }, 'merge'))
      .toThrow('different contents');
    expect(result.current.history.records).toEqual([record]);
  });
});
