import { useState } from 'react';
import { latestCompletedDay, type CutoffContext } from '../../services/completedDayCutoff';

export function CompletedDaySettings({ cutoff, onApply, onReset, disabled }: {
  cutoff: CutoffContext & { lastCompletedDay: string };
  onApply: (date: string) => void; onReset: () => string; disabled: boolean;
}) {
  const [draft, setDraft] = useState(cutoff.lastCompletedDay);
  const [error, setError] = useState('');
  return <details className="cutoff-settings">
    <summary>{disabled ? 'Saved calculation: ' : ''}Completed through {cutoff.lastCompletedDay} · {cutoff.basis === 'manual' ? 'Manual' : 'Device calendar'}</summary>
    <p className="help">Default: yesterday in your device calendar ({cutoff.device_time_zone}). Adjust for your travel location only after that calendar day has fully ended. Later dates remain projected. This setting applies to this session; reports retain the effective cutoff.</p>
    <form onSubmit={event => {
      event.preventDefault();
      try { onApply(draft); setError(''); } catch (cause) { setError((cause as Error).message); }
    }}>
      <label htmlFor="last-completed-day">Last completed calendar day</label>
      <input id="last-completed-day" type="date" min="1900-01-01" max={latestCompletedDay()} value={draft}
        disabled={disabled} aria-describedby="cutoff-error" aria-invalid={Boolean(error)} onChange={event => setDraft(event.target.value)} required />
      <p className="error" id="cutoff-error" role={error ? 'alert' : undefined}>{error}</p>
      <div className="actions"><button disabled={disabled}>Apply completed-day cutoff</button>
        <button type="button" className="secondary" disabled={disabled} onClick={() => { setDraft(onReset()); setError(''); }}>Use device default</button></div>
    </form>
  </details>;
}
