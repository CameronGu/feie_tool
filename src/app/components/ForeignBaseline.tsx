import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ONGOING_END, recordFromDates, type TravelRecord } from '../../domain/history';

export function ForeignBaseline({ editing, ending, onSave, onCancel }: {
  editing: TravelRecord | null; ending: boolean; onSave(record: TravelRecord): void; onCancel(): void;
}) {
  const [start, setStart] = useState(editing?.start_date ?? '');
  const [ongoing, setOngoing] = useState(ending ? false : editing ? Boolean(editing.ongoing) : true);
  const [end, setEnd] = useState(editing?.ongoing ? '' : editing?.end_date ?? '');
  const [note, setNote] = useState(editing?.note ?? '');
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);
  const closesOngoing = Boolean(editing?.ongoing && !ongoing);
  useEffect(() => { (ending ? endRef : startRef).current?.focus(); }, [ending]);
  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      if (!acknowledged) throw new Error('Confirm the full foreign-presence assumption before saving.');
      if (closesOngoing && !confirmed) throw new Error('Confirm the final covered day before ending default foreign presence.');
      onSave({ ...recordFromDates('foreign_assumption', start, ongoing ? ONGOING_END : end, editing?.status ?? 'completed', note),
        id: editing?.id ?? crypto.randomUUID(), ...(ongoing ? { ongoing: true as const } : {}) });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not save default foreign presence.');
      (start > end && !ongoing ? endRef : startRef).current?.focus();
    }
  }
  return <form onSubmit={submit} aria-label="Default foreign presence">
    <h2>{ending ? 'End default foreign presence' : editing ? 'Edit default foreign presence' : 'Set default foreign presence'}</h2>
    <p className="help">For dates in this period that you haven’t marked otherwise, we’ll assume you spent the full day in a foreign country. Record U.S. visits, nonqualifying travel and unknown dates as exceptions.</p>
    <label htmlFor="baseline-start">First full foreign day</label>
    <input ref={startRef} id="baseline-start" type="date" required min="1900-01-01" max={ONGOING_END} value={start}
      onChange={event => setStart(event.target.value)} aria-describedby="baseline-help baseline-error" />
    {!ending && <><label htmlFor="baseline-duration">Foreign presence continues</label>
      <select id="baseline-duration" value={ongoing ? 'ongoing' : 'ended'} onChange={event => { setOngoing(event.target.value === 'ongoing'); setConfirmed(false); }}>
        {editing?.status !== 'proposed' && <option value="ongoing">Ongoing</option>}<option value="ended">Through a specified date</option>
      </select></>}
    {!ongoing && <><label htmlFor="baseline-end">Final covered full foreign day</label>
      <input ref={endRef} id="baseline-end" type="date" required min={start || '1900-01-01'} max={ONGOING_END} value={end}
        onChange={event => { setEnd(event.target.value); setConfirmed(false); }} aria-describedby="baseline-error" /></>}
    <p id="baseline-help" className="help">Start with your first full day, generally midnight to midnight. Record partial travel days separately. Ongoing presence after the last completed day is projected when comparison is on.</p>
    <label htmlFor="baseline-note">Supporting note (optional)</label>
    <input id="baseline-note" maxLength={500} value={note} onChange={event => setNote(event.target.value)} />
    <label className="check-row"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} />
      I explicitly assume full foreign presence in this range except my recorded U.S., nonqualifying and unknown days.</label>
    {closesOngoing && <label className="check-row"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />
      End default foreign presence after {end || 'the final day I select'}. Keep all historical records.</label>}
    <p id="baseline-error" className="error" role={error ? 'alert' : undefined}>{error}</p>
    <div className="actions"><button disabled={!acknowledged || (closesOngoing && (!end || !confirmed))}>
      {closesOngoing ? 'Confirm end of foreign presence' : 'Save default foreign presence'}</button>
      <button type="button" className="secondary" onClick={onCancel}>Cancel</button></div>
  </form>;
}
