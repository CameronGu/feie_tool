import { useEffect, useMemo, useState } from 'react';
import { EMPTY_HISTORY, mergeHistory, validateHistory, type TravelHistory, type TravelRecord } from '../../domain/history';
import { loadHistory, saveHistory } from '../../services/historyStorage';
import { assessTravel } from '../../services/travelCalculator';
import { deviceCutoff, manualCutoff } from '../../services/completedDayCutoff';

export type EntryView = 'foreign' | 'us';
const browserStorage = {
  getItem: (key: string) => window.localStorage.getItem(key),
  setItem: (key: string, value: string) => window.localStorage.setItem(key, value)
};

export function useTravelHistory() {
  const [loaded] = useState(() => loadHistory(browserStorage));
  const [history, setHistory] = useState(loaded.history);
  const [previous, setPrevious] = useState<TravelHistory | null>(null);
  const [recoveryData, setRecoveryData] = useState(loaded.unreadable);
  const [storageMessage, setStorageMessage] = useState(loaded.error);
  const [year, setYear] = useState(() => new Date().getUTCFullYear() - 1);
  const [entryView, setEntryView] = useState<EntryView>('foreign');
  const [includeProposals, setIncludeProposals] = useState(false);
  const [cutoff, setCutoff] = useState<ReturnType<typeof deviceCutoff> | ReturnType<typeof manualCutoff>>(() => deviceCutoff());
  const asOf = cutoff.asOf;

  useEffect(() => {
    if (recoveryData !== undefined) return;
    setStorageMessage(saveHistory(browserStorage, history));
  }, [history, recoveryData]);

  const baseline = useMemo(() => assessTravel(history, year, asOf), [history, year, asOf]);
  const scenario = useMemo(() => includeProposals ? assessTravel(history, year, asOf, true) : null,
    [history, year, asOf, includeProposals]);

  function commit(next: TravelHistory, replaceUnreadable = false) {
    const validated = validateHistory(next);
    setPrevious(history);
    setHistory(validated);
    if (replaceUnreadable) setRecoveryData(undefined);
  }

  return {
    history, year, setYear, entryView, setEntryView, includeProposals, setIncludeProposals, asOf, cutoff,
    setLastCompletedDay(date: string) { setCutoff(manualCutoff(date)); },
    resetCutoff() { const next = deviceCutoff(); setCutoff(next); return next.lastCompletedDay; },
    baseline, scenario, assessment: scenario ?? baseline, storageMessage, recoveryData,
    canUndo: previous !== null,
    saveRecord(record: TravelRecord) {
      const found = history.records.some(row => row.id === record.id);
      commit({ schema_version: 1, records: found ? history.records.map(row => row.id === record.id ? record : row) : [...history.records, record] });
    },
    deleteRecord(id: string) { commit({ schema_version: 1, records: history.records.filter(record => record.id !== id) }); },
    importHistory(imported: TravelHistory, strategy: 'merge' | 'replace') {
      commit(strategy === 'merge' ? mergeHistory(history, imported) : imported, strategy === 'replace');
    },
    reset() { commit(EMPTY_HISTORY, true); },
    undo() {
      if (previous) { setHistory(previous); setPrevious(null); }
    }
  };
}
