import { describe, expect, it } from 'vitest';
import { loadHistory, saveHistory, STORAGE_KEY, type HistoryStorage } from '../historyStorage';
import { EMPTY_HISTORY, type TravelHistory } from '../../domain/history';

function storage(initial: string | null = null): HistoryStorage {
  let value = initial;
  return { getItem: () => value, setItem: (_key, next) => { value = next; } };
}

describe('browser history storage', () => {
  it('saves and restores using a stable versioned key', () => {
    const memory = storage();
    const data: TravelHistory = { schema_version: 1, records: [{ id: 'test', kind: 'foreign', status: 'completed',
      start_date: '2024-01-01', end_date: '2024-11-30', note: 'Full foreign days' }] };
    expect(saveHistory(memory, data)).toBeUndefined();
    expect(loadHistory(memory).history).toEqual(data);
    expect(STORAGE_KEY).toBe('feie.travel-history.v1');
  });

  it('preserves unreadable saved data so the UI can recover it before replacement', () => {
    const memory = storage('corrupt saved history');
    expect(loadHistory(memory)).toMatchObject({ history: EMPTY_HISTORY, unreadable: 'corrupt saved history' });
    expect(memory.getItem(STORAGE_KEY)).toBe('corrupt saved history');
  });

  it('reports storage denial/quota failure without claiming changes were saved', () => {
    const denied: HistoryStorage = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('quota'); } };
    expect(loadHistory(denied).error).toContain('unavailable');
    expect(saveHistory(denied, EMPTY_HISTORY)).toContain('could not be saved');
  });
});
