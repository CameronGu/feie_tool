import type { ValidationErrors } from '../hooks/useCalculator';

interface TaxYearFieldsProps {
  taxYearStart: string;
  taxYearEnd: string;
  errors: ValidationErrors;
  onStartChange(value: string): void;
  onEndChange(value: string): void;
}

export function TaxYearFields({ taxYearStart, taxYearEnd, errors, onStartChange, onEndChange }: TaxYearFieldsProps) {
  return (
    <div className="card">
      <h2>Tax Year</h2>
      <div className="field">
        <label htmlFor="tax-year-start">Start date</label>
        <input
          id="tax-year-start"
          type="date"
          value={taxYearStart}
          onChange={event => onStartChange(event.target.value)}
        />
        {errors.tax_year_start && <div className="error">{errors.tax_year_start}</div>}
      </div>
      <div className="field">
        <label htmlFor="tax-year-end">End date</label>
        <input id="tax-year-end" type="date" value={taxYearEnd} onChange={event => onEndChange(event.target.value)} />
        {errors.tax_year_end && <div className="error">{errors.tax_year_end}</div>}
      </div>
    </div>
  );
}
