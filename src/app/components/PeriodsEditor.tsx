import type { Mode, PeriodFormRow, ValidationErrors } from '../hooks/useCalculator';

interface PeriodsEditorProps {
  mode: Mode;
  periods: PeriodFormRow[];
  errors: ValidationErrors;
  onAdd(): void;
  onRemove(id: string): void;
  onChange(id: string, field: 'start_date' | 'end_date', value: string): void;
}

const LABELS: Record<Mode, string> = {
  FOREIGN_PERIODS: 'Foreign travel intervals',
  US_PERIODS: 'US presence intervals'
};

export function PeriodsEditor({ mode, periods, errors, onAdd, onRemove, onChange }: PeriodsEditorProps) {
  return (
    <div className="card">
      <div className="sheet-header">
        <h2>{LABELS[mode]}</h2>
        <button type="button" onClick={onAdd} className="secondary">
          + Add interval
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
                value={row.start_date}
                onChange={event => onChange(row.id, 'start_date', event.target.value)}
              />
            </div>
            <div className="field">
              <label>End</label>
              <input
                type="date"
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
