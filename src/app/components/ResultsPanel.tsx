import { useState } from 'react';
import { reportText, type TravelReport } from '../../services/report';

export function ResultsPanel({ report, baselineDays, example = false }: { report: TravelReport; baselineDays: number; example?: boolean }) {
  const [feedback, setFeedback] = useState('');
  const [failed, setFailed] = useState(false);
  const [exporting, setExporting] = useState(false);
  const periods = report.supporting_periods.length ? report.supporting_periods : [report.closest_period];
  async function copy() {
    try {
      await navigator.clipboard.writeText(reportText(report)); setFailed(false); setFeedback('Preparer report copied.');
    } catch { setFailed(true); setFeedback('Clipboard unavailable. Select and copy the report text below.'); }
  }
  async function exportPdf() {
    setExporting(true);
    try {
      const { createReportPdf } = await import('../../services/reportPdf');
      const pdf = await createReportPdf(report);
      pdf.save(`feie-physical-presence-${report.tax_year}${report.scenario ? '-scenario' : ''}.pdf`);
      setFailed(false); setFeedback('PDF report downloaded.');
    } catch { setFailed(true); setFeedback('PDF export failed. Copy the preparer report or select its text below.'); }
    finally { setExporting(false); }
  }
  return (
    <section className="panel results-panel" aria-labelledby="results-heading">
      <div className="eyebrow">{example ? 'Example preview' : report.scenario ? 'Scenario comparison' : 'Completed travel assessment'}</div>
      <h2 id="results-heading">Physical presence · {report.tax_year}</h2>
      <div className={`assessment assessment-${report.status}`} role="status" aria-live="polite">
        <h3>{report.status_label}</h3>
        <p><strong className="coverage-number">{report.qualifying_days}</strong> of {report.tax_year_days} tax-year days covered by supported qualifying periods.</p>
      </div>
      {report.scenario && <p className="notice">Completed-record coverage: <strong>{baselineDays} days</strong>. Scenario coverage: <strong>{report.qualifying_days} days</strong> ({report.qualifying_days - baselineDays >= 0 ? '+' : ''}{report.qualifying_days - baselineDays}). Saved completed records are preserved.</p>}
      <p><strong>Coverage fraction:</strong> {report.qualifying_days} / {report.tax_year_days} = {report.fraction.toFixed(6)} <span className="help">(rounded display)</span></p>
      <p className="help">Physical-presence coverage is conditional on foreign tax home and other eligibility requirements. It is not the amount of your exclusion or tax savings. Missing dates count as zero foreign days; adding evidence may increase coverage.</p>
      {report.status === 'incomplete' && <p className="notice">No supported period reaches 330 full foreign days. Unrecorded or unknown dates prevent a conclusive failure assessment. Add missing travel evidence or an explicit foreign-presence declaration.</p>}
      {report.leap_day_review && <div className="notice"><h3>February 29 boundary needs review</h3>
        <p>The longer leap-start convention could cover {report.leap_day_review.alternative_coverage_days} days. This is separate from the {report.qualifying_days}-day baseline. Ask your preparer to resolve the endpoint convention.</p></div>}
      <h3>{report.supporting_periods.length ? 'Supporting 12-month periods' : 'Closest evaluated period'}</h3>
      <p className="help">{report.supporting_periods.length ? `${report.qualifying_period_count} periods pass. This compact supporting set covers their combined tax-year dates; overlapping days count once.` :
        `This period has ${report.closest_period.foreign_days} full foreign days; ${Math.max(0, 330 - report.closest_period.foreign_days)} more would be needed inside this same period. This is a count deficit, not a recommended itinerary.`}</p>
      {periods.map(window => <article className="period-card" key={window.window_start}>
        <h4>{window.window_start} to {window.window_end}</h4>
        <dl><div><dt>Full foreign days</dt><dd>{window.foreign_days} / 330 required</dd></div>
          <div><dt>Calendar period</dt><dd>{window.calendar_days} days</dd></div>
          <div><dt>Days in selected year</dt><dd>{window.overlap_days}</dd></div>
          <div><dt>Recorded completed foreign</dt><dd>{window.recorded_foreign_days}</dd></div>
          <div><dt>Assumed foreign</dt><dd>{window.assumed_foreign_days}</dd></div>
          <div><dt>Projected foreign</dt><dd>{window.projected_foreign_days}</dd></div>
          <div><dt>Unknown days</dt><dd>{window.unknown_days}</dd></div></dl>
      </article>)}
      <p className="help">Assumed and projected counts can overlap. Period dates describe the containing test period, not a recommendation to stay abroad continuously.</p>
      {report.coverage.length > 0 && <details><summary>Tax-year dates covered</summary><ul>{report.coverage.map(segment => <li key={segment.start_date}>{segment.start_date} to {segment.end_date}</li>)}</ul></details>}
      <div className="actions"><button className="secondary" onClick={copy}>Copy preparer report</button>
        <button onClick={exportPdf} disabled={exporting}>{exporting ? 'Preparing PDF...' : 'Download PDF report'}</button></div>
      <p role={failed ? 'alert' : 'status'} className={failed ? 'error' : 'feedback'}>{feedback}</p>
      <details><summary>Review normalized evidence and assumptions</summary>
        <p className="help">The report includes exactly the normalized days supplied to the engine, with record identifiers and assumptions. This text is also available for manual copying.</p>
        <textarea className="report-text" aria-label="Preparer report text" readOnly value={reportText(report)} />
      </details>
      <p className="help">As of {report.as_of} (UTC). Calculation {report.calculation_version}. <a href="https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion-physical-presence-test" target="_blank" rel="noreferrer">IRS physical-presence rules</a>.</p>
    </section>
  );
}
