import { useState } from 'react';
import { estimateIncomeIllustration, illustrationTaxYear } from '../../services/incomeIllustration';

const money = (amount: number) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0
}).format(amount);
const MIN_SALARY = 30000;
const MAX_SALARY = 250000;

export function IncomeIllustration() {
  const [data] = useState(() => illustrationTaxYear(new Date().getFullYear()));
  const [salary, setSalary] = useState(120000);
  const [draft, setDraft] = useState('120000');
  const [expanded, setExpanded] = useState(false);
  const valid = draft.trim() !== '' && Number.isFinite(Number(draft)) &&
    Number(draft) >= MIN_SALARY && Number(draft) <= MAX_SALARY && Number.isInteger(Number(draft));
  const result = estimateIncomeIllustration(salary, data);
  const scale = Math.max(result.withoutFeie, result.withFeie, 1);
  function changeSalary(value: number) { setSalary(value); setDraft(String(value)); }
  return <section id="income-example" className="panel income-example" aria-labelledby="income-heading">
    <div className="income-heading"><h2 id="income-heading">Why track your days abroad?</h2>
      <span>{data.year} tax example{data.year !== new Date().getFullYear() ? ' · latest supported figures' : ''}</span></div>
    <p className="income-difference"><strong>~{money(Math.round(result.difference / 500) * 500)}</strong> less in federal income tax</p>
    <p className="income-premise">Assumes {money(salary)} earned abroad, full-year FEIE eligibility and single filing status. Separate from your travel year.</p>
    <button type="button" className="secondary income-disclosure" aria-expanded={expanded} aria-controls="income-example-controls"
      onClick={() => setExpanded(value => !value)}>{expanded ? 'Hide income controls and calculation' : 'Adjust income and see the calculation'}</button>
    <div id="income-example-controls" data-expanded={expanded}>
    <div className="income-controls">
      <div><label htmlFor="example-salary">Annual salary <span className="optional">(USD)</span></label>
        <input id="example-salary" type="number" inputMode="numeric" min={MIN_SALARY} max={MAX_SALARY} step={1}
          value={draft} aria-invalid={!valid} aria-describedby="salary-help salary-error" onChange={event => {
            const value = event.target.value; setDraft(value);
            const amount = Number(value);
            if (value.trim() && Number.isInteger(amount) && amount >= MIN_SALARY && amount <= MAX_SALARY) setSalary(amount);
          }} /></div>
      <div><label className="sr-only" htmlFor="example-salary-slider">Adjust annual salary</label>
        <input id="example-salary-slider" type="range" min={MIN_SALARY} max={MAX_SALARY} step={1}
          value={salary} aria-valuetext={`${money(salary)} annual salary`} aria-describedby="salary-help"
          onChange={event => changeSalary(Math.round(Number(event.target.value) / 5000) * 5000)}
          onKeyDown={event => {
            const increments: Record<string, number> = { ArrowRight: 5000, ArrowUp: 5000, ArrowLeft: -5000, ArrowDown: -5000, PageUp: 25000, PageDown: -25000 };
            if (event.key in increments) {
              event.preventDefault(); changeSalary(Math.max(MIN_SALARY, Math.min(MAX_SALARY, salary + increments[event.key])));
            }
          }} />
        <div className="range-labels" aria-hidden="true"><span>$30,000</span><span>$250,000</span></div></div>
    </div>
    <p className="sr-only" id="salary-help">Move the slider in $5,000 steps or type an exact whole-dollar amount. This example isn’t saved or included in travel reports.</p>
    <p className="error" id="salary-error">{!valid && 'Enter a whole-dollar salary from $30,000 to $250,000. Estimates below use the last valid amount.'}</p>
    <div className="tax-comparison" role="group" aria-label={`Estimated regular federal income tax at ${money(salary)} salary`}>
      {[{ label: 'Without FEIE', amount: result.withoutFeie }, { label: 'With FEIE', amount: result.withFeie }].map(row =>
        <div className="tax-bar-row" key={row.label}><div><span>{row.label}</span><strong>Approximately {money(row.amount)}</strong></div>
          <div className="tax-bar-track" aria-hidden="true"><div className="tax-bar" style={{ width: `${100 * row.amount / scale}%` }} /></div></div>)}
    </div>
    <details><summary>How was this calculated?</summary>
      <p>One way to qualify is to spend at least 330 full days in foreign countries during 12 consecutive months. Your U.S. visits can affect whether you meet that requirement. Travel dates alone do not establish full FEIE eligibility.</p>
      <p>For {data.year}, this assumes single filing status, full-year FEIE eligibility including a foreign tax home, a {money(data.singleStandardDeduction)} standard deduction and an annual FEIE maximum of {money(data.maximumFeie)}.</p>
      <p>The example excludes {money(result.excluded)} of the {money(salary)} salary. It compares estimated regular federal income tax with FEIE against a hypothetical calculation with no FEIE or other income-tax relief.</p>
      <p><strong>Tax-rate stacking:</strong> income left after FEIE keeps the rates that would apply if the excluded income were still present. We calculate tax on remaining taxable income plus the exclusion, then subtract tax on the exclusion. The remaining income doesn’t start over in the lowest bracket.</p>
      <p>We use continuous rate schedules rather than IRS tax-table rounding. The potential difference is rounded to the nearest $500. As salary rises above the exclusion limit, some income remains taxable, so the difference doesn’t grow in direct proportion to salary.</p>
      <div className="table-scroll"><table className="bracket-table"><caption>{data.year} single-filer marginal rates on taxable income</caption>
        <thead><tr><th scope="col">Taxable income band</th><th scope="col">Rate</th></tr></thead>
        <tbody>{data.brackets.map((bracket, index) => <tr key={bracket.from}>
          <td>{index === 0 ? 'Up to' : 'Over'} {money(index === 0 ? data.brackets[1].from : bracket.from)}{index > 0 && data.brackets[index + 1] ? ` through ${money(data.brackets[index + 1].from)}` : ''}</td><td>{bracket.rate * 100}%</td>
        </tr>)}</tbody></table></div>
      <p>No other income, deductions, credits or special adjustments are included. This excludes foreign housing relief, foreign tax credits, payroll taxes, self-employment tax, state taxes and foreign taxes. It doesn’t compare alternative tax relief or estimate your total tax liability.</p>
      <ul>{data.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}</a></li>)}</ul>
    </details>
    </div>
  </section>;
}
