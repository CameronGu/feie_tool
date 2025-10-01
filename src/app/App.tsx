import { useState, type ChangeEvent } from 'react';
import { useCalculator, type Mode } from './hooks/useCalculator';
import { ModeToggle } from './components/ModeToggle';
import { TaxYearSelector } from './components/TaxYearSelector';
import { PeriodsEditor } from './components/PeriodsEditor';
import { ResultsPanel } from './components/ResultsPanel';
import './styles/app.css';

export function App() {
  const calculator = useCalculator();
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);

  const handleModeChange = (mode: Mode, event: ChangeEvent<HTMLInputElement>) => {
    if (mode === calculator.state.mode) {
      return;
    }

    const sourceRows =
      calculator.state.mode === 'US_PERIODS' ? calculator.state.usPeriods : calculator.state.foreignPeriods;
    const hasFilled = sourceRows.some(row => row.start_date || row.end_date);

    if (hasFilled) {
      event.preventDefault();
      setPendingMode(mode);
      return;
    }

    calculator.setMode(mode);
  };

  const closeModeDialog = () => {
    setPendingMode(null);
  };

  const confirmLiteralTransfer = () => {
    if (!pendingMode) {
      return;
    }
    calculator.setMode(pendingMode, { strategy: 'literal' });
    setPendingMode(null);
  };

  const confirmConvertedTransfer = () => {
    if (!pendingMode) {
      return;
    }
    calculator.setMode(pendingMode, { strategy: 'convert' });
    setPendingMode(null);
  };

  const targetLabel = pendingMode === 'US_PERIODS' ? 'US travel' : 'foreign travel';

  return (
    <div className="app-shell">
      <header>
        <h1>FEIE Window Optimizer</h1>
        <p>Plan and validate your Foreign Earned Income Exclusion 12-month windows.</p>
      </header>

      <section className="input-grid">
        <div className="panel">
          <ModeToggle
            mode={calculator.state.mode}
            onModeChange={handleModeChange}
          />

          <TaxYearSelector
            taxYear={calculator.state.taxYear}
            taxYearOptions={calculator.taxYearOptions}
            taxYearStart={calculator.taxYearStart}
            taxYearEnd={calculator.taxYearEnd}
            error={calculator.errors.tax_year}
            onChange={calculator.setTaxYear}
          />

          <PeriodsEditor
            mode={calculator.state.mode}
            taxYear={calculator.state.taxYear}
            taxYearStart={calculator.taxYearStart}
            taxYearEnd={calculator.taxYearEnd}
            coverageStart={calculator.coverageStart}
            coverageEnd={calculator.coverageEnd}
            periods={calculator.activePeriods}
            errors={calculator.errors}
            onAdd={calculator.addPeriod}
            onRemove={calculator.removePeriod}
            onChange={calculator.updatePeriod}
            onCommitRange={(start, end) => calculator.commitInterval({ start_date: start, end_date: end })}
            onClearAll={calculator.clearPeriods}
          />

          {calculator.errors.general && (
            <div className="error-banner">{calculator.errors.general}</div>
          )}
        </div>

        <ResultsPanel result={calculator.result} planning={calculator.state.planningMode} />
      </section>

      {pendingMode && (
        <div className="mode-switch-overlay" role="dialog" aria-modal="true" aria-labelledby="mode-switch-title">
          <div className="mode-switch-dialog">
            <h2 id="mode-switch-title">Switch input mode?</h2>
            <p>
              You already captured intervals in this mode. Choose how to carry them into the {targetLabel} input.
            </p>
            <div className="mode-switch-actions">
              <button type="button" className="secondary" onClick={confirmLiteralTransfer}>
                Keep same date ranges
              </button>
              <button type="button" onClick={confirmConvertedTransfer}>
                Convert for new mode
              </button>
              <button type="button" className="ghost" onClick={closeModeDialog}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
