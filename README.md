# FEIE Window Optimizer

A private, account-free utility for evaluating the Foreign Earned Income Exclusion's ordinary physical-presence test. Maintain travel history, compare proposed travel, and prepare a supporting report for a tax preparer.

Optional **How FEIE works** guidance explains physical presence, bona fide residence and foreign tax home without adding an onboarding sequence. Results distinguish full foreign days from qualifying-period coverage and explain the actual supporting-period selection. A visible salary illustration is a separate educational example, with compact expandable controls on mobile. The introduction links directly to optional guidance below travel history; travel entry remains directly accessible.

The application counts full foreign days in intersecting twelve-calendar-month periods and combines qualifying-period coverage within a selected calendar year without double counting. It does **not** determine complete FEIE eligibility, foreign tax home, eligible income, actual exclusion dollars, or tax savings.

## Run locally

Use Node 20.19+ within the 20.x line, or Node 22.12+ (Node 22 recommended).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Production bundle: `npm run build`, then `npm run preview`. Nothing is deployed by these commands.

## Travel workflow

1. Select a calendar tax year. Changing years preserves all records.
2. Enter the first and last **full** foreign days, inclusive. Ordinary arrival/departure dates are partial; record transit and other nonqualifying days separately. Check IRS short-transit exceptions before counting them.
3. For U.S.-visit entry, choose **Establish default foreign presence**, enter the first full foreign day, choose ongoing or a final day, and explicitly confirm the assumption. Then add U.S., nonqualifying and unknown exceptions. Edit or end an ongoing baseline from its status summary; ending requires a final covered day and confirmation, and retains history. U.S. visits alone do not imply foreign presence on other dates.
4. Mark proposed records as a scenario. Enable comparison to include them and future dates; completed history remains unchanged.
5. Review supporting periods, combined coverage, the exact day-count fraction and assumptions. Copy/download the concise preparer report, including incomplete or unsuccessful cases. Enable **Include detailed supporting records** only when a PDF evidence appendix is wanted; it is off by default.
6. Export a JSON backup to restore records or transfer devices. Import first previews records; merging preserves existing records and rejects conflicts, while replacement requires explicit acknowledgment. Reset requires a deliberate choice; the last change can be undone in the current session.

The initial year is the previous UTC calendar year. Choose your filing year directly; the tool does not infer your filing situation from a deadline.

Records persist in this browser's local storage. Clearing browser data, private sessions or storage restrictions can remove/prevent persistence. Keep backups. Browser data is plaintext within the browser profile. There are no accounts, analytics, external travel-data submissions or cloud synchronization. Use one editing tab at a time. Example preview never replaces saved records.

## Interpretation limits

Results distinguish recorded, assumed, projected, incomplete, unsuccessful and leap-boundary review cases. Missing dates remain unknown and contribute zero full foreign days. A candidate upper bound below 330 can establish ordinary threshold failure despite missing dates; supported coverage can increase when evidence is added. Completed evidence defaults to yesterday in the device local calendar. The visible completed-day cutoff can be adjusted for travel calendar differences; reports retain the effective boundary and its provenance. Settings apply to this session; travel history remains persistent. A supporting period extending into the future is projected.

Coverage can combine several passing periods and can include U.S. days. It is conditional physical-presence coverage, distinct from actual foreign income. Foreign tax home must hold throughout the 330 supporting foreign days and needs independent verification. Raw coverage is not an established exclusion-limit numerator; other eligibility requirements also need review. February 29 starts have an explicit sensitivity calculation because reviewed guidance does not settle the absent corresponding-date convention. Form 2555 asks for a single period; multiple supporting periods require preparer review of filing treatment. Reports are working documentation, not completed tax forms. Waivers, bona fide residence determinations, special relief, unlawful-presence rules and personalized monetary calculations are outside this tool.

## Educational income illustration

**Why track your days abroad?** compares estimated regular federal income tax with and without full-year FEIE for a hypothetical single salaried worker. All wages are earned abroad; full eligibility including foreign tax home is assumed. It uses the standard deduction and no other income, deductions, credits, housing relief or special adjustments. Payroll, self-employment, state and foreign taxes are excluded. The comparison assumes no alternative income-tax relief and does not compare foreign tax credits.

Verified 2026 data: $132,900 FEIE maximum, $16,100 single standard deduction and the official progressive single-filer rate schedule. Tax-rate stacking follows the IRS Foreign Earned Income Tax Worksheet: tax on remaining taxable income plus the exclusion, less tax on the exclusion, floored at zero. Continuous schedules approximate tax-table rounding. Salary is session-only component state, never travel evidence, a saved field or a report/export field.

`src/services/incomeIllustration.ts` stores a small typed dataset with IRS source links. Add a year only after verifying its complete dataset; the current calendar year is selected if supported, otherwise the latest verified year is visibly labeled. No complete official 2027 dataset was found in the milestone research. Tests cover reference salaries, deduction/exclusion/bracket boundaries, stacking, exact entry, validation, keyboard, pointer and mobile touch.

Preparer reports lead with Physical Presence Test, tax year, conditional assessment and exact qualifying-period coverage. Necessary supporting periods, relevant travel with original dates/clipped counts, source assumptions and two or three primary references follow. Scenario exports retain both supporting sets and the signed difference. The default PDF and clipboard omit identifiers and technical logs. The optional PDF appendix adds matching source records, normalized evidence, cutoff/timezone provenance and complete references; JSON backup remains separate. PDF generation and licensed bundled Noto Sans subsets load only on export, without remote font requests. Latin, Greek and Cyrillic render as text; unsupported glyphs use explicit `[U+codepoint]` notation. Clipboard and JSON preserve original Unicode. PDF tagging/screen-reader reading order is not certified; the accessible webpage and copyable text are alternatives.

## Verification

```sh
npm run check             # type check, unit/integration tests, production build
npx playwright install chromium firefox
npm run test:e2e          # production preview; desktop, tablet and narrow mobile
```

Browser tests exercise primary workflows, reload and JSON restore, scenario/example isolation, clipboard/PDF downloads, keyboard labels/focus, page width and automated accessibility. CI runs these checks on Node 22. Browser installation on Linux CI also needs `npx playwright install --with-deps chromium firefox`. Mobile tests emulate viewport size; they do not certify native iOS/Android behavior or a complete assistive-technology audit.

## Design and release records

- [Calculation specification and sources](docs/CALCULATION-SPEC.md)
- [Milestone plan](docs/RELEASE-PLAN.md)
- [Progress log](docs/PROGRESS.md)
- [Release-readiness evidence](docs/RELEASE-READINESS.md)
- [Architecture](docs/architecture.md)

`PROJECT-STATE.md` and `PRODUCT-REVIEW.md` describe the historical 2025 alpha, not the current candidate. The application and report version comes from `package.json`; the calculation has a separate version identifier.

## Source reuse

The pure domain and service modules are reusable within this repository. `src/index.ts` exposes `assessTravel`, versioned history helpers and the lower-level `calculateFeie` adapter. Only complete calendar tax years are supported. This private application is not configured as a published npm package.

No license has been granted for redistribution; choose licensing before public source distribution. No publishing or hosting changes are part of this release work.

by Cameron Guthrie
