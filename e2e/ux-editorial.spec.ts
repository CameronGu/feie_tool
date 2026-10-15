import { test, expect, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

test.use({ timezoneId: 'America/Managua' });
async function start(page: Page) {
  await page.clock.install({ time: new Date('2026-10-13T12:00:00Z') });
  await page.goto('/');
}
async function capture(page: Page, info: TestInfo, name: string, selector?: string) {
  if (!['chromium-desktop', 'chromium-mobile'].includes(info.project.name)) return;
  const directory = join('output/playwright/ux-editorial', info.project.name);
  await mkdir(directory, { recursive: true });
  if (selector) await page.locator(selector).screenshot({ path: join(directory, `${name}.png`) });
  else {
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: join(directory, `${name}.png`), fullPage: true });
    await page.screenshot({ path: join(directory, `${name}-viewport.png`) });
  }
}
async function expandIncome(page: Page) {
  const toggle = page.getByRole('button', { name: 'Adjust income and see the calculation' });
  if (await toggle.isVisible()) await toggle.click();
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test('experienced expatriate calculates and exports without opening educational help', async ({ page }, info) => {
  await start(page);
  await capture(page, info, '01-first-use');
  await expect(page.locator('.feie-guidance')).not.toHaveAttribute('open');
  const dateTop = await page.getByLabel('First full foreign day').evaluate(input => input.getBoundingClientRect().top);
  expect(dateTop).toBeLessThan(850);
  await page.getByLabel('Calendar tax year').fill('2025');
  await page.getByRole('button', { name: 'Enter U.S. visits' }).click();
  await page.getByRole('button', { name: 'Establish default foreign presence' }).click();
  await page.getByLabel('First full foreign day').fill('2015-01-01');
  await page.getByLabel('Foreign presence continues').selectOption('ended');
  await page.getByLabel('Final covered full foreign day').fill('2025-12-31');
  await page.getByLabel(/I explicitly assume/).check();
  await page.getByRole('button', { name: 'Save default foreign presence' }).click();
  for (const [start, end] of [['2025-05-31', '2025-06-29'], ['2025-12-13', '2026-01-13']]) {
    await page.getByLabel('Start date', { exact: true }).fill(start);
    await page.getByLabel('End date', { exact: true }).fill(end);
    await page.getByRole('button', { name: 'Save travel record', exact: true }).click();
  }
  await expect(page.getByText('330 / 330 required', { exact: true })).toBeVisible();
  await expect(page.getByText('2024-12-18 to 2025-12-17', { exact: true })).toBeVisible();
  const text = await page.getByLabel('Preparer report text').inputValue();
  expect(text).toContain('351 / 365 = 0.961644');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF report' }).click();
  expect((await download).suggestedFilename()).toBe('feie-physical-presence-2025.pdf');
  await expect(page.locator('.feie-guidance')).not.toHaveAttribute('open');
  await capture(page, info, '02-experienced-result');
  await noOverflow(page);
  await page.getByText('Why did the calculator choose these dates?', { exact: true }).click();
  await expect(page.getByText('This period supplies all 351 supported qualifying-period days in 2025.')).toBeVisible();
  await page.getByText('Why are qualifying-period days different from foreign days?', { exact: true }).click();
  await expect(page.getByText(/The fraction is/)).toContainText('351/365');
  await page.getByText('Day-count details', { exact: true }).click();
  await expect(page.locator('.period-card')).toContainText('35 / 0');
  await capture(page, info, '03-count-explanation', '.results-panel');
});

test('new international worker explores optional help and gets a cross-year result', async ({ page }, info) => {
  await start(page);
  const help = page.getByRole('link', { name: 'How FEIE works', exact: true });
  await help.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.feie-guidance')).toHaveAttribute('open');
  await expect(page.getByText(/Temporary U.S. visits do not necessarily/)).toBeVisible();
  await page.getByText('What is a foreign tax home?', { exact: true }).click();
  await expect(page.getByText(/Your tax home is generally your main place of business/)).toBeVisible();
  await page.getByText('What is a qualifying 12-month period?', { exact: true }).click();
  await expect(page.getByText(/It can cross tax years/)).toBeVisible();
  await capture(page, info, '04-feie-guidance', '.guidance-body');
  await page.locator('.feie-guidance > summary').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('.feie-guidance')).not.toHaveAttribute('open');
  await page.getByLabel('Calendar tax year').fill('2025');
  await page.getByText('What counts as a full foreign day?', { exact: true }).click();
  await expect(page.getByText(/Generally, a full day runs from midnight to midnight/)).toBeVisible();
  await page.getByLabel('First full foreign day').fill('2025-02-05');
  await page.getByLabel('Last full foreign day').fill('2025-12-31');
  await page.getByRole('button', { name: 'Save travel record', exact: true }).click();
  await expect(page.getByText('330 / 330 required', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Physical-presence threshold met', exact: true })).toBeVisible();
  await page.getByText('Why are qualifying-period days different from foreign days?', { exact: true }).click();
  await expect(page.getByText(/This fraction is a conditional share/)).toBeVisible();
  await noOverflow(page);
});

test('income example supports exact entry, pointer and keyboard controls without changing travel or exports', async ({ page }, info) => {
  await start(page);
  const history = await page.evaluate(() => localStorage.getItem('feie.travel-history.v1'));
  const report = await page.getByLabel('Preparer report text').inputValue();
  await expandIncome(page);
  const example = page.locator('.income-example');
  const salary = page.getByRole('spinbutton', { name: /Annual salary/ });
  const slider = page.getByRole('slider', { name: 'Adjust annual salary' });
  await expect(example).toContainText('2026 tax example');
  await expect(example).toContainText('Approximately $17,570');
  await expect(example).toContainText('~$17,500');
  await capture(page, info, '05-income-default', '.income-example');
  await salary.fill('180000');
  await expect(example).toContainText('Approximately $31,934');
  await expect(example).toContainText('Approximately $7,440');
  await salary.fill('180001');
  await expect(slider).toHaveValue('180001');
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(salary).toHaveValue('185001');
  await page.keyboard.press('Home');
  await expect(salary).toHaveValue('30000');
  await page.keyboard.press('End');
  await expect(salary).toHaveValue('250000');
  await expect(example).toContainText('Approximately $26,810');
  await salary.fill('250001');
  await expect(salary).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText(/Estimates below use the last valid amount/)).toBeVisible();
  await slider.scrollIntoViewIfNeeded();
  const box = (await slider.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const pointerAmount = Number(await salary.inputValue());
  expect(pointerAmount).toBeGreaterThanOrEqual(30000);
  expect(pointerAmount % 5000).toBe(0);
  await salary.fill('180000');
  await capture(page, info, '06-income-above-limit', '.income-example');
  await page.getByText('How was this calculated?', { exact: true }).click();
  await expect(example).toContainText('Tax-rate stacking:');
  await expect(example).toContainText('self-employment tax');
  await expect(example).toContainText('foreign tax credits');
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(accessibility.violations).toEqual([]);
  await noOverflow(page);
  expect(await page.evaluate(() => localStorage.getItem('feie.travel-history.v1'))).toBe(history);
  expect(await page.getByLabel('Preparer report text').inputValue()).toBe(report);
  await page.reload();
  await expandIncome(page);
  await expect(salary).toHaveValue('120000');
});

test('income slider responds to touch on mobile', async ({ browser }, info) => {
  test.skip(info.project.name !== 'chromium-mobile', 'Native touch review uses mobile Chromium.');
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4174/');
    await page.getByRole('button', { name: 'Adjust income and see the calculation' }).tap();
    const slider = page.getByRole('slider', { name: 'Adjust annual salary' });
    await slider.scrollIntoViewIfNeeded();
    const box = (await slider.boundingBox())!;
    await page.touchscreen.tap(box.x + box.width * .8, box.y + box.height / 2);
    const amount = Number(await page.getByRole('spinbutton', { name: /Annual salary/ }).inputValue());
    expect(amount).toBeGreaterThan(180000);
    expect(amount % 5000).toBe(0);
    await page.getByRole('button', { name: 'Hide income controls and calculation' }).tap();
    await expect(slider).not.toBeVisible();
    await page.getByRole('button', { name: 'Adjust income and see the calculation' }).tap();
    await expect(page.getByRole('spinbutton', { name: /Annual salary/ })).toHaveValue(String(amount));
    await noOverflow(page);
  } finally { await context.close(); }
});
