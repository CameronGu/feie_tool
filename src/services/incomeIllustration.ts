/** Educational rate-schedule example only. Independent of travel, storage and reports. */
export interface IllustrationTaxYear {
  year: number;
  maximumFeie: number;
  singleStandardDeduction: number;
  brackets: readonly { from: number; rate: number }[];
  sources: readonly { label: string; url: string }[];
}

// Verified 2026-10-13. Rev. Proc. 2025-32 §4.01 table 3, §4.14(1), §4.39.
// Add a year only after verifying all values. No complete official 2027 dataset found.
export const ILLUSTRATION_TAX_YEARS: readonly IllustrationTaxYear[] = [{
  year: 2026,
  maximumFeie: 132900,
  singleStandardDeduction: 16100,
  brackets: [
    { from: 0, rate: .10 }, { from: 12400, rate: .12 },
    { from: 50400, rate: .22 }, { from: 105700, rate: .24 },
    { from: 201775, rate: .32 }, { from: 256225, rate: .35 },
    { from: 640600, rate: .37 }
  ],
  sources: [
    { label: 'IRS 2026 rates, deduction and FEIE limit (Rev. Proc. 2025-32)', url: 'https://www.irs.gov/irb/2025-45_IRB#REV-PROC-2025-32' },
    { label: 'IRS Foreign Earned Income Tax Worksheet (Form 1040 instructions)', url: 'https://www.irs.gov/instructions/i1040gi' }
  ]
}];

export function illustrationTaxYear(calendarYear: number): IllustrationTaxYear {
  return ILLUSTRATION_TAX_YEARS.find(data => data.year === calendarYear)
    ?? ILLUSTRATION_TAX_YEARS.reduce((latest, data) => data.year > latest.year ? data : latest);
}

export function rateScheduleTax(taxableIncome: number, data: IllustrationTaxYear): number {
  return data.brackets.reduce((tax, bracket, index) => {
    const end = data.brackets[index + 1]?.from ?? Infinity;
    return tax + Math.max(0, Math.min(taxableIncome, end) - bracket.from) * bracket.rate;
  }, 0);
}

export function estimateIncomeIllustration(salary: number, data: IllustrationTaxYear) {
  if (!Number.isFinite(salary) || salary < 0) throw new Error('Salary must be a finite, nonnegative amount.');
  const excluded = Math.min(salary, data.maximumFeie);
  const taxableWithout = Math.max(0, salary - data.singleStandardDeduction);
  const taxableWith = Math.max(0, salary - excluded - data.singleStandardDeduction);
  const withoutFeie = rateScheduleTax(taxableWithout, data);
  // Worksheet lines 1–6: tax(taxable remaining + exclusion) − tax(exclusion).
  // No related itemized deductions, housing amounts or other income in this scenario.
  const withFeie = Math.max(0, rateScheduleTax(taxableWith + excluded, data) - rateScheduleTax(excluded, data));
  return { excluded, withoutFeie, withFeie, difference: withoutFeie - withFeie };
}
