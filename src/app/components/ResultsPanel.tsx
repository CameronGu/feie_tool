import { useState } from 'react';
import { KIND_LABELS, TAX_HOME_EXAMPLE, TAX_HOME_NOTE, basisLines, dateLabel, displayPeriods, projectedForeignLines, relevantExceptions, reportText, type TravelReport } from '../../services/report';

export function ResultsPanel({ report, example = false }: { report: TravelReport; example?: boolean }) {
  const [feedback, setFeedback] = useState('');
  const [failed, setFailed] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [includeAppendix, setIncludeAppendix] = useState(false);
  const periods = displayPeriods(report);
  const exceptions = relevantExceptions(report);
  const comparison = report.comparison;
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
      <div className="eyebrow">{example ? 'Demonstration · tax year 2025' : report.scenario ? 'Scenario comparison' : 'Completed travel assessment'}</div>
      <h2 id="results-heading">Physical presence · {report.tax_year}</h2>
      <div className={`assessment assessment-${report.status}`} role="status" aria-live="polite">
        <h3>{report.has_evidence ? report.status_label : 'Add travel evidence to begin'}</h3>
        {report.has_evidence ? <p><strong className="coverage-number">{report.qualifying_days}</strong> of {report.tax_year_days} tax-year days covered by supported qualifying periods.</p> : <p>Enter full foreign days, or establish normal foreign presence and record U.S. visits and other exceptions. Unrecorded dates remain unknown.</p>}
      </div>
      {comparison && <p className="notice">Completed-record coverage: <strong>{comparison.completed_days} / {comparison.denominator} days</strong>. Scenario coverage: <strong>{comparison.scenario_days} / {comparison.denominator} days</strong> ({comparison.delta_days >= 0 ? '+' : ''}{comparison.delta_days}). Saved completed records are preserved.</p>}
      {report.has_evidence && <p><strong>Coverage fraction:</strong> {report.qualifying_days} / {report.tax_year_days} = {report.fraction.toFixed(6)} <span className="help">(rounded display)</span></p>}
      <p className="help">{TAX_HOME_NOTE} This is not your exclusion amount or tax savings.</p>
      {report.has_evidence && <details><summary>Why foreign tax-home dates matter</summary><p className="help">{TAX_HOME_EXAMPLE}</p></details>}
      {report.has_evidence && !report.supporting_periods.length && <p className="notice">
        No supported ordinary period reaches 330 full foreign days. Maximum possible across ordinary periods: <strong>{report.max_possible_foreign_days} / 330</strong>, treating unresolved elapsed dates as foreign.
        {' '}{report.max_possible_foreign_days < 330 ? 'Even that upper bound is below 330, so missing dates cannot change the ordinary threshold failure.' : 'Missing evidence could change the conclusion. Add missing travel records or an explicit foreign-presence assumption.'}
        {' '}Future dates cannot establish completed presence.
      </p>}
      {report.leap_day_review && <div className="notice"><h3>February 29 boundary needs review</h3>
        <p>The longer leap-start convention could cover {report.leap_day_review.alternative_coverage_days} days. This is separate from the {report.qualifying_days}-day baseline. Ask your preparer to resolve the endpoint convention.</p></div>}
      {report.has_evidence && <h3>{report.supporting_periods.length ? 'Supporting 12-month periods' : 'Strongest supported period'}</h3>}
      <p className="help">{!report.has_evidence ? '' : report.supporting_periods.length ? `${report.qualifying_period_count} periods pass. This compact supporting set covers their combined tax-year dates; overlapping days count once.` :
        `This period has ${report.closest_period.foreign_days} full foreign days; ${Math.max(0, 330 - report.closest_period.foreign_days)} more would be needed inside this same period. This is a count deficit, not a recommended itinerary.`}</p>
      {periods.map(window => <article className="period-card" key={window.window_start}>
        <h4>{window.window_start} to {window.window_end}</h4>
        <dl><div><dt>Full foreign days in period</dt><dd>{window.foreign_days} / 330 required</dd></div>
          <div><dt>Calendar period</dt><dd>{window.calendar_days} days</dd></div>
          <div><dt>{report.supporting_periods.length ? `${report.tax_year} qualifying-period days` : `Candidate days in ${report.tax_year}`}</dt><dd>{window.overlap_days}</dd></div>
          <div><dt>Recorded completed foreign</dt><dd>{window.recorded_foreign_days}</dd></div>
          <div><dt>Assumed completed foreign</dt><dd>{window.completed_assumed_foreign_days}</dd></div>
          <div><dt>Projected foreign</dt><dd>{window.projected_foreign_days}</dd></div>
          <div><dt>U.S. / other nonforeign days</dt><dd>{window.us_days} / {window.other_nonforeign_days}</dd></div>
          <div><dt>Unknown days</dt><dd>{window.unknown_days}</dd></div>
          {report.supporting_periods.length > 1 && <div><dt>Distinct days added</dt><dd>{window.distinct_tax_year_days}</dd></div>}</dl>
      </article>)}
      {report.has_evidence && <p className="help">Recorded completed, assumed completed and projected foreign days are separate counts. Period dates describe the containing test period, not a recommendation to stay abroad continuously.</p>}
      {report.has_evidence && !report.supporting_periods.length && <p className="help">Upper-bound period: {report.possible_period.window_start} to {report.possible_period.window_end}. This can differ from the strongest supported period; it is a possibility, not evidence.</p>}
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
