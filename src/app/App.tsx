import { useMemo, useState } from 'react';
import { APP_NAME } from '../constants/meta';
import type { TravelHistory, TravelRecord } from '../domain/history';
import { assessTravel } from '../services/travelCalculator';
import { buildReport } from '../services/report';
import { useTravelHistory } from './hooks/useTravelHistory';
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
  const [example, setExample] = useState(false);
  const [yearDraft, setYearDraft] = useState(String(travel.year));
  const [yearError, setYearError] = useState('');
  const exampleAssessment = useMemo(() => example ? assessTravel(EXAMPLE, 2025, travel.asOf, true) : null, [example, travel.asOf]);
  const assessment = exampleAssessment ?? travel.assessment;
  const report = useMemo(() => ({ ...buildReport(assessment), example }), [assessment, example]);
  function closeEditor() { setEditing(null); setEditorKey(value => value + 1); }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to calculator</a>
      <header className="app-header"><div><div className="eyebrow">Travel evidence, clearly counted</div>
        <h1>{APP_NAME}</h1><p>Evaluate 12-month physical-presence periods and prepare a travel summary for your tax preparer.</p></div>
        <button className="secondary" onClick={() => setExample(value => !value)}>{example ? 'Close example' : 'Preview an example'}</button></header>
      <main id="main-content" tabIndex={-1}>
        <div className="scope-note">Private by default. No account or uploads. Travel stays in this browser. This tool evaluates physical presence; foreign tax home, income and overall FEIE eligibility need separate review.</div>
        {travel.storageMessage && <p className="notice" role="alert">{travel.storageMessage}</p>}
        <section className="year-bar" aria-label="Calculation settings">
          <div><label htmlFor="tax-year">Calendar tax year</label><input id="tax-year" inputMode="numeric" type="number" min={1901} max={2099} value={yearDraft}
            aria-describedby="year-help year-error" aria-invalid={Boolean(yearError)} onChange={event => {
              const value = event.target.value; setYearDraft(value);
              const year = Number(value);
              if (/^\d{4}$/.test(value) && year >= 1901 && year <= 2099) { travel.setYear(year); setYearError(''); setExample(false); }
              else setYearError('Choose a complete calendar year between 1901 and 2099.');
            }} /></div>
          <p id="year-help" className="help">Changing years preserves every travel record. Dates without records remain unknown.</p>
          <label className="check-row"><input type="checkbox" checked={travel.includeProposals} onChange={event => { travel.setIncludeProposals(event.target.checked); setExample(false); }} />Compare proposed and future travel</label>
          <p id="year-error" className="error" role={yearError ? 'alert' : undefined}>{yearError}</p>
        </section>
        {example && <div className="notice" role="status">Example preview for tax year 2025. Your saved travel records are unchanged. Close the example to return to your calculation.</div>}
        <div className="calculator-grid">
          <section className="panel" aria-label="Travel entry">
            <div className="view-switch" role="group" aria-label="Entry convenience">
              <button className="secondary" aria-pressed={travel.entryView === 'foreign'} onClick={() => travel.setEntryView('foreign')}>Enter foreign stays</button>
              <button className="secondary" aria-pressed={travel.entryView === 'us'} onClick={() => travel.setEntryView('us')}>Enter U.S. visits</button>
            </div>
            {travel.entryView === 'us' && <p className="notice">U.S. visits alone leave other dates unknown. Choose <strong>Declared foreign presence</strong> to specify a bounded foreign range, then add U.S. visits, transit and unknown exceptions.</p>}
            <TravelEntry key={`${editing?.id ?? 'new'}-${editorKey}`} view={travel.entryView} editing={editing}
              onSave={record => { travel.saveRecord(record); setExample(false); if (editing) closeEditor(); }} onCancel={closeEditor} />
          </section>
          <ResultsPanel report={report} baselineDays={travel.baseline.calculation.qualifyingDays} example={example} />
        </div>
        <HistoryPanel history={travel.history} recoveryData={travel.recoveryData} canUndo={travel.canUndo}
          onEdit={record => { setEditing(record); setExample(false); }} onDelete={id => { travel.deleteRecord(id); if (editing?.id === id) closeEditor(); setExample(false); }}
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
