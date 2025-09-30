import type { Mode, PeriodFormRow, ValidationErrors } from '../hooks/useCalculator';
import { RangePlanner } from './RangePlanner';

interface PeriodsEditorProps {
  mode: Mode;
  taxYear: number;
  taxYearStart: string;
  taxYearEnd: string;
  coverageStart: string;
  coverageEnd: string;
  periods: PeriodFormRow[];
  errors: ValidationErrors;
  onAdd(): void;
  onRemove(id: string): void;
  onChange(id: string, field: 'start_date' | 'end_date', value: string): void;
  onCommitRange(start: string, end: string): void;
  onClearAll(): void;
}

const LABELS: Record<Mode, string> = {
  FOREIGN_PERIODS: 'Foreign travel intervals',
  US_PERIODS: 'US presence intervals'
};

export function PeriodsEditor({
  mode,
  taxYear,
  taxYearStart,
  taxYearEnd,
  coverageStart,
  coverageEnd,
  periods,
  errors,
  onAdd,
  onRemove,
  onChange,
  onCommitRange,
  onClearAll
}: PeriodsEditorProps) {
  return (
    <div className="card">
      <div className="sheet-header">
        <h2>{LABELS[mode]}</h2>
        <button type="button" onClick={onAdd} className="secondary">
          + Add interval
        </button>
      </div>

      <RangePlanner
        mode={mode}
        taxYear={taxYear}
        coverageStart={coverageStart}
        coverageEnd={coverageEnd}
        periods={periods}
        onRangeSelected={(start, end) => onCommitRange(start, end)}
      />

      <p className="help-text">
        {mode === 'US_PERIODS'
          ? 'Intervals added here represent days spent in the U.S. from one year before through one year after the selected tax year. Use the calendar or edit the fields below to fine-tune each stay.'
          : 'Add your time abroad across the eligible window (one year before through one year after the selected tax year). We will invert these intervals into U.S. presence automatically.'}
      </p>

      <div className="manual-actions">
        <button type="button" className="ghost" onClick={onClearAll}>
          Clear all intervals
        </button>
        <button type="button" className="secondary" onClick={onAdd}>
          + Add another interval
        </button>
      </div>

      {periods.map((row, index) => {
        const rowError = errors[`period_${index}`];
        return (
          <div key={row.id} className="period-row">
            <div className="field">
              <label>Start</label>
              <input
                type="date"
                min={coverageStart}
                max={coverageEnd}
                value={row.start_date}
                onChange={event => onChange(row.id, 'start_date', event.target.value)}
              />
            </div>
            <div className="field">
              <label>End</label>
              <input
                type="date"
                min={coverageStart}
                max={coverageEnd}
                value={row.end_date}
                onChange={event => onChange(row.id, 'end_date', event.target.value)}
              />
            </div>
            <button type="button" className="ghost" onClick={() => onRemove(row.id)} disabled={periods.length === 1}>
              Remove
            </button>
            {rowError && <div className="error">{rowError}</div>}
          </div>
        );
      })}
    </div>
  );
}
