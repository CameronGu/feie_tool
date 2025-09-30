import type { Mode } from '../hooks/useCalculator';

interface ModeToggleProps {
  mode: Mode;
  planningMode: boolean;
  onModeChange(mode: Mode): void;
  onPlanningToggle(): void;
}

export function ModeToggle({ mode, planningMode, onModeChange, onPlanningToggle }: ModeToggleProps) {
  return (
    <div className="card">
      <h2>Input Mode</h2>
      <div className="toggle-row">
        <label>
          <input
            type="radio"
            name="mode"
            value="FOREIGN_PERIODS"
            checked={mode === 'FOREIGN_PERIODS'}
            onChange={() => onModeChange('FOREIGN_PERIODS')}
          />
          Foreign travel periods
        </label>
        <label>
          <input
            type="radio"
            name="mode"
            value="US_PERIODS"
            checked={mode === 'US_PERIODS'}
            onChange={() => onModeChange('US_PERIODS')}
          />
          US travel periods
        </label>
      </div>

      <div className="toggle-row">
        <label>
          <input type="checkbox" checked={planningMode} onChange={onPlanningToggle} /> Planning mode
        </label>
        <p className="help-text">Show remaining days and optimal start dates for upcoming travel.</p>
      </div>
    </div>
  );
}
