import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

async function open(page: Page) {
  await page.goto('/');
  await page.getByLabel('Calendar tax year', { exact: true }).fill('2024');
}
async function add(page: Page, kind: string, start: string, end: string, proposed = false) {
  await page.getByLabel('Record type', { exact: true }).selectOption(kind);
  await page.getByLabel(kind.startsWith('foreign') ? 'First full foreign day' : 'Start date', { exact: true }).fill(start);
  await page.getByLabel(kind.startsWith('foreign') ? 'Last full foreign day' : 'End date', { exact: true }).fill(end);
  await page.getByLabel('Travel status', { exact: true }).selectOption(proposed ? 'proposed' : 'completed');
  if (kind === 'foreign_assumption') await page.getByLabel(/I explicitly assume/).check();
  await page.getByRole('button', { name: 'Save travel record', exact: true }).click();
}
async function noOverflow(page: Page) {
  const widths = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
}

test('direct entry, year/view changes, correction, reload and keyboard labels', async ({ page }) => {
  const errors: string[] = [];
  const externalRequests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (new URL(request.url()).hostname !== '127.0.0.1') externalRequests.push(request.url());
  });
  await open(page);
  const top = await page.getByLabel('First full foreign day').evaluate(input => input.getBoundingClientRect().top + scrollY);
  expect(top).toBeLessThan(1200);
  await add(page, 'foreign', '2024-01-01', '2024-11-30');
  await expect(page.getByRole('heading', { name: 'Physical-presence threshold met', exact: true })).toBeVisible();
  await noOverflow(page);
  await page.getByLabel('Calendar tax year').fill('2027');
  await page.getByRole('button', { name: 'Enter U.S. visits' }).click();
  await page.getByRole('button', { name: 'Enter time abroad' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Edit Full foreign days 2024-01-01' })).toBeVisible();
  await page.getByRole('button', { name: 'Edit Full foreign days 2024-01-01' }).click();
  await expect(page.getByLabel('First full foreign day')).toBeFocused();
  await page.getByLabel('Last full foreign day').fill('2024-11-25');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByLabel('Calendar tax year').fill('2024');
  await expect(page.getByRole('heading', { name: 'Physical-presence threshold met', exact: true })).toBeVisible();
  await page.keyboard.press('Control+Home');
  await page.getByRole('link', { name: 'Skip to calculator' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('main #calculator-settings')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Calendar tax year')).toBeFocused();
  const unnamed = await page.locator('input,select,textarea').evaluateAll(inputs => inputs.filter(element => {
    const input = element as HTMLInputElement;
    return !input.labels?.length && !input.getAttribute('aria-label');
  }).length);
  expect(unnamed).toBe(0);
  await expect(page.getByLabel('Choose travel-history backup')).toHaveAttribute('tabindex', '-1');
  await noOverflow(page);
  expect(errors).toEqual([]);
  expect(externalRequests).toEqual([]);
});

test('bounded U.S. workflow, shared copy/PDF evidence and portable backup restore', async ({ page }, testInfo) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true,
    value: { writeText: async (text: string) => { (window as unknown as { copiedReport: string }).copiedReport = text; } } }));
  await open(page);
  await page.getByRole('button', { name: 'Enter U.S. visits' }).click();
  await expect(page.getByRole('heading', { name: 'Add travel evidence to begin' })).toBeVisible();
  await add(page, 'foreign_assumption', '2024-01-01', '2024-12-31');
  await add(page, 'us', '2024-12-01', '2024-12-31');
  await expect(page.getByRole('heading', { name: 'Threshold met under declared assumptions' })).toBeVisible();
  const text = await page.getByLabel('Preparer report text').inputValue();
  expect(text).toContain('December 1, 2024 to December 31, 2024');
  expect(text).toContain('366 / 366');
  await page.getByRole('button', { name: 'Copy preparer report' }).click();
  expect(await page.evaluate(() => (window as unknown as { copiedReport: string }).copiedReport)).toBe(text);
  const pdfEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF report' }).click();
  const pdf = await pdfEvent;
  const pdfPath = testInfo.outputPath('ordinary-report.pdf'); await pdf.saveAs(pdfPath);
  expect((await readFile(pdfPath)).subarray(0, 5).toString()).toBe('%PDF-');
  const backupEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON backup' }).click();
  const backup = await backupEvent;
  const backupPath = testInfo.outputPath('history.json'); await backup.saveAs(backupPath);
  expect(JSON.parse(await readFile(backupPath, 'utf8')).records).toHaveLength(2);
  await page.getByText('Reset saved history', { exact: true }).first().click();
  await page.getByLabel('I want to remove all saved travel records.').check();
  await page.getByRole('button', { name: 'Reset saved history', exact: true }).click();
  await page.getByLabel('Choose travel-history backup').setInputFiles(backupPath);
  await expect(page.getByRole('heading', { name: 'Review import: 2 records' })).toBeVisible();
  await page.getByRole('button', { name: 'Merge imported records' }).click();
  await expect(page.getByRole('heading', { name: 'Threshold met under declared assumptions' })).toBeVisible();
  await page.reload();
  await page.getByLabel('Calendar tax year').fill('2024');
  await expect(page.getByRole('button', { name: 'Edit U.S. visit 2024-12-01' })).toBeVisible();
  await noOverflow(page);
});

test('scenario and example previews preserve history; malformed import is recoverable', async ({ page }) => {
  await open(page);
  await add(page, 'foreign', '2024-01-01', '2024-12-31', true);
  await expect(page.getByRole('heading', { name: 'Add travel evidence to begin' })).toBeVisible();
  const source = await page.evaluate(() => localStorage.getItem('feie.travel-history.v1'));
  await page.getByLabel('Compare proposed and future travel').check();
  await expect(page.getByRole('heading', { name: 'Projected physical-presence coverage' })).toBeVisible();
  await page.getByRole('button', { name: 'Preview an example' }).click();
  await expect(page.getByText(/Your saved travel records are unchanged/)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('feie.travel-history.v1'))).toBe(source);
  await page.getByRole('button', { name: 'Close example' }).click();
  await page.getByLabel('Compare proposed and future travel').uncheck();
  await expect(page.getByRole('heading', { name: 'Add travel evidence to begin' })).toBeVisible();
  await page.getByLabel('Choose travel-history backup').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
  await expect(page.getByRole('alert')).toContainText('not valid JSON');
  expect(await page.evaluate(() => localStorage.getItem('feie.travel-history.v1'))).toBe(source);
  await noOverflow(page);
});

test('empty and populated workflows have no automated WCAG A/AA violations', async ({ page }) => {
  await open(page);
  const empty = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(empty.violations).toEqual([]);
  await add(page, 'foreign', '2024-01-01', '2024-11-30');
  const populated = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(populated.violations).toEqual([]);
  await noOverflow(page);
});

test('native Chromium clipboard receives the complete report', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Native clipboard permission grant is Chromium-specific; Firefox copy dispatch is covered separately.');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page);
  await page.getByRole('button', { name: 'Copy preparer report' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Preparer report copied.' })).toBeVisible();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toBe(await page.getByLabel('Preparer report text').inputValue());
});

test('large imported history exports a multipage PDF without widening the page', async ({ page }, testInfo) => {
  await open(page);
  const records = Array.from({ length: 120 }, (_, index) => {
    const date = new Date(Date.UTC(2024, 0, 1 + index * 3)).toISOString().slice(0, 10);
    return { id: `large-${index}`, kind: 'unknown', status: 'completed', start_date: date, end_date: date,
      note: `Evidence row ${index}: ${'Review original travel documentation. '.repeat(4)}` };
  });
  await page.getByLabel('Choose travel-history backup').setInputFiles({ name: 'large-history.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ schema_version: 1, records })) });
  await expect(page.getByRole('heading', { name: 'Review import: 120 records' })).toBeVisible();
  await page.getByRole('button', { name: 'Merge imported records' }).click();
  await expect(page.getByRole('heading', { name: 'Incomplete travel evidence' })).toBeVisible();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF report' }).click();
  const pdf = await downloaded;
  const pdfPath = testInfo.outputPath('multipage-report.pdf'); await pdf.saveAs(pdfPath);
  const bytes = await readFile(pdfPath);
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  expect(bytes.length).toBeGreaterThan(10000);
  await noOverflow(page);
});
