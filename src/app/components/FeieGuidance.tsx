import { IncomeIllustration } from './IncomeIllustration';

export function DayCountsHelp() {
  return <details><summary>Why are qualifying-period days different from foreign days?</summary>
    <p><strong>Full foreign days</strong> determine whether a consecutive 12-month period reaches the 330-day threshold.</p>
    <p><strong>Qualifying-period days in the tax year</strong> determine the conditional calendar-year proration fraction. They are dates inside a supported period, including any U.S. days within it, subject to the separate tax-home and other eligibility rules.</p>
    <p>For example, December 18, 2024 to December 17, 2025 contains 330 full foreign days and 35 U.S. days. Of that qualifying period, 351 days fall in 2025. The fraction is <strong>351/365</strong>, even though some of those 351 days are U.S. days.</p>
    <p>Those U.S. days belong to the containing qualifying period; they do not count toward the 330 full foreign days. Pay for work performed in the United States does not become foreign earned income because its dates fall inside that period.</p>
    <p className="help">This fraction is a conditional share of the annual exclusion limit, not the share of your income excluded or your tax savings. Eligible income, tax home and other rules still need review. See <a href="https://www.ecfr.gov/current/title-26/section-1.911-3#p-1.911-3(d)" target="_blank" rel="noreferrer">Treasury Regulation §1.911-3(d)</a>, <a href="https://www.irs.gov/individuals/international-taxpayers/figuring-the-foreign-earned-income-exclusion" target="_blank" rel="noreferrer">current IRS proration guidance</a>, and <a href="https://www.irs.gov/pub/irs-prior/p54--2023.pdf#page=27" target="_blank" rel="noreferrer">Publication 54’s worked part-year example (2023 edition, page 27)</a>.</p>
  </details>;
}

export function FeieGuidance() {
  return <details className="feie-guidance"><summary>How FEIE works</summary>
    <div className="guidance-body">
      <p>The Foreign Earned Income Exclusion (FEIE) lets eligible U.S. citizens and resident aliens exclude some income earned from work abroad from U.S. federal income tax. If you live or work internationally, it may be relevant to your return.</p>
      <h2>Two ways to meet the time or residence requirement</h2>
      <dl className="test-comparison">
        <div><dt>Physical presence test</dt><dd>Generally, at least 330 full days in foreign countries during 12 consecutive months. This calculator checks your travel dates against that test.</dd></div>
        <div><dt>Bona fide residence test</dt><dd>Genuine residence abroad for an uninterrupted period that includes an entire tax year, with its own eligibility requirements. Temporary U.S. visits do not necessarily interrupt that residence. This calculator does not determine it.</dd></div>
      </dl>
      <p>These tests are alternatives for one FEIE requirement. Neither establishes complete eligibility on its own. The bona fide residence test is available to U.S. citizens and certain resident aliens covered by a tax treaty.</p>
      <details><summary>What is a foreign tax home?</summary>
        <p>Your tax home is generally your main place of business or work, rather than simply where you live. An abode in the United States can prevent you from having a foreign tax home; that depends on your circumstances and ties.</p>
        <p>The 330 supporting foreign days must also meet the foreign-tax-home requirement. Travel dates alone cannot establish that. This calculator does not determine tax home, eligible foreign earned income or your actual income exclusion or tax savings.</p>
      </details>
      <details><summary>What is a qualifying 12-month period?</summary>
        <p>A consecutive 12-month period can begin on any day and generally ends the day before the same date a year later. It must contain at least 330 full foreign days and overlap the tax year you’re checking.</p>
        <p>It can cross tax years, so dates from the year before or after may help support your selected year. U.S. visits do not automatically prevent a passing count if enough full foreign days remain.</p>
      </details>
      <p className="help">Read the <a href="https://www.irs.gov/publications/p54" target="_blank" rel="noreferrer">IRS Publication 54</a>, <a href="https://www.irs.gov/instructions/i2555" target="_blank" rel="noreferrer">Form 2555 instructions</a> and <a href="https://www.ecfr.gov/current/title-26/section-1.911-2" target="_blank" rel="noreferrer">Treasury Regulation §1.911-2</a> for the underlying requirements.</p>
      <IncomeIllustration />
    </div>
  </details>;
}
