import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

test.use({ timezoneId: 'America/Managua' });

test('local completed day, adjustment and isolated demonstration survive the UTC boundary', async ({ page }, info) => {
  await page.clock.install({ time: new Date('2026-11-27T01:30:00Z') });
  await page.goto('/');
  await page.getByLabel('Calendar tax year').fill('2026');
  await expect(page.getByText('Completed through 2026-11-25 · Device calendar')).toBeVisible();
  const records = [{ id: 'utc-boundary', kind: 'foreign', status: 'completed', start_date: '2026-01-01', end_date: '2026-11-26', note: 'Synthetic timezone-boundary review' }];
  await page.getByLabel('Choose travel-history backup').setInputFiles({ name: 'boundary.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ schema_version: 1, records })) });
  await page.getByRole('button', { name: 'Merge imported records' }).click();
  await expect(page.getByText('329 / 330 required', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Physical-presence threshold met', exact: true })).toHaveCount(0);
  const saved = await page.evaluate(() => localStorage.getItem('feie.travel-history.v1'));
  const directory = join('output/playwright/refinement-review', info.project.name);
  await mkdir(directory, { recursive: true });
  if (info.project.name.startsWith('chromium') && info.project.name !== 'chromium-tablet') {
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: join(directory, '01-local-boundary.png'), fullPage: true });
    await page.screenshot({ path: join(directory, '01-local-boundary-viewport.png') });
  }
  await page.getByLabel('Compare proposed and future travel').check();
  const text = await page.getByLabel('Preparer report text').inputValue();
  expect(text).toContain('329 recorded completed');
  expect(text).toContain('1 projected');
  expect(text).toContain('Completed through: 2026-11-25');
  await page.getByText('Completed through 2026-11-25 · Device calendar').click();
  await page.getByLabel('Last completed calendar day').fill('2026-11-24');
  await page.getByRole('button', { name: 'Apply completed-day cutoff' }).click();
  await expect(page.getByText('Completed through 2026-11-24 · Manual')).toBeVisible();
  expect(await page.getByLabel('Preparer report text').inputValue()).toContain('cutoff was manually selected');
  await page.getByRole('button', { name: 'Preview an example' }).click();
  await expect(page.getByLabel('Saved calendar tax year')).toHaveValue('2026');
  await expect(page.getByLabel('Saved calendar tax year')).toBeDisabled();
  await expect(page.getByText(/Your saved calculation for 2026 is paused/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Physical presence · 2025' })).toBeVisible();
  expect(await page.getByLabel('Preparer report text').inputValue()).not.toContain('Completed and projected comparison');
  if (info.project.name === 'chromium-mobile' || info.project.name === 'chromium-desktop') {
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: join(directory, '02-demonstration.png'), fullPage: true });
    await page.screenshot({ path: join(directory, '02-demonstration-viewport.png') });
  }
  await page.getByRole('button', { name: 'Close example' }).click();
  await expect(page.getByLabel('Calendar tax year')).toHaveValue('2026');
  await expect(page.getByLabel('Compare proposed and future travel')).toBeChecked();
  await page.getByText('Completed through 2026-11-24 · Manual').click();
  await page.getByRole('button', { name: 'Use device default' }).click();
  await expect(page.getByText('Completed through 2026-11-25 · Device calendar')).toBeVisible();
  await page.clock.setSystemTime(new Date('2026-11-27T06:00:00Z'));
  await page.getByText('Completed through 2026-11-25 · Device calendar').click();
  await page.getByRole('button', { name: 'Use device default' }).click();
  await expect(page.getByText('Completed through 2026-11-26 · Device calendar')).toBeVisible();
  await page.getByLabel('Compare proposed and future travel').uncheck();
  await expect(page.getByText('330 / 330 required', { exact: true })).toBeVisible();
  const completed = await page.getByLabel('Preparer report text').inputValue();
  expect(completed).toContain('330 recorded completed');
  expect(completed).not.toContain('1 projected');
  // The containing period still ends in the future; preserve its projected assessment.
  await expect(page.getByRole('heading', { name: 'Projected physical-presence coverage', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('feie.travel-history.v1'))).toBe(saved);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
