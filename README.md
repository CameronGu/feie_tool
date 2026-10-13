# FEIE Window Optimizer

A private, account-free utility for evaluating the Foreign Earned Income Exclusion's ordinary physical-presence test. Maintain travel history, compare proposed travel, and prepare a supporting report for a tax preparer.

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
3. For U.S.-visit entry, add a bounded **Declared foreign presence** record and explicitly confirm its assumption. Add U.S., nonqualifying and unknown exceptions within that range. U.S. visits alone do not imply foreign presence on other dates.
4. Mark proposed records as a scenario. Enable comparison to include them and future dates; completed history remains unchanged.
5. Review supporting periods, combined coverage, the exact day-count fraction and assumptions. Copy/download the preparer report, including incomplete or unsuccessful cases.
6. Export a JSON backup to restore records or transfer devices. Import first previews records; merging preserves existing records and rejects conflicts, while replacement requires explicit acknowledgment. Reset requires a deliberate choice; the last change can be undone in the current session.

The initial year is the previous UTC calendar year. Choose your filing year directly; the tool does not infer your filing situation from a deadline.

Records persist in this browser's local storage. Clearing browser data, private sessions or storage restrictions can remove/prevent persistence. Keep backups. Browser data is plaintext within the browser profile. There are no accounts, analytics, external travel-data submissions or cloud synchronization. Use one editing tab at a time. Example preview never replaces saved records.

## Interpretation limits

Results distinguish recorded, assumed, projected, incomplete, unsuccessful and leap-boundary review cases. Missing dates remain unknown and contribute zero full foreign days; supported coverage can increase when evidence is added. Today's UTC reference date and later are excluded from completed-day evidence. A supporting period extending into the future is projected.

Coverage can combine several passing periods and can include U.S. days. It is conditional physical-presence coverage, distinct from actual foreign income. Foreign tax home and other eligibility requirements need independent review. February 29 starts have an explicit sensitivity calculation because reviewed guidance does not settle the absent corresponding-date convention. Form 2555 asks for a single period; multiple supporting periods require preparer review of filing treatment. Reports are working documentation, not completed tax forms. Waivers, bona fide residence, special relief, unlawful-presence rules and monetary calculations are outside this tool.

PDFs include normalized evidence, source records and assumptions, repeated page context and page numbers. Core PDF fonts render unsupported Unicode as `[U+codepoint]`; clipboard and JSON preserve the original text. PDF tagging/screen-reader reading order is not certified; the accessible webpage and copyable text are alternatives.

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
