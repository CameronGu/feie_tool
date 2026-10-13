# First release plan

Current work: corrective candidate **0.2.0-rc.2**, assessment **physical-presence-2.2**; ordinary counting engine unchanged. Initial rc.1 milestones below are historical; current acceptance is recorded in the corrective-pass section.

Branch: `refactor/project-update`. Recoverable baseline: `2025-alpha.1` / `9df6883`.
No push, deployment, publication, backend, accounts, or external travel-data submission is authorized.

## Release criteria and milestones

| Milestone | Dependencies | Acceptance criteria | Status |
| --- | --- | --- | --- |
| 0. Baseline and research | None | Inspect historical assessments and current code; reproduce checks; establish sourced calculation contract and persistent log | Complete |
| A. Calculation | 0 | Reproduce/fix both audit boundaries; exact calendar periods, 330 threshold, union without double counting, deterministic supporting periods, 365/366 denominator, precision, explicit legal limits; permanent counterexamples | Complete; legal limitations explicit |
| B. Travel history | A | One versioned source; foreign declarations plus exceptions; unknown/completed/proposed distinctions; history survives year/view changes; local persistence; validated backup/import with explicit merge/replace; deliberate reset | Complete; unit/integration and browser restore pass |
| C. Primary workflow | B | Direct labeled interval entry; visible year selection; safe example/scenario flows; keyboard access; usable desktop/tablet/390px layout; no giant calendar/tab sequence or unsafe mode conversion | Complete; five browser/viewport projects pass; real screenshots inspected |
| D. Results and reports | A, B, C | Shared structured report for page/copy/PDF; union evidence, exact fraction, assumptions, dates and versions; unsuccessful/incomplete exports; actual versus scenario comparison; ordinary and multipage PDF checks | Complete; actual 1-page/10-page downloads, text/raster checks and fallback tests pass |
| E. Verification and readiness | A–D | Compatible dependency tree; unit/integration/browser tests, type check and production build pass; CI; real browser/accessibility inspection; current README/architecture/readiness; coherent local commits | Complete locally; 79 tests, 28 browser passes/2 platform skips; remote CI and publication remain unauthorized |

Each milestone receives targeted regression tests, relevant browser verification, log updates, and a local commit. Correct regressions before advancement. Domain-only work need not wait for the scheduled replacement of stale UI fixtures. Final completion requires **all** milestones and an evidence-based readiness audit, not merely a passing build.

Candidate: `0.2.0-rc.1`; calculation version `physical-presence-2`. All requested local milestones are complete. See [RELEASE-READINESS.md](RELEASE-READINESS.md) for the requirement-by-requirement audit and explicit remaining limits. That initial conclusion is superseded by the independent review and corrective acceptance pass below. No deployment, push or publication occurred.

## Verification commands

- Baseline: `git status --short`, `npm run build`, `npm test -- --run`.
- Calculation: `npm test -- --run src/domain/__tests__ src/services/__tests__ --environment node`.
- Final: `npm ci`, `npm ls --depth=0`, `npm run check` (type check, unit/integration tests and build), `npm run test:e2e` (production bundle across five browser/viewport configurations).
- Browser: production preview; primary workflows at desktop, tablet and narrow mobile; keyboard and accessible names; clipboard/download, backup restore, reload and year changes; PDF page/text inspection.

## Baseline

The assignment baseline build passes; 17 tests comprise 11 passes and six failures (the historical audit had 12/5). Four hook tests use 2023 dates outside the dynamically selected year horizon; clearing on year changes is also a real application defect. Both StrictMode UI tests timed out in this run, demonstrating timing instability. React hook-order warnings are real. Vite 8 with React plugin 4 has an invalid peer relationship.

## Rules for completion

Maintain `CALCULATION-SPEC.md`, `PROGRESS.md`, and `RELEASE-READINESS.md`. Explicitly document unresolved tax questions and sensitivity, without claiming full FEIE eligibility or actual tax savings. Preserve historical audit documents as dated evidence. Inspect and test current state instead of assuming those reports remain current.


## Corrective pass — independent review and visual requirements

Scope: C01 candidate upper bounds; C02 isolated example; C03 shared scenario baseline/delta; C04 concise PDF pagination; specific tax-home premise and example; direct ongoing foreign-baseline setup/edit/confirmed end; shorter mobile first use; stacked mobile history; informative empty states and import review. Keep static/private operation and the existing ordinary counting engine.

Implementation sequence: assessment/history extensions and regression cases; baseline/history/results UX; ordered shared report and PDF layout; production browser workflows and before/after evidence; release documentation and final gates. No new dependencies, tax-home calculator or separate baseline data store.

Acceptance: `npm run check` and full `npm run test:e2e`; actual production captures at 1440×1000 and 390×844, including ongoing setup, several visits, baseline editing/ending, mobile correction, qualifying and projected results; downloaded PDF text and raster inspection, ordinary one-page and multi-period cases. Existing independent screenshots remain immutable comparison references. Corrective local acceptance is complete: 90 unit/integration tests, full TypeScript/build, and 48 production browser passes with two platform skips. Actual mobile/desktop flows, one-page ordinary/scenario/two-support PDFs, a large appendix and the before/after package were inspected; see RELEASE-READINESS.md. The initial rc.1 audit does not establish corrective completion.

Qualified tax review of the changing-tax-home example and multiple-period filing remains a publication prerequisite, outside software verification. Nothing in this plan authorizes push, publication or deployment.

## rc.2 checkpoint and final refinements

Accepted corrective foundation preserved in local checkpoint `d2c5151` after 90-test, TypeScript/build and browser verification. Scope is limited to device-local completed-day selection with manual adjustment and export provenance; PDF typography/whitespace with readable pagination; explicitly separated saved/example years; and current-first release documentation. No baseline, history, C01–C04 or arithmetic redesign.

Acceptance: timezone-boundary regressions plus complete `npm run check` and five-project production browser suite; inspect UTC/local boundary and adjustment, example restoration, and native ordinary/scenario/two-support PDFs. Keep original accepted artifacts unchanged and store new synthetic captures separately under ignored `output/playwright/refinement-review/`. A second local commit follows verification.

Final refinement acceptance is complete: **101 unit/integration tests**, TypeScript/build, and **53 unique browser passes / two expected skips** over all five projects, with interruption/isolated-retry details in readiness. Actual local-midnight behavior, manual/default cutoff, saved/example isolation, mobile entry/history and six pages of the three native preparer PDFs were inspected. Ordinary/scenario/two-support reports use two readable pages without dropping evidence; large pagination remains intact. Deliver the narrow refinements in their own local commit, separate from checkpoint `d2c5151`. No publication or architectural work is added.
