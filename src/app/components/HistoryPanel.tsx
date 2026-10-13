import { useRef, useState, type ChangeEvent } from 'react';
import { parseHistory, serializeHistory, type TravelHistory, type TravelRecord } from '../../domain/history';
import { KIND_LABELS } from '../../services/report';

export function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

interface Props {
  history: TravelHistory;
  recoveryData?: string;
  canUndo: boolean;
  onEdit(record: TravelRecord): void;
  onDelete(id: string): void;
  onUndo(): void;
  onImport(history: TravelHistory, strategy: 'merge' | 'replace'): void;
  onReset(): void;
}

export function HistoryPanel({ history, recoveryData, canUndo, onEdit, onDelete, onUndo, onImport, onReset }: Props) {
  const [pending, setPending] = useState<TravelHistory | null>(null);
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);
  const [resetConfirmed, setResetConfirmed] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(''); setPending(null); setReplaceConfirmed(false);
    try {
      if (file.size > 2_000_000) throw new Error('Backup is too large (maximum 2 MB).');
      setPending(parseHistory(await file.text()));
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not read this file.'); }
    event.target.value = '';
  }
  function importPending(strategy: 'merge' | 'replace') {
    if (!pending || (strategy === 'replace' && !replaceConfirmed)) return;
    try {
      onImport(pending, strategy); setPending(null); setError(''); setMessage('Backup imported. Review the updated travel history.');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not import this backup.'); }
  }
  return (
    <section className="panel history-panel" aria-labelledby="history-heading">
      <div className="section-heading"><div><h2 id="history-heading">Your travel history</h2>
        <p className="help">{history.records.length} {history.records.length === 1 ? 'record' : 'records'} across all years. Stored locally when browser storage is available; export a backup to move devices.</p></div>
        <button className="secondary" onClick={onUndo} disabled={!canUndo}>Undo last history change</button></div>
      {history.records.length ? <div className="table-scroll" tabIndex={0} role="region" aria-label="Travel history table">
        <table><caption className="sr-only">Recorded and proposed travel across all years</caption><thead><tr>
          <th scope="col">Dates (inclusive)</th><th scope="col">Type / status</th><th scope="col">Country / note</th><th scope="col">Actions</th>
        </tr></thead><tbody>{history.records.map(record => <tr key={record.id}>
          <td data-label="Dates">{record.start_date}<br />{' '}{record.ongoing ? '· Ongoing' : `to ${record.end_date}`}</td>
          <td data-label="Type / status">{KIND_LABELS[record.kind]}<br /><span className="badge">{record.kind === 'foreign_assumption' && record.status === 'completed' ? 'Assumed baseline' : record.status}</span></td>
          <td data-label="Note" className={record.note ? undefined : 'empty-note'}>{record.note || 'No note'}</td>
          <td data-label="Actions"><div className="actions"><button className="secondary" aria-label={`Edit ${KIND_LABELS[record.kind]} ${record.start_date}`} onClick={() => onEdit(record)}>Edit</button>
            <button className="secondary" aria-label={`Delete ${KIND_LABELS[record.kind]} ${record.start_date}`} onClick={() => { onDelete(record.id); setMessage('Record deleted. Use Undo last history change to restore it.'); }}>Delete</button></div></td>
        </tr>)}</tbody></table></div> : <p>No travel saved yet. Add full foreign days, or declare a bounded foreign range and record its exceptions.</p>}
      <div className="actions backup-actions">
        <button className="secondary" onClick={() => downloadText(serializeHistory(history), 'feie-travel-history-v1.json')}>Export JSON backup</button>
        <button className="secondary" onClick={() => fileRef.current?.click()}>Import JSON backup</button>
        <input ref={fileRef} className="sr-only" tabIndex={-1} type="file" accept=".json,application/json" aria-label="Choose travel-history backup" onChange={readFile} />
        {recoveryData !== undefined && <button className="secondary" onClick={() => downloadText(recoveryData, 'feie-unreadable-history.txt')}>Download unreadable saved data</button>}
      </div>
      {pending && <div className="notice" aria-label="Review backup import">
        <h3>Review import: {pending.records.length} records</h3>
        <p>{pending.records.length ? `${pending.records[0].start_date} through ${pending.records.some(record => record.ongoing) ? 'ongoing presence' : [...pending.records].sort((a, b) => b.end_date.localeCompare(a.end_date))[0].end_date}.` : 'Empty backup.'}
          {' '}{pending.records.filter(record => record.status === 'proposed').length} proposed; {pending.records.filter(record => record.kind === 'foreign_assumption').length} foreign baselines.</p>
        <ul className="import-preview">{pending.records.map(record => <li key={record.id}>{record.start_date} to {record.ongoing ? 'ongoing' : record.end_date} · {KIND_LABELS[record.kind]} · {record.status}{record.note ? ` · ${record.note}` : ''}</li>)}</ul>
        <p>Merge keeps existing records and rejects conflicts. Replacement discards the current history; export a backup first.</p>
        <label className="check-row"><input type="checkbox" checked={replaceConfirmed} onChange={event => setReplaceConfirmed(event.target.checked)} />
          Replace all {history.records.length} existing records with this backup.</label>
        <div className="actions"><button onClick={() => importPending('merge')}>Merge imported records</button>
          <button className="secondary" disabled={!replaceConfirmed} onClick={() => importPending('replace')}>Replace history with backup</button>
          <button className="secondary" onClick={() => setPending(null)}>Cancel import</button></div>
      </div>}
      <details><summary>Reset saved history</summary>
        <p>Remove all records from this browser. Export a backup before resetting. You can undo the reset during this session.</p>
        <label className="check-row"><input type="checkbox" checked={resetConfirmed} onChange={event => setResetConfirmed(event.target.checked)} />I want to remove all saved travel records.</label>
        <button className="danger" disabled={!resetConfirmed} onClick={() => { onReset(); setResetConfirmed(false); setMessage('Travel history reset.'); }}>Reset saved history</button>
      </details>
      {error && <p role="alert" className="error">{error}</p>}
      <p role="status" className="feedback">{message}</p>
    </section>
  );
}
