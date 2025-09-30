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
  const primaryWindow = result.best_windows?.[0];
  const additionalCount = result.best_windows ? result.best_windows.length - 1 : 0;

  return (
    <aside className="panel results">
      <h2>Results</h2>
      <div className={tone}>{status}</div>
      <div className="field">
        <span>Total tax-year days</span>
        <strong>{result.total_tax_year_days ?? '—'}</strong>
      </div>

      {primaryWindow && (
        <div className="optimized-copy">
          <h3>Optimized FEIE window</h3>
          <p>
            We evaluated every possible 12-month combination to lock in the window that shields the most of your {primaryWindow.overlap_days}{' '}
            tax-year days. Stay abroad from <strong>{primaryWindow.window_start}</strong> through <strong>{primaryWindow.window_end}</strong> to
            capture the maximum FEIE benefit.
          </p>
          {additionalCount > 0 && (
            <p>
              We also found {additionalCount} other {additionalCount === 1 ? 'window' : 'windows'} with the same coverage—check the timeline for
              alternate date ranges that still qualify.
            </p>
          )}
        </div>
      )}

      {result.best_windows && result.best_windows.length > 0 ? (
        <Timeline windows={result.best_windows} />
      ) : (
        <p>
          We analyzed every 12-month window in this range, but none of them reached 330 foreign days. Adjust your travel plan or enable planning mode
          to see how many additional days you need.
        </p>
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
