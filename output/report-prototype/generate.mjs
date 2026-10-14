/** Isolated design prototype. Reads existing calculator; never imports production exporters.
 * Run from repository root: node output/report-prototype/generate.mjs
 * Render/check afterward: python3 output/report-prototype/verify.py
 */
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { jsPDF } from 'jspdf';

const ROOT = resolve('.');
const OUT = join(ROOT, 'output/report-prototype');
const GENERATED = 'October 13, 2026';
const CALC = 'physical-presence-2.2';
const APP = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8')).version;
// Transpile unchanged calculation modules into a disposable directory. No new dependency.
const scratch = await mkdtemp(join(tmpdir(), 'feie-report-prototype-'));
let assessTravel;
try {
  for (const relative of ['domain/dates', 'domain/types', 'domain/errors', 'domain/intervals', 'domain/occupancy', 'domain/feie', 'domain/history', 'services/travelCalculator']) {
    const source = await readFile(join(ROOT, 'src', relative + '.ts'), 'utf8');
    const emitted = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText
      .replace(/(from\s+['"])(\.[^'"]+)(['"])/g, '$1$2.mjs$3');
    await mkdir(join(scratch, relative.split('/')[0]), { recursive: true });
    await writeFile(join(scratch, relative + '.mjs'), emitted);
  }
  ({ assessTravel } = await import(pathToFileURL(join(scratch, 'services/travelCalculator.mjs')).href));
} finally { await rm(scratch, { recursive: true, force: true }); }

const record = (id, kind, start_date, end_date, status = 'completed', note = '') => ({ id, kind, start_date, end_date, status, note });
const history = (...records) => ({ schema_version: 1, records });
const standardHistory = history(
  record('SYN-A01', 'foreign_assumption', '2015-01-01', '2025-12-31', 'completed', 'Synthetic bounded declaration; except recorded exceptions.'),
  record('SYN-U01', 'us', '2025-05-31', '2025-06-29'),
  record('SYN-U02', 'us', '2025-12-13', '2026-01-13')
);
const standard = assessTravel(standardHistory, 2025, '2026-10-13');
assert.equal(standard.status, 'conditional');
assert.equal(standard.calculation.qualifyingDays, 351);
assert.deepEqual(standard.calculation.supportingWindows.map(w => [w.window_start, w.window_end, w.foreign_days]), [['2024-12-18', '2025-12-17', 330]]);
const multipleHistory = history(
  record('SYN-M01', 'foreign', '2023-01-01', '2024-05-31'),
  record('SYN-M02', 'nonqualifying', '2024-06-01', '2024-07-31'),
  record('SYN-M03', 'foreign', '2024-08-01', '2025-12-31')
);
const multiple = assessTravel(multipleHistory, 2024, '2026-10-13');
assert.equal(multiple.status, 'met');
assert.equal(multiple.calculation.qualifyingDays, 366);
assert.equal(multiple.calculation.supportingWindows.length, 2);
const incompleteHistory = history(record('SYN-I01', 'foreign', '2025-01-01', '2025-11-25'));
const incomplete = assessTravel(incompleteHistory, 2025, '2026-10-13');
assert.equal(incomplete.status, 'incomplete');
assert.equal(incomplete.calculation.maxForeignDays, 329);
const failedHistory = history(
  record('SYN-F00', 'nonqualifying', '2024-01-02', '2024-12-31'),
  record('SYN-F01', 'foreign', '2025-01-01', '2025-11-25'),
  record('SYN-F02', 'nonqualifying', '2025-11-26', '2026-12-30')
);
const failed = assessTravel(failedHistory, 2025, '2027-01-01');
assert.equal(failed.status, 'not-met');
assert.equal(failed.maxPossibleForeignDays, 329);
const scenarioHistory = history(...standardHistory.records,
  record('SYN-P01', 'foreign', '2026-01-14', '2026-06-29', 'proposed', 'Synthetic proposed continuation only.')
);
const baseline = assessTravel(scenarioHistory, 2025, '2026-01-14');
const projected = assessTravel(scenarioHistory, 2025, '2026-01-14', true);
assert.equal(baseline.calculation.qualifyingDays, 351);
assert.equal(projected.calculation.qualifyingDays, 365);
assert.equal(projected.status, 'projected');

const DAY = 86400000;
const count = (start, end) => start <= end ? Math.round((Date.parse(end) - Date.parse(start)) / DAY) + 1 : 0;
const within = (row, window) => count(row.start_date > window.window_start ? row.start_date : window.window_start, row.end_date < window.window_end ? row.end_date : window.window_end);
const date = iso => new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T00:00:00Z'));
const range = (a, b) => `${date(a)} to ${date(b)}`;
const fraction = result => `${result.qualifyingDays}/${result.totalTaxYearDays} = ${result.coverageFraction.toFixed(6)} (${(result.coverageFraction * 100).toFixed(2)}%)`;
const sw = standard.calculation.supportingWindows[0];
assert.equal(count(sw.window_start, sw.window_end), 365);
assert.deepEqual(standardHistory.records.slice(1).map(r => within(r, sw)), [30, 5]);
assert.equal(330 + 30 + 5, 365);
assert.equal(count('2025-01-01', sw.window_end), 351);

const C = { navy: '#19354A', teal: '#116D72', ink: '#263A47', muted: '#526571', line: '#CED9DE', wash: '#F2F6F7' };
const L = 19, R = 191, WIDTH = R - L;
const fontRoot = '/usr/share/fonts/truetype/noto';
const fonts = await Promise.all(['NotoSans-Regular.ttf', 'NotoSans-Bold.ttf'].map(f => readFile(join(fontRoot, f), 'base64')));
let doc, y;
function text(s, x, top, size = 10.5, style = 'normal', color = C.ink, options = {}) {
  doc.setFont('Noto', style).setFontSize(size).setTextColor(color);
  doc.text(s, x, top, { baseline: 'top', ...options });
}
function rule(top, left = L, right = R, color = C.line, thickness = .25) {
  doc.setDrawColor(color).setLineWidth(thickness).line(left, top, right, top);
}
function para(s, { size = 10.5, width = WIDTH, x = L, color = C.ink, gap = 3.2, style = 'normal' } = {}) {
  doc.setFont('Noto', style).setFontSize(size);
  const lines = doc.splitTextToSize(s, width);
  const leading = size * .352778 * 1.36;
  lines.forEach((line, index) => text(line, x, y + index * leading, size, style, color));
  y += lines.length * leading + gap;
}
function section(title) { y += 2; text(title, L, y, 11.5, 'bold', C.navy); y += 6; }
function start(year, context = 'Synthetic example • visual prototype') {
  doc = new jsPDF({ format: 'a4', unit: 'mm', compress: true, putOnlyUsedFonts: true });
  doc.addFileToVFS('Noto-Regular.ttf', fonts[0]); doc.addFont('Noto-Regular.ttf', 'Noto', 'normal');
  doc.addFileToVFS('Noto-Bold.ttf', fonts[1]); doc.addFont('Noto-Bold.ttf', 'Noto', 'bold');
  doc.setProperties({ title: `Physical Presence Test | Tax Year ${year}`, author: 'Cameron Guthrie', subject: context, creator: `Isolated report prototype / ${CALC}` });
  doc.setCreationDate(new Date('2026-10-13T12:00:00Z'));
  text(context, L, 15, 8.5, 'normal', C.muted);
  text(`Generated ${GENERATED}`, R, 15, 8.5, 'normal', C.muted, { align: 'right' });
  text('Physical Presence Test', L, 25, 25, 'bold', C.navy);
  text(`Foreign Earned Income Exclusion | Tax Year ${year}`, L, 39, 11, 'normal', C.muted);
  rule(48, L, R, C.teal, .7); y = 54;
}
function footer(page = '1 / 1') {
  assert.ok(y < 270, `Content encroaches on footer at ${y}mm`);
  rule(274);
  text('FEIE Window Optimizer | by Cameron Guthrie', L, 278, 8, 'normal', C.muted);
  text(page, R, 278, 8, 'normal', C.muted, { align: 'right' });
  text(`Generated October 13, 2026 | App ${APP} | Calculation ${CALC}`, L, 284, 7.5, 'normal', C.muted);
}
async function save(name) { footer(); await writeFile(join(OUT, name + '.pdf'), Buffer.from(doc.output('arraybuffer'))); }
function metricPair(numerator, denominator, foreignDays, basis = 'assumed full foreign days') {
  rule(y); y += 5;
  text('Tax-year coverage', L, y, 10, 'bold', C.navy);
  text('Foreign-day threshold', 125, y, 10, 'bold', C.navy);
  y += 7;
  text(`${numerator} / ${denominator}`, L, y, 31, 'bold', C.navy);
  text(String(foreignDays), 125, y, 31, 'bold', C.teal);
  y += 15;
  text(`${numerator}/${denominator} = ${(numerator / denominator).toFixed(6)}`, L, y, 10.5);
  text(basis, 125, y, 9.5);
  y += 6;
  text(`${(numerator / denominator * 100).toFixed(2)}% of the tax year`, L, y, 9.5, 'normal', C.muted);
  text('330 required in 12 months', 125, y, 9.5, 'normal', C.muted);
  y += 7; rule(y); y += 2;
}
function table(headers, rows, columns, { size = 10, rowHeight = 8.5 } = {}) {
  const positions = [L]; for (const w of columns.slice(0, -1)) positions.push(positions.at(-1) + w);
  doc.setFillColor(C.wash).rect(L, y, WIDTH, 10, 'F');
  headers.forEach((h, i) => text(h, positions[i] + (i === 0 ? 2 : 1), y + 3, 9, 'bold', C.muted));
  y += 10;
  for (const row of rows) {
    row.forEach((s, i) => {
      const lines = String(s).split('\n');
      lines.forEach((line, j) => {
        const numeric = i > 0 && /^\d+$/.test(line);
        text(line, numeric ? positions[i] + columns[i] - 3 : positions[i] + (i === 0 ? 2 : 1), y + 3 + j * (size > 11 ? 6 : 5), size, row[0] === 'Total' ? 'bold' : 'normal', C.ink, numeric ? { align: 'right' } : {});
      });
    });
    y += rowHeight; rule(y);
  }
  y += 4;
}
const explanation = 'The 12-month period contains the required 330 full foreign days under the stated assumptions. Its overlap with tax year 2025 covers 351 calendar days. U.S. days within a qualifying period can count toward conditional proration, without making U.S.-source employment income foreign earned income.';
const assumptions = [
  'Full foreign presence is assumed from January 1, 2015 through December 31, 2025, except for recorded exceptions.',
  'Foreign tax home and broader FEIE eligibility have not been independently verified.',
  'Eligible foreign earned income and actual exclusion amounts are not calculated.'
];
const refs = [
  ['IRS physical-presence guidance', 'https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion-physical-presence-test'],
  ['IRS exclusion computation', 'https://www.irs.gov/individuals/international-taxpayers/figuring-the-foreign-earned-income-exclusion'],
  ['IRM 21.8.1.3.2(9)(d)', 'https://www.irs.gov/irm/part21/irm_21-008-001r'],
  ['IRS foreign earned income', 'https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion-what-is-foreign-earned-income'],
  ['26 CFR §1.911-2', 'https://www.ecfr.gov/current/title-26/section-1.911-2'],
  ['26 CFR §1.911-3(d)(3)', 'https://www.ecfr.gov/current/title-26/section-1.911-3'],
  ['2025 Form 2555 instructions, Part III / line 16', 'https://www.irs.gov/instructions/i2555']
];
function referenceLine(items) {
  let x = L;
  for (const [label, url] of items) {
    text(label, x, y, 8.5, 'normal', C.teal);
    const width = doc.getTextWidth(label);
    doc.link(x, y, width, 4, { url }); x += width + 4;
  }
  y += 5.5;
}
function basis() {
  section('Basis and limitations');
  assumptions.forEach(s => para(s, { size: 10, gap: 1.7 }));
  para('IRS guidance distinguishes foreign-day counting, period coverage and income sourcing.', { size: 9, color: C.muted, gap: 1.5 });
  referenceLine([refs[0], refs[1]]);
  referenceLine([refs[2], refs[3]]);
}
await mkdir(OUT, { recursive: true });
start(2025);
para('Threshold met under declared assumptions', { size: 13, style: 'bold', color: C.navy, gap: 5 });
metricPair(351, 365, 330);
section('Supporting qualifying period');
para(range(sw.window_start, sw.window_end), { size: 13, style: 'bold', color: C.navy, gap: 2 });
para('365 calendar days: 330 assumed full foreign days + 35 recorded U.S. days.', { size: 10, gap: 1.5 });
para('Tax-year intersection: January 1 to December 17, 2025 — 351 days.', { size: 10, color: C.muted, gap: 1 });
section('Relevant U.S. travel');
table(['U.S. visit', 'Days within period'], [
  ['May 31 to June 29, 2025', '30'],
  ['December 13, 2025 to January 13, 2026', '5'],
  ['Total', '35']
], [128, 44]);
para('Only December 13–17 of the December–January visit falls within the qualifying period.', { size: 9.5, color: C.muted, gap: 1.5 });
section('Calculation explanation');
para(explanation, { size: 10, gap: 1.5 });
basis();
await save('standard-2025');

start(2024, 'Synthetic example • multiple supporting periods');
para('Threshold met using two supporting periods', { size: 13, style: 'bold', color: C.navy, gap: 5 });
text('366 / 366', L, y, 31, 'bold', C.navy); y += 18;
para(fraction(multiple.calculation), { size: 10.5 });
para('All 366 tax-year days are covered by the union of the periods below. Each period separately meets the 330-day threshold.', { size: 10.5 });
section('Supporting qualifying periods');
for (const [index, w] of multiple.calculation.supportingWindows.entries()) {
  para(`${index + 1}. ${range(w.window_start, w.window_end)}`, { size: 12, style: 'bold', color: C.navy, gap: 2 });
  para(`${count(w.window_start, w.window_end)} calendar days • ${w.foreign_days} recorded full foreign days • ${within(multipleHistory.records[1], w)} recorded nonforeign days`, { size: 10, gap: 2 });
  const a = w.window_start < '2024-01-01' ? '2024-01-01' : w.window_start;
  const b = w.window_end > '2024-12-31' ? '2024-12-31' : w.window_end;
  para(`2024 intersection: ${range(a, b)} (${count(a, b)} days).`, { size: 10, color: C.muted, gap: 5 });
}
const mw = multiple.calculation.supportingWindows;
assert.equal(count(mw[1].window_start, mw[0].window_end), 0);
para(`${mw[0].overlap_days} + ${mw[1].overlap_days} = 366 distinct tax-year days. These supporting periods are adjacent, with no overlap.`, { size: 10.5 });
section('Relevant exceptions');
table(['Original source range', 'Period 1', 'Period 2'], [[
  'June 1 to July 31, 2024\nRecorded nonforeign days', String(within(multipleHistory.records[1], mw[0])), String(within(multipleHistory.records[1], mw[1]))
]], [120, 26, 26], { rowHeight: 17 });
section('Preparer review');
para('No single supporting period covers the entire tax year. Form 2555 line 16 provides one period field; the preparer should review how to present multiple supporting periods. Do not combine these into a single period longer than 12 months.');
para('Foreign tax home and broader FEIE eligibility are unverified. Recorded full foreign days are user-supplied evidence, not independent verification. Eligible income and exclusion amounts are not calculated.', { size: 10 });
referenceLine([refs[2], refs[6]]);
await save('multiple-periods');

start(2025, 'Synthetic example • incomplete evidence');
para('Insufficient evidence to establish the threshold', { size: 13, style: 'bold', color: C.navy, gap: 5 });
text('329', L, y, 31, 'bold', C.navy); y += 18;
para('Recorded full foreign days in the strongest supported candidate', { size: 10.5, gap: 5 });
para('330 full foreign days are required. Unresolved dates could change this result; a failed supported count does not establish conclusive failure.', { size: 11 });
section('Strongest supported candidate — not a qualifying period');
const iw = incomplete.calculation.closestWindow;
para(range(iw.window_start, iw.window_end), { size: 13, style: 'bold', color: C.navy });
para(`${count(iw.window_start, iw.window_end)} calendar days: 329 recorded full foreign days and ${count(iw.window_start, iw.window_end) - 329} unresolved days. Unknown days count zero toward the threshold.`, { size: 10.5 });
section('Evidence to resolve');
table(['Classification', 'Dates / count'], [
  ['Recorded full foreign days', 'January 1 to November 25, 2025 / 329'],
  ['Unresolved within candidate', 'November 26 to December 31, 2025 / 36']
], [76, 96]);
para('No U.S. visits or other exceptions were supplied. Their absence is not evidence of foreign presence.');
section('Tax-year coverage');
para('No qualifying-period coverage established', { size: 13, style: 'bold', color: C.navy });
para('The supported coverage is 0/365. A percentage is omitted here because the evidence is incomplete; this result does not establish ineligibility.');
section('Preparer next step');
para('Confirm the unresolved full foreign days, arrival/departure dates and transit facts before reassessment. One additional supported day in this candidate would reach 330.');
para('Foreign tax home and broader FEIE eligibility remain unverified. Eligible income and exclusion amounts are not calculated.', { size: 10 });
referenceLine([refs[0]]);
await save('incomplete-result');

start(2025, 'Synthetic example • unsuccessful ordinary assessment');
para('330-day threshold not met on supplied evidence', { size: 13, style: 'bold', color: C.navy, gap: 5 });
text('329 / 330', L, y, 31, 'bold', C.navy); y += 18;
para('Maximum full foreign days in any relevant ordinary 12-month period', { size: 10.5 });
para('All dates in the evaluation horizon are classified. Even the possible upper bound is 329 days, so no ordinary candidate reaches the threshold.');
section('Strongest candidate — not a qualifying period');
para(range(failed.calculation.closestWindow.window_start, failed.calculation.closestWindow.window_end), { size: 13, style: 'bold', color: C.navy });
table(['Classification', 'Within candidate'], [['Recorded full foreign days', '329'], ['Recorded nonforeign days', '36'], ['Unresolved days', '0']], [128, 44]);
section('Tax-year coverage');
para('0 / 365', { size: 22, style: 'bold', color: C.navy });
para('0/365 = 0.000000 (0.00%). No supporting qualifying period is established by this evidence.');
section('Basis and review');
para('Synthetic recorded foreign presence: January 1 to November 25, 2025. All other dates from January 2, 2024 through December 30, 2026 are explicitly recorded as nonforeign; no foreign-presence assumption is used.');
para('Evidence reference date: January 1, 2027 (synthetic). This ordinary-test result does not assess bona fide residence, special relief or a waiver.');
para('Foreign tax home and broader FEIE eligibility are unverified. Eligible income and exclusion amounts are not calculated.', { size: 10 });
referenceLine([refs[0]]);
await save('unsuccessful-result');

start(2025, 'Synthetic example • proposed-travel comparison');
para('Projected coverage increases by 14 days', { size: 13, style: 'bold', color: C.navy, gap: 3 });
para('Reference date: January 14, 2026; completed through January 13. Later days are proposed.', { size: 10, color: C.muted, gap: 5 });
section('Tax-year coverage comparison');
table(['Completed basis', 'Projected scenario', 'Difference'], [
  ['351 / 365\n96.16%', '365 / 365\n100.00%', '+14 days\n+3.84 percentage points']
], [58, 58, 56], { size: 11.5, rowHeight: 18 });
para('Completed: 351/365 = 0.961644. Projected: 365/365 = 1.000000. The difference is 14/365 = 0.038356.', { size: 10 });
section('Completed supporting period');
para(range(sw.window_start, sw.window_end), { size: 12, style: 'bold', color: C.navy });
para('330 assumed full foreign days + 35 recorded U.S. days = 365 calendar days. Tax-year intersection: January 1 to December 17, 2025 (351 days).', { size: 10 });
section('Projected supporting periods');
for (const w of projected.calculation.supportingWindows) {
  const projectedDays = projected.normalized.segments.filter(s => s.kind === 'foreign' && s.projected).reduce((sum, s) => sum + within(s, w), 0);
  para(range(w.window_start, w.window_end), { size: 11, style: 'bold', color: C.navy, gap: 1.5 });
  const usDays = projected.normalized.segments.filter(s => s.kind === 'us').reduce((sum, s) => sum + within(s, w), 0);
  const unknownDays = projected.normalized.segments.filter(s => s.kind === 'unknown').reduce((sum, s) => sum + within(s, w), 0);
  para(`${w.foreign_days} full foreign days (${projectedDays} proposed); ${usDays} recorded U.S. days${unknownDays ? `; ${unknownDays} unresolved days, counted as zero foreign` : ''}.`, { size: 10, gap: 2 });
}
section('Relevant travel and proposed continuation');
table(['Original source dates / classification', 'Completed', 'Projected¹'], [
  ['May 31 to June 29, 2025 / U.S.', '30', '30'],
  ['December 13, 2025 to January 13, 2026 / U.S.', '5', '32'],
  ['January 14 to June 29, 2026 / proposed foreign', '0', String(count('2026-01-14', '2026-06-29'))]
], [126, 23, 23], { size: 9 });
para('¹ Distinct days within the union of scenario supporting periods; overlapping days count once. Completed counts use the completed supporting period.', { size: 9, color: C.muted, gap: 1 });
para('The additional December 18–31 coverage depends on the proposed continuation occurring as modeled; proposed days are not completed evidence.', { size: 10, gap: 1.5 });
para('Completed counts use the stated 2015–2025 assumption and exceptions. Tax home and eligibility are unverified; eligible income and exclusion amounts are not calculated.', { size: 9.5, gap: 1 });
referenceLine([refs[0], refs[1]]);
await save('proposed-comparison');

// Optional appendix: standard case, then a separately identified scenario provenance page.
start(2025, 'Optional appendix • standard 2025 synthetic evidence');
para('Detailed evidence and provenance', { size: 18, style: 'bold', color: C.navy });
para('Companion to standard-2025.pdf. The standard report is independently readable. Source identifiers below are synthetic review labels.', { size: 10 });
section('Full relevant source history');
table(['Source / classification', 'Original inclusive source dates'], [
  ['SYN-A01 / assumed foreign', 'January 1, 2015 to December 31, 2025'],
  ['SYN-U01 / recorded U.S.', 'May 31 to June 29, 2025'],
  ['SYN-U02 / recorded U.S.', 'December 13, 2025 to January 13, 2026']
], [72, 100], { size: 9.5 });
para('All three supplied source records are retained with original endpoints. SYN-A01 is a bounded synthetic declaration, not independent evidence of each full foreign day. Explicit exceptions override it.', { size: 10 });
section('Normalized evidence within the selected period');
const segments = standard.normalized.segments.filter(s => within(s, sw) > 0).map(s => [
  `${s.start_date < sw.window_start ? sw.window_start : s.start_date}\nto ${s.end_date > sw.window_end ? sw.window_end : s.end_date}`,
  `${s.basis === 'assumed' ? 'Assumed foreign' : 'Recorded U.S.'}\n${s.record_ids.join(', ')}`, String(within(s, sw))
]);
table(['Inclusive normalized range', 'Basis / source', 'Days'], [...segments, ['Total', '330 foreign + 35 U.S.', '365']], [76, 74, 22], { size: 9.5, rowHeight: 16 });
para('No projected or unknown days occur within this supporting period. Normalized rows are derived and clipped; source dates above are preserved. Unrecorded dates elsewhere remain unknown.', { size: 10 });
para('This appendix is documentation, not a restorable backup. Travel-history JSON backup remains a separate application function.', { size: 9.5, color: C.muted, gap: 0 });
footer('A1 / A2');
const appendixFirst = doc;
// Reuse the same document to preserve embedded fonts and metadata.
doc.addPage();
text('Optional appendix • classifications and references', L, 18, 9, 'normal', C.muted);
text('Review details', L, 28, 22, 'bold', C.navy); rule(43, L, R, C.teal, .7); y = 51;
section('Calculation and source provenance');
para(`Application ${APP}; calculation ${CALC}; history schema 1. Generation: October 13, 2026, 12:00 UTC. Reference date: October 13, 2026 (exclusive); last completed day: October 12, 2026.`, { size: 9.5 });
para('Prototype arithmetic is checked against the unchanged calculator from local commit f4e8d9d. Supporting period: 2024-12-18 to 2025-12-17. Intersection: 2025-01-01 to 2025-12-17. Exact fraction: 351/365; decimal and percentage are rounded for display.', { size: 9.5 });
section('Evidence classifications');
para('Recorded: user-entered full foreign or nonforeign facts. Assumed: foreign presence supplied by an explicit declaration, subject to recorded exceptions. Projected: proposed or unfinished dates, excluded from completed evidence. Unknown: unrecorded or unresolved dates, counted as zero foreign days.', { size: 10 });
section('Scenario provenance — proposed-comparison.pdf only');
para('Separate synthetic comparison of the same history at January 14, 2026 (exclusive), completed through January 13. Source SYN-P01 adds proposed full foreign days January 14 to June 29, 2026; no completed source record is altered.', { size: 10 });
const pw = projected.calculation.supportingWindows.find(w => w.window_end >= '2026-01-14');
const scenarioSegments = projected.normalized.segments.filter(s => within(s, pw) > 0).map(s => [
  `${s.start_date < pw.window_start ? pw.window_start : s.start_date}\nto ${s.end_date > pw.window_end ? pw.window_end : s.end_date}`,
  `${s.kind === 'unknown' ? 'Unknown / zero foreign' : s.projected ? 'Projected foreign' : s.basis === 'assumed' ? 'Assumed foreign' : 'Recorded U.S.'}\n${s.record_ids.join(', ') || 'Unrecorded'}`, String(within(s, pw))
]);
para(`Projected period: ${range(pw.window_start, pw.window_end)}.`, { size: 10, style: 'bold' });
table(['Inclusive normalized range', 'Basis / source', 'Days'], scenarioSegments, [76, 74, 22], { size: 9.5, rowHeight: 15 });
section('Additional primary references');
for (const ref of refs) referenceLine([ref]);
footer('A2 / A2');
assert.equal(doc, appendixFirst);
await writeFile(join(OUT, 'supporting-appendix.pdf'), Buffer.from(doc.output('arraybuffer')));

const clipboard = `Physical Presence Test
Foreign Earned Income Exclusion | Tax Year 2025
Synthetic example for design review. Generated October 13, 2026.

Assessment: Threshold met under declared assumptions.

Tax-year coverage: 351/365 = 0.961644 (96.16%).
Foreign-day threshold: 330 assumed full foreign days; 330 required.

Supporting qualifying period: December 18, 2024 to December 17, 2025.
365 calendar days: 330 assumed full foreign days and 35 recorded U.S. days.
Tax-year intersection: January 1 to December 17, 2025 (351 days).

Relevant U.S. travel (original source dates):
- May 31 to June 29, 2025: 30 days within the qualifying period.
- December 13, 2025 to January 13, 2026: 5 days within the qualifying period.
Total: 35 days. Only December 13–17 contributes from the December–January visit because the qualifying period ends December 17.

Calculation explanation:
${explanation}

Basis and limitations:
${assumptions.map(s => '- ' + s).join('\n')}
IRS guidance distinguishes foreign-day counting, period coverage and income sourcing.

References:
${refs.slice(0, 4).map(([label, url]) => `${label}: ${url}`).join('\n')}

FEIE Window Optimizer | by Cameron Guthrie
Generated October 13, 2026 | App ${APP} | Calculation ${CALC}
`;
await writeFile(join(OUT, 'clipboard-2025.txt'), clipboard);
// Compact machine-readable reconciliation contains derived checks, not a history backup.
const summary = a => ({ status: a.status, coverage: a.calculation.qualifyingDays, denominator: a.calculation.totalTaxYearDays,
  fraction: a.calculation.coverageFraction, supporting_periods: a.calculation.supportingWindows, strongest_candidate: a.calculation.closestWindow });
await writeFile(join(OUT, 'reconciliation.json'), JSON.stringify({ synthetic: true, baseline_commit: 'f4e8d9d', calculation: CALC,
  standard: { ...summary(standard), us_counts: [30, 5], foreign: 330, nonforeign: 35, period_days: 365 },
  multiple: summary(multiple), incomplete: summary(incomplete), unsuccessful: summary(failed),
  comparison: { completed: summary(baseline), projected: summary(projected), delta_days: 14, proposed_foreign_days: count('2026-01-14', '2026-06-29') }
}, null, 2) + '\n');
console.log('Generated six synthetic PDFs, clipboard text and reconciled calculator results.');
