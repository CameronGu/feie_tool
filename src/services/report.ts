import { diffDaysInclusive } from '../domain/dates';
import { segmentDaysWithin, type PresenceSegment, type TravelRecord } from '../domain/history';
import type { Interval, QualifiedWindow } from '../domain/types';
import type { TravelAssessment } from './travelCalculator';
import { APP_VERSION, CALCULATION_VERSION } from '../version';

export const STATUS_LABELS = {
  met: 'Physical-presence threshold met',
  conditional: 'Threshold met under declared assumptions',
  projected: 'Projected physical-presence coverage',
  incomplete: 'Incomplete travel evidence',
  'not-met': 'Physical-presence threshold not met',
  'review-required': 'Leap-day interpretation requires review'
} as const;

export const KIND_LABELS = {
  foreign: 'Full foreign days', foreign_assumption: 'Declared foreign presence',
  us: 'U.S. visit', nonqualifying: 'Other nonqualifying days', unknown: 'Unknown days'
} as const;

export interface PeriodEvidence extends QualifiedWindow {
  calendar_days: number;
  recorded_foreign_days: number;
  assumed_foreign_days: number;
  projected_foreign_days: number;
  unknown_days: number;
}

export interface TravelReport {
  title: 'FEIE Window Optimizer';
  app_version: string;
  calculation_version: string;
  tax_year: number;
  as_of: string;
  generated_at: string;
  scenario: boolean;
  example: boolean;
  status: TravelAssessment['status'];
  status_label: string;
  qualifying_days: number;
  tax_year_days: number;
  fraction: number;
  coverage: Interval[];
  supporting_periods: PeriodEvidence[];
  closest_period: PeriodEvidence;
  qualifying_period_count: number;
  horizon: Interval;
  segments: PresenceSegment[];
  records: TravelRecord[];
  notes: string[];
  leap_day_review: TravelAssessment['calculation']['leapDayReview'];
}

export function buildReport(assessment: TravelAssessment, generatedAt = new Date().toISOString()): TravelReport {
  const { normalized, calculation } = assessment;
  const evidence = (window: QualifiedWindow): PeriodEvidence => {
    const interval = { start_date: window.window_start, end_date: window.window_end };
    const count = (predicate: (segment: PresenceSegment) => boolean) => normalized.segments
      .filter(predicate).reduce((sum, segment) => sum + segmentDaysWithin(segment, interval), 0);
    return {
      ...window,
      calendar_days: diffDaysInclusive(window.window_start, window.window_end),
      recorded_foreign_days: count(segment => segment.kind === 'foreign' && segment.basis === 'recorded' && !segment.projected),
      assumed_foreign_days: count(segment => segment.kind === 'foreign' && segment.basis === 'assumed'),
      projected_foreign_days: count(segment => segment.kind === 'foreign' && segment.projected),
      unknown_days: count(segment => segment.kind === 'unknown')
    };
  };
  return {
    title: 'FEIE Window Optimizer', app_version: APP_VERSION, calculation_version: CALCULATION_VERSION,
    tax_year: Number(normalized.input.taxYearStart.slice(0, 4)), as_of: normalized.as_of, generated_at: generatedAt,
    scenario: normalized.includes_proposals, example: false, status: assessment.status, status_label: STATUS_LABELS[assessment.status],
    qualifying_days: calculation.qualifyingDays, tax_year_days: calculation.totalTaxYearDays, fraction: calculation.coverageFraction,
    coverage: calculation.qualifyingCoverage, supporting_periods: calculation.supportingWindows.map(evidence),
    closest_period: evidence(calculation.closestWindow), qualifying_period_count: calculation.qualifyingWindowCount,
    horizon: normalized.horizon, segments: normalized.segments, records: normalized.records,
    leap_day_review: calculation.leapDayReview,
    notes: [
      'This report evaluates the ordinary physical-presence day test, not complete FEIE eligibility, actual foreign earned income or tax savings. Foreign tax home, citizenship/residency, elections and other eligibility rules require independent review.',
      'Foreign ranges use first and last FULL foreign days, inclusive. Arrival/departure, U.S. territories, extended international-water travel and uncertain days do not automatically count. Short transit between foreign countries requires checking IRS rules.',
      'Unrecorded dates remain unknown and count as zero foreign days. U.S. visits do not imply foreign presence on other dates. Declared foreign ranges are assumptions, overridden by explicit exceptions.',
      'Tax-year coverage is the union of all supported qualifying periods intersecting this calendar year. Overlapping days count once. Coverage may include U.S. days; it is different from days physically abroad and from eligible foreign income.',
      'Coverage is based on supplied evidence and can increase when missing records are supplied. The displayed fraction is conditional physical-presence coverage divided by calendar-year days, not a dollar exclusion.',
      `Completed calculation excludes proposed records and dates on or after ${normalized.as_of} (UTC reference date). Scenario calculations include those dates as projected; neither scenario records nor changing years replace completed history.`,
      'Supporting periods are chosen deterministically: cover the first uncovered day with the passing period ending latest, then repeat. This compact set covers the same union as every passing ordinary-date period.',
      'February 29 starts have an unresolved endpoint convention. Ordinary-date periods supply the baseline. A separate longer-convention sensitivity result is shown whenever it adds coverage.',
      'Form 2555 line 16 requests a single twelve-month period. Multiple supporting periods in this working report require preparer review of filing/attachment treatment. Do not enter the combined span as one twelve-month period.',
      'Sources: 26 CFR 1.911-2(d) and 1.911-3(d)(3); IRM 21.8.1.3.2(9)(d); IRS physical-presence guidance; 2025 Form 2555 instructions. Waivers, bona fide residence, special relief and monetary calculations are outside this tool.',
      'https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion-physical-presence-test',
      'https://www.irs.gov/irm/part21/irm_21-008-001r',
      'https://www.irs.gov/instructions/i2555',
      'https://www.ecfr.gov/current/title-26/section-1.911-3'
    ]
  };
}

export function reportText(report: TravelReport): string {
  const period = (window: PeriodEvidence) => [
    `${window.window_start} to ${window.window_end} (${window.calendar_days} calendar days)`,
    `Full foreign days: ${window.foreign_days} / 330 required; recorded completed: ${window.recorded_foreign_days}; assumed: ${window.assumed_foreign_days}; projected foreign: ${window.projected_foreign_days}; unknown: ${window.unknown_days}. Assumed and projected counts can overlap.`,
    `Tax-year intersection: ${window.overlap_days} days.`
  ].join('\n');
  return [report.title, 'by Cameron Guthrie',
    ...(report.example ? ['EXAMPLE REPORT: demonstration data, not your saved travel history.'] : []),
    `Calendar tax year: ${report.tax_year}`, `Assessment: ${report.status_label}`,
    `Input: ${report.scenario ? 'Scenario including proposed/future travel' : 'Completed travel only'}`,
    `As of: ${report.as_of} (UTC date); generated: ${report.generated_at}`,
    `Application ${report.app_version}; calculation ${report.calculation_version}`,
    '', 'PHYSICAL-PRESENCE COVERAGE',
    `${report.qualifying_days} / ${report.tax_year_days} = ${report.fraction.toFixed(6)} (display rounded; exact fraction shown).`,
    `Passing ordinary-date periods: ${report.qualifying_period_count}. Supporting periods: ${report.supporting_periods.length}.`,
    ...report.coverage.map(segment => `Covered: ${segment.start_date} to ${segment.end_date} (${diffDaysInclusive(segment.start_date, segment.end_date)} days).`),
    '', report.supporting_periods.length ? 'SUPPORTING TWELVE-MONTH PERIODS' : 'CLOSEST EVALUATED PERIOD (NOT QUALIFYING)',
    ...(report.supporting_periods.length ? report.supporting_periods : [report.closest_period]).map(period),
    ...(report.leap_day_review ? ['', 'LEAP-DAY REVIEW REQUIRED',
      `Longer February 29 convention could cover ${report.leap_day_review.alternative_coverage_days} tax-year days; baseline covers ${report.qualifying_days}. This alternative is not established coverage.`,
      ...report.leap_day_review.additional_windows.map(window => `${window.window_start} to ${window.window_end}: ${window.foreign_days} full foreign days.`)] : []),
    '', 'SOURCE RECORDS RELEVANT TO THE EVALUATION HORIZON',
    ...report.records.map(record => `${record.id} | ${record.start_date} to ${record.end_date} | ${KIND_LABELS[record.kind]} | ${record.status} | ${record.note || '(no note)'}`),
    ...(report.records.length ? [] : ['No recorded travel.']),
    '', `NORMALIZED DAYS ACTUALLY EVALUATED: ${report.horizon.start_date} to ${report.horizon.end_date}`,
    ...report.segments.map(segment => `${segment.start_date} to ${segment.end_date} | ${segment.kind} | ${segment.basis} | ${segment.projected ? 'projected' : 'completed/unknown'} | source ${segment.record_ids.join(', ') || 'unrecorded'}`),
    '', 'ASSUMPTIONS AND PREPARER NOTES', ...report.notes.map((note, index) => `${index + 1}. ${note}`),
    '', 'For informational use only. Not legal or tax advice.'
  ].join('\n');
}
