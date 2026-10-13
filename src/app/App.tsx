import { useMemo, useState } from 'react';
import { APP_NAME } from '../constants/meta';
import type { TravelHistory, TravelRecord } from '../domain/history';
import { assessTravel } from '../services/travelCalculator';
import { buildReport } from '../services/report';
import { useTravelHistory } from './hooks/useTravelHistory';
import { ForeignBaseline } from './components/ForeignBaseline';
import { TravelEntry } from './components/TravelEntry';
import { HistoryPanel } from './components/HistoryPanel';
import { ResultsPanel } from './components/ResultsPanel';
import { AppFooter } from './components/AppFooter';
import './styles/app.css';

const EXAMPLE: TravelHistory = { schema_version: 1, records: [{ id: 'example-2025', kind: 'foreign', status: 'completed',
  start_date: '2025-01-01', end_date: '2025-11-30', note: 'Example only: 334 full foreign days' }] };

export function App() {
  const travel = useTravelHistory();
  const [editing, setEditing] = useState<TravelRecord | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [setupBaseline, setSetupBaseline] = useState(false);
  const [endingBaseline, setEndingBaseline] = useState(false);
  const [example, setExample] = useState(false);
  const [yearDraft, setYearDraft] = useState(String(travel.year));
  const [yearError, setYearError] = useState('');
  const exampleAssessment = useMemo(() => example ? assessTravel(EXAMPLE, 2025, travel.asOf) : null, [example, travel.asOf]);
  const assessment = exampleAssessment ?? travel.assessment;
  const report = useMemo(() => ({ ...buildReport(assessment, undefined, !example && travel.includeProposals ? travel.baseline : undefined), example }), [assessment, example, travel.includeProposals, travel.baseline]);
  function closeEditor() { setEditing(null); setSetupBaseline(false); setEndingBaseline(false); setEditorKey(value => value + 1); }
  const baselines = travel.history.records.filter(record => record.kind === 'foreign_assumption' && record.status === 'completed');
  function editRecord(record: TravelRecord) {
    setEditing(record); setSetupBaseline(false); setEndingBaseline(false); setExample(false);
    document.getElementById('travel-entry')?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to calculator</a>
      <header className="app-header"><div>
        <h1>{APP_NAME}</h1><p>Count physical presence. Prepare travel evidence for your tax preparer.</p></div>
        <button className="secondary" onClick={() => setExample(value => !value)}>{example ? 'Close example' : 'Preview an example'}</button></header>
      <main id="main-content" tabIndex={-1}>
        <p className="scope-note">Private: travel stays in this browser. Physical-presence planning only; tax home and FEIE eligibility need separate review.</p>
        {travel.storageMessage && <p className="notice" role="alert">{travel.storageMessage}</p>}
        <section className="year-bar" aria-label="Calculation settings">
          <div><label htmlFor="tax-year">Calendar tax year</label><input id="tax-year" inputMode="numeric" type="number" min={1901} max={2099} value={yearDraft}
            aria-describedby="year-help year-error" aria-invalid={Boolean(yearError)} onChange={event => {
              const value = event.target.value; setYearDraft(value);
              const year = Number(value);
              if (/^\d{4}$/.test(value) && year >= 1901 && year <= 2099) { travel.setYear(year); setYearError(''); setExample(false); }
              else setYearError('Choose a complete calendar year between 1901 and 2099.');
            }} /></div>
          <span id="year-help" className="sr-only">Changing years preserves travel history. Unrecorded dates remain unknown.</span>
          <label className="check-row"><input type="checkbox" checked={travel.includeProposals} onChange={event => { travel.setIncludeProposals(event.target.checked); setExample(false); }} />Compare proposed and future travel</label>
          <p id="year-error" className="error" role={yearError ? 'alert' : undefined}>{yearError}</p>
        </section>
        {example && <div className="notice" role="status">Example preview for tax year 2025. Your saved travel records are unchanged. Close the example to return to your calculation.</div>}
        <div className="calculator-grid">
          <section id="travel-entry" className="panel" aria-label="Travel entry">
            <div className="view-switch" role="group" aria-label="Entry convenience">
              <button className="secondary" aria-pressed={travel.entryView === 'foreign'} onClick={() => travel.setEntryView('foreign')}>Enter foreign stays</button>
              <button className="secondary" aria-pressed={travel.entryView === 'us'} onClick={() => travel.setEntryView('us')}>Enter U.S. visits</button>
            </div>
            {baselines.filter(record => record.ongoing).map(record => <div className="baseline-summary" key={record.id}>
              <p><strong>Default foreign presence since {record.start_date} · Ongoing</strong></p>
              <p className="help">Assumed full foreign days except recorded exceptions. Future continuation is projected, never completed evidence.</p>
              <div className="actions"><button className="secondary" onClick={() => editRecord(record)}>Edit default presence</button>
                <button className="secondary" onClick={() => { editRecord(record); setEndingBaseline(true); }}>End default presence</button></div>
            </div>)}
            {travel.entryView === 'us' && !baselines.length && !setupBaseline && !editing && <div className="baseline-intro">
              <h2>Start with normal foreign presence</h2>
              <p className="help">Set when full foreign presence began, then record U.S. visits and other exceptions. Those exceptions override the baseline; visits alone leave other dates unknown.</p>
              <button onClick={() => setSetupBaseline(true)}>Establish default foreign presence</button>
            </div>}
            {travel.entryView === 'us' && baselines.length > 0 && !baselines.some(record => record.ongoing) && !setupBaseline && !editing &&
              <p className="help">Your default foreign presence has a specified end date. <button className="secondary" onClick={() => setSetupBaseline(true)}>Add another foreign baseline</button></p>}
            {setupBaseline || editing?.kind === 'foreign_assumption' ?
              <ForeignBaseline key={`${editing?.id ?? 'baseline'}-${endingBaseline}`} editing={editing} ending={endingBaseline}
                onSave={record => { travel.saveRecord(record); closeEditor(); travel.setEntryView('us'); setExample(false); }} onCancel={closeEditor} /> :
              <TravelEntry key={`${editing?.id ?? 'new'}-${editorKey}`} view={travel.entryView} editing={editing}
                onSave={record => { travel.saveRecord(record); setExample(false); if (editing) closeEditor(); }} onCancel={closeEditor} />}

          </section>
          <ResultsPanel report={report} example={example} />
        </div>
        <HistoryPanel history={travel.history} recoveryData={travel.recoveryData} canUndo={travel.canUndo}
          onEdit={editRecord} onDelete={id => { travel.deleteRecord(id); if (editing?.id === id) closeEditor(); setExample(false); }}
          onUndo={() => { travel.undo(); closeEditor(); setExample(false); }}
          onImport={(history, strategy) => { travel.importHistory(history, strategy); closeEditor(); setExample(false); }}
          onReset={() => { travel.reset(); closeEditor(); setExample(false); }} />
        <section className="panel guidance"><h2>How to use the count</h2><p>Enter full foreign days directly, or declare foreign presence for a known range and record exceptions. Mark uncertain days as unknown. Travel between foreign countries may preserve full days under specific IRS transit rules; check the rules before counting those days.</p>
          <p>A passing period contains at least 330 full foreign days in 12 calendar months and intersects your tax year. Multiple passing periods can cover more of the year than one alone; overlapping dates are counted once. Covered days may include U.S. visits. Eligible income and foreign tax home are separate questions.</p>
          <p>Use the JSON backup to restore your history. Use the preparer report to review the count, its source records, assumptions and limitations. <a href="https://www.irs.gov/instructions/i2555" target="_blank" rel="noreferrer">Form 2555 instructions</a>.</p></section>
      </main>
      <AppFooter />
    </div>
  );
}
