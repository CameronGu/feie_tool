import { test, expect, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const output = 'output/playwright/homepage-spacing-tests';
async function capture(page: Page, info: TestInfo, name: string) {
  if (!info.project.name.startsWith('chromium-')) return;
  const directory = join(output, info.project.name);
  await mkdir(directory, { recursive: true });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: join(directory, `${name}.png`) });
  await page.screenshot({ path: join(directory, `${name}-full.png`), fullPage: true });
  const geometry = await page.evaluate(() => ({
    viewport: { width: innerWidth, height: innerHeight },
    firstDateTop: document.querySelector<HTMLInputElement>('#travel-entry input[type="date"]')!.getBoundingClientRect().top,
    exampleHeight: document.querySelector('.income-example')!.getBoundingClientRect().height,
    overflow: document.documentElement.scrollWidth > innerWidth
  }));
  await writeFile(join(directory, `${name}.json`), JSON.stringify(geometry, null, 2));
}
async function start(page: Page) {
  await page.clock.install({ time: new Date('2026-10-13T12:00:00Z') });
  await page.goto('/');
}

async function checkSettingsLayout(page: Page) {
  const geometry = await page.evaluate(() => {
    const rect = (selector: string) => {
      const box = document.querySelector(selector)!.getBoundingClientRect();
      return { top: box.top + scrollY, bottom: box.bottom + scrollY, left: box.left, right: box.right };
    };
    return { width: innerWidth, introduction: rect('.introduction'), settings: rect('#calculator-settings'),
      income: rect('.income-example'), calculator: rect('.calculator-grid'),
      firstDateTop: rect('#travel-entry input[type="date"]').top,
      overflow: document.documentElement.scrollWidth > innerWidth };
  });
  await expect(page.locator('main #tax-year')).toHaveCount(1);
  await expect(page.locator('main .cutoff-settings')).toHaveCount(1);
  expect(geometry.overflow).toBe(false);
  if (geometry.width > 900) {
    expect(geometry.settings.left).toBeCloseTo(geometry.introduction.left, 1);
    expect(geometry.settings.right).toBeCloseTo(geometry.introduction.right, 1);
    expect(geometry.settings.top - geometry.introduction.bottom).toBeCloseTo(12);
    expect(geometry.calculator.top - Math.max(geometry.income.bottom, geometry.settings.bottom)).toBeCloseTo(20);
  } else {
    expect(geometry.settings.top).toBeGreaterThanOrEqual(Math.max(geometry.introduction.bottom, geometry.income.bottom));
    expect(geometry.settings.left).toBeCloseTo(geometry.calculator.left, 1);
    expect(geometry.settings.right).toBeCloseTo(geometry.calculator.right, 1);
  }
  // Accepted first-use positions: mobile 641.44px and tablet 677.97px.
  if (geometry.width === 390) expect(geometry.firstDateTop).toBeLessThan(642);
  if (geometry.width === 768) expect(geometry.firstDateTop).toBeLessThan(678.5);
  if ([1024, 1440].includes(geometry.width)) expect(geometry.firstDateTop).toBeLessThan(670);
}

test('first use keeps travel entry accessible and links directly to optional guidance below history', async ({ page }, info) => {
  await start(page);
  const width = page.viewportSize()!.width;
  const example = page.getByRole('region', { name: 'Why track your days abroad?' });
  await expect(example).toContainText('~$17,500 less in federal income tax');
  await expect(example).toContainText('Assumes $120,000 earned abroad, full-year FEIE eligibility');
  await expect(example).toContainText('2026 tax example');
  await expect(example).toContainText('Separate from your travel year.');
  await checkSettingsLayout(page);
  await page.getByRole('link', { name: 'Skip to calculator' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('main #calculator-settings')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Calendar tax year')).toBeFocused();
  await page.evaluate(() => scrollTo(0, 0));
  await expect(page.locator('.feie-guidance')).not.toHaveAttribute('open');
  const dateTop = await page.getByLabel('First full foreign day').evaluate(input => input.getBoundingClientRect().top);
  expect(dateTop).toBeLessThan(width <= 600 ? 650 : 850);
  if (width <= 900) {
    await expect(page.getByRole('button', { name: 'Adjust income and see the calculation' })).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('spinbutton', { name: /Annual salary/ })).not.toBeVisible();
  } else {
    await expect(page.getByRole('spinbutton', { name: /Annual salary/ })).toBeVisible();
    const bounds = await page.evaluate(() => {
      const intro = document.querySelector('.home-intro')!.getBoundingClientRect();
      const calculator = document.querySelector('.calculator-grid')!.getBoundingClientRect();
      const income = document.querySelector('.income-example')!.getBoundingClientRect();
      const results = document.querySelector('.results-panel')!.getBoundingClientRect();
      return { introLeft: intro.left, calcLeft: calculator.left, introWidth: intro.width, calcWidth: calculator.width, incomeLeft: income.left, resultLeft: results.left };
    });
    expect(bounds.introLeft).toBe(bounds.calcLeft);
    expect(bounds.introWidth).toBe(bounds.calcWidth);
    expect(bounds.incomeLeft).toBe(bounds.resultLeft);
  }
  await capture(page, info, '01-first-use');
  const calculatorTop = await page.locator('.calculator-grid').evaluate(el => el.getBoundingClientRect().top + scrollY);
  await page.getByRole('link', { name: 'How FEIE works', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.feie-guidance')).toHaveAttribute('open');
  await expect(page.locator('.feie-guidance')).toBeFocused();
  expect(await page.locator('.calculator-grid').evaluate(el => el.getBoundingClientRect().top + scrollY)).toBeCloseTo(calculatorTop, 2);
  const historyBottom = await page.locator('.history-panel').evaluate(el => el.getBoundingClientRect().bottom + scrollY);
  expect(await page.locator('.feie-guidance').evaluate(el => el.getBoundingClientRect().top + scrollY)).toBeGreaterThan(historyBottom);
  await expect(page.getByText(/Temporary U.S. visits do not necessarily/)).toBeVisible();
  await expect(page.locator('.feie-guidance .income-example')).toHaveCount(0);
  if (info.project.name.startsWith('chromium-')) {
    await page.locator('.feie-guidance').screenshot({ path: join(output, info.project.name, '02-guidance.png') });
  }
  await page.locator('.feie-guidance > summary').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('.feie-guidance')).not.toHaveAttribute('open');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  if (width === 1440) {
    for (const [nextWidth, height] of [[1024, 900], [901, 900], [900, 900], [768, 1024], [601, 900], [600, 900], [390, 844]]) {
      await page.setViewportSize({ width: nextWidth, height });
      await page.evaluate(() => scrollTo(0, 0));
      await checkSettingsLayout(page);
      if (nextWidth === 1024) await capture(page, info, '06-first-use-1024');
    }
  }
});

test('one financial state survives responsive disclosure, keyboard adjustment and resizing', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await start(page);
  const salary = page.getByRole('spinbutton', { name: /Annual salary/ });
  const slider = page.getByRole('slider', { name: 'Adjust annual salary' });
  const history = await page.evaluate(() => localStorage.getItem('feie.travel-history.v1'));
  const report = await page.getByLabel('Preparer report text').inputValue();
  await salary.fill('180000');
  await expect(slider).toHaveValue('180000');
  await expect(page.locator('.income-example')).toContainText('Approximately $31,934');
  await expect(page.locator('.income-example')).toContainText('Approximately $7,440');
  const barWidths = await page.locator('.tax-bar').evaluateAll(bars => bars.map(bar => (bar as HTMLElement).style.width));
  expect(barWidths[0]).toBe('100%');
  expect(parseFloat(barWidths[1])).toBeCloseTo(7440 / 31934 * 100);
  if (info.project.name === 'chromium-desktop') await capture(page, info, '03-desktop-adjusted');
  await page.setViewportSize({ width: 390, height: 844 });
  const disclosure = page.locator('.income-disclosure');
  await expect(disclosure).toHaveAttribute('aria-expanded', 'false');
  await expect(salary).not.toBeVisible();
  await expect(page.locator('.income-premise')).toContainText('$180,000');
  if (info.project.name === 'chromium-desktop') await capture(page, info, '04-mobile-adjusted-collapsed');
  await disclosure.focus();
  await page.keyboard.press('Enter');
  await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
  await expect(salary).toHaveValue('180000');
  await slider.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(salary).toHaveValue('175000');
  await salary.fill('120000');
  if (info.project.name === 'chromium-desktop') await capture(page, info, '05-mobile-expanded');
  await page.getByRole('button', { name: 'Hide income controls and calculation' }).focus();
  await page.keyboard.press('Space');
  await expect(salary).not.toBeVisible();
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(salary).not.toBeVisible();
  await disclosure.click();
  await expect(salary).toHaveValue('120000');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(salary).toHaveValue('120000');
  await expect(page.locator('#example-salary')).toHaveCount(1);
  await page.getByLabel('Calendar tax year').fill('2024');
  await expect(page.locator('.income-example')).toContainText('2026 tax example');
  expect(await page.evaluate(() => localStorage.getItem('feie.travel-history.v1'))).toBe(history);
  await page.getByLabel('Calendar tax year').fill('2025');
  expect(await page.getByLabel('Preparer report text').inputValue()).toBe(report);
  const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(a11y.violations).toEqual([]);
});
