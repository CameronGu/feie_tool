import { mergeIntervals } from '../domain/intervals';
import { addDays, diffDaysInclusive } from '../domain/dates';
import type { CutoffContext } from './completedDayCutoff';
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
  us_days: number;
  other_nonforeign_days: number;
  completed_assumed_foreign_days: number;
  distinct_tax_year_days: number;
}

export const TAX_HOME_NOTE = 'The 330 supporting full foreign days must also satisfy the foreign tax-home requirement. This tool has no tax-home timeline: its raw period coverage is not an established exclusion-limit numerator. Ask your preparer to verify these facts before using the fraction.';

export const TAX_HOME_EXAMPLE = 'Tax-home example: Jan 1-Nov 26, 2025 supplies 330 physical days. A foreign tax home beginning Apr 1 covers only 240 of them; without other support, these facts do not establish the joint 330-day requirement. Preparer review is required.';

export interface TravelReport {
  title: 'FEIE Window Optimizer';
  app_version: string;
  calculation_version: string;
  tax_year: number;
  as_of: string;
  last_completed_day: string;
  cutoff: CutoffContext;
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
  comparison?: { tax_year: number; completed_days: number; scenario_days: number; denominator: number; delta_days: number; completed_status: string; completed_report: TravelReport };
  leap_day_review: TravelAssessment['calculation']['leapDayReview'];
}

export function buildReport(assessment: TravelAssessment, generatedAt = new Date().toISOString(), baseline?: TravelAssessment,
  cutoff: CutoffContext = { basis: 'provided-date' }): TravelReport {
  if (baseline && (!assessment.normalized.includes_proposals || baseline.normalized.includes_proposals ||
    baseline.normalized.as_of !== assessment.normalized.as_of || baseline.normalized.input.taxYearStart !== assessment.normalized.input.taxYearStart ||
    JSON.stringify(baseline.normalized.records) !== JSON.stringify(assessment.normalized.records.filter(record => record.status === 'completed')))) {
    throw new Error('A scenario comparison requires completed evidence from the same history, tax year and reference date.');
  }
  const { normalized, calculation } = assessment;
  let priorCoverage: Interval[] = [];
  const evidence = (window: QualifiedWindow, supporting = false): PeriodEvidence => {
    const interval = { start_date: window.window_start, end_date: window.window_end };
    const count = (predicate: (segment: PresenceSegment) => boolean) => normalized.segments
      .filter(predicate).reduce((sum, segment) => sum + segmentDaysWithin(segment, interval), 0);
    const intersection = { start_date: window.window_start < normalized.input.taxYearStart ? normalized.input.taxYearStart : window.window_start,
      end_date: window.window_end > normalized.input.taxYearEnd ? normalized.input.taxYearEnd : window.window_end };
    const alreadyCovered = priorCoverage.reduce((sum, range) => {
      const start = intersection.start_date > range.start_date ? intersection.start_date : range.start_date;
      const end = intersection.end_date < range.end_date ? intersection.end_date : range.end_date;
      return sum + (start <= end ? diffDaysInclusive(start, end) : 0);
    }, 0);
    if (supporting) priorCoverage = mergeIntervals([...priorCoverage, intersection].sort((a, b) => a.start_date.localeCompare(b.start_date)));
    return {
      ...window,
      distinct_tax_year_days: supporting ? window.overlap_days - alreadyCovered : 0,
      us_days: count(segment => segment.kind === 'us'),
      other_nonforeign_days: count(segment => segment.kind === 'nonqualifying'),
      completed_assumed_foreign_days: count(segment => segment.kind === 'foreign' && segment.basis === 'assumed' && !segment.projected),
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
    last_completed_day: addDays(normalized.as_of, -1), cutoff: { basis: cutoff.basis, device_time_zone: cutoff.device_time_zone },
    scenario: normalized.includes_proposals, example: false, status: assessment.status, status_label: STATUS_LABELS[assessment.status],
    qualifying_days: calculation.qualifyingDays, tax_year_days: calculation.totalTaxYearDays, fraction: calculation.coverageFraction,
    coverage: calculation.qualifyingCoverage, supporting_periods: calculation.supportingWindows.map(window => evidence(window, true)),
    closest_period: evidence(calculation.closestWindow), qualifying_period_count: calculation.qualifyingWindowCount,
    horizon: normalized.horizon, segments: normalized.segments, records: normalized.records,
    leap_day_review: calculation.leapDayReview,
    has_evidence: assessment.hasEvidence, max_possible_foreign_days: assessment.maxPossibleForeignDays, possible_period: assessment.possibleWindow,
    ...(baseline ? { comparison: { tax_year: Number(normalized.input.taxYearStart.slice(0, 4)), completed_days: baseline.calculation.qualifyingDays,
      scenario_days: calculation.qualifyingDays, denominator: calculation.totalTaxYearDays,
      delta_days: calculation.qualifyingDays - baseline.calculation.qualifyingDays, completed_status: STATUS_LABELS[baseline.status], completed_report: buildReport(baseline, generatedAt, undefined, cutoff) } } : {}),
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
      { text: 'IRS foreign earned income', url: 'https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion-what-is-foreign-earned-income' },
      { text: 'IRS exclusion computation', url: 'https://www.irs.gov/individuals/international-taxpayers/figuring-the-foreign-earned-income-exclusion' },
      { text: 'Form 2555 instructions (line 16)', url: 'https://www.irs.gov/instructions/i2555' }
    ]
  };
}

export interface ReportLine { text: string; url?: string; emphasis?: 'result' | 'period' }
export interface ReportTable { headers: string[]; rows: string[][]; widths: number[] }
export interface ReportSection { title: string; lines: ReportLine[]; table?: ReportTable }
export interface RelevantException {
  record: TravelRecord;
  days: number;
  projected_days: number;
  contributions: { period: number; days: number }[];
  ranges: Interval[];
}

export function dateLabel(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
}
export const periodLabel = (window: QualifiedWindow) => `${dateLabel(window.window_start)} to ${dateLabel(window.window_end)}`;
export const fractionLabel = (days: number, denominator: number) => `${days} / ${denominator} = ${(days / denominator).toFixed(6)}`;
const intervalOf = (window: QualifiedWindow): Interval => ({ start_date: window.window_start, end_date: window.window_end });
export const displayPeriods = (report: TravelReport) => report.has_evidence ? report.supporting_periods.length ? report.supporting_periods : [report.closest_period] : [];
const section = (title: string, lines: (string | ReportLine)[] = [], table?: ReportTable): ReportSection => ({
  title, lines: lines.map(line => typeof line === 'string' ? { text: line } : line), ...(table ? { table } : {})
});

/** Contributions come from the very same normalized evidence as the engine, after proposal overrides.
 * Original source endpoints are retained. Counts across overlapping periods are a union. */
export function relevantExceptions(report: TravelReport): RelevantException[] {
  const periods = displayPeriods(report);
  const union = mergeIntervals(periods.map(intervalOf).sort((a, b) => a.start_date.localeCompare(b.start_date)));
  return report.records.filter(record => ['us', 'nonqualifying', 'unknown'].includes(record.kind)).flatMap(record => {
    const segments = report.segments.filter(segment => segment.record_ids.includes(record.id) && segment.kind !== 'foreign');
    const contributions = periods.map((period, index) => ({ period: index + 1,
      days: segments.reduce((sum, segment) => sum + segmentDaysWithin(segment, intervalOf(period)), 0) }));
    const ranges = mergeIntervals(segments.flatMap(segment => union.flatMap(range => {
      const start_date = segment.start_date > range.start_date ? segment.start_date : range.start_date;
      const end_date = segment.end_date < range.end_date ? segment.end_date : range.end_date;
      return start_date <= end_date ? [{ start_date, end_date }] : [];
    })).sort((a, b) => a.start_date.localeCompare(b.start_date)));
    const days = ranges.reduce((sum, range) => sum + diffDaysInclusive(range.start_date, range.end_date), 0);
    const projected_days = segments.filter(segment => segment.projected).reduce((sum, segment) => sum + union.reduce((n, range) => n + segmentDaysWithin(segment, range), 0), 0);
    return days ? [{ record, days, projected_days, contributions, ranges }] : [];
  });
}

export function projectedForeignLines(report: TravelReport): string[] {
  const union = mergeIntervals(displayPeriods(report).map(intervalOf).sort((a, b) => a.start_date.localeCompare(b.start_date)));
  return report.segments.filter(segment => segment.kind === 'foreign' && segment.projected).flatMap(segment => union.flatMap(range => {
    const start = segment.start_date > range.start_date ? segment.start_date : range.start_date;
    const end = segment.end_date < range.end_date ? segment.end_date : range.end_date;
    if (start > end) return [];
    const record = report.records.find(record => segment.record_ids.includes(record.id));
    const basis = record?.status === 'proposed' ? 'proposed presence' : segment.basis === 'assumed' ? 'future continuation of the declaration' : 'unfinished recorded presence';
    return [`${dateLabel(start)} to ${dateLabel(end)}: ${diffDaysInclusive(start, end)} projected full foreign days (${basis}).`];
  }));
}

export function periodEvidenceText(period: PeriodEvidence): string {
  const parts = [`${period.foreign_days} full foreign days${period.completed_assumed_foreign_days === period.foreign_days && period.foreign_days > 0 ? ' (assumed)' : ''}`, `${period.us_days} U.S. ${period.us_days === 1 ? 'day' : 'days'}`];
  if (period.other_nonforeign_days) parts.push(`${period.other_nonforeign_days} other nonforeign days`);
  if (period.unknown_days) parts.push(`${period.unknown_days} unresolved days (zero foreign)`);
  return `${period.calendar_days} calendar days: ${parts.join('; ')}.`;
}
export function foreignBasisText(period: PeriodEvidence): string {
  const parts = [];
  if (period.recorded_foreign_days) parts.push(`${period.recorded_foreign_days} recorded completed`);
  if (period.completed_assumed_foreign_days) parts.push(`${period.completed_assumed_foreign_days} assumed completed`);
  if (period.projected_foreign_days) parts.push(`${period.projected_foreign_days} projected`);
  return `Foreign-day basis: ${parts.join(', ') || 'no supported foreign days'}.`;
}
export function standardReferences(report: TravelReport): TravelReport['references'] {
  const urls = report.supporting_periods.length ? ['physical-presence-test', 'section-1.911-3', report.supporting_periods.length > 1 ? '/instructions/i2555' : 'what-is-foreign-earned-income'] : ['physical-presence-test', 'section-1.911-2'];
  return urls.map(url => { const reference = report.references.find(ref => ref.url.includes(url))!;
    return { ...reference, text: url === 'physical-presence-test' ? 'IRS physical-presence test' : url === 'section-1.911-3' ? '26 CFR 1.911-3(d)(3)' : url === '/instructions/i2555' ? 'Form 2555 instructions' : url === 'section-1.911-2' ? '26 CFR 1.911-2: foreign days and tax home' : 'IRS income sourcing' };
  });
}
export function basisLines(report: TravelReport): string[] {
  const contexts = report.comparison ? [report, report.comparison.completed_report] : [report];
  const contextIds = (context: TravelReport) => new Set(context.segments.filter(segment => displayPeriods(context).some(period => segmentDaysWithin(segment, intervalOf(period)) > 0)).flatMap(segment => segment.record_ids));
  const currentIds = contextIds(report);
  const ids = new Set(contexts.flatMap(context => [...contextIds(context)]));
  const declarations = [...new Map(contexts.flatMap(context => context.records).filter(record => record.kind === 'foreign_assumption' && ids.has(record.id)).map(record => [record.id, record])).values()];
  return [
    ...(report.example ? ['Demonstration data; this report does not describe your saved travel history.'] : []),
    ...declarations.map(record => `Full foreign presence is assumed from ${dateLabel(record.start_date)} ${record.ongoing ? 'onward (ongoing)' : `through ${dateLabel(record.end_date)}`}, except recorded exceptions.${!currentIds.has(record.id) ? ' This declaration supports the completed baseline only.' : record.status === 'proposed' ? ' This declaration is proposed.' : ''}${record.note ? ` Declaration note: ${record.note}` : ''}`),
    `Completed through: ${report.last_completed_day}.${report.scenario ? ' Proposed dates and future continuation are projected, not completed evidence.' : ' Later dates do not establish completed presence.'}`,
    ...(report.cutoff.basis === 'manual' ? ['The completed-day cutoff was manually selected for the travel calendar.'] : []),
    'Foreign tax home for the supporting foreign days and broader FEIE eligibility are unverified.',
    'Eligible foreign earned income and actual exclusion amounts are not calculated.',
    ...(report.supporting_periods.some(period => period.unknown_days > 0) ? ['Unresolved days count zero toward the foreign-day threshold; additional evidence could change coverage.'] : []),
    ...(report.supporting_periods.some(period => period.window_end >= report.as_of) ? ['A supporting period ends after the completed-day cutoff; its coverage remains projected even if 330 foreign days have elapsed.'] : []),
    ...(report.supporting_periods.length > 1 ? ['Form 2555 line 16 requests a single twelve-month period. Multiple supporting periods require preparer review of filing/attachment treatment; do not enter their combined span as one period.'] : [])
  ];
}

/** Shared semantic standard document. PDF supplies typography; clipboard supplies plain text. */
export function reportSections(report: TravelReport): ReportSection[] {
  const periods = displayPeriods(report);
  const exceptions = relevantExceptions(report);
  const comparison = report.comparison;
  const sections: ReportSection[] = [];
  if (comparison) {
    sections.push(section('Completed and projected comparison', [
      `Completed-record coverage: ${fractionLabel(comparison.completed_days, comparison.denominator)} (${comparison.completed_status}).`,
      `Scenario coverage: ${comparison.scenario_days} / ${comparison.denominator}; change: ${comparison.delta_days >= 0 ? '+' : ''}${comparison.delta_days} days.`,
      `Projected fraction: ${fractionLabel(comparison.scenario_days, comparison.denominator)}. Difference: ${comparison.delta_days >= 0 ? '+' : ''}${(comparison.delta_days / comparison.denominator * 100).toFixed(2)} percentage points.`,
      ...comparison.completed_report.supporting_periods.flatMap(period => [
        { text: `Completed support: ${periodLabel(period)}`, emphasis: 'period' as const }, periodEvidenceText(period), foreignBasisText(period)
      ]),
      ...(!comparison.completed_report.supporting_periods.length ? [`Completed evidence establishes no qualifying period; strongest supported foreign-day count: ${comparison.completed_report.closest_period.foreign_days}.`] : [])
    ]));
    const completedExceptions = relevantExceptions(comparison.completed_report);
    if (completedExceptions.length) sections.push(section('Completed-basis travel exceptions', [], exceptionTable(comparison.completed_report, completedExceptions)));
  }
  if (!report.has_evidence) {
    sections.push(section('Evidence needed', ['No relevant travel evidence. Supply full foreign days or an explicit foreign-presence declaration with exceptions. An empty U.S. visit list does not establish foreign presence.']));
  } else if (!report.supporting_periods.length) {
    sections.push(section('Assessment detail', [
      report.status === 'not-met'
        ? `Maximum attainable full foreign days: ${report.max_possible_foreign_days} / 330. Shortfall: ${Math.max(0, 330 - report.max_possible_foreign_days)} ${330 - report.max_possible_foreign_days === 1 ? 'day' : 'days'}; even the possible upper bound is below 330.`
        : `Strongest supported count: ${report.closest_period.foreign_days} / 330. Potentially qualifying upper bound: ${report.max_possible_foreign_days} / 330; unresolved dates are possibilities, not evidence.`,
      `Possible upper-bound period: ${periodLabel(report.possible_period)}.`,
      ...report.segments.filter(segment => segment.kind === 'unknown' && segmentDaysWithin(segment, intervalOf(report.closest_period)) > 0).map(segment => {
        const start = segment.start_date < report.closest_period.window_start ? report.closest_period.window_start : segment.start_date;
        const end = segment.end_date > report.closest_period.window_end ? report.closest_period.window_end : segment.end_date;
        return `Unresolved dates: ${dateLabel(start)} to ${dateLabel(end)} (${diffDaysInclusive(start, end)} days; zero supported foreign days).`;
      }),
      ...(report.status !== 'not-met' ? ['Confirm missing full foreign days, arrival/departure and transit facts before reassessment. Future dates cannot establish completed presence.'] : ['This is a conclusive ordinary-test failure on supplied evidence; special relief and other eligibility routes are not assessed.'])
    ]));
  }
  if (periods.length) sections.push(section(report.supporting_periods.length ? `${report.scenario ? 'Projected ' : ''}Supporting qualifying period${periods.length > 1 ? 's' : ''}` : 'Strongest supported period — not qualifying', periods.flatMap((period, index) => [
    { text: `${periods.length > 1 ? `${index + 1}. ` : ''}${periodLabel(period)}`, emphasis: 'period' as const },
    periodEvidenceText(period), ...(period.completed_assumed_foreign_days === period.foreign_days && period.foreign_days > 0 ? [] : [foreignBasisText(period)]),
    ...(report.supporting_periods.length ? [`${report.tax_year} intersection: ${dateLabel(period.window_start < `${report.tax_year}-01-01` ? `${report.tax_year}-01-01` : period.window_start)} to ${dateLabel(period.window_end > `${report.tax_year}-12-31` ? `${report.tax_year}-12-31` : period.window_end)} (${period.overlap_days} days)${periods.length > 1 ? `; adds ${period.distinct_tax_year_days} distinct days` : ''}.`] : [])
  ])));
  const projectedRanges = projectedForeignLines(report);
  if (projectedRanges.length) sections.push(section('Projected foreign presence', projectedRanges));
  if (exceptions.length) {
    sections.push(section('Relevant travel exceptions', [], exceptionTable(report, exceptions)));
    const clipped = exceptions.filter(item => item.days < diffDaysInclusive(item.record.start_date, item.record.end_date));
    if (clipped.length) sections.push(section('Counted portions', clipped.map(item =>
      `Counted from the ${item.record.kind === 'us' ? 'U.S. visit' : KIND_LABELS[item.record.kind].toLowerCase()} starting ${dateLabel(item.record.start_date)}: ${item.ranges.map(range => `${dateLabel(range.start_date)} to ${dateLabel(range.end_date)}`).join('; ')} (${item.days} days).`)));
  }
  if (report.supporting_periods.length) sections.push(section('Calculation explanation', [
    `The supporting periods each contain at least 330 full foreign days under the stated assumptions. Their overlap with ${report.tax_year} covers ${report.qualifying_days} distinct calendar days. U.S. days may contribute to conditional proration; U.S.-source employment income remains separate from foreign earned income.`
  ]));
  if (report.leap_day_review) sections.push(section('February 29 interpretation requires review', [
    `The longer February 29 endpoint convention could cover ${report.leap_day_review.alternative_coverage_days} tax-year days, compared with ${report.qualifying_days} baseline days. This alternative is not established coverage.`,
    ...report.leap_day_review.additional_windows.map(period => `${periodLabel(period)}: ${period.foreign_days} full foreign days.`)
  ]));
  sections.push(section('Basis and limitations', basisLines(report)));
  sections.push({ title: 'References', lines: standardReferences(report) });
  return sections;
}
function exceptionTable(report: TravelReport, exceptions: RelevantException[]): ReportTable {
  const multiple = displayPeriods(report).length > 1;
  const allUs = exceptions.every(item => item.record.kind === 'us');
  return { headers: [allUs ? 'U.S. visit (original dates)' : 'Original travel dates / classification', 'Days within periods'], widths: [.75, .25], rows: exceptions.map(item => [
    `${dateLabel(item.record.start_date)} to ${dateLabel(item.record.end_date)}${allUs ? '' : `\n${KIND_LABELS[item.record.kind]}`}${item.projected_days ? ` (${item.projected_days} projected ${item.projected_days === 1 ? 'day' : 'days'})` : ''}${item.record.note ? `\n${item.record.note}` : ''}`,
    `${item.days}${multiple ? `\n${item.contributions.filter(c => c.days).map(c => `P${c.period}: ${c.days}`).join('; ')}` : ''}`
  ]).concat([['Total distinct exception days', String(exceptions.reduce((sum, item) => sum + item.days, 0))]]) };
}

/** Reader-facing evidence status, independent of the source entry's completed/proposed flag. */
function appendixEvidenceLabel(segment: PresenceSegment): string {
  if (segment.kind === 'unknown') {
    return `${segment.projected ? 'Projected unresolved' : segment.basis === 'recorded' ? 'Recorded unresolved' : 'Unrecorded unknown'} dates (zero foreign days)`;
  }
  const presence = segment.kind === 'foreign' ? 'full foreign days' : segment.kind === 'us' ? 'U.S. days' : 'other nonforeign days';
  if (segment.projected) return `Projected ${presence} (${segment.basis === 'assumed' ? 'assumed' : 'user-entered'})`;
  return segment.basis === 'assumed' ? `Assumed ${presence} (elapsed)` : `Recorded ${presence} (completed)`;
}

/** Only relevant evidence, including the same-history completed baseline when comparing scenarios. */
export function appendixSections(report: TravelReport): ReportSection[] {
  const relevant = (context: TravelReport) => {
    const periods = [...displayPeriods(context), ...(!context.supporting_periods.length && context.has_evidence ? [context.possible_period] : [])];
    return context.segments.filter(segment => periods.some(period => segmentDaysWithin(segment, intervalOf(period)) > 0));
  };
  const contexts = report.comparison ? [report, report.comparison.completed_report] : [report];
  const ids = new Set(contexts.flatMap(context => relevant(context).flatMap(segment => segment.record_ids)));
  const records = new Map(contexts.flatMap(context => context.records).filter(record => ids.has(record.id)).map(record => [record.id, record]));
  return [
    section('Relevant full source history', [...records.values()].map(record =>
      `${record.id}: ${record.start_date} to ${record.ongoing ? 'ongoing' : record.end_date}; ${KIND_LABELS[record.kind]}; ${record.status === 'proposed' ? 'proposed record' : record.kind === 'foreign_assumption' ? 'assumption (cutoff applies)' : 'recorded history'}${record.note ? `. ${record.note}` : '.'}`)),
    ...contexts.map((context, index) => {
      const selected = relevant(context);
      const selectedSet = new Set(selected);
      const omitted = mergeIntervals(context.segments.filter(segment => !selectedSet.has(segment))
        .map(({ start_date, end_date }) => ({ start_date, end_date })));
      const selection = context.supporting_periods.length ? 'supporting periods' : context.has_evidence ? 'strongest supported and possible upper-bound periods' : 'selected periods (none established)';
      return section(`${index ? 'Completed baseline' : report.scenario ? 'Scenario' : 'Completed'} normalized evidence — relevant selection`, [
        `Whole normalized ranges intersecting the ${selection} are shown; endpoints may extend beyond those periods.`,
        omitted.length ? `Omitted dates: ${omitted.map(range => `${range.start_date} to ${range.end_date}`).join('; ')}. Other dates, including unknown dates in these omitted ranges, are excluded; this is not the full engine input.`
          : 'No dates omitted: this selection covers the full evaluation horizon for this context.',
        ...selected.map(segment => `${segment.start_date} to ${segment.end_date}: ${appendixEvidenceLabel(segment)}; sources: ${segment.record_ids.join(', ') || 'unrecorded'}.`)
      ]);
    }),
    section('Evidence classifications', [
      'Recorded = user-supplied facts, not independent verification. Assumed = an explicit declaration, overridden by exceptions. Projected = proposed or unfinished dates, excluded from completed evidence. Unknown = unresolved dates, counted as zero full foreign days.',
      'Period foreign-day totals separate recorded completed, assumed completed and projected foreign days. A projected day can derive from an ongoing assumption; it remains projected.'
    ]),
    section('Calculation provenance', [
      `Application ${report.app_version}; calculation ${report.calculation_version}; history schema 1. Generated: ${report.generated_at}.`,
      `Cutoff basis: ${report.cutoff.basis}${report.cutoff.device_time_zone ? `; device time zone: ${report.cutoff.device_time_zone}` : ''}. Exclusive as-of date: ${report.as_of}; completed through ${report.last_completed_day}.`,
      `Evaluation horizon: ${report.horizon.start_date} to ${report.horizon.end_date}. Exact coverage: ${report.qualifying_days}/${report.tax_year_days}; decimal display rounded. ${report.scenario ? 'Scenario includes proposals and future continuation; completed baseline is retained separately.' : 'Completed evidence only.'}`,
      'Full foreign days are midnight-to-midnight days. Verify arrival/departure and transit facts; international waters and U.S. territories do not automatically count. Foreign tax home, citizenship/residency, elections and income eligibility need separate review.',
      'Ordinary rules are anchored to 2025 guidance. Waivers, bona fide residence, special relief and monetary calculations are outside scope. Multiple-period filing and affected February 29 endpoints require preparer review.',
      'This appendix is supporting documentation, not a restorable JSON travel-history backup.'
    ]),
    { title: 'Primary technical and legal references', lines: report.references }
  ];
}

export function reportText(report: TravelReport): string {
  const incomplete = report.status === 'incomplete' || report.status === 'review-required' || !report.has_evidence;
  return ['Physical Presence Test', `Foreign Earned Income Exclusion | Tax Year ${report.tax_year}`, '',
    report.status_label,
    `${report.tax_year} qualifying-period days: ${fractionLabel(report.qualifying_days, report.tax_year_days)}${incomplete ? ' (supported coverage; evidence incomplete)' : ` (${(report.fraction * 100).toFixed(2)}% coverage)`}.`,
    ...reportSections(report).flatMap(group => ['', group.title, ...group.lines.map(line => line.url ? `${line.text}: ${line.url}` : line.text),
      ...(group.table ? ['Days counted within supporting periods; original travel dates retained.', ...(group.table.headers[0].startsWith('U.S.') ? ['U.S. visits:'] : []), ...group.table.rows.map(row => row.map(cell => cell.replace(/\n/g, '; ')).join(': '))] : [])]), '',
    'FEIE Window Optimizer | by Cameron Guthrie',
    `Generated ${dateLabel(report.generated_at.slice(0, 10))} | App ${report.app_version} | Calculation ${report.calculation_version}`
  ].join('\n');
}
