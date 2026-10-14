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
import { CompletedDaySettings } from './components/CompletedDaySettings';
import { FeieGuidance } from './components/FeieGuidance';
import { IncomeIllustration } from './components/IncomeIllustration';
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
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const exampleAssessment = useMemo(() => example ? assessTravel(EXAMPLE, 2025, '2026-01-01') : null, [example]);
  const assessment = exampleAssessment ?? travel.assessment;
  const report = useMemo(() => ({ ...buildReport(assessment, undefined, !example && travel.includeProposals ? travel.baseline : undefined,
    example ? { basis: 'demonstration' } : travel.cutoff), example }), [assessment, example, travel.includeProposals, travel.baseline, travel.cutoff]);
  function closeEditor() { setEditing(null); setSetupBaseline(false); setEndingBaseline(false); setEditorKey(value => value + 1); }
  const baselines = travel.history.records.filter(record => record.kind === 'foreign_assumption' && record.status === 'completed');
  function editRecord(record: TravelRecord) {
    setEditing(record); setSetupBaseline(false); setEndingBaseline(false); setExample(false);
    document.getElementById('travel-entry')?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#calculator-settings">Skip to calculator</a>
      <main id="main-content">
        {travel.storageMessage && <p className="notice" role="alert">{travel.storageMessage}</p>}
        <div className="home-intro">
          <header className="introduction">
            <h1>{APP_NAME}</h1>
            <p className="intro-subtitle">Check your time abroad against the IRS physical presence test.</p>
            <p className="intro-detail">Enter your U.S. visits or the dates you spent abroad. Find qualifying 12-month periods and see how they apply to the tax year you’re checking.</p>
            <div className="intro-links"><a href="#feie-guidance" onClick={() => setGuidanceOpen(true)}>How FEIE works</a>
              <span>Travel history stays in this browser.</span></div>
          </header>
          <IncomeIllustration />
          <div id="calculator-settings" tabIndex={-1}>
            <section className="year-bar" aria-label="Calculation settings">
              <div><label htmlFor="tax-year">{example ? 'Saved calendar tax year' : 'Calendar tax year'}</label><input id="tax-year" inputMode="numeric" type="number" min={1901} max={2099} value={yearDraft} disabled={example}
                aria-describedby="year-help year-error" aria-invalid={Boolean(yearError)} onChange={event => {
                  const value = event.target.value; setYearDraft(value);
                  const year = Number(value);
                  if (/^\d{4}$/.test(value) && year >= 1901 && year <= 2099) { travel.setYear(year); setYearError(''); setExample(false); }
                  else setYearError('Choose a complete calendar year between 1901 and 2099.');
                }} /></div>
              <span id="year-help" className="sr-only">Changing years keeps your travel history.</span>
              <label className="check-row"><input type="checkbox" checked={travel.includeProposals} disabled={example} onChange={event => { travel.setIncludeProposals(event.target.checked); setExample(false); }} />Compare proposed and future travel</label>
              <p id="year-error" className="error" role={yearError ? 'alert' : undefined}>{yearError}</p>
            </section>
            <CompletedDaySettings key={travel.cutoff.asOf + travel.cutoff.basis} cutoff={travel.cutoff} onApply={travel.setLastCompletedDay} onReset={travel.resetCutoff} disabled={example} />
          </div>
        </div>
        {example && <div className="notice" role="status"><strong>Demonstration · tax year 2025</strong>. Your saved calculation for {travel.year} is paused. Your saved travel records are unchanged; saved settings resume on close. The example uses completed days through 2025-12-31.
          <div className="actions"><button className="secondary" onClick={() => setExample(false)}>Close example</button></div></div>}
        <div className="calculator-grid">
          <section id="travel-entry" className="panel" aria-label="Travel entry">
            <div className="view-switch" role="group" aria-label="Entry preference">
              <button className="secondary" aria-pressed={travel.entryView === 'us'} onClick={() => travel.setEntryView('us')}>Enter U.S. visits</button>
              <button className="secondary" aria-pressed={travel.entryView === 'foreign'} onClick={() => travel.setEntryView('foreign')}>Enter time abroad</button>
            </div>
            <p className="help">{travel.entryView === 'us' ? 'If you normally live abroad, this is usually easier. Set when your foreign presence began, then enter U.S. visits and other exceptions. We’ll use your declared assumption for the remaining days.' : 'Enter full days spent in foreign countries. Unrecorded dates won’t count as foreign days.'}</p>
            {baselines.filter(record => record.ongoing).map(record => <div className="baseline-summary" key={record.id}>
              <p><strong>Default foreign presence since {record.start_date} · Ongoing</strong></p>
              <p className="help">Assumed full foreign days except recorded exceptions. Future continuation is projected, never completed evidence.</p>
              <div className="actions"><button className="secondary" onClick={() => editRecord(record)}>Edit default presence</button>
                <button className="secondary" onClick={() => { editRecord(record); setEndingBaseline(true); }}>End default presence</button></div>
            </div>)}
            {travel.entryView === 'us' && !baselines.length && !setupBaseline && !editing && <div className="baseline-intro">
              <h2>Set default foreign presence</h2>
              <p className="help">U.S. visits alone leave the dates between them unknown. Declare a period of full foreign days to count those dates.</p>
              <button onClick={() => setSetupBaseline(true)}>Establish default foreign presence</button>
            </div>}
            {travel.entryView === 'us' && baselines.length > 0 && !baselines.some(record => record.ongoing) && !setupBaseline && !editing &&
              <p className="help">Your default foreign presence has an end date. <button className="secondary" onClick={() => setSetupBaseline(true)}>Add another default period</button></p>}
            {setupBaseline || editing?.kind === 'foreign_assumption' ?
              <ForeignBaseline key={`${editing?.id ?? 'baseline'}-${endingBaseline}`} editing={editing} ending={endingBaseline}
                onSave={record => { travel.saveRecord(record); closeEditor(); travel.setEntryView('us'); setExample(false); }} onCancel={closeEditor} /> :
              <TravelEntry key={`${editing?.id ?? 'new'}-${editorKey}`} view={travel.entryView} editing={editing}
                onSave={record => { travel.saveRecord(record); setExample(false); if (editing) closeEditor(); }} onCancel={closeEditor} />}

          </section>
          <ResultsPanel report={report} example={example} />
        </div>
        {!example && <div className="example-toggle"><button className="secondary" onClick={() => setExample(true)}>Preview an example</button>
          <span className="help">Try a separate travel example without changing your history.</span></div>}
        <HistoryPanel history={travel.history} recoveryData={travel.recoveryData} canUndo={travel.canUndo}
          onEdit={editRecord} onDelete={id => { travel.deleteRecord(id); if (editing?.id === id) closeEditor(); setExample(false); }}
          onUndo={() => { travel.undo(); closeEditor(); setExample(false); }}
          onImport={(history, strategy) => { travel.importHistory(history, strategy); closeEditor(); setExample(false); }}
          onReset={() => { travel.reset(); closeEditor(); setExample(false); }} />
        <FeieGuidance open={guidanceOpen} onToggle={setGuidanceOpen} />
      </main>
      <AppFooter />
    </div>
  );
}
