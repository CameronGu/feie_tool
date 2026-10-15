import { describe, expect, it } from 'vitest';
import { estimateIncomeIllustration, illustrationTaxYear, rateScheduleTax } from '../incomeIllustration';

const data = illustrationTaxYear(2026);
describe('isolated 2026 income illustration', () => {
  it.each([
    [60000, 5020, 0, 5020], [120000, 17570, 0, 17570],
    [180000, 31934, 7440, 24494], [250000, 51304, 26810, 24494]
  ])('matches the rate-schedule reference at salary %i', (salary, without, withFeie, difference) => {
    const result = estimateIncomeIllustration(salary, data);
    expect(result.withoutFeie).toBeCloseTo(without, 6);
    expect(result.withFeie).toBeCloseTo(withFeie, 6);
    expect(result.difference).toBeCloseTo(difference, 6);
  });
  it.each([[0, 0], [16100, 0], [16101, .1], [132899, 20629.76], [132900, 20630], [132901, 20630.24]])(
    'handles deduction and exclusion boundaries at %i', (salary, without) => {
      const result = estimateIncomeIllustration(salary, data);
      expect(result.withoutFeie).toBeCloseTo(without, 6);
      expect(result.withFeie).toBe(0);
      expect(result.excluded).toBe(Math.min(salary, 132900));
    });
  it('applies the deduction to remaining income, then stacks at 24% after the exclusion', () => {
    expect(estimateIncomeIllustration(149000, data).withFeie).toBe(0);
    expect(estimateIncomeIllustration(149001, data).withFeie).toBeCloseTo(.24, 6);
    // Taxing the $31,000 remaining at the bottom brackets would incorrectly produce $3,472.
    expect(estimateIncomeIllustration(180000, data).withFeie).toBeCloseTo(31000 * .24, 6);
  });
  it.each([
    [12400, 1240, .10, .12], [50400, 5800, .12, .22],
    [105700, 17966, .22, .24], [201775, 41024, .24, .32],
    [256225, 58448, .32, .35], [640600, 192979.25, .35, .37]
  ])('is continuous at taxable income %i with the published marginal rates', (threshold, base, below, above) => {
    expect(rateScheduleTax(threshold, data)).toBeCloseTo(base, 6);
    expect(rateScheduleTax(threshold - 1, data)).toBeCloseTo(base - below, 6);
    expect(rateScheduleTax(threshold + 1, data)).toBeCloseTo(base + above, 6);
    const at = estimateIncomeIllustration(threshold + data.singleStandardDeduction, data);
    expect(at.withoutFeie).toBeCloseTo(base, 6);
  });
  it('keeps estimates bounded and continuous across the slider range', () => {
    let previous = estimateIncomeIllustration(30000, data);
    for (let salary = 35000; salary <= 250000; salary += 5000) {
      const current = estimateIncomeIllustration(salary, data);
      expect(current.withoutFeie).toBeGreaterThanOrEqual(previous.withoutFeie);
      expect(current.withFeie).toBeGreaterThanOrEqual(previous.withFeie);
      expect(current.withFeie).toBeLessThanOrEqual(current.withoutFeie);
      expect(current.difference).toBeGreaterThanOrEqual(0);
      previous = current;
    }
  });
  it.each([-1, Infinity, NaN])('rejects invalid salary %s', salary => {
    expect(() => estimateIncomeIllustration(salary, data)).toThrow('finite, nonnegative');
  });
  it('uses a complete current-year dataset or clearly falls back to the latest verified year', () => {
    expect(data.year).toBe(2026);
    expect(illustrationTaxYear(2027)).toBe(data);
    expect(illustrationTaxYear(2025)).toBe(data);
    expect(data.sources.every(source => source.url.startsWith('https://www.irs.gov/'))).toBe(true);
  });
});
