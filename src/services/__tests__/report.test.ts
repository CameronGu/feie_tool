// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { assessTravel } from '../travelCalculator';
import { buildReport, reportText } from '../report';
import { createReportPdf, pdfSafeText } from '../reportPdf';
import { EMPTY_HISTORY, type TravelHistory } from '../../domain/history';

const source: TravelHistory = { schema_version: 1, records: [
  { id: 'declaration', kind: 'foreign_assumption', status: 'completed', start_date: '2023-01-01', end_date: '2025-12-31', note: 'Foreign tax home must be checked separately' },
  { id: 'us-visit', kind: 'us', status: 'completed', start_date: '2024-06-01', end_date: '2024-07-31', note: 'Visit' }
] };

describe('single structured preparer report', () => {
  it('reports union coverage and supporting evidence instead of a single-best fraction', () => {
    const report = buildReport(assessTravel(source, 2024, '2026-10-12'), '2026-10-12T12:00:00Z');
    expect(report.qualifying_days).toBe(366);
    expect(report.supporting_periods).toHaveLength(2);
    expect(report.supporting_periods.every(period => period.overlap_days < 366 && period.foreign_days >= 330)).toBe(true);
    expect(report.supporting_periods.every(period => period.foreign_days === period.assumed_foreign_days)).toBe(true);
    expect(reportText(report)).toContain('366 / 366 = 1.000000');
    expect(reportText(report)).toContain('2024-06-01 to 2024-07-31 | us | recorded');
    expect(reportText(report)).toContain('us-visit');
  });
  it('contains the exact engine input segments, provenance, source notes and reproducibility context', () => {
    const assessment = assessTravel(source, 2024, '2026-10-12');
    const report = buildReport(assessment, '2026-10-12T12:00:00Z');
    expect(report.segments).toEqual(assessment.normalized.segments);
    expect(report.records).toEqual(assessment.normalized.records);
    const text = reportText(report);
    expect(text).toContain('Foreign tax home must be checked separately');
    expect(text).toContain('generated: 2026-10-12T12:00:00Z');
    expect(text).toContain('calculation physical-presence-2');
    expect(text).toContain('Form 2555 line 16');
    expect(text).toContain('not complete FEIE eligibility');
  });
  it('exports incomplete and unsuccessful cases with the best failing period and unknown dates', () => {
    const report = buildReport(assessTravel(EMPTY_HISTORY, 2024, '2026-10-12'));
    expect(report.status).toBe('incomplete');
    expect(reportText(report)).toContain('No relevant travel evidence');
    expect(reportText(report)).not.toContain('STRONGEST SUPPORTED PERIOD');
    expect(reportText(report)).toContain('unknown | unrecorded');
    expect(reportText(report)).toContain('0 / 366 = 0.000000');
    expect(report.supporting_periods).toEqual([]);
  });
  it('labels projection and preserves exact count precision', () => {
    const projected: TravelHistory = { schema_version: 1, records: [{ id: 'proposal', kind: 'foreign', status: 'proposed',
      start_date: '2023-01-02', end_date: '2023-11-27', note: '' }] };
    const report = buildReport(assessTravel(projected, 2024, '2026-10-12', true));
    expect(report.status).toBe('projected');
    expect(report.fraction).toBe(1 / 366);
    expect(reportText(report)).toContain('1 / 366 = 0.002732');
    expect(reportText(report)).toContain('Scenario including proposed/future travel');
  });
});

describe('real PDF generation', () => {
  it('keeps an ordinary bounded-declaration report to one page', async () => {
    const ordinary: TravelHistory = { schema_version: 1, records: [
      { ...source.records[0], start_date: '2024-01-01', end_date: '2024-12-31' },
      { ...source.records[1], start_date: '2024-12-01', end_date: '2024-12-31' }
    ] };
    const doc = await createReportPdf(buildReport(assessTravel(ordinary, 2024, '2026-10-12')));
    expect(doc.getNumberOfPages()).toBe(1);
  });
  it('generates a valid PDF for an incomplete report with header and footer', async () => {
    const doc = await createReportPdf(buildReport(assessTravel(EMPTY_HISTORY, 2024, '2026-10-12')));
    expect(new TextDecoder().decode(doc.output('arraybuffer').slice(0, 8))).toContain('%PDF-');
    expect(doc.getNumberOfPages()).toBeGreaterThan(0);
  });
  it('paginates a large report and repeats page context on every page', async () => {
    const records: TravelHistory['records'] = Array.from({ length: 120 }, (_, index) => {
      const date = new Date(Date.UTC(2024, 0, 1 + index * 3)).toISOString().slice(0, 10);
      return { id: `r-${index}`, kind: 'unknown', status: 'completed', start_date: date, end_date: date,
        note: `Supporting record ${index}: ${'Review evidence. '.repeat(10)}` };
    });
    const doc = await createReportPdf(buildReport(assessTravel({ schema_version: 1, records }, 2024, '2026-10-12')));
    expect(doc.getNumberOfPages()).toBeGreaterThan(5);
    // jsPDF's public declaration mis-types the internal page command arrays as numbers.
    const pages = (doc.internal.pages as unknown as string[][]).slice(1);
    for (const page of pages) {
      const content = page.join('\n');
      expect(content).toContain('FEIE Window Optimizer');
      expect(content).toContain('Working report');
      expect(content).toContain('physical-presence-2');
    }
  });
  it('preserves unsupported Unicode as explicit code points instead of silently losing note text', () => {
    expect(pdfSafeText('Málaga 東京')).toBe('Málaga [U+6771][U+4EAC]');
  });
});


it('C03: carries the completed baseline, scenario, denominator and signed delta into text and PDF', async () => {
  const data: TravelHistory = { schema_version: 1, records: [
    { id: 'completed', kind: 'foreign', status: 'completed', start_date: '2025-01-01', end_date: '2025-11-25', note: '' },
    { id: 'extra', kind: 'foreign', status: 'proposed', start_date: '2025-11-26', end_date: '2025-11-26', note: '' }
  ] };
  const baseline = assessTravel(data, 2025, '2026-10-13');
  const scenario = assessTravel(data, 2025, '2026-10-13', true);
  const report = buildReport(scenario, undefined, baseline);
  expect(report.comparison).toMatchObject({ tax_year: 2025, completed_days: 0, scenario_days: 365, denominator: 365, delta_days: 365 });
  expect(reportText(report)).toContain('Scenario coverage: 365 / 365; change: +365 days.');
  const doc = await createReportPdf(report);
  const commands = (doc.internal.pages as unknown as string[][]).slice(1).flat().join(' ');
  expect(commands).toContain('Completed-record coverage: 0 / 365');
  expect(commands).toContain('Scenario coverage: 365 / 365; change: +365 days.');
  expect(() => buildReport(scenario, undefined, assessTravel(data, 2024, '2026-10-13'))).toThrow('same history');
});

it('C04: keeps the reviewed two-source/two-support PDF on one page with all evidence and references', async () => {
  const report = buildReport(assessTravel(source, 2024, '2026-10-13'));
  const doc = await createReportPdf(report);
  expect(doc.getNumberOfPages()).toBe(1);
  const commands = (doc.internal.pages as unknown as string[][]).slice(1).flat().join(' ');
  expect(commands).toContain('NORMALIZED EVIDENCE');
  expect(commands).toContain('Foreign tax home must be checked separately');
  expect(commands).toContain('Not legal or tax advice.');
  expect(new TextDecoder().decode(doc.output('arraybuffer'))).toContain('https://www.ecfr.gov/current/title-26/section-1.911-2');
});

it('retains a negative scenario delta and rejects a baseline from another history', () => {
  const data: TravelHistory = { schema_version: 1, records: [
    { id: 'c', kind: 'foreign', status: 'completed', start_date: '2025-01-01', end_date: '2025-11-26', note: '' },
    { id: 'p', kind: 'us', status: 'proposed', start_date: '2025-11-26', end_date: '2025-11-26', note: '' }
  ] };
  const scenario = assessTravel(data, 2025, '2026-10-13', true);
  const report = buildReport(scenario, undefined, assessTravel(data, 2025, '2026-10-13'));
  expect(report.comparison?.delta_days).toBe(-365);
  expect(reportText(report)).toContain('Scenario coverage: 0 / 365; change: -365 days.');
  expect(() => buildReport(scenario, undefined, assessTravel(EMPTY_HISTORY, 2025, '2026-10-13'))).toThrow('same history');
});
