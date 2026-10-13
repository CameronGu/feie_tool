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

export const TAX_HOME_NOTE = 'The 330 supporting full foreign days must also satisfy the foreign tax-home requirement. This tool has no tax-home timeline: its raw period coverage is not an established exclusion-limit numerator. Ask your preparer to verify these facts before using the fraction.';

export const TAX_HOME_EXAMPLE = 'Tax-home example: Jan 1-Nov 26, 2025 supplies 330 physical days. A foreign tax home beginning Apr 1 covers only 240 of them; without other support, these facts do not establish the joint 330-day requirement. Preparer review is required.';

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
  references: { text: string; url: string }[];
  has_evidence: boolean;
  max_possible_foreign_days: number;
  possible_period: QualifiedWindow;
  comparison?: { tax_year: number; completed_days: number; scenario_days: number; denominator: number; delta_days: number; completed_status: string };
  leap_day_review: TravelAssessment['calculation']['leapDayReview'];
}

export function buildReport(assessment: TravelAssessment, generatedAt = new Date().toISOString(), baseline?: TravelAssessment): TravelReport {
  if (baseline && (!assessment.normalized.includes_proposals || baseline.normalized.includes_proposals ||
    baseline.normalized.as_of !== assessment.normalized.as_of || baseline.normalized.input.taxYearStart !== assessment.normalized.input.taxYearStart ||
    JSON.stringify(baseline.normalized.records) !== JSON.stringify(assessment.normalized.records.filter(record => record.status === 'completed')))) {
    throw new Error('A scenario comparison requires completed evidence from the same history, tax year and reference date.');
  }
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
    has_evidence: assessment.hasEvidence, max_possible_foreign_days: assessment.maxPossibleForeignDays, possible_period: assessment.possibleWindow,
    ...(baseline ? { comparison: { tax_year: Number(normalized.input.taxYearStart.slice(0, 4)), completed_days: baseline.calculation.qualifyingDays,
      scenario_days: calculation.qualifyingDays, denominator: calculation.totalTaxYearDays,
      delta_days: calculation.qualifyingDays - baseline.calculation.qualifyingDays, completed_status: STATUS_LABELS[baseline.status] } } : {}),
    notes: [
      TAX_HOME_NOTE,
      'This is the ordinary physical-presence day test, not complete FEIE eligibility, eligible income or tax savings. Citizenship/residency, elections and other requirements need independent review.',
      'Coverage is the union of supported periods in the tax year, counting overlapping dates once. It may include U.S. days and differs from days physically abroad.',
      ...(assessment.assumedForeignDays > 0 ? ['Declared foreign presence is assumed, overridden by explicit U.S., nonqualifying and unknown exceptions.'] : []),
      ...(normalized.includes_proposals ? ['Scenario includes proposals and future continuation as projected evidence; saved completed history is retained.'] : []),
      ...(calculation.supportingWindows.length > 1 ? ['Form 2555 line 16 requests a single twelve-month period. Multiple supporting periods require preparer review of filing/attachment treatment; do not enter their combined span as one period.'] : []),
      ...(assessment.relevantUnknownDays > 0 || !calculation.qualified ? ['Unknown dates count zero toward the supported result. The possible upper bound treats unresolved elapsed dates as foreign, not as evidence.'] : []),
      ...(calculation.leapDayReview ? ['The longer February 29 endpoint convention adds possible coverage requiring preparer review; it is not established coverage.'] : [])
    ],
    references: [
      { text: '26 CFR 1.911-2(a), (d): tax home and full foreign days', url: 'https://www.ecfr.gov/current/title-26/section-1.911-2' },
      { text: '26 CFR 1.911-3(d)(3): qualifying periods and computation', url: 'https://www.ecfr.gov/current/title-26/section-1.911-3' },
      { text: 'IRM 21.8.1.3.2(9)(d): union of qualifying periods', url: 'https://www.irs.gov/irm/part21/irm_21-008-001r' },
      { text: 'IRS physical-presence guidance', url: 'https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion-physical-presence-test' },
      { text: '2025 Form 2555 instructions (line 16)', url: 'https://www.irs.gov/instructions/i2555' }
    ]
  };
}

export interface ReportSection { title: string; lines: { text: string; url?: string }[] }

/** One ordered document for clipboard and PDF. References carry clickable destinations. */
export function reportSections(report: TravelReport): ReportSection[] {
  const section = (title: string, lines: string[]): ReportSection => ({ title, lines: lines.map(text => ({ text })) });
  const period = (window: PeriodEvidence) => [
    `${window.window_start} to ${window.window_end} (${window.calendar_days} calendar days; ${window.overlap_days} days in tax year).`,
    `Full foreign days: ${window.foreign_days} / 330 required; recorded completed: ${window.recorded_foreign_days}; assumed: ${window.assumed_foreign_days}; projected foreign: ${window.projected_foreign_days}; unknown: ${window.unknown_days}.`
  ];
  const comparison = report.comparison;
  const sourceRef = (id: string) => `R${report.records.findIndex(record => record.id === id) + 1}`;
  return [
    section('SUMMARY', [
      ...(report.example ? ['EXAMPLE REPORT: demonstration data, not your saved travel history.'] : []),
      `Calendar tax year: ${report.tax_year} | Assessment: ${report.status_label}`,
      `Input: ${report.scenario ? 'Scenario including proposed/future travel' : 'Completed travel only'} | As of: ${report.as_of} (UTC).`,
      ...(!report.has_evidence ? ['No relevant travel evidence. Add full foreign days, or establish default foreign presence and record exceptions.'] : []),
      `PHYSICAL-PRESENCE COVERAGE: ${report.qualifying_days} / ${report.tax_year_days} = ${report.fraction.toFixed(6)} (display rounded; exact fraction shown).`,
      ...(comparison ? [`COMPLETED / SCENARIO COMPARISON - tax year ${comparison.tax_year}`,
        `Completed-record coverage: ${comparison.completed_days} / ${comparison.denominator} (${comparison.completed_status}).`,
        `Scenario coverage: ${comparison.scenario_days} / ${comparison.denominator}; change: ${comparison.delta_days >= 0 ? '+' : ''}${comparison.delta_days} days.`] : []),
      `Passing ordinary-date periods: ${report.qualifying_period_count}. Supporting periods: ${report.supporting_periods.length}.`,
      ...report.coverage.map(segment => `Covered: ${segment.start_date} to ${segment.end_date} (${diffDaysInclusive(segment.start_date, segment.end_date)} days).`)
    ]),
    ...(report.has_evidence ? [section(report.supporting_periods.length ? 'SUPPORTING TWELVE-MONTH PERIODS' : 'STRONGEST SUPPORTED PERIOD (NOT QUALIFYING)', [
      ...(report.supporting_periods.length ? report.supporting_periods : [report.closest_period]).flatMap(period),
      'Recorded completed excludes projected days. Assumed and projected counts can overlap.',
      ...(!report.supporting_periods.length ? [
        `Maximum possible full foreign days in any ordinary period: ${report.max_possible_foreign_days} / 330; upper-bound period ${report.possible_period.window_start} to ${report.possible_period.window_end}.`,
        report.max_possible_foreign_days < 330 ? 'Even the upper bound is below 330: ordinary threshold failure is conclusive despite missing dates.' : 'Unknown dates could change the threshold conclusion; the upper bound is not completed evidence.'
      ] : [])
    ])] : []),
    section('CASE ASSUMPTIONS AND LIMITATIONS', report.notes),
    ...(report.leap_day_review ? [section('LEAP-DAY REVIEW REQUIRED', [
      `Longer February 29 convention could cover ${report.leap_day_review.alternative_coverage_days} tax-year days; baseline covers ${report.qualifying_days}. This alternative is not established coverage.`,
      ...report.leap_day_review.additional_windows.map(window => `${window.window_start} to ${window.window_end}: ${window.foreign_days} full foreign days.`)
    ])] : []),
    section('SUPPORTING DETAILS - SOURCE RECORDS', report.records.length ? report.records.map(record =>
      `${sourceRef(record.id)} | ${record.start_date} to ${record.ongoing ? 'ongoing' : record.end_date} | ${KIND_LABELS[record.kind]} | ${record.status} | ${record.note || '(no note)'} | id: ${record.id}`) : ['No recorded travel relevant to this horizon.']),
    section(`NORMALIZED EVIDENCE: ${report.horizon.start_date} to ${report.horizon.end_date}`, [
      'Legend: foreign = full foreign day; assumed = declaration; unrecorded = unknown. R references identify source records above.',
      ...report.segments.map(segment => `${segment.start_date} to ${segment.end_date} | ${segment.kind} | ${segment.basis} | ${segment.projected ? 'projected' : 'completed/unknown'} | ${segment.record_ids.map(sourceRef).join(', ') || 'unrecorded'}`)
    ]),
    section('CALCULATION PROVENANCE', [
      `Application ${report.app_version}; calculation ${report.calculation_version}; generated: ${report.generated_at}`,
      `Completed evidence excludes dates on/after ${report.as_of} (UTC). Full foreign ranges are inclusive; exclude partial arrival/departure days. Check short-transit exceptions; territories and international waters do not automatically count.`,
      'Supporting periods deterministically cover the first uncovered tax-year day with the passing period ending latest. February 29 endpoints remain a separate sensitivity. Rules anchored to 2025 guidance; waivers, bona fide residence, special relief and monetary calculations are outside scope.',
      ...(report.records.some(record => record.ongoing) ? ['Ongoing declarations retain an open endpoint through the supported date ceiling (2100-12-31); normalization clips only evaluated evidence.'] : []),
      TAX_HOME_EXAMPLE,
      'For informational use only. Not legal or tax advice.'
    ]),
    { title: 'TECHNICAL REFERENCES', lines: report.references }
  ];
}

export function reportText(report: TravelReport): string {
  return [report.title, 'by Cameron Guthrie', ...reportSections(report).flatMap(section =>
    ['', section.title, ...section.lines.map(line => line.url ? `${line.text}: ${line.url}` : line.text)])].join('\n');
}
