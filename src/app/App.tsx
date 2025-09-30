import { useCalculator } from './hooks/useCalculator';
import { ModeToggle } from './components/ModeToggle';
import { TaxYearSelector } from './components/TaxYearSelector';
import { PeriodsEditor } from './components/PeriodsEditor';
import { ResultsPanel } from './components/ResultsPanel';
import './styles/app.css';

export function App() {
  const calculator = useCalculator();

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
            onModeChange={calculator.setMode}
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
    </div>
  );
}

export default App;
