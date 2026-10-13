import { EMPTY_HISTORY, parseHistory, serializeHistory, type TravelHistory } from '../domain/history';

export const STORAGE_KEY = 'feie.travel-history.v1';
export interface HistoryStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
export interface LoadedHistory { history: TravelHistory; error?: string; unreadable?: string }

export function loadHistory(storage: HistoryStorage): LoadedHistory {
  let raw: string | null;
  try { raw = storage.getItem(STORAGE_KEY); }
  catch { return { history: EMPTY_HISTORY, error: 'Browser storage is unavailable. Keep a JSON backup before leaving this page.' }; }
  if (raw === null) return { history: EMPTY_HISTORY };
  try { return { history: parseHistory(raw) }; }
  catch (error) {
    return { history: EMPTY_HISTORY, unreadable: raw,
      error: `Saved history could not be restored and has not been overwritten. ${error instanceof Error ? error.message : 'Invalid saved data.'}` };
  }
}

export function saveHistory(storage: HistoryStorage, history: TravelHistory): string | undefined {
  try { storage.setItem(STORAGE_KEY, serializeHistory(history)); }
  catch { return 'Changes could not be saved in this browser. Export a JSON backup before leaving this page.'; }
  return undefined;
}
