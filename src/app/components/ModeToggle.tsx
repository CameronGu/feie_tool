import type { Mode } from '../hooks/useCalculator';

interface ModeToggleProps {
  mode: Mode;
  onModeChange(mode: Mode): void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
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
    </div>
  );
}
