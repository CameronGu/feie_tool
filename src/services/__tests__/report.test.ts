// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { assessTravel } from '../travelCalculator';
import { appendixSections, basisLines, buildReport, relevantExceptions, reportSections, reportText } from '../report';
import { createReportPdf, pdfSafeText } from '../reportPdf';
import { EMPTY_HISTORY, type TravelHistory, type TravelRecord } from '../../domain/history';
import { diffDaysInclusive } from '../../domain/dates';
import { pdfPageText } from './pdfText';

const row = (id: string, kind: TravelRecord['kind'], start_date: string, end_date: string, extra: Partial<TravelRecord> = {}): TravelRecord => ({ id, kind, start_date, end_date, status: 'completed', note: '', ...extra });
const data = (...records: TravelRecord[]): TravelHistory => ({ schema_version: 1, records });
export const approved = data(
  row('synthetic-assumption', 'foreign_assumption', '2015-01-01', '2025-12-31'),
  row('synthetic-may-trip', 'us', '2025-05-31', '2025-06-29'),
  row('synthetic-cross-year-trip', 'us', '2025-12-13', '2026-01-13'),
  row('irrelevant-in-horizon', 'us', '2024-01-03', '2024-01-04')
);
const reportFor = (history = approved, year = 2025, asOf = '2026-10-13', scenario = false) => buildReport(assessTravel(history, year, asOf, scenario), '2026-10-13T12:00:00Z');
const appendixText = (report: ReturnType<typeof buildReport>) => appendixSections(report).flatMap(section => [section.title, ...section.lines.map(line => line.text)]).join('\n');
const multiple = data(row('declaration', 'foreign_assumption', '2023-01-01', '2025-12-31'), row('visit', 'us', '2024-06-01', '2024-07-31'));
const failed = data(row('f0', 'nonqualifying', '2024-01-02', '2024-12-31'), row('f1', 'foreign', '2025-01-01', '2025-11-25'), row('f2', 'nonqualifying', '2025-11-26', '2026-12-30'));

describe('shared preparer evidence and concise presentation', () => {
  it('reconciles the approved fixture against the engine and preserves original cross-year dates', () => {
    const assessment = assessTravel(approved, 2025, '2026-10-13');
    const report = buildReport(assessment);
    expect(report.qualifying_days).toBe(assessment.calculation.qualifyingDays);
    expect(report.supporting_periods).toHaveLength(1);
    expect(report.supporting_periods[0]).toMatchObject({ window_start: '2024-12-18', window_end: '2025-12-17', foreign_days: 330, calendar_days: 365, us_days: 35, overlap_days: 351, distinct_tax_year_days: 351 });
    expect(report.segments).toEqual(assessment.normalized.segments);
    expect(report.records).toEqual(assessment.normalized.records);
    const exceptions = relevantExceptions(report);
    expect(exceptions.map(item => item.days)).toEqual([30, 5]);
    expect(exceptions[1].record.end_date).toBe('2026-01-13');
    expect(exceptions[1].ranges).toEqual([{ start_date: '2025-12-13', end_date: '2025-12-17' }]);
    const text = reportText(report);
    for (const phrase of ['U.S. visits:', 'Days counted within supporting periods', '351 / 365 = 0.961644', '96.16%', '330 full foreign days', '35 U.S. days', 'December 13, 2025 to January 13, 2026', 'December 13, 2025 to December 17, 2025 (5 days)']) expect(text).toContain(phrase);
    for (const phrase of ['synthetic-cross-year-trip', 'irrelevant-in-horizon', 'January 3, 2024', 'NORMALIZED', 'algorithm', '2100-12-31']) expect(text).not.toContain(phrase);
    expect(appendixText(report)).toContain('synthetic-cross-year-trip: 2025-12-13 to 2026-01-13');
    expect(appendixText(report)).not.toContain('irrelevant-in-horizon');
  });
  it('preserves an ongoing declaration and computes its actual periods rather than the prototype endpoint', () => {
    const ongoing = data({ ...approved.records[0], ongoing: true, end_date: '2100-12-31' }, ...approved.records.slice(1));
    const assessment = assessTravel(ongoing, 2025, '2026-10-13');
    const report = buildReport(assessment);
    expect(report.qualifying_days).toBe(assessment.calculation.qualifyingDays);
    expect(report.qualifying_days).toBe(365);
    expect(report.supporting_periods.length).toBeGreaterThan(1);
    expect(report.supporting_periods.at(-1)!.window_end > '2025-12-17').toBe(true);
    expect(basisLines(report).join(' ')).toContain('January 1, 2015 onward (ongoing)');
    expect(reportText(report)).not.toContain('2100-12-31');
    expect(appendixText(report)).toContain('2015-01-01 to ongoing');
  });
  it('shows a full calendar year and nonduplicated multiple-period contributions', () => {
    expect(reportFor(data(row('year', 'foreign', '2025-01-01', '2025-12-31'))).qualifying_days).toBe(365);
    const report = reportFor(multiple, 2024);
    expect(report.qualifying_days).toBe(366);
    expect(report.supporting_periods.map(period => period.distinct_tax_year_days)).toEqual([188, 178]);
    expect(report.supporting_periods.reduce((sum, period) => sum + period.distinct_tax_year_days, 0)).toBe(report.qualifying_days);
    expect(relevantExceptions(report)[0]).toMatchObject({ days: 61, contributions: [{ period: 1, days: 36 }, { period: 2, days: 25 }] });
    expect(reportText(report)).toContain('Form 2555 line 16');
  });
  it('distinguishes incomplete evidence, no evidence and conclusive failure without an incomplete percentage', () => {
    const incomplete = reportFor(data(row('i', 'foreign', '2025-01-01', '2025-11-25')));
    expect(incomplete.status).toBe('incomplete');
    expect(incomplete.closest_period.foreign_days).toBe(329);
    const text = reportText(incomplete);
    expect(text).toContain('Potentially qualifying upper bound');
    expect(text).toContain('November 26, 2025 to December 31, 2025 (36 days');
    expect(text).not.toContain('%');
    const empty = reportFor(EMPTY_HISTORY);
    expect(reportText(empty)).toContain('No relevant travel evidence');
    expect(reportText(empty)).not.toContain('Strongest supported period');
    const failure = reportFor(failed, 2025, '2027-01-01');
    expect(failure.status).toBe('not-met');
    expect(reportText(failure)).toContain('Maximum attainable full foreign days: 329 / 330. Shortfall: 1 day');
  });
  it.each([1, -1])('compares both supporting sets and signed differences (%i)', sign => {
    const history = data(row('c', 'foreign', '2025-01-01', sign > 0 ? '2025-11-25' : '2025-11-26'), row('p', sign > 0 ? 'foreign' : 'us', '2025-11-26', '2025-11-26', { status: 'proposed' }));
    const baseline = assessTravel(history, 2025, '2026-10-13');
    const scenario = assessTravel(history, 2025, '2026-10-13', true);
    const report = buildReport(scenario, undefined, baseline);
    expect(report.comparison?.delta_days).toBe(sign * 365);
    expect(report.comparison?.completed_report.supporting_periods.map(p => [p.window_start, p.window_end])).toEqual(baseline.calculation.supportingWindows.map(p => [p.window_start, p.window_end]));
    expect(report.qualifying_days).toBe(scenario.calculation.qualifyingDays);
    expect(reportText(report)).toContain(`change: ${sign > 0 ? '+' : '-'}365 days`);
    expect(appendixText(report)).toContain('Completed baseline normalized evidence');
    expect(() => buildReport(scenario, undefined, assessTravel(EMPTY_HISTORY, 2025, '2026-10-13'))).toThrow('same history');
  });
  it('retains the completed declaration when proposals override it throughout the scenario', () => {
    const history = data(row('a', 'foreign_assumption', '2025-01-01', '2025-12-31', { note: 'Declared basis note' }), row('p', 'foreign', '2025-01-01', '2025-12-31', { status: 'proposed' }));
    const report = buildReport(assessTravel(history, 2025, '2026-10-13', true), undefined, assessTravel(history, 2025, '2026-10-13'));
    expect(basisLines(report).join(' ')).toContain('This declaration supports the completed baseline only.');
    expect(reportText(report)).toContain('Declared basis note');
    expect(reportText(report)).toContain('January 1, 2025 to December 31, 2025: 365 projected full foreign days');
    expect(appendixText(report)).toContain('a: 2025-01-01 to 2025-12-31');
  });
  it('counts proposal-overridden exceptions once and keeps projected assumption days separate', () => {
    const history = data(row('a', 'foreign_assumption', '2025-01-01', '2100-12-31', { ongoing: true }), row('u', 'us', '2025-02-01', '2025-02-10'), row('p', 'foreign', '2025-02-04', '2025-02-06', { status: 'proposed' }));
    const report = reportFor(history, 2025, '2025-11-01', true);
    expect(relevantExceptions(report)[0].days).toBe(7);
    for (const period of report.supporting_periods) {
      expect(period.recorded_foreign_days + period.completed_assumed_foreign_days + period.projected_foreign_days).toBe(period.foreign_days);
      expect(period.foreign_days + period.us_days + period.other_nonforeign_days + period.unknown_days).toBe(period.calendar_days);
    }
    expect(reportText(report)).toContain('ongoing');
  });
  it('does not silently turn leap sensitivity into established coverage', () => {
    const report = reportFor(data(row('l1', 'foreign', '2024-02-29', '2025-01-22'), row('l2', 'foreign', '2025-02-28', '2025-02-28')), 2024);
    expect(report.status).toBe('review-required');
    expect(reportText(report)).toContain('alternative is not established coverage');
    expect(report.qualifying_days).toBe(0);
  });
});

describe('real embedded-font PDFs', () => {
  it('generates the ordinary standard report on one A4 page, with precise counts and relevant hyperlinks', async () => {
    const report = reportFor();
    const doc = await createReportPdf(report);
    expect(doc.getNumberOfPages()).toBe(1);
    expect(doc.internal.pageSize.getWidth()).toBeCloseTo(210, 1);
    const text = pdfPageText(doc).join(' ');
    for (const phrase of ['Physical Presence Test', '2025 qualifying-period days', 'Full foreign days in period', '351 / 365 = 0.961644', '330 full foreign days', 'January 13, 2026']) expect(text).toContain(phrase);
    expect(text).not.toContain('synthetic-cross-year-trip');
    const bytes = new TextDecoder().decode(doc.output('arraybuffer'));
    expect(bytes).toContain('/FontFile2');
    expect(bytes).toContain('/ToUnicode');
    expect(bytes).toContain('https://www.ecfr.gov/current/title-26/section-1.911-3');
  });
  it('appends exactly matching source/evidence/provenance without repeating the standard report', async () => {
    const report = reportFor();
    const doc = await createReportPdf(report, { includeAppendix: true });
    const pages = pdfPageText(doc);
    expect(pages.length).toBeGreaterThan(1);
    expect(pages[0]).not.toContain('synthetic-cross-year-trip');
    expect(pages.slice(1).join(' ')).toContain('synthetic-cross-year-trip: 2025-12-13 to 2026-01-13');
    expect(pages.join(' ')).not.toContain('irrelevant-in-horizon');
    for (const page of pages) expect(page).toContain('FEIE Window Optimizer | by Cameron Guthrie');
    for (const ref of report.references) expect(new TextDecoder().decode(doc.output('arraybuffer'))).toContain(ref.url);
  });
  it('paginates long source notes and repeats table headings/footer without clipping', async () => {
    const records = [row('a', 'foreign_assumption', '2024-01-01', '2024-12-31'), ...Array.from({ length: 24 }, (_, i) => {
      const day = new Date(Date.UTC(2024, 0, 2 + i * 10)).toISOString().slice(0, 10);
      return row(`long-${i}`, 'us', day, day, { note: `Record ${i}: ${'Résumé — Málaga; verify travel. '.repeat(13)}` });
    })];
    const report = reportFor(data(...records), 2024);
    const doc = await createReportPdf(report, { includeAppendix: true });
    const pages = pdfPageText(doc);
    expect(pages.length).toBeGreaterThan(3);
    expect(pages.join(' ')).toContain('Record 23:');
    expect(pages.filter(p => p.includes('U.S. visit (original dates)')).length).toBeGreaterThan(1);
    for (let i = 0; i < pages.length; i++) {
      expect(pages[i]).toContain('Tax Year 2024');
      expect(pages[i]).toContain(`${i + 1} / ${pages.length}`);
      expect(pages[i]).toContain('physical-presence-2.2');
    }
  });
  it('retains Unicode notes, escapes unsupported glyphs, and omits empty-note placeholders', async () => {
    const report = reportFor(data(approved.records[0], { ...approved.records[1], note: 'Résumé — Málaga Ελληνικά Кириллица 東京 🌍' }, approved.records[2]));
    expect(reportText(report)).toContain('東京 🌍');
    const text = pdfPageText(await createReportPdf(report, { includeAppendix: true })).join(' ');
    expect(text).toContain('Résumé — Málaga Ελληνικά Кириллица [U+6771][U+4EAC] [U+1F30D]');
    expect(text).not.toContain('(no note)');
    expect(text).toContain('PDF character preservation');
    expect(pdfSafeText('Málaga 東京')).toBe('Málaga [U+6771][U+4EAC]');
  });
  it('wraps maximal unbroken descriptions and long identifiers without losing their ends', async () => {
    const report = reportFor(data(approved.records[0], { ...approved.records[1], id: 'r'.repeat(100), note: 'W'.repeat(490) + 'NOTEEND' }, approved.records[2]));
    const doc = await createReportPdf(report, { includeAppendix: true });
    expect(pdfPageText(doc).join(' ')).toContain('NOTEEND');
    expect(reportText(report)).toContain('W'.repeat(490) + 'NOTEEND');
  });
  it('renders empty, failed and multiple-period assessments from their shared sections', async () => {
    for (const report of [reportFor(EMPTY_HISTORY), reportFor(failed, 2025, '2027-01-01'), reportFor(multiple, 2024)]) {
      const doc = await createReportPdf(report);
      const text = pdfPageText(doc).join(' ');
      expect(text).toContain(report.status_label);
      expect(text).toContain(fractionLabelForTest(report.qualifying_days, report.tax_year_days));
      expect(new TextDecoder().decode(doc.output('arraybuffer').slice(0, 8))).toContain('%PDF-');
    }
  });
});
function fractionLabelForTest(days: number, denominator: number) { return `${days} / ${denominator} = ${(days / denominator).toFixed(6)}`; }
