import { enumerateWindows, evaluateFeie, type FeieComputationResult } from '../domain/feie';
import { addDays } from '../domain/dates';
import { normalizeHistory, segmentDaysWithin, type NormalizedHistory, type TravelHistory } from '../domain/history';

export type AssessmentStatus = 'met' | 'conditional' | 'projected' | 'incomplete' | 'not-met' | 'review-required';
export interface TravelAssessment {
  status: AssessmentStatus;
  normalized: NormalizedHistory;
  calculation: FeieComputationResult;
  relevantUnknownDays: number;
  assumedForeignDays: number;
  projectedForeignDays: number;
  maxPossibleForeignDays: number;
  possibleWindow: FeieComputationResult['closestWindow'];
  hasEvidence: boolean;
}

export function assessTravel(history: TravelHistory, year: number, asOf: string, includeProposals = false): TravelAssessment {
  const normalized = normalizeHistory(history, year, asOf, includeProposals);
  const calculation = evaluateFeie(normalized.input);
  const support = calculation.qualified ? calculation.supportingWindows : [calculation.closestWindow];
  // A segment may intersect multiple supporting periods; count its dates once.
  const relevantSegments = normalized.segments.filter(segment => support.some(window =>
    segmentDaysWithin(segment, { start_date: window.window_start, end_date: window.window_end }) > 0));
  const daysMatching = (test: (segment: NormalizedHistory['segments'][number]) => boolean) => {
    let count = 0;
    for (const segment of relevantSegments.filter(test)) {
      for (let day = segment.start_date; day <= segment.end_date;) {
        if (support.some(window => day >= window.window_start && day <= window.window_end)) count += 1;
        // Segment length is bounded by the approximately three-year evaluation horizon.
        day = addDays(day, 1);
      }
    }
    return count;
  };
  const relevantUnknownDays = daysMatching(segment => segment.kind === 'unknown');
  const assumedForeignDays = daysMatching(segment => segment.kind === 'foreign' && segment.basis === 'assumed');
  const projectedForeignDays = daysMatching(segment => segment.kind === 'foreign' && segment.projected);
  // Upper bound: every unresolved, elapsed date could be foreign. Future days cannot
  // establish completed presence, even when normalization labels them unknown.
  const possiblePeriods = normalized.segments.filter(segment => segment.kind === 'foreign' || segment.kind === 'unknown')
    .filter(segment => includeProposals || segment.start_date < asOf)
    .map(segment => ({ start_date: segment.start_date,
      end_date: !includeProposals && segment.end_date >= asOf ? addDays(asOf, -1) : segment.end_date }));
  const possibleWindow = enumerateWindows({ ...normalized.input, foreignPeriods: possiblePeriods })
    .sort((a, b) => b.foreign_days - a.foreign_days || b.overlap_days - a.overlap_days || a.window_start.localeCompare(b.window_start))[0];
  const maxPossibleForeignDays = possibleWindow.foreign_days;
  const hasEvidence = normalized.segments.some(segment => segment.basis !== 'unrecorded');
  const projectedPeriod = support.some(window => window.window_end >= asOf);
  const status: AssessmentStatus = calculation.leapDayReview ? 'review-required' :
    calculation.qualified ? projectedForeignDays > 0 || projectedPeriod ? 'projected' : assumedForeignDays > 0 ? 'conditional' : 'met' :
    maxPossibleForeignDays >= 330 ? 'incomplete' : 'not-met';
  return { status, normalized, calculation, relevantUnknownDays, assumedForeignDays, projectedForeignDays, maxPossibleForeignDays, possibleWindow, hasEvidence };
}
