import { useState } from 'react';
import { KIND_LABELS, TAX_HOME_EXAMPLE, TAX_HOME_NOTE, basisLines, dateLabel, displayPeriods, projectedForeignLines, relevantExceptions, reportText, type TravelReport } from '../../services/report';
import { DayCountsHelp } from './FeieGuidance';

const STATUS_EXPLANATIONS = {
  met: 'Your travel dates meet the 330-day physical presence test under the information you’ve provided.',
  conditional: 'Your travel dates meet the 330-day physical presence test under the assumptions you’ve provided.',
  projected: 'This projected result meets the 330-day count, but relies on future travel or a period that has not ended.',
  incomplete: 'We need more travel information to determine whether a qualifying period is supported.',
  'not-met': 'Your recorded travel doesn’t meet the 330-day test for this tax year.',
  'review-required': 'A period starting on February 29 could change this result. Its ending date needs review.'
} as const;

export function ResultsPanel({ report, example = false }: { report: TravelReport; example?: boolean }) {
  const [feedback, setFeedback] = useState('');
  const [failed, setFailed] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [includeAppendix, setIncludeAppendix] = useState(false);
  const periods = displayPeriods(report);
  const exceptions = relevantExceptions(report);
  const comparison = report.comparison;
  const possible = report.possible_period;
  const possibleEnd = !report.scenario && report.last_completed_day < possible.window_end ? report.last_completed_day : possible.window_end;
  const unresolved = report.segments.filter(segment => segment.kind === 'unknown' &&
    segment.start_date <= possibleEnd && segment.end_date >= possible.window_start)
    .map(segment => ({ start: segment.start_date < possible.window_start ? possible.window_start : segment.start_date,
      end: segment.end_date > possibleEnd ? possibleEnd : segment.end_date }));
  async function copy() {
    try {
      await navigator.clipboard.writeText(reportText(report)); setFailed(false); setFeedback('Preparer report copied.');
    } catch { setFailed(true); setFeedback('Clipboard unavailable. Select and copy the report text below.'); }
  }
  async function exportPdf() {
    setExporting(true);
    try {
      const { createReportPdf } = await import('../../services/reportPdf');
      const pdf = await createReportPdf(report, { includeAppendix });
      pdf.save(`feie-physical-presence-${report.tax_year}${report.scenario ? '-scenario' : ''}.pdf`);
      setFailed(false); setFeedback('PDF report downloaded.');
    } catch { setFailed(true); setFeedback('PDF export failed. Copy the preparer report or select its text below.'); }
    finally { setExporting(false); }
  }
  return (
    <section className="panel results-panel" aria-labelledby="results-heading">
      <div className="eyebrow">{example ? 'Demonstration · tax year 2025' : report.scenario ? 'Scenario comparison' : 'Completed travel'}</div>
      <h2 id="results-heading">Physical presence · {report.tax_year}</h2>
      <div className={`assessment assessment-${report.status}`} role="status" aria-live="polite">
        <h3>{report.has_evidence ? report.status_label : 'Add travel evidence to begin'}</h3>
        <p>{report.has_evidence ? STATUS_EXPLANATIONS[report.status] : 'Enter time abroad, or set default foreign presence and add U.S. visits. Dates you haven’t accounted for remain unknown.'}</p>
      </div>
      {comparison && <p className="notice">Completed-record coverage: <strong>{comparison.completed_days} / {comparison.denominator} days</strong>. Scenario coverage: <strong>{comparison.scenario_days} / {comparison.denominator} days</strong> ({comparison.delta_days >= 0 ? '+' : ''}{comparison.delta_days}). Saved completed records are preserved.</p>}
      {report.has_evidence && <>
        <p><strong className="coverage-number">{report.qualifying_days}</strong> of {report.tax_year_days} qualifying-period days in {report.tax_year}.</p>
        <p><strong>Conditional proration fraction:</strong> {report.qualifying_days} / {report.tax_year_days} = {report.fraction.toFixed(6)} <span className="help">(rounded display)</span></p>
        <DayCountsHelp />
      </>}
      <p className="help">This checks physical presence. Foreign tax home and other FEIE requirements need separate review; the result is not your income exclusion or tax savings.</p>
      {report.has_evidence && !report.supporting_periods.length && <p className="notice">
        Across ordinary 12-month periods, the highest possible count is <strong>{report.max_possible_foreign_days} / 330</strong>, even if every unresolved {report.scenario ? 'scenario' : 'completed'} date counted as foreign.
        {' '}{report.max_possible_foreign_days < 330 ? `That is ${330 - report.max_possible_foreign_days} days short. Missing information alone cannot close the gap under the ordinary counting rules.` : 'Missing travel records or a declared foreign-presence assumption could change the result.'}
        {' '}{!report.scenario && 'Future dates cannot establish completed presence.'}
      </p>}
      {report.has_evidence && !report.supporting_periods.length && <details><summary>Why is this calculation {report.status === 'incomplete' ? 'incomplete' : 'below 330'}?</summary>
        <p>The strongest supported count is a lower bound: only recorded or explicitly assumed full foreign days count. The possible count is an upper bound: it also treats unresolved {report.scenario ? 'scenario' : 'completed'} dates as foreign. These counts can come from different periods.</p>
        <p>The upper-bound period is {possible.window_start} to {possible.window_end}. It is a possibility, not evidence.</p>
        {unresolved.length > 0 ? <><p>Unresolved dates in that period:</p><ul>{unresolved.map(segment => <li key={segment.start}>
          {segment.start} to {segment.end}
        </li>)}</ul></> : <p>No unresolved completed dates in this period could add to the count.</p>}
      </details>}
      {report.status === 'not-met' && report.has_evidence && <p className="help">The bona fide residence test works differently. If you’ve established residence abroad, it may be worth reviewing even if you don’t meet the physical presence test. This calculator does not determine residence or overall FEIE eligibility.</p>}
      {report.leap_day_review && <div className="notice"><h3>February 29 boundary needs review</h3>
        <p>The longer leap-start convention could cover {report.leap_day_review.alternative_coverage_days} days. This is separate from the {report.qualifying_days}-day baseline. Ask your preparer to resolve the endpoint convention.</p></div>}
      {report.has_evidence && <h3>{report.supporting_periods.length ? 'Supporting 12-month periods' : 'Strongest supported period'}</h3>}
      {report.has_evidence && !report.supporting_periods.length && <p className="help">This period has {report.closest_period.foreign_days} full foreign days; {Math.max(0, 330 - report.closest_period.foreign_days)} more would be needed inside this same period. This shortfall is not a recommended itinerary.</p>}
      {periods.map(window => <article className="period-card" key={window.window_start}>
        <h4>{window.window_start} to {window.window_end}</h4>
        <dl><div><dt>Full foreign days in period</dt><dd>{window.foreign_days} / 330 required</dd></div>
          <div><dt>{report.supporting_periods.length ? `${report.tax_year} qualifying-period days` : `Candidate days in ${report.tax_year}`}</dt><dd>{window.overlap_days}</dd></div>
          {report.supporting_periods.length > 1 && <div><dt>Distinct days added</dt><dd>{window.distinct_tax_year_days}</dd></div>}</dl>
        <details><summary>Day-count details</summary><dl>
          <div><dt>Calendar period</dt><dd>{window.calendar_days} days</dd></div>
          <div><dt>Recorded completed foreign</dt><dd>{window.recorded_foreign_days}</dd></div>
          <div><dt>Assumed completed foreign</dt><dd>{window.completed_assumed_foreign_days}</dd></div>
          <div><dt>Projected foreign</dt><dd>{window.projected_foreign_days}</dd></div>
          <div><dt>U.S. / other nonforeign days</dt><dd>{window.us_days} / {window.other_nonforeign_days}</dd></div>
          <div><dt>Unknown days</dt><dd>{window.unknown_days}</dd></div>
          </dl></details>
      </article>)}
      {report.supporting_periods.length > 0 && <details><summary>Why did the calculator choose these dates?</summary>
        <p>{report.supporting_periods.length === 1 ? `This period supplies all ${report.qualifying_days} supported qualifying-period days in ${report.tax_year}.` : `These ${report.supporting_periods.length} periods together supply ${report.qualifying_days} distinct qualifying-period days in ${report.tax_year}. More than one valid 12-month period contributes days; overlapping dates count only once.`}</p>
        <p>There are {report.qualifying_period_count} valid 12-month periods in this calculation. The calculator combines their dates within {report.tax_year}, then chooses a compact supporting set that covers those same dates. Starting with the earliest uncovered day, it chooses a valid period reaching furthest forward, using the earliest start to break ties.</p>
        <p>Selection is based on tax-year coverage, rather than the largest foreign-day count. It does not determine an income exclusion or maximize tax savings.</p>
        <p className="help">This is the coverage supported by your current information. Accounting for missing dates may support additional coverage.</p>
      </details>}
      {report.has_evidence && <details><summary>Why foreign tax-home dates matter</summary><p className="help">{TAX_HOME_NOTE}</p><p className="help">{TAX_HOME_EXAMPLE}</p></details>}
      {report.coverage.length > 0 && <details><summary>Tax-year dates covered</summary><ul>{report.coverage.map(segment => <li key={segment.start_date}>{segment.start_date} to {segment.end_date}</li>)}</ul></details>}
      {comparison && comparison.completed_report.supporting_periods.length > 0 && <details><summary>Completed supporting periods</summary>
        <ul>{comparison.completed_report.supporting_periods.map(period => <li key={period.window_start}>{period.window_start} to {period.window_end}: {period.foreign_days} full foreign days; {period.distinct_tax_year_days} distinct {report.tax_year} days.</li>)}</ul>
      </details>}
      {report.scenario && <details><summary>Projected foreign presence</summary><ul>{projectedForeignLines(report).map(line => <li key={line}>{line}</li>)}</ul></details>}
      {exceptions.length > 0 && <details><summary>Relevant travel exceptions</summary><ul>{exceptions.map(item => <li key={item.record.id}>
        {KIND_LABELS[item.record.kind]}: {dateLabel(item.record.start_date)} to {dateLabel(item.record.end_date)}: {item.days} days within supporting periods{item.projected_days ? ` (${item.projected_days} projected)` : ''}.
      </li>)}</ul></details>}
      <details><summary>Source assumptions and limitations</summary><ul>{basisLines(report).map(line => <li key={line}>{line}</li>)}</ul></details>
      <label className="check-row"><input type="checkbox" checked={includeAppendix} onChange={event => setIncludeAppendix(event.target.checked)} disabled={exporting} />Include detailed supporting records</label>
      <p className="help">Optional PDF appendix with source records, evidence classifications and provenance. JSON backup is separate.</p>
      <div className="actions"><button className="secondary" onClick={copy}>Copy preparer report</button>
        <button onClick={exportPdf} disabled={exporting}>{exporting ? 'Preparing PDF...' : 'Download PDF report'}</button></div>
      <p role={failed ? 'alert' : 'status'} className={failed ? 'error' : 'feedback'}>{feedback}</p>
      <details><summary>Review preparer report text</summary>
        <p className="help">Concise report text for email or workpapers. Detailed evidence and source identifiers are available in the optional PDF appendix.</p>
        <textarea className="report-text" aria-label="Preparer report text" readOnly value={reportText(report)} />
      </details>
      <p className="help">Completed through {report.last_completed_day}. Later dates are projected when included. Calculation {report.calculation_version}. <a href="https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion-physical-presence-test" target="_blank" rel="noreferrer">IRS physical-presence rules</a>.</p>
    </section>
  );
}
