# First release plan

Branch: `refactor/project-update`. Recoverable baseline: `2025-alpha.1` / `9df6883`.
No push, deployment, publication, backend, accounts, or external travel-data submission is authorized.

## Release criteria and milestones

| Milestone | Dependencies | Acceptance criteria | Status |
| --- | --- | --- | --- |
| 0. Baseline and research | None | Inspect historical assessments and current code; reproduce checks; establish sourced calculation contract and persistent log | Complete |
| A. Calculation | 0 | Reproduce/fix both audit boundaries; exact calendar periods, 330 threshold, union without double counting, deterministic supporting periods, 365/366 denominator, precision, explicit legal limits; permanent counterexamples | Core verified; evidence/status integration in B |
| B. Travel history | A | One versioned source; foreign declarations plus exceptions; unknown/completed/proposed distinctions; history survives year/view changes; local persistence; validated backup/import with explicit merge/replace; deliberate reset | Pending |
| C. Primary workflow | B | Direct labeled interval entry; visible year selection; safe example/scenario flows; keyboard access; usable desktop/tablet/390px layout; no giant calendar/tab sequence or unsafe mode conversion | Pending |
| D. Results and reports | A, B, C | Shared structured report for page/copy/PDF; union evidence, exact fraction, assumptions, dates and versions; unsuccessful/incomplete exports; actual versus scenario comparison; ordinary and multipage PDF checks | Pending |
| E. Verification and readiness | A–D | Compatible dependency tree; unit/integration/browser tests, type check and production build pass; CI; real browser/accessibility inspection; current README/architecture/readiness; coherent local commits | Pending |

Each milestone receives targeted regression tests, relevant browser verification, log updates, and a local commit. Correct regressions before advancement. Domain-only work need not wait for the scheduled replacement of stale UI fixtures. Final completion requires **all** milestones and an evidence-based readiness audit, not merely a passing build.

## Verification commands

- Baseline: `git status --short`, `npm run build`, `npm test -- --run`.
- Calculation: `npm test -- --run src/domain/__tests__ src/services/__tests__ --environment node`.
- Final: `npm ci`, `npm ls --depth=0`, `npm run typecheck`, `npm test -- --run`, `npm run build`, plus checked-in browser test command to be established in E.
- Browser: production preview; primary workflows at desktop, tablet and narrow mobile; keyboard and accessible names; clipboard/download, backup restore, reload and year changes; PDF page/text inspection.

## Baseline

The assignment baseline build passes; 17 tests comprise 11 passes and six failures (the historical audit had 12/5). Four hook tests use 2023 dates outside the dynamically selected year horizon; clearing on year changes is also a real application defect. Both StrictMode UI tests timed out in this run, demonstrating timing instability. React hook-order warnings are real. Vite 8 with React plugin 4 has an invalid peer relationship.

## Rules for completion

Maintain `CALCULATION-SPEC.md`, `PROGRESS.md`, and `RELEASE-READINESS.md`. Explicitly document unresolved tax questions and sensitivity, without claiming full FEIE eligibility or actual tax savings. Preserve historical audit documents as dated evidence. Inspect and test current state instead of assuming those reports remain current.
