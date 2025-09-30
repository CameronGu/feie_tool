import { useCalculator } from './hooks/useCalculator';
import { ModeToggle } from './components/ModeToggle';
import { TaxYearFields } from './components/TaxYearFields';
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
            planningMode={calculator.state.planningMode}
            onModeChange={calculator.setMode}
            onPlanningToggle={calculator.togglePlanningMode}
          />

          <TaxYearFields
            taxYearStart={calculator.state.taxYearStart}
            taxYearEnd={calculator.state.taxYearEnd}
            errors={calculator.errors}
            onStartChange={calculator.setTaxYearStart}
            onEndChange={calculator.setTaxYearEnd}
          />

          <PeriodsEditor
            mode={calculator.state.mode}
            periods={calculator.activePeriods}
            errors={calculator.errors}
            onAdd={calculator.addPeriod}
            onRemove={calculator.removePeriod}
            onChange={calculator.updatePeriod}
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
