import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

test.use({ video: 'on' });
async function start(page: Page, info: TestInfo) {
  await mkdir(join('output/playwright/corrective-review', info.project.name), { recursive: true });
  await page.clock.install({ time: new Date('2026-10-13T12:00:00Z') });
  await page.goto('/');
  await page.getByLabel('Calendar tax year').fill('2024');
}
async function capture(page: Page, info: TestInfo, name: string) {
  // Curate desktop/mobile Chromium evidence; other projects verify the same interactions.
  if (!['chromium-desktop', 'chromium-mobile'].includes(info.project.name)) return;
  const directory = join('output/playwright/corrective-review', info.project.name);
  await mkdir(directory, { recursive: true });
  await page.screenshot({ path: join(directory, `${name}.png`), fullPage: true });
  await page.screenshot({ path: join(directory, `${name}-viewport.png`) });
}
async function visit(page: Page, start: string, end: string) {
  await page.getByLabel('Start date', { exact: true }).fill(start);
  await page.getByLabel('End date', { exact: true }).fill(end);
  await page.getByRole('button', { name: 'Save travel record', exact: true }).click();
}

test('ongoing foreign baseline, repeated visits, mobile correction and confirmed ending', async ({ page }, info) => {
  test.slow(); // Full lifecycle plus fourteen screenshots and a native PDF download.
  await start(page, info);
  const dateTop = await page.getByLabel('First full foreign day').evaluate(input => input.getBoundingClientRect().top + scrollY);
  expect(dateTop).toBeLessThan(650);
  await expect(page.getByRole('heading', { name: 'Add travel evidence to begin' })).toBeVisible();
  await capture(page, info, '01-first-use');
  await page.getByRole('button', { name: 'Enter U.S. visits' }).click();
  await page.getByRole('button', { name: 'Establish default foreign presence' }).click();
  await expect(page.getByLabel('Travel status')).toHaveCount(0);
  await page.getByLabel('First full foreign day').fill('2024-01-01');
  await page.getByLabel(/I explicitly assume/).check();
  await capture(page, info, '02-baseline-setup');
  await page.getByRole('button', { name: 'Save default foreign presence' }).click();
  await expect(page.getByLabel('Record type')).toHaveValue('us');
  await expect(page.getByText('Default foreign presence since 2024-01-01 · Ongoing')).toBeVisible();
  await visit(page, '2024-02-01', '2024-02-05');
  await visit(page, '2024-06-01', '2024-06-05');
  await visit(page, '2024-10-01', '2024-10-03');
  await expect(page.getByRole('heading', { name: 'Threshold met under declared assumptions' })).toBeVisible();
  await capture(page, info, '03-ongoing-and-visits');
  const record = page.getByRole('row').filter({ has: page.getByRole('button', { name: 'Edit U.S. visit 2024-06-01' }) });
  await record.evaluate(row => row.scrollIntoView({ block: 'center' }));
  const geometry = await record.evaluate(row => ({ width: row.getBoundingClientRect().width,
    actions: row.querySelector('button')!.getBoundingClientRect().right, viewport: innerWidth }));
  expect(geometry.actions).toBeLessThanOrEqual(geometry.viewport);
  await capture(page, info, '04-history-records');
  await page.getByRole('button', { name: 'Edit U.S. visit 2024-06-01' }).click();
  await expect(page.getByLabel('Start date', { exact: true })).toBeFocused();
  await page.getByLabel('End date', { exact: true }).fill('2024-06-07');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(record).toContainText('2024-06-07');
  await page.getByRole('button', { name: 'Edit default presence' }).click();
  await page.getByLabel('First full foreign day').fill('2023-12-31');
  await page.getByLabel(/I explicitly assume/).check();
  await page.getByRole('button', { name: 'Save default foreign presence' }).click();
  await capture(page, info, '05-edited-baseline');
  const beforeEnding = await page.evaluate(() => localStorage.getItem('feie.travel-history.v1'));
  await page.getByRole('button', { name: 'End default presence' }).click();
  await page.getByLabel('Final covered full foreign day').fill('2024-12-31');
  await page.getByLabel(/I explicitly assume/).check();
  await expect(page.getByRole('button', { name: 'Confirm end of foreign presence' })).toBeDisabled();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('feie.travel-history.v1'))).toBe(beforeEnding);
  await page.getByRole('button', { name: 'End default presence' }).click();
  await page.getByLabel('Final covered full foreign day').fill('2024-12-31');
  await page.getByLabel(/I explicitly assume/).check();
  await page.getByLabel(/End default foreign presence after/).check();
  await page.getByRole('button', { name: 'Confirm end of foreign presence' }).scrollIntoViewIfNeeded();
  await capture(page, info, '06-ending-confirmation');
  await page.getByRole('button', { name: 'Confirm end of foreign presence' }).click();
  await expect(page.getByText(/Default foreign presence since/)).toHaveCount(0);
  const ended = await page.evaluate(() => JSON.parse(localStorage.getItem('feie.travel-history.v1')!));
  expect(ended.records).toHaveLength(4);
  expect(ended.records[0].ongoing).toBeUndefined();
  expect(ended.records[0].end_date).toBe('2024-12-31');
  await capture(page, info, '07-ended-baseline');
  await page.getByRole('button', { name: 'Edit Declared foreign presence 2023-12-31' }).click();
  await expect(page.getByLabel('Final covered full foreign day')).toHaveValue('2024-12-31');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF report' }).click();
  await (await downloaded).saveAs(join('output/playwright/corrective-review', info.project.name, 'ordinary-preparer.pdf'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('C01 definitive upper bound and C02 independent example context', async ({ page }, info) => {
  await start(page, info);
  const records = [
    { id: 'a', kind: 'us', status: 'completed', start_date: '2023-01-02', end_date: '2024-01-01', note: '' },
    { id: 'b', kind: 'us', status: 'completed', start_date: '2024-01-03', end_date: '2025-12-30', note: '' }
  ];
  await page.getByLabel('Choose travel-history backup').setInputFiles({ name: 'synthetic-upper-bound.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ schema_version: 1, records })) });
  await page.getByRole('button', { name: 'Merge imported records' }).click();
  await expect(page.getByRole('heading', { name: 'Physical-presence threshold not met' })).toBeVisible();
  await expect(page.getByText('1 / 330', { exact: true })).toBeVisible();
  await page.getByText('1 / 330', { exact: true }).scrollIntoViewIfNeeded();
  await capture(page, info, '08-definitive-failure');
  await page.getByRole('button', { name: 'Preview an example' }).click();
  await expect(page.getByRole('heading', { name: 'Physical presence · 2025' })).toBeVisible();
  await expect(page.getByText(/Completed-record coverage:/)).toHaveCount(0);
  expect(await page.getByLabel('Preparer report text').inputValue()).not.toContain('Completed and projected comparison');
  await capture(page, info, '09-example-context');
});

test('C03 projected comparison is shared by page, clipboard and downloaded PDF', async ({ page, context, browserName }, info) => {
  if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await start(page, info);
  await page.getByLabel('Calendar tax year').fill('2026');
  await page.getByRole('button', { name: 'Enter U.S. visits' }).click();
  await page.getByRole('button', { name: 'Establish default foreign presence' }).click();
  await page.getByLabel('First full foreign day').fill('2026-01-01');
  await page.getByLabel(/I explicitly assume/).check();
  await page.getByRole('button', { name: 'Save default foreign presence' }).click();
  await page.getByLabel('Compare proposed and future travel').check();
  await expect(page.getByRole('heading', { name: 'Projected physical-presence coverage' })).toBeVisible();
  const report = await page.getByLabel('Preparer report text').inputValue();
  expect(report).toContain('Completed-record coverage: 0 / 365');
  expect(report).toContain('Scenario coverage: 365 / 365; change: +365 days.');
  await expect(page.getByText('0 / 365 days', { exact: true })).toBeVisible();
  await page.getByText('0 / 365 days', { exact: true }).scrollIntoViewIfNeeded();
  await capture(page, info, '10-projected-comparison');
  if (browserName === 'chromium') {
    await page.getByRole('button', { name: 'Copy preparer report' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(report);
  }
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF report' }).click();
  await (await downloaded).saveAs(join('output/playwright/corrective-review', info.project.name, 'scenario-preparer.pdf'));
});


test('bounded baseline setup, validation focus, import recognition and two-period preparer PDF', async ({ page }, info) => {
  await start(page, info);
  await page.getByRole('button', { name: 'Enter U.S. visits' }).click();
  await page.getByRole('button', { name: 'Establish default foreign presence' }).click();
  await page.getByLabel('First full foreign day').fill('2024-01-01');
  await page.getByLabel('Foreign presence continues').selectOption('ended');
  await page.getByLabel('Final covered full foreign day').fill('2024-12-31');
  await page.getByLabel(/I explicitly assume/).check();
  await page.getByRole('button', { name: 'Save default foreign presence' }).click();
  await page.getByLabel('Start date', { exact: true }).fill('2024-06-10');
  await page.getByLabel('End date', { exact: true }).fill('2024-06-01');
  await page.getByRole('button', { name: 'Save travel record', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('ordered calendar dates');
  await expect(page.getByRole('alert')).toBeFocused();
  await capture(page, info, '11-validation-focus');
  await page.getByLabel('End date', { exact: true }).fill('2024-06-15');
  await page.getByRole('button', { name: 'Save travel record', exact: true }).click();
  const source = await page.evaluate(() => localStorage.getItem('feie.travel-history.v1'));
  const records = [
    { id: 'baseline', kind: 'foreign_assumption', status: 'completed', start_date: '2023-01-01', end_date: '2025-12-31', note: 'Synthetic multi-period review' },
    { id: 'exception', kind: 'us', status: 'completed', start_date: '2024-06-01', end_date: '2024-07-31', note: 'Synthetic exception' }
  ];
  const upload = () => page.getByLabel('Choose travel-history backup').setInputFiles({ name: 'synthetic-multiple-periods.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ schema_version: 1, records })) });
  await upload();
  await expect(page.getByRole('heading', { name: 'Review import: 2 records' })).toBeVisible();
  await expect(page.getByLabel('Review backup import')).toContainText('2023-01-01 through 2025-12-31');
  await page.getByRole('heading', { name: 'Review import: 2 records' }).scrollIntoViewIfNeeded();
  await capture(page, info, '12-import-recognition');
  await page.getByRole('button', { name: 'Cancel import' }).click();
  expect(await page.evaluate(() => localStorage.getItem('feie.travel-history.v1'))).toBe(source);
  await upload();
  await page.getByLabel('Replace all 2 existing records with this backup.').check();
  await page.getByRole('button', { name: 'Replace history with backup' }).click();
  await expect(page.getByRole('heading', { name: 'Threshold met under declared assumptions' })).toBeVisible();
  const report = await page.getByLabel('Preparer report text').inputValue();
  expect(report).toContain('Supporting periods: 2.');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF report' }).click();
  await (await downloaded).saveAs(join('output/playwright/corrective-review', info.project.name, 'multiple-periods.pdf'));
  await capture(page, info, '13-multiple-supports');
});
