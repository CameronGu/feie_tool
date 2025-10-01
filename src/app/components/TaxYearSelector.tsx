import type { DateISO } from '../../domain/types';

interface TaxYearSelectorProps {
  taxYear: number;
  taxYearOptions: number[];
  taxYearStart: DateISO;
  taxYearEnd: DateISO;
  error?: string;
  onChange(year: number): void;
}

export function TaxYearSelector({
  taxYear,
  taxYearOptions,
  taxYearStart,
  taxYearEnd,
  error,
  onChange
}: TaxYearSelectorProps) {
  return (
    <div className="card">
      <h2>Tax Year</h2>
      <div className="field">
        <label htmlFor="tax-year">Select filing year</label>
        <select id="tax-year" value={taxYear} onChange={event => onChange(Number(event.target.value))}>
          {taxYearOptions.map(year => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        {error && <div className="error">{error}</div>}
      </div>
      <p className="help-text">
        Analysis assumes the standard U.S. tax year from <strong>{taxYearStart}</strong> through <strong>{taxYearEnd}</strong>.
      </p>
    </div>
  );
}
