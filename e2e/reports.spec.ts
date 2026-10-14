import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { assessTravel } from '../src/services/travelCalculator';
import { buildReport, relevantExceptions } from '../src/services/report';
import type { TravelHistory, TravelRecord } from '../src/domain/history';

test.use({ timezoneId: 'America/Managua' });
const record = (id: string, kind: TravelRecord['kind'], start_date: string, end_date: string, extra: Partial<TravelRecord> = {}): TravelRecord => ({ id, kind, start_date, end_date, status: 'completed', note: '', ...extra });
const history = (...records: TravelRecord[]): TravelHistory => ({ schema_version: 1, records });
const approved = history(record('sample-assumption', 'foreign_assumption', '2015-01-01', '2025-12-31'), record('sample-may', 'us', '2025-05-31', '2025-06-29'), record('sample-december', 'us', '2025-12-13', '2026-01-13'), record('unrelated-source', 'us', '2024-01-03', '2024-01-04', { note: 'UNRELATED SOURCE MUST NOT APPEAR' }));
async function load(page: Page, data: TravelHistory, year: number, scenario = false) {
  await page.getByLabel('Calendar tax year', { exact: true }).fill(String(year));
  await page.getByLabel('Choose travel-history backup').setInputFiles({ name: 'synthetic-report-fixture.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
  await page.getByLabel(/Replace all .* existing records with this backup/).check();
  await page.getByRole('button', { name: 'Replace history with backup' }).click();
  await page.getByLabel('Compare proposed and future travel').setChecked(scenario);
}
async function download(page: Page, directory: string, name: string, appendix = false) {
  await page.getByLabel('Include detailed supporting records').setChecked(appendix);
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF report' }).click();
  await (await event).saveAs(join(directory, name + '.pdf'));
  await expect(page.getByRole('status').filter({ hasText: 'PDF report downloaded.' })).toBeVisible();
}

test('standard and optional appendix export controls preserve the same history on desktop and mobile', async ({ page, browserName, context }, info) => {
  await page.clock.install({ time: new Date('2026-10-13T12:00:00Z') });
  await page.goto('/');
  const initialRequests: string[] = [];
  page.on('request', request => initialRequests.push(request.url()));
  await load(page, approved, 2025);
  // PDF implementation and fonts remain outside the initial interaction bundle.
  expect(initialRequests.some(url => /reportPdf/.test(url))).toBe(false);
  const option = page.getByLabel('Include detailed supporting records');
  await expect(option).not.toBeChecked();
  const text = await page.getByLabel('Preparer report text').inputValue();
  expect(text).toContain('351 / 365 = 0.961644');
  expect(text).toContain('December 13, 2025 to January 13, 2026');
  expect(text).not.toContain('unrelated-source');
  expect(text).not.toContain('sample-december');
  expect(text).not.toContain('NORMALIZED');
  const stored = await page.evaluate(() => localStorage.getItem('feie.travel-history.v1'));
  const directory = join('output/playwright/report-redesign', info.project.name);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'standard-2025.clipboard.txt'), text);
  await download(page, directory, 'standard-2025');
  await download(page, directory, 'standard-2025-appendix', true);
  if (browserName === 'chromium') {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('button', { name: 'Copy preparer report' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text);
  }
  await option.scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(directory, 'export-controls.png') });
  expect(await page.evaluate(() => localStorage.getItem('feie.travel-history.v1'))).toBe(stored);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('native report samples reconcile every assessment fixture with the unchanged engine', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium-desktop', 'The cross-browser controls test covers each engine; the sample collection is generated once.');
  test.slow();
  await page.clock.install({ time: new Date('2026-10-13T12:00:00Z') });
  await page.goto('/');
  const long = history(record('long-assumption', 'foreign_assumption', '2024-01-01', '2024-12-31'), ...Array.from({ length: 24 }, (_, index) => {
    const day = new Date(Date.UTC(2024, 0, 2 + index * 10)).toISOString().slice(0, 10);
    return record(`long-${index}`, 'us', day, day, { note: `Record ${index}: ${'Résumé — Málaga; verify original travel records. '.repeat(9)}` });
  }));
  const fixtures = [
    { name: 'ongoing-cross-year', year: 2025, data: history({ ...approved.records[0], ongoing: true as const, end_date: '2100-12-31' }, ...approved.records.slice(1)) },
    { name: 'fully-qualifying', year: 2025, data: history(record('full', 'foreign', '2025-01-01', '2025-12-31')) },
    { name: 'multiple-periods', year: 2024, data: history(record('multiple-declaration', 'foreign_assumption', '2023-01-01', '2025-12-31'), record('multiple-visit', 'us', '2024-06-01', '2024-07-31')) },
    { name: 'incomplete', year: 2025, data: history(record('incomplete', 'foreign', '2025-01-01', '2025-11-25')) },
    { name: 'failure', year: 2025, data: history(record('failure-before', 'nonqualifying', '2024-01-02', '2024-12-31'), record('failure-foreign', 'foreign', '2025-01-01', '2025-11-25'), record('failure-after', 'nonqualifying', '2025-11-26', '2026-12-30')) },
    { name: 'positive-comparison', year: 2025, scenario: true, data: history(record('positive-completed', 'foreign', '2025-01-01', '2025-11-25'), record('positive-proposal', 'foreign', '2025-11-26', '2025-11-26', { status: 'proposed' })) },
    { name: 'negative-comparison', year: 2025, scenario: true, data: history(record('negative-completed', 'foreign', '2025-01-01', '2025-11-26'), record('negative-proposal', 'us', '2025-11-26', '2025-11-26', { status: 'proposed' })) },
    { name: 'overridden-declaration', year: 2025, scenario: true, data: history(record('override-assumption', 'foreign_assumption', '2025-01-01', '2025-12-31', { note: 'Baseline declaration retained for comparison' }), record('override-proposal', 'foreign', '2025-01-01', '2025-12-31', { status: 'proposed' })) },
    { name: 'unicode', year: 2025, data: history(approved.records[0], { ...approved.records[1], note: 'Résumé — Málaga Ελληνικά Кириллица 東京 🌍' }, approved.records[2]) },
    { name: 'long-history', year: 2024, data: long }
  ];
  const directory = join('output/playwright/report-redesign', info.project.name);
  await mkdir(directory, { recursive: true });
  const manifest = [];
  for (const fixture of fixtures) {
    await load(page, fixture.data, fixture.year, fixture.scenario);
    const assessment = assessTravel(fixture.data, fixture.year, '2026-10-13', fixture.scenario);
    const baseline = fixture.scenario ? assessTravel(fixture.data, fixture.year, '2026-10-13') : undefined;
    const report = buildReport(assessment, undefined, baseline);
    const text = await page.getByLabel('Preparer report text').inputValue();
    expect(text).toContain(report.status_label);
    if (fixture.name === 'overridden-declaration') expect(text).toContain('This declaration supports the completed baseline only.');
    expect(text).toContain(`${report.qualifying_days} / ${report.tax_year_days} = ${report.fraction.toFixed(6)}`);
    await writeFile(join(directory, fixture.name + '.clipboard.txt'), text);
    await download(page, directory, fixture.name);
    if (fixture.name === 'long-history' || fixture.name === 'unicode' || fixture.name === 'multiple-periods' || fixture.name === 'ongoing-cross-year' || fixture.scenario) await download(page, directory, fixture.name + '-appendix', true);
    manifest.push({ name: fixture.name, year: fixture.year, status: report.status, numerator: report.qualifying_days, denominator: report.tax_year_days, periods: report.supporting_periods, delta: report.comparison?.delta_days, exceptions: relevantExceptions(report).map(item => ({ start: item.record.start_date, end: item.record.end_date, days: item.days })) });
  }
  await writeFile(join(directory, 'engine-reconciliation.json'), JSON.stringify(manifest, null, 2));
});
