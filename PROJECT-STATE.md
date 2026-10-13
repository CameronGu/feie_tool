# FEIE Window Optimizer — Project State

Assessment date: October 12, 2026, America/Managua; browser/export timestamps also show October 13 UTC. Assessment only: application source, tests, configuration, and existing documentation were not edited. The user independently updated dependencies during inspection; those changes are included in the final-state assessment and were left untouched. Companion assessment: [PRODUCT-REVIEW.md](PRODUCT-REVIEW.md).

## Evidence and scope

Reviewed every application module, all five test files, package/configuration files, and existing project documentation. Ran existing checks, small read-only calculation probes against temporarily compiled source, and Firefox browser checks against both development and the updated production build. Generated build/browser/PDF inspection artifacts under `/tmp`, not as repository deliverables. No dependencies were installed by the reviewer; no deployment occurred.

Evidence labels used below:

- **Verified by code and tests (V):** source inspection plus an existing test, an executed calculation probe, or an explicitly identified browser check. Ad hoc probes are not permanent regression coverage.
- **Supported by documentation but not independently tested (D):** documented intent only.
- **Suspected defect (S):** implementation concern whose full impact or intended contract remains unresolved. A demonstrated incorrect result is explicitly called out.
- **Unverified tax-rule assumption (T):** legal/domain interpretation requiring qualified independent review; passing software checks cannot settle it.

File references use `path:line` and relevant symbols. Line numbers refer to the inspected source; package files reflect the user's update. No local `AGENTS.md` was found in the project file inventory; the instructions supplied in the conversation governed this audit.

## 1. Executive inventory

This is a client-only, single-page travel-window calculator. Users select a calendar tax year, enter inclusive foreign or U.S. date intervals, and receive automatically recalculated candidate windows containing at least 330 days marked foreign. Among passing windows, the engine retains those with the greatest number of calendar days overlapping the selected year. The interface selects the earliest tied window for its summary and exports.

The apparent audience is U.S. expatriate taxpayers and travelers planning around the physical presence test; PDF/clipboard features also target tax preparers. It does not calculate an actual dollar exclusion, tax savings, foreign earned income, housing exclusion, or overall FEIE eligibility. README claims about the strongest tax benefit exceed the implemented overlap objective (`README.md:1–19`; `src/domain/feie.ts:70`, `evaluateFeie`).

| Capability | Demonstrated state | Evidence |
|---|---|---|
| Calendar-year selection, manual intervals, calendar quick-add | Implemented; ordinary in-range entry works | `TaxYearSelector.tsx:12`; `PeriodsEditor.tsx:71`; `RangePlanner.tsx:196`; browser calculation for 2025 |
| U.S./foreign input modes | Both implemented, with conversion or literal reinterpretation | `App.tsx:17–53,121`; `useCalculator.ts:325` |
| Rolling cross-year windows | Implemented, but boundary defects demonstrated | `domain/feie.ts:14–60`; probe register in §3 |
| Qualification and overlap ratio | Implemented under binary-presence assumptions | `domain/occupancy.ts:13`; `domain/feie.ts:70` |
| Alternatives | All maximum-overlap ties listed; no selection/comparison interaction | `Timeline.tsx:17`; `ResultsPanel.tsx:51` |
| Clipboard and PDF | Successful Firefox copy status and actual readable PDF download | `ResultsPanel.tsx:123,170`; §4 |
| Planning mode | Service and hook exist; no public toggle invokes them | `useCalculator.ts:358`; `App.tsx:57–141`; search for `togglePlanningMode` |
| Sample histories | Development-only, including an archive that fails calculation | `App.tsx:67`; `datasets.ts:30`; browser error for archive preset |
| Persistent/reusable history | Absent; in-memory state only; changing years can clear dates | `useCalculator.ts:169–180,229–257` |
| Actual income/exclusion optimization | Absent | `domain/types.ts:8–35` has no income, annual limit, or tax-home inputs |
| API/serverless/library deployment | Reusable source export exists; distribution/integrations absent | `src/index.ts:1`; `package.json` lacks library entry/export/build configuration |

**Release judgment:** a functioning prototype with useful domain separation and a working basic calculation/export path, requiring substantial work before dependable public use. Concrete calculation-boundary failures, unsupported eligibility language, destructive history handling, inconsistent report provenance, accessibility barriers, and failing verification prevent treating it as a reliable tax-planning service. A wholesale rewrite is not justified by the repository's size or structure.

## 2. Architecture and technology

### Final dependency and runtime inventory

| Package | Declared after user update | Installed (`npm ls --depth=0`) |
|---|---|---|
| React / React DOM | `^18.3.1` / `^18.3.1` | 18.3.1 / 18.3.1 |
| jsPDF | `^4.2.1` | 4.2.1 |
| TypeScript | `^5.4.5` | 5.9.2 |
| Vite | `^8.3.4` | 8.3.4 |
| Vitest | `^4.1.11` | 4.1.11 |
| Vite React plugin | `^4.3.1` | 4.7.0 |
| Testing Library React | `^15.0.0` | 15.0.7 |
| jsdom | `^27.0.0` | 27.0.0 |
| React / React DOM types | `^18.3.3` / `^18.3.3` | 18.3.25 / 18.3.7 |
| baseline-browser-mapping | `^2.11.28` | 2.11.28 |

Observed runtime: Node 20.19.0, npm 11.3.0. No repository Node version pin or `engines` declaration. Installed Vite requires Node `^20.19.0 || >=22.12.0`. Package version is `0.1.0`, while the rendered/exported build identifier is hard-coded `v1.0.0` (`src/version.ts:1`). They are not synchronized.

TypeScript strict checking targets ES2022 with DOM types, JSX automatic runtime, and no emit (`tsconfig.json:2–21`). `skipLibCheck` is enabled. That configuration excludes `vite.config.ts` by naming nonexistent `vitest.config.ts` in `include`; the Vite/test configuration is therefore not covered by the successful project type check.

### Directory and module map

| Location | Responsibility |
|---|---|
| `index.html`, `src/main.tsx` | HTML metadata, root element, `createRoot`, React StrictMode |
| `src/app/App.tsx` | Single-screen composition; mode-switch dialog; development preset gate |
| `src/app/hooks/useCalculator.ts` | Form rows, modes, selected year, derived complementary intervals, validation, results, coverage override |
| `src/app/components/PeriodsEditor.tsx`, `RangePlanner.tsx` | Manual date rows and custom multi-year calendar selection |
| `ModeToggle.tsx`, `TaxYearSelector.tsx`, `SampleDataMenu.tsx` | Small input controls |
| `ResultsPanel.tsx` | Result text, summary data, travel table, clipboard formatting, manual PDF layout |
| `Timeline.tsx`, `AppFooter.tsx` | Static tied-window bars; attribution/disclaimer |
| `src/app/utils/periods.ts` | Filters/parses/sorts complete date rows |
| `src/app/sample-data/datasets.ts` | Four hard-coded presets, including 2016–2025 history |
| `src/domain/types.ts`, `errors.ts` | Input/output and error contracts |
| `src/domain/dates.ts` | UTC date-only arithmetic and comparisons |
| `src/domain/intervals.ts` | Validation, sorting, merging, complement construction |
| `src/domain/occupancy.ts`, `feie.ts` | Binary daily occupancy, prefix sums, exhaustive windows, ranking/planning |
| `src/services/calculator.ts`, `src/index.ts` | Public calculation orchestration/error conversion; source exports |
| `src/**/__tests__` | Five Vitest suites; 17 defined tests |
| `vite.config.ts`, `tsconfig.json`, package files | Build/test/runtime setup and lockfile |
| `README.md`, `CONTRIBUTING.md`, `docs/architecture.md` | Intent, setup, contributor guidance, architectural notes |
| `dist/`, `node_modules/` | Existing ignored build/dependency directories; existing `dist` not used as proof of current source |

No router, backend, database, authentication, state-management library, analytics integration, or external calculation API exists. React hooks own all state. The domain/service separation is appropriate and modest, rather than intrinsically overengineered.

### Actual data flow

1. Native date fields or two calendar clicks update form rows (`PeriodsEditor`, `RangePlanner`).
2. `syncRows` stores the edited list and constructs the opposite list using `sanitizePeriodRows` and `invertPeriods` (`useCalculator.ts:199`).
3. An effect validates rows and sends only the active mode's intervals to `calculateFeie` (`useCalculator.ts:259`).
4. The service independently validates/normalizes inputs, builds the complement, evaluates windows, and maps output/errors (`calculator.ts:12,90`).
5. `ResultsPanel` receives the numerical result **and both UI row lists**, reconstructing its own reporting travel intervals (`ResultsPanel.tsx:54`). It does not receive the normalized intervals actually evaluated. This parallel reporting path causes demonstrated omissions after literal mode switches.

All calculations run synchronously on the browser's main thread. The PDF dependency loads dynamically only when exporting (`ResultsPanel.tsx:177`), which is a useful existing optimization.

Deployment assumes a static Vite bundle; `base: './'` accommodates relative assets (`vite.config.ts:10`). Canonical/share URLs point to `cameronjguthrie.com/tools/feie-window-optimizer` (`index.html:11`; `constants/meta.ts:2`). No host deployment manifest, CI pipeline, hosting headers, operational monitoring, or actual serverless integration is present. Live hosting and subdirectory behavior were not verified or deployed.

## 3. Core calculation engine

### Input representation and normalization

`Interval` is `{start_date: string, end_date: string}`; `DateISO` is only a string alias, not a branded or runtime-constrained type (`types.ts:1–6`). The API accepts explicit tax-year bounds and exactly one meaningful period mode. Both nonempty lists together produce `UNEXPECTED_PERIODS`; there is no record-level location conflict resolution (`calculator.ts:35–71`). An omitted active list errors, but an empty array is accepted.

`normalizeIntervals` validates actual `YYYY-MM-DD` calendar dates, inclusive start ≤ end, and complete containment in selected tax-year bounds expanded one year each way. It sorts a copied list. Exact duplicates and overlaps, including a shared endpoint, are rejected. Consecutive intervals ending January 10 and starting January 11 are accepted. They remain separate normalized input rows; `mergeIntervals` combines adjacency when used by inversion. Invalid historic rows are rejected rather than clipped or ignored by the service (`intervals.ts:13–119`). V: existing sorting/overlap/inversion tests plus executed duplicate/adjacency/shared-endpoint probes.

The UI's `sanitizePeriodRows` filters incomplete/invalid date strings and sorts, but does not validate ordering, overlaps, or bounds (`app/utils/periods.ts:9`). The hook validates complete active rows separately; complements can be constructed before this validation. `invertPeriods` assumes sorted, in-bounds intervals and does not itself clip them (`intervals.ts:122`). Calling it with out-of-horizon or invalid rows can create malformed/complementary records; this matters to mode switching and stale test fixtures, not just external consumers.

### Presence, gaps, travel days, and time

| Topic | Actual behavior | Classification |
|---|---|---|
| Foreign mode | Entered dates are foreign; every other date in coverage is treated as U.S./nonforeign | V: service normalization and occupancy |
| U.S. mode | Entered dates are U.S.; every unentered date in coverage becomes foreign | V: `calculator.ts:49`; empty-U.S. probe/browser |
| Unknown/missing data | No unknown state, completeness attestation, country, transit, or evidence field | V: types and UI; T: whether users can safely supply these assumptions |
| Interval endpoints | Both endpoints count as whole marked days | V: occupancy loop and inclusive differences |
| Full/partial travel days | No adjustment for arrival/departure times; no fractional-day representation | V; T: supplied dates must already identify eligible full days |
| International waters, U.S. territories, exceptional transit | No separate representation or special rules | V; T: the U.S./foreign complement is insufficient for all itineraries |
| Timezone | Parses UTC components; adds fixed 86,400,000 ms; month labels use UTC | V: `dates.ts:26–58`; `RangePlanner.tsx:34` |
| Local travel date interpretation | User-entered date-only strings; no flight timezone/date-line handling | V absence; T boundary interpretation |
| Leap years | Inclusive day counting naturally includes February 29; year shift clamps February 29 to February 28 | V: `dates.ts:47`; probe below |
| Future dates | Count exactly like completed travel; no as-of-date eligibility state | V: no reference date in domain input/evaluation |

UTC-only arithmetic avoids browser-local daylight-saving drift. It does not establish that the recorded dates represent qualifying local midnight-to-midnight days.

IRS guidance requires full foreign days, defines a full day from midnight to midnight, excludes relevant international-water travel, and describes special transit treatment. The app's ordinary “first and final day of that stay” instruction does not explain these distinctions (`RangePlanner.tsx:234–250`). This is a substantive risk near 330 days. [IRS physical presence guidance](https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion-physical-presence-test).

“Outside the United States” is not a sufficient foreign-country definition: U.S. territories and international waters can be outside ordinary U.S. stays without qualifying. Tax-home/abode conditions are separate from a travel count and are not collected. [IRS tax-home and foreign-country guidance](https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion-tax-home-in-foreign-country).

### Candidate generation, counts, and objective

`computeCoverageBounds` starts at `shiftYears(taxYearStart, -1) + 2 days` and ends at `shiftYears(taxYearEnd, 1)` (`feie.ts:14`). `enumerateWindows` tries every daily start in that coverage whose end fits. End is `addDays(shiftYears(start, 1), -1)`, rather than a fixed 365-day increment. It uses a binary foreign occupancy array and prefix sums to count days; tax-year overlap is a separate inclusive interval intersection (`feie.ts:29–60`).

`evaluateFeie` checks `foreignDays >= 330`, then maximizes **all calendar overlap days**, not foreign days in the tax year and not money. It keeps every maximum-overlap tie and sorts by earliest start (`feie.ts:79–108`). No second criterion favors more foreign days, completed travel, more reliable data, or income. Inferior-overlap passing windows are discarded. No union of multiple qualifying windows is computed. Results for adjacent tax years are separate, not reconciled.

| Quantity | Implemented representation | Important distinction |
|---|---|---|
| 1. Days satisfying the physical presence test | `foreign_days` counts binary foreign marks in each candidate | Correct only if marks denote eligible full foreign days; tax-home facts absent |
| 2. Days within a qualifying 12-month period | Window start/end; length inferred by date helper | May include U.S./nonforeign days; not equal to `foreign_days` |
| 3. Relevant days falling in selected tax year | `overlap_days` counts **all** candidate days in the year | Foreign presence within the tax year is not separately reported |
| 4. Days for statutory exclusion-limit proration | Assumed equal to `overlap_days`; ratio divides by supplied tax-year length | No distinct eligibility/tax-home-qualified day set; assumptions unverified |
| 5. Actual eligible foreign earned income | Not modeled | No earnings, work location, timing, housing adjustments, annual cap, or dollar result |

The ratio is rounded to four decimal places in the engine; the summary/exports format it to three, while the timeline displays a percentage from the rounded value (`feie.ts:103`; `ResultsPanel.tsx:95`; `Timeline.tsx:38`). Exported fractions are not precise enough to be treated as the original day-count computation.

**Do not diagnose overlap counting as wrong merely because it includes U.S. days.** The regulation describes a physical-presence period that may include nonforeign days; satisfying the test and calculating eligible income remain distinct. The code lacks enough facts to establish that its entire overlap is the appropriate statutory numerator for a particular taxpayer. [26 CFR §1.911-3(d)(3)](https://www.ecfr.gov/current/title-26/section-1.911-3).

IRS proration guidance uses qualifying days and a 365/366 denominator. Calendar-year UI inputs have that denominator, but the documented reusable API allows arbitrary partial “tax years,” and instead divides by their supplied length. That broader contract can return 100% for a half-year input. [IRS exclusion computation guidance](https://www.irs.gov/individuals/international-taxpayers/figuring-the-foreign-earned-income-exclusion).

Foreign earned income depends on services performed abroad during an eligible period; the optimizer has no such income inputs. Its maximizing-overlap objective can serve a conditional limit-planning calculation, but cannot demonstrate maximum actual exclusion or tax savings. [IRS definition of foreign earned income](https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion-what-is-foreign-earned-income). Overall FEIE eligibility also has conditions beyond the physical presence count. [IRS FEIE overview](https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion).

### Executed calculation probes

These call unchanged `calculateFeie` compiled into `/tmp/feie-audit-engine`. Default tax bounds are 2024-01-01–2024-12-31; foreign mode unless stated. Dates are inclusive.

| Probe | Actual result | Interpretation/classification |
|---|---|---|
| Foreign 2024-01-01–2024-11-24: 329 days | Not qualified; deficit 1 | V: correct implemented threshold arithmetic |
| Foreign 2024-01-01–2024-11-25: 330 days | Qualified; calendar-year window; overlap 366; fraction 1 | V: counts/objective; T: ratio's applicability requires separate facts |
| Empty foreign list | Not qualified; deficit 330 | V: blank means zero foreign marks |
| Empty U.S. list | Qualified; foreign 366; fraction 1 | V: blank means complete foreign coverage; unsafe inference without attestation |
| Foreign 2023-01-02–2023-11-27: 330 days | Not qualified; deficit 1 | **Demonstrated boundary defect:** valid candidate 2023-01-02–2024-01-01 is skipped because enumeration starts January 3 |
| Foreign 2025-02-05–2025-12-31: 330 days | Qualified; best 2025-01-01–2025-12-31; **overlap 0**, fraction 0 | **Demonstrated boundary defect:** qualification accepts a period entirely outside selected tax year; no positive-overlap guard |
| Foreign 2025-01-01–2025-12-31 | Qualified; best begins 2024-11-27; overlap 35 | V: future foreign marks can extend a passing window backward; T: does not prove 2024 eligible income |
| Historic foreign row 2016-05-28–2016-06-13 | `INTERVAL_OUT_OF_RANGE` | V: a long history cannot be supplied unchanged |
| Tax bounds 2024-07-01–2024-12-31; foreign all 2024 | Fraction 1 from overlap 184 / tax span 184 | V: reusable partial-year contract does not implement an annual denominator |
| Adjacent intervals Jan 1–10 and Jan 11–20 | Accepted, 20 marked foreign days | V: adjacency supported |
| Duplicate Jan 1–10 rows | `INTERVAL_DUPLICATE` | V: duplicates rejected |
| Jan 1–10 and Jan 10–20 | `INTERVAL_OVERLAP` | V: shared endpoint rejected |
| Window helper starting 2024-02-29 | Ends 2025-02-27, 365 inclusive days | V: clamp-then-subtract behavior; **T/S:** specialist confirmation needed for intended leap-day 12-month convention |

A physical-presence period must include some part of the year being evaluated, supporting the zero-overlap defect classification. Ordinary calendar-month start/end rules support evaluating the omitted January 2 candidate. [IRS physical presence guidance](https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion-physical-presence-test).

### Planning and multiple periods

`summarizePlanning` finds the maximum foreign count across candidates, returns `330 - maxForeign`, and lists starts achieving that maximum (`feie.ts:135`). Output field `us_days_remaining` actually means **additional foreign days needed**, not allowable U.S. days (`calculator.ts:99–107`). It does not calculate which future dates can supply those days, a latest departure/return date, or whether a proposed trip is feasible. It enumerates windows a second time when planning is enabled.

Multiple maximum-overlap candidates are supported as ties, not as combined qualifying coverage. Whether multiple qualifying periods should contribute to a year's exclusion, how to avoid double counting, and how to coordinate income across those periods remain **T**. The presence of overlapping permissible periods does not by itself validate this single-window objective for every taxpayer. Form-specific eligibility and income calculations require independent review. [Form 2555 instructions](https://www.irs.gov/instructions/i2555).

### Performance and robustness

Let `N` be input interval count, `D` coverage days, `W` evaluated starts, and `B` tied best windows. Validation/sorting is `O(N log N)`; occupancy marking is linear in covered days for validated nonoverlapping input; prefix construction is `O(D)`; candidate evaluation is `O(W)`; final tie sorting is `O(B log B)`. Memory is `O(D + W + B + N)`. Normal calendar-year coverage is about three years; this is small. A rough local probe of 100 full-coverage service calls took 581 ms (~5.8 ms each); not a mobile benchmark.

`Uint16Array` prefix counts overflow above 65,535 total marked days; very long arbitrary API spans can exceed this, although ordinary UI years cannot (`occupancy.ts:20`). No maximum API tax span or row count is enforced. Date-only validation rejects years 0000–0099 because `Date.UTC` remaps those years; irrelevant to the offered modern filing years. `normalizeError` accepts any object with `code`/`message` without validating enum membership (`calculator.ts:121`). These are secondary robustness limits, not demonstrated public exploits.

The larger UI cost is calendar rendering: 36 months × 42 day buttons = 1,512 buttons even when years are “collapsed.” Every hover with an active draft rebuilds month/day structures and scans intervals per cell (`RangePlanner.tsx:70–158,253`). Rendering is roughly `O(years × 504 × N)` per update. An extended archive creates approximately a decade of calendars. Main-thread UI work, rather than prefix-sum mathematics, deserves performance attention.

## 4. Data model and persistence

| Item | Implementation and limitations |
|---|---|
| Travel record | Only two dates plus transient random row ID; no country, timezone, notes, source evidence, full-day confirmation, or proposed/completed status |
| Tax year | Calendar bounds generated from integer; default previous year through October 15 UTC, current year afterward (`useCalculator.ts:62–86`) |
| Offered years | Current year −7 through current year +1; README “+/- 7” is inaccurate |
| Calculation parameters | Mode, dates, optional planning boolean; 330 hard-coded; no annual monetary parameters |
| Preferences | No persisted settings; current mode, expansion and drafts are component state |
| Storage | No localStorage, sessionStorage, IndexedDB, cookie, backend, or URL-state persistence found |
| Retention | Current page memory only; refresh/reopen loses records. Browser reload check returned blank rows |
| Import | No user file, JSON, CSV, or pasted-history import; development presets are not import support |
| Clipboard | Plain text: year, primary window, foreign count, overlap count, rounded fraction, window-clipped U.S./foreign rows, selection note, attribution/disclaimer, UTC generation date and build |
| PDF | Letter-size text/vector summary and manually paginated table; same primary-window content; no raw history or machine-readable reload format |
| Portability | Human-readable copy/PDF only, available for a passing primary window; cannot round-trip history |
| Schema compatibility | No persistence schema/migrations; source interfaces are unversioned; report build label is manually maintained |

**Travel history is coupled to calculation horizon.** The hook's coverage-change effect blanks endpoints outside the new horizon, then regenerates the opposite mode (`useCalculator.ts:229–257`). Browser reproduction: foreign 2025-01-01–2025-11-30; change filing year from 2025 to 2027; both dates disappear without confirmation. Changing back cannot restore them. A partially intersecting interval can become a half-filled invalid row instead of being safely retained as history.

The special `loadDataset` coverage override extends displayed calendars/validation to archive dates (`useCalculator.ts:412–440`), but `normalizeInput` independently enforces ±1-year bounds. The 2016–2025 U.S. archive preset therefore loads into the form and then returns “Interval lies outside allowed bounds.” Browser-verified. The existing archive test asserts state and coverage, not successful calculation (`useCalculator.test.tsx:166`).

**Report provenance is inconsistent.** Literal transfer intentionally clears the opposite row list (`useCalculator.ts:332–349`). The service still computes a complement, but the report reads the cleared UI list. Verified production reproduction: literal foreign→U.S.→foreign transfer of 2025-01-01–2025-11-30 leaves a summary with 334 foreign days and 365 overlap days, while the supporting table includes only the foreign row and omits December 1–31 U.S. days. Normally converted input shows both rows. Clipboard and PDF share this defective reporting data path (`ResultsPanel.tsx:59–110`).

The footer says data stays “in your browser only,” which is consistent with no submissions but does not clearly communicate **not saved** (`AppFooter.tsx:31`). Clipboard/downloads create user-controlled copies outside page memory; they are not automatically erased by the application.

## 5. Actual user workflows

| Workflow | Assessment | Evidence/friction |
|---|---|---|
| First calculation | Works under constrained assumptions | Browser manually entered 2025 Jan 1–Nov 30; qualified summary appeared automatically; no Calculate button needed |
| Returning visitor updates records | Absent across visits; works within current page | Refresh resets rows; no restore/import mechanism |
| Switch U.S./foreign mode | Partially works | Empty switch immediate; populated switch opens literal/convert/cancel dialog. Valid in-range convert round-trip preserved tested interval; literal transfer changes semantic meaning and omits complementary report rows |
| Evaluate another tax year | Partially works, unsafe for retained history | Recalculates but horizon change blanks endpoints; selected-year dropdown works |
| Plan a future trip | Partially works | Future dates accepted within coverage; no planned/completed distinction or scenarios. Planning toggle is inaccessible |
| Correct an interval | Works for ordinary manual edit | Partial entry clears result and shows row error; completion recalculates. Repeated React warnings indicate hook-order violation; no crash in tested sequence |
| Review optimized period | Works with interpretability limitations | Primary earliest tie, counts, ratio and table visible; “maximum FEIE benefit” overstates objective |
| Compare alternatives | Partially works | Static list of maximum-overlap ties only; no selectable alternative summary/export or scenario comparison |
| Copy summary | Works in tested Firefox environment | UI reported “Summary copied to clipboard”; exact formatting inspected in source; independent clipboard read-back not performed |
| Export preparer documentation | Partially works | Downloaded/read/visually inspected actual one-page PDF; lacks assumptions/provenance and full tax context |
| Insufficient days | Partially works | Deficit displayed; text refers to nonexistent planning-mode control; generic failure also shown for empty foreign input |
| Incomplete data | Unsafe/partial | Half-filled row blocked with message; entirely blank U.S. mode shows Qualified; missing travel gaps inferred rather than flagged |
| Long-history preset | Fails calculation | Form horizon expands but service rejects old records |

The mode dialog's native radio change is intentionally deferred pending confirmation. Playwright `check()` therefore reported that state did not change; using `click()` followed by the dialog action completed the flow. That automation-specific check failure is not itself a product defect.

## 6. Tests and verification

### Existing test inventory

| File | Defined tests | Actual coverage |
|---|---:|---|
| `domain/__tests__/intervals.test.ts` | 3 | Sorting, overlap rejection, one complement example |
| `domain/__tests__/feie.test.ts` | 2 | Some qualifying window exists; positive planning deficit |
| `services/__tests__/calculator.test.ts` | 3 | Invalid tax end, qualification, planning result shape |
| `app/hooks/__tests__/useCalculator.test.tsx` | 7 | Conversion/literal row state; two preset-loading cases |
| `app/__tests__/appModeToggle.test.tsx` | 2 | Empty switching, literal quick-add switching in StrictMode |

Vitest is configured through `vite.config.ts:16`, globally using jsdom. Testing Library provides component/hook integration tests. No checked-in real-browser/end-to-end suite, visual tests, export tests, accessibility tests, coverage configuration, coverage percentage, or CI enforcement was found. Architectural documentation's claims about prefix sums, leap/single-day edge coverage and snapshots are broader than the actual tests (`docs/architecture.md:26–28`).

### Executed commands and outcomes

| Command | Outcome |
|---|---|
| `git status --short` | Initially clean. Later `package.json` and lockfile changed by user, then the two audit reports created |
| `node --version`; `npm --version`; `npm ls --depth=0` | Runtime/installed inventory in §2, repeated after update |
| Initial `npm test -- --run` | Exit 1; 11 passed, 4 failed across four completed files; unhandled missing `source-map-js/lib/source-map-generator.js`; internal React static-flag warnings |
| Initial `npm run build -- --outDir /tmp/feie-audit-build` | Type-check stage passed; Vite 5.4.20 failed resolving `jspdf` during user dependency replacement. **Transitional result, not final build state** |
| Updated `npm test -- --run` | Exit 1; all five files collected; **12 passed, 5 failed**. Four conversion assertions plus literal-switch test timeout at 5000 ms. Total ~24 s; React static-flag warnings remain |
| `node node_modules/vitest/vitest.mjs run src/domain/__tests__ src/services/__tests__ --environment node` | Exit 0; all 3 files / 8 tests passed; isolates domain/service tests from jsdom/tooling issues |
| `npm run build -- --outDir /tmp/feie-audit-build-updated` | Exit 0; type check and Vite 8.3.4 production build passed; React plugin/esbuild/oxc and deprecated optimizeDeps warnings |
| `node node_modules/typescript/bin/tsc --noEmit` | Exit 0 after update; does not type-check Vite config |
| `npm ls vite --all` | Exit 1, `ELSPROBLEMS`; Vite 8.3.4 violates React plugin 4.7.0 peer range (through Vite 7) |
| `npm audit --json` | Sandbox DNS failure; read-only outside-sandbox retry succeeded: **0 known vulnerabilities**, 202 dependency total in metadata |
| `npm outdated --json` | Read-only registry retry returned outdated inventory in §7; exit 1 indicates outdated packages |
| `npm run dev -- --host 127.0.0.1` | Sandbox `listen EPERM`; authorized retry started updated Vite at port 5173 |
| `npm run preview -- --outDir /tmp/feie-audit-build-updated --host 127.0.0.1` | Updated production preview started at port 4173 |
| `node node_modules/typescript/bin/tsc --outDir /tmp/feie-audit-engine --noEmit false --module commonjs --target ES2022 --skipLibCheck src/services/calculator.ts` | Compiled unchanged engine for inline `node -e` probes; results in §3 |
| `pdftotext -layout /tmp/feie-audit-summary.pdf -` | Extracted expected year/window/counts/travel/notes/footer text |
| `pdftoppm -scale-to 1100 -png -singlefile /tmp/feie-audit-summary.pdf /tmp/feie-audit-pdf` | Rendered PDF for visual inspection; readable one-page layout |

Browser command base: `node /home/cameron/.npm/_npx/31e32ef8478fbf80/node_modules/@playwright/cli/playwright-cli.js --session=feie-audit`. Executed `open http://127.0.0.1:5173/ --browser firefox`, `snapshot`, and `run-code` checks using existing cached tools/browser. No browser/package installation. Snapshot-driven inspection plus scripted native fields, semantic button/radio locators, DOM layout/accessibility measurements, screenshots and download capture were used. Desktop 1440×1000 and mobile 390×844 were inspected; development and production differences are recorded in the product report.

### Interpreting failures correctly

The four hook conversion tests hard-code 2023 intervals and do not freeze the clock. Current default year is 2025, whose horizon starts in 2024; their data is now out of bounds. Failures demonstrate loss for those fixtures, but **do not prove all supported mode conversions lose data**. A valid 2025 browser round-trip preserved its interval. Stale fixtures and inversion's unguarded assumptions both deserve investigation (`useCalculator.test.tsx:23–139`).

The app literal-switch test freezes June 2024 but calls `vi.runAllTimersAsync`; it timed out under the updated suite. Its slow execution and changed Vitest/toolchain warrant investigation; a product failure was not established from timeout alone. The same literal workflow completed in a browser.

`ResultsPanel` returns before calling hooks when `result` is null (`ResultsPanel.tsx:39–54`), then conditionally begins `useMemo`, `useState`, `useEffect`, and callbacks. This violates React hook ordering. Tests and development browser emitted “Expected static flag was missing.” Manual incomplete→complete entry worked in the observed sequence; a fatal crash was **not** demonstrated. There is no application error boundary (`main.tsx:6`).

Important uncovered boundaries: exact 329/330 transitions, positive tax-year overlap, earliest/latest candidates, leap-day starts, complete/partial tax years, tax-home conditions, transit/arrival days, multiple-period treatment, duplicate/single-day intervals, large-span overflow, empty-U.S. assumptions, year-change retention, report provenance after literal transfer, refresh recovery, PDF pagination/errors, clipboard denial, keyboard/modal behavior and mobile populated results. Ad hoc checks cover some observations, not permanent regression protection.

No lint script/configuration exists; no linter was installed or run. No coverage tool was installed or run. Successful arithmetic tests and the updated build do not establish tax-law correctness.

## 7. Configuration, dependencies, and security

### Dependency currency and compatibility

The user independently replaced jsPDF 3.0.3, Vite 5.x and Vitest 1.x with major versions 4.2.1, 8.3.4 and 4.1.11 during review. Initial missing-module failures occurred during that transition and are superseded by the successful final build and complete test collection. The audit did not reproduce the initial security vulnerabilities against the old tree; the user's reported remediation is not evidence of any particular exploit in this app.

Registry query results at review time:

| Package | Installed | Wanted by declared range | Registry latest |
|---|---:|---:|---:|
| React / React DOM | 18.3.1 | 18.3.1 | 19.3.0 |
| React types | 18.3.25 | 18.3.31 | 19.3.0 |
| React DOM types | 18.3.7 | 18.3.7 | 19.3.0 |
| React Vite plugin | 4.7.0 | 4.7.0 | 6.1.2 |
| Testing Library React | 15.0.7 | 15.0.7 | 16.3.3 |
| jsdom | 27.0.0 | 27.4.0 | 29.1.1 |
| TypeScript | 5.9.2 | 5.9.3 | 7.0.2 |

“Outdated” does not mean insecure or require every major upgrade. The concrete compatibility issue is the plugin's Vite peer mismatch and runtime transform/deprecation warnings. `baseline-browser-mapping` has no direct application import; it appears to be tooling support introduced by the user update, not a product capability. Fresh-install reproducibility remains unverified because installing dependencies was prohibited. Lockfile and source were not changed to resolve compatibility.

### Actual security/data exposure observations

- No secrets, credentials, `.env` files, server endpoints or API tokens were found in tracked application/configuration files. Empty restricted `.aws`/`.agents` directory listings do not establish anything about credentials elsewhere; no account-wide secret scan was attempted.
- No application `fetch`, Axios, analytics SDK, external font download, account creation or travel-data submission path was found. Runtime dependencies are bundled, with jsPDF loaded on export. Development Vite module/HMR traffic is development infrastructure, not a product analytics service.
- Input dates are validated by the service and rendered via React text; clipboard uses plain text and PDF uses text drawing. No `dangerouslySetInnerHTML`, `eval`, or user-controlled URL sink was found in application source. No concrete injection exploit was identified. Bundled jsPDF optional HTML-related packages are not evidence of an exploit in this text-only export path.
- No browser-storage XSS/token exposure finding applies to nonexistent persistent storage. The demonstrated issue is loss of unsaved data, not leaked stored credentials. Downloaded/clipboard travel information is sensitive user-controlled output; it has no app retention policy or access-control facility.
- Production HTTPS/headers/CSP/frame restrictions cannot be determined from local preview or this static repository. `index.html` contains no CSP meta tag, but hosting may supply headers. This is **not verified**, not a proven public vulnerability. Secure-context clipboard behavior outside localhost was not tested.
- Author/product outbound links use `rel="noreferrer"` with a new tab (`AppFooter.tsx:12,19`). No login, payment, authorization boundary, database or remote mutation exists to audit.
- No accessibility component library or automated accessibility checker is included. Custom date calendars and modal implement their own incomplete accessibility semantics.

Updated build assets: main JS ~176.46 kB (57.05 kB gzip), CSS 9.90 kB; lazy jsPDF chunk ~398.81 kB (129.49 kB gzip), with additional generated optional chunks including html2canvas ~199.45 kB. Emitted optional chunks are not proof they all download in a normal session. There is no service worker/offline-install support.

Security review used the applicable React/general frontend security guidance; no implementation fixes or standalone third report were created. `npm audit` returning zero is a point-in-time advisory result, not a guarantee of security or compatibility. [npm audit documentation](https://docs.npmjs.com/cli/v11/commands/npm-audit).

## 8. Technical debt and complexity

| Finding | Specific evidence and consequence |
|---|---|
| Parallel sources of travel truth | Two editable row arrays, `lastEditedMode`, complement regeneration and separate service normalization (`useCalculator.ts:175–178,199–257`). Report omission after literal transfer demonstrates drift |
| Side effects inside updater functions | `syncRows` and `setModeState` callbacks call other state setters (`useCalculator.ts:205–225,327–355`). Purity/replay/StrictMode behavior is difficult to reason about |
| Three different coverage policies | UI override; service ±1 year; engine prior-year start +2 days (`useCalculator.ts:185`; `calculator.ts:31`; `feie.ts:14`). Archive mismatch and missed boundary result |
| Repeated validation/date handling | Hook validation, row sanitization, service normalization, planner filtering; planner separately constructs ISO strings and month dates. Necessary layers have divergent guarantees |
| Calendar cost exceeds task need | All months constructed/rendered in “collapsed” years; hover rebuilds them; Set-based expanded state permits only one year despite generic multi-open structure (`RangePlanner.tsx:179–193,253`) |
| Reporting component has several jobs | 513-line `ResultsPanel` combines React state, derived travel model, copy formatting and custom PDF pagination; changing report semantics requires keeping multiple render paths aligned |
| Cosmetic timeline implies more than implemented | Two left-aligned percentage overlays, no actual shared date axis, legend or interaction (`Timeline.tsx:18–39`; `app.css:445–464`) |
| Unconnected planning action | Exposed in hook, never wired to UI; user text repeatedly instructs enabling it (`ResultsPanel.tsx:487,505`) |
| Unused/superfluous helpers/contracts | `enumerateDays`, `diffDaysExclusive` have no application callers; occupancy imports `fromEpoch`/`toEpoch` unused; `normalized.taxYearDays` duplicated/recomputed; `maxForeignDays` only internal; `travelIntervals` retained in summary object but rendering/export uses clipped list |
| Unused props/aliases | `PeriodsEditor` receives tax-year start/end but does not use them; source has little use of configured `@` alias beyond metadata. These are small cleanup candidates, not architecture failures |
| Weakly enforced typing | `DateISO = string`; `details as any` in error routing; `normalizeError` shape cast; config excluded from type check |
| Documentation overclaims | README ±7 years, public presets, optimal planning starts, interactive visualization/client-ready reports and package import example exceed verified behavior/distribution |
| Build attribution drift | Package 0.1.0 vs hard-coded v1.0.0; no source revision in exports (`package.json:3`; `version.ts:1`) |

No TODO/FIXME markers were found in `src`. That absence does not imply completeness. Runtime React and jsPDF packages have actual uses; no application framework dependency is entirely unused. Most excess complexity comes from synchronization, calendar interaction and reporting, not a need for additional architectural layers.

## 9. Historical fingerprints

These are reassessment hypotheses, **not claims about who authored the code or whether AI was used**. Recent inspected commits end October 9, 2025. Age alone is not the issue.

| Pattern | Likely purpose | Evidence and reason to reassess |
|---|---|---|
| Reusable API/CLI/SSR/serverless framing without packaging | Anticipate future reuse | README and architecture docs promise channels; private package only builds website. Pure source boundary is useful; unsupported integration claims add maintenance expectations |
| Dual arrays plus canonical-mode and override state | Preserve friendly switching and historic examples | `useCalculator.ts` has 473 lines and multiple synchronized truths. Literal output divergence and archive rejection show the cost of incremental patches |
| Special archive horizon override | Keep long sample history intact without redesigning domain horizon | Only dataset loading broadens bounds; engine service still rejects them. Workaround solves display but not calculation |
| Hand-built calendar and PDF layout | Avoid new dependencies/control appearance | Calendar duplicates native date-entry capability and renders 1,512 buttons; PDF manually manages tables/pages. Both serve real user needs but need disproportionate testing |
| Layered error codes plus unreachable guard | Stable reusable API errors | `WINDOW_TOO_SHORT` follows an earlier reversed-range check, so validated inclusive bounds already guarantee ≥1 day (`calculator.ts:18–24`). Some defensiveness obscures the meaningful failures |
| Fraction/value duplication | Convenient rendering/export formats | Stores rounded ratio despite integer counts already available, then rounds again. Adds apparent precision differences without richer tax modeling |
| Promotional result storytelling | Make calculations approachable | “Every possible combination” and “maximum FEIE benefit” conflict with missed starts, nonmonetary objective and absent assumptions (`ResultsPanel.tsx:386–388`) |
| Fixed max-height calendar collapse | Animated previews without managing mount state | Hidden content remains in DOM/accessibility tree; repeated numeric day names and large tab order. Contemporary expectations favor intentional semantics and bounded interaction |

Retain the useful TypeScript domain boundary, UTC date arithmetic, prefix-sum approach, static deployment and optional PDF loading unless evidence shows a need to change them. Nothing here supports wholesale replacement.

## 10. Prioritized unanswered technical questions

### Tax correctness

1. **Highest priority:** what exact limited claim should the product make, and which tax-home, citizenship/residency, foreign-country, income and election prerequisites must be established outside the calculator?
2. Which days belong in the exclusion-limit numerator for the intended cases, including travel gaps and changing tax homes? The current unconditional overlap ratio has not received specialist validation.
3. When should multiple qualifying periods contribute to the same tax year, and how should overlapping days and income attribution be handled? Is maximizing a single period sufficient for the intended users?
4. What is the authoritative leap-day-start convention, and what specialist-approved examples establish 12-month boundaries and transit/full-day treatment?
5. What should prospective qualification mean before travel occurs, and what confidence/assumptions should a preparer receive?
6. Are statutory waivers, excluded locations, bona fide residence cases and special taxpayer categories deliberately outside scope? No implementation establishes them.
7. Does the public API really need arbitrary partial tax-year bounds? If so, what legal denominator and annual-limit contract applies?

### Implementation and operations

1. Can a clean install reproduce the updated build/tests, and what compatible Vite/plugin/Node combination is intended? Installation was prohibited; peer mismatch remains.
2. Are clock-controlled, in-range mode-conversion tests stable under the supported React/Vitest combination? Current failures include stale fixtures; the updater-side-effect design still warrants investigation.
3. What causes the literal-switch test timeout under Vitest 4, and does it reproduce without competing checks? No timeout-only product defect is asserted.
4. What is the intended retention/portability contract for multi-year travel history? Current behavior cannot fulfill durable maintenance.
5. Can the hook-order violation cause a fatal failure in other interactions or React versions? Observed warnings are concrete; tested entry did not crash.
6. Do clipboard denial, PDF failure, long multipage exports and accessible/tagged PDF reading work acceptably? Only successful copy and one-page export were inspected.
7. What host/path, security headers, HTTPS, cache policy and deployed version are actually in use? No deployment was performed or verified.
8. Which mobile browsers, touch devices and screen readers must be supported? Only desktop Firefox with emulated viewport sizes was exercised; no full assistive-technology or automated WCAG conformance test.
9. What license and support/ownership arrangements apply? README still asks for a license to be specified; no license file was found.
