import { type ChangeEvent } from 'react';
import type { Mode } from '../hooks/useCalculator';

interface ModeToggleProps {
  mode: Mode;
  onModeChange(mode: Mode, event: ChangeEvent<HTMLInputElement>): void;
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
            onChange={event => onModeChange('FOREIGN_PERIODS', event)}
          />
          Foreign travel periods
        </label>
        <label>
          <input
            type="radio"
            name="mode"
            value="US_PERIODS"
            checked={mode === 'US_PERIODS'}
            onChange={event => onModeChange('US_PERIODS', event)}
          />
          US travel periods
        </label>
      </div>
    </div>
  );
}
