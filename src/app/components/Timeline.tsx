import { diffDaysInclusive } from '../../domain/dates';
import type { QualifiedWindow } from '../../domain/types';

interface TimelineProps {
  windows?: QualifiedWindow[];
}

export function Timeline({ windows }: TimelineProps) {
  if (!windows || windows.length === 0) {
    return null;
  }

  return (
    <div className="timeline">
      <h3>Optimized windows</h3>
      <p className="help-text">Each interval below ties for the strongest tax-year coverage that still delivers at least 330 foreign days.</p>
      {windows.map(window => {
        const span = diffDaysInclusive(window.window_start, window.window_end);
        const foreignPercent = span > 0 ? Math.min(100, (window.foreign_days / span) * 100) : 0;
        const overlapPercent = span > 0 ? Math.min(100, (window.overlap_days / span) * 100) : 0;

        return (
          <div key={`${window.window_start}-${window.window_end}`} className="timeline-row">
            <div className="timeline-label">
              <span>
                {window.window_start} → {window.window_end}
              </span>
              <span>{window.foreign_days} foreign days</span>
            </div>
            <div className="bar">
              <div className="bar-total">
                <div className="bar-foreign" style={{ width: `${foreignPercent}%` }} />
                <div className="bar-overlap" style={{ width: `${overlapPercent}%` }} />
              </div>
            </div>
            <div className="timeline-meta">
              <span>Tax-year overlap: {window.overlap_days} days</span>
              <span>Pro-rata: {(window.pro_rata_fraction * 100).toFixed(2)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
