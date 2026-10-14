import { useEffect, useRef, useState, type FormEvent } from 'react';
import { recordFromDates, type RecordKind, type TravelRecord, type RecordStatus } from '../../domain/history';
import { KIND_LABELS } from '../../services/report';
import type { EntryView } from '../hooks/useTravelHistory';

interface Props {
  view: EntryView;
  editing: TravelRecord | null;
  onSave(record: TravelRecord): void;
  onCancel(): void;
}

export function TravelEntry({ view, editing, onSave, onCancel }: Props) {
  const [kind, setKind] = useState<RecordKind>(editing?.kind ?? (view === 'us' ? 'us' : 'foreign'));
  const [start, setStart] = useState(editing?.start_date ?? '');
  const [end, setEnd] = useState(editing?.end_date ?? '');
  const [status, setStatus] = useState<RecordStatus>(editing?.status ?? 'completed');
  const [note, setNote] = useState(editing?.note ?? '');
  const [acknowledged, setAcknowledged] = useState(editing?.kind === 'foreign_assumption');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const errorRef = useRef<HTMLParagraphElement>(null);
  const startRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setKind(view === 'us' ? 'us' : 'foreign');
  }, [view, editing]);
  useEffect(() => { if (editing) startRef.current?.focus(); }, [editing]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      if (kind === 'foreign_assumption' && !acknowledged) throw new Error('Confirm the full foreign-day assumption before saving.');
      onSave({ ...recordFromDates(kind, start, end, status, note), id: editing?.id ?? crypto.randomUUID() });
      if (!editing) { setStart(''); setEnd(''); setNote(''); setAcknowledged(false); }
      setMessage('Travel record saved.');
      startRef.current?.focus();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not save this record.'); requestAnimationFrame(() => errorRef.current?.focus()); }
  }

  const isForeign = kind === 'foreign' || kind === 'foreign_assumption';
  return (
    <form onSubmit={submit} aria-label={editing ? 'Edit travel record' : 'Add travel record'}>
      <h2 className={editing ? undefined : 'sr-only'}>{editing ? 'Edit travel record' : 'Add travel record'}</h2>
      <div className="record-type-row"><label htmlFor="record-kind">Record type</label>
      <select id="record-kind" value={kind} onChange={event => { setKind(event.target.value as RecordKind); setAcknowledged(false); }}>
        {Object.entries(KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></div>
      <div className="date-fields">
        <div><label htmlFor="record-start">{isForeign ? 'First full foreign day' : 'Start date'}</label>
          <input ref={startRef} id="record-start" type="date" required min="1900-01-01" max="2100-12-31" value={start}
            aria-describedby="record-help record-error" aria-invalid={Boolean(error)} onChange={event => { setStart(event.target.value); setMessage(''); }} /></div>
        <div><label htmlFor="record-end">{isForeign ? 'Last full foreign day' : 'End date'}</label>
          <input id="record-end" type="date" required min="1900-01-01" max="2100-12-31" value={end}
            aria-describedby="record-help record-error" aria-invalid={Boolean(error)} onChange={event => { setEnd(event.target.value); setMessage(''); }} /></div>
      </div>
      <p id="record-help" className="help">
        {isForeign ? 'Include the first and last full foreign days. An arrival or departure date may be only a partial day; record travel days separately when they don’t count.' :
          kind === 'us' ? 'Include your U.S. arrival and departure dates. Record additional transit days separately. These visits override your declared default foreign presence.' :
          kind === 'nonqualifying' ? 'Record days that cannot count, such as partial travel days, time in U.S. territories or international waters.' :
          'Record dates you’re unsure about. Unknown days won’t count toward 330 until you account for them.'}
      </p>
      <details><summary>What counts as a full foreign day?</summary>
        <p className="help">Generally, a full day runs from midnight to midnight in a foreign country. The 330 days need not be consecutive. U.S. territories and international waters are not foreign countries for this test.</p>
        <p className="help">Arrival, departure and transit dates need care. Travel between foreign countries can preserve a full day under specific short-transit rules. Check your flight times and the <a href="https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion-physical-presence-test" target="_blank" rel="noreferrer">IRS travel rules</a>; mark unresolved dates as unknown.</p>
      </details>
      <label htmlFor="record-status">Travel status</label>
      <select id="record-status" value={status} onChange={event => setStatus(event.target.value as RecordStatus)}>
        <option value="completed">Completed travel</option><option value="proposed">Proposed travel</option>
      </select>
      <p className="help">Proposed travel is counted only when “Compare proposed and future travel” is on. Dates after the last completed day remain projected, even in a completed record.</p>
      <label htmlFor="record-note">Country or supporting note <span className="optional">(optional)</span></label>
      <input id="record-note" type="text" maxLength={500} value={note} onChange={event => setNote(event.target.value)} />
      {kind === 'foreign_assumption' && <label className="check-row">
        <input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} />
        I explicitly assume full foreign presence in this range except my recorded U.S., nonqualifying and unknown days.
      </label>}
      <p ref={errorRef} tabIndex={-1} id="record-error" className="error" role={error ? 'alert' : undefined}>{error}</p>
      <div className="actions"><button type="submit">{editing ? 'Save changes' : 'Save travel record'}</button>
        {editing && <button type="button" className="secondary" onClick={onCancel}>Cancel edit</button>}</div>
      <p className="feedback" role="status">{message}</p>
    </form>
  );
}
