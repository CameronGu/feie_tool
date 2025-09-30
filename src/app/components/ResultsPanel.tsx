import type { CalculatorOutput } from '../../domain/types';
import { Timeline } from './Timeline';

interface ResultsPanelProps {
  result: CalculatorOutput | null;
  planning: boolean;
}

export function ResultsPanel({ result, planning }: ResultsPanelProps) {
  if (!result) {
    return (
      <aside className="panel results">
        <h2>Results</h2>
        <p>Enter tax year dates and travel intervals to see FEIE qualification analysis.</p>
      </aside>
    );
  }

  const status = result.qualified ? 'Qualified' : 'Not qualified yet';
  const tone = result.qualified ? 'status ok' : 'status warning';

  return (
    <aside className="panel results">
      <h2>Results</h2>
      <div className={tone}>{status}</div>
      <div className="field">
        <span>Total tax-year days</span>
        <strong>{result.total_tax_year_days ?? '—'}</strong>
      </div>

      {result.best_windows && result.best_windows.length > 0 ? (
        <Timeline windows={result.best_windows} />
      ) : (
        <p>No qualifying windows identified yet. Adjust travel intervals or enable planning mode for guidance.</p>
      )}

      {result.planning_info && (
        <div className="planning">
          <h3>Planning Insights</h3>
          <p>
            Foreign days needed: <strong>{result.planning_info.us_days_remaining}</strong>
          </p>
          {result.planning_info.optimal_starts.length > 0 ? (
            <ul>
              {result.planning_info.optimal_starts.map(date => (
                <li key={date}>{date}</li>
              ))}
            </ul>
          ) : (
            <p>{planning ? 'All goals met for selected windows.' : 'Enable planning mode to see optimal starts.'}</p>
          )}
        </div>
      )}

      {result.error && <div className="error">{result.error.message}</div>}
    </aside>
  );
}
