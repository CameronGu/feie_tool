# FEIE Window Optimizer: Independent Release Review

Candidate: **0.2.0-rc.1**, calculation **physical-presence-2**. Reviewed October 13, 2026. Branch `refactor/project-update`, commit `18677df`; comparison baseline `2025-alpha.1` (`9df6883`). Synthetic data only. No implementation, tests, dependencies, configuration, or existing documentation were changed. No publication or deployment occurred.

## 1. Release assessment

**The candidate substantially fulfills its stated, narrow purpose: private travel-history maintenance, ordinary physical-presence counting, conditional calendar-year coverage, and preparer working reports.** Its architecture is proportionate and considerably simpler than alpha. I found no new defect in ordinary candidate enumeration, full-foreign-day counting, coverage union, deduplication, or fraction arithmetic across the independent cases tested.

I would make a small corrective release before publication. Newly reproduced problems concern a false claim that unknown dates necessarily prevent a conclusive failure, an example comparison mixing different histories/years, and scenario exports omitting the completed comparison. Tax-home wording also deserves a more specific explanation before publication. None justifies replacing the calculation engine or adding a tax-preparation backend.

Evidence was independently obtained, rather than accepting the previous readiness conclusion:

| Check | Review result |
| --- | --- |
| `npm run check` | Passed: TypeScript, 79 tests in 10 files, production build |
| `npm run test:e2e` | Passed: 28; two expected Firefox native-clipboard skips; five browser/viewport projects, about 2.5 minutes |
| Separate Python oracle against temporarily transpiled current modules | **77 cases, zero mismatches**; every ordinary candidate's dates/count, passing count, coverage union, denominator, fraction, and supporting-set coverage compared |
| Production browser exploration | Direct entry/correction, declarations and exceptions, thresholds, unknowns, proposals, examples, JSON download/import/reload/year change, overlap and reversed-date recovery |
| Actual outputs | Nine native clipboard exports and nine downloaded PDFs; numeric reconciliation and PDF text extraction; all 11 PDF pages rasterized and inspected, with larger views of representative pages |
| Visual evidence | 22 Chromium captures, desktop 1440×1000 and mobile viewport 390×844; narrow viewport testing is not real-phone certification |

The initial sandboxed browser/server attempt failed with `listen EPERM`. The successful full suite and production capture used authorized local execution outside that restriction. A separate CLI/browser-version mismatch was resolved by selecting the already installed Chromium executable in temporary configuration. Neither failure is counted as an application defect. No clean dependency installation, remote CI, hosted deployment, Safari, real mobile device, or OS screen-reader run was performed for this review.

The compact evidence package is [output/release-review/index.html](output/release-review/index.html), with [screenshot index](output/release-review/SCREENSHOT-INDEX.md), reports, reconciliation results, and a reproducible independent calculation helper. Existing release documents remain unchanged as requested.

## 2. Independently reproduced calculation results

### Method and primary authorities

I read the calculation contract, release plan, progress/readiness records, historical assessments, relevant source/tests, and the actual baseline-to-candidate diff. Expected ordinary counts came from a separate Python `datetime` implementation and sets of individual dates, not the application's date helpers, occupancy arrays, interval merger, or existing test assertions. Source was transpiled into a temporary directory without editing it. The oracle examines daily starts, independently constructs corresponding-date endpoints, counts foreign-date membership, and unions tax-year dates. It also checks that the selected supporting periods reproduce exactly the same union.

Fourteen named cases and 63 seeded sparse/dense histories cover 1901, 1904, 1999, 2000, 2023–2025, 2096 and 2099. Century/leap behavior and technical date extremes are included; these years are arithmetic probes, not certifications of historical tax law. February 29 longer-endpoint sensitivity is inspected separately from ordinary coverage. See [independent results](output/release-review/data/independent-calculation-results.json).

Live primary-source review establishes these distinctions:

- The ordinary twelve-month endpoint is the day before the corresponding date twelve months later; full foreign days need not be consecutive, and specified short-transit exceptions exist. The regulation also supplies an itinerary whose two illustrated periods each contain 330 days; the oracle checked the candidate enumeration against that itinerary. [26 CFR §1.911-2(a), (d)](https://www.ecfr.gov/current/title-26/section-1.911-2).
- The IRS manual expressly defines coverage by membership in one or more qualifying periods. Consequently, union coverage is justified; summing overlapping periods or restricting the numerator to the 330 foreign days would be wrong for this modeled quantity. [IRM 21.8.1.3.2(9)](https://www.irs.gov/irm/part21/irm_21-008-001r).
- Tax-home requirements enter both qualification and the exclusion computation. The regulation allows a containing physical-presence period to include days outside a foreign country and days without a foreign tax home. Raw period coverage therefore needs careful interpretation. [26 CFR §1.911-3(d)(3)](https://www.ecfr.gov/current/title-26/section-1.911-3).
- The annual denominator is 365 or 366. Actual exclusion amounts additionally depend on eligible income and other requirements. [IRS exclusion computation guidance](https://www.irs.gov/individuals/international-taxpayers/figuring-the-foreign-earned-income-exclusion).
- Form 2555 requests one line-16 range; it does not provide multiple range fields. Line 38 asks for qualifying-period days in the tax year and line 39 a decimal fraction. Listing supporting periods in a working report does not settle their filing presentation. [2025 Form 2555](https://www.irs.gov/pub/irs-pdf/f2555.pdf), [instructions](https://www.irs.gov/instructions/i2555).

### Results register

Ranges below mean inclusive **full foreign days**; omitted dates contribute zero to the ordinary lower-bound calculation. Unless a different reference date is stated, completed/scenario checks use `2026-10-13`.

| Input and tax year | Independent expectation | Actual |
| --- | --- | --- |
| 2023-01-02–2023-11-27; year 2024 | Exactly 330; earliest intersecting period ends 2024-01-01; coverage **1/366** | Matches |
| 2024-01-02–2024-11-26; year 2025 | 330; 366-day containing period; coverage **1/365** | Matches |
| 2025-02-05–2025-12-31; year 2024 | No passing intersecting period; **0/366** | Matches; the latest relevant ordinary period contains only 329 foreign days |
| 2026-02-04–2026-12-30; year 2025 | Only the last start, 2025-12-31, passes; coverage **1/365** | Matches; catches the opposite enumeration boundary |
| 2025-01-01–2025-11-25 versus ending Nov 26; year 2025 | 329 fails; 330 passes; passing coverage **365/365**, not 330/365 | Matches |
| 2025-07-01–2026-05-26; year 2025 | 330; earliest passing start May 27; coverage **219/365 = 0.6** | Matches; actual foreign presence starts later than coverage |
| 2023-01-01–2024-05-31 plus 2024-08-01–2025-12-31; year 2024 | Union **366/366**, although no single passing period covers the whole year | Matches; 375 passing periods; compact supports overlap year by 188 and 178 days |
| 2023-01-01–2024-03-31 plus 2024-10-01–2025-12-31; year 2024 | Two disjoint segments: Jan 1–May 6 and Aug 27–Dec 31; **254/366**; middle gap excluded | Matches; 127 + 127 days |
| Repeated identical raw foreign interval Jan 1–Nov 26, 2025, sent directly to domain occupancy | 330 foreign dates, counted once; **365/365** | Matches; the user-facing history validator separately rejects conflicting/duplicate explicit records |
| 2024-02-29–2025-01-22 plus 2025-02-28; year 2024 | Ordinary maximum 329, baseline zero; longer Feb 29 convention gives 330 and **307 alternative days** | Matches; alternative is not silently certified |
| Empty history or U.S. visit alone | Zero supported coverage, incomplete evidence; no implied foreign complement | Matches |
| Declaration for 2025, unknown Jan 1–Feb 5 | 36 unknown days override declaration, leaving 329 assumed foreign days | Matches; no passing ordinary period |
| Foreign 2026 Jan 1–Dec 31 entered as completed | Completed calculation contains 285 full foreign days through Oct 12; comparison contains 365, of which 80 projected | Matches; completed is incomplete, comparison projected |
| Completed foreign 2025 Jan 1–Nov 25 plus proposed Nov 26 | Completed remains 329 and zero coverage; proposal enables 330 and 365-day projected coverage | Matches; original completed history retained |

The multiple-period supporting set is a compact proof of the union, not a list of all possible periods or a claim about financial optimization. Greedy selection is appropriate for this interval-cover problem. Overlap between qualifying periods does not duplicate tax-year dates.

The 2024/2025 enumeration has 729 ordinary candidates in each case; the separate Feb 29 sensitivity accounts for the omitted ambiguous start. The short Feb 29 interpretation is dominated by the ordinary Feb 28 start, which covers its dates and has at least as many foreign days. The longer interpretation can add coverage and is correctly surfaced separately.

Unknown dates are not silently classified as U.S. days. A successful lower-bound count can remain valid despite unknown dates, because already recorded dates alone supply 330. Conversely, a failing lower bound is not always inconclusive: an upper bound can establish failure. That status distinction is the newly reproduced defect below.

## 3. Confirmed defects

Severity reflects demonstrated user consequence, not implementation effort. **No newly confirmed ordinary day-count, union, or fraction defect was found.** C01 is assessment logic; C02/C03 are context/output defects. All reproductions use synthetic data.

### C01 — Unknown dates incorrectly said to prevent conclusive failure

**Medium; high confidence.** `src/services/travelCalculator.ts:36` makes any unknown segment sufficient for `incomplete`; `src/app/components/ResultsPanel.tsx:41` then claims unknown dates prevent a conclusive failure.

Minimal history for tax year 2024, reference date `2026-10-13`:

```json
{"schema_version":1,"records":[
  {"id":"a","kind":"us","status":"completed","start_date":"2023-01-02","end_date":"2024-01-01","note":""},
  {"id":"b","kind":"us","status":"completed","start_date":"2024-01-03","end_date":"2025-12-30","note":""}
]}
```

**Expected:** zero coverage and a conclusive ordinary threshold failure; even treating the sole unknown date, January 2, 2024, as foreign gives at most **one** foreign day in any candidate. The record set is incomplete, but the threshold conclusion is not.

**Actual:** “Incomplete travel evidence” and “Unrecorded or unknown dates prevent a conclusive failure assessment.” Closest-period evidence shows zero foreign days and one unknown day. [Screenshot 18](output/release-review/screenshots/18-one-unknown-day-status-desktop.png).

A more realistic instance is [the 2025 329-day report](output/release-review/reports/nonqualifying.pdf): future dates are withheld from completed evidence, so the app reports incomplete despite the independent maximum possible count across every candidate remaining 329. [Reconciliation](output/release-review/data/report-reconciliation.json) proves that upper bound.

This follows the documented blanket policy, so it is a limitation in the contract as well as its implementation. It does not falsely grant coverage, but it can send users searching for records that cannot change the conclusion. An upper-bound check, or more precise wording separating incomplete records from an undecided result, resolves it without changing foreign-day counting.

### C02 — Example preview mixes demo and saved-history comparison contexts

**Medium; high confidence.** `src/app/App.tsx:23` assesses the fixed 2025 example with scenario enabled, while line 59 passes the user's currently selected year's baseline into the result panel.

Minimal reproduction: save completed full foreign days `2024-01-01–2024-12-31`, select 2024, and choose **Preview an example**. Comparison need not be enabled.

**Expected:** a self-contained 2025 example; no subtraction between the user's 2024 result and the unrelated demo.

**Actual:** the 2025 example displays “Completed-record coverage: **366** days. Scenario coverage: **365** days (**-1**).” The year control still shows 2024 and comparison is unchecked. [Screenshot 11](output/release-review/screenshots/11-example-context-mismatch-desktop.png).

The banner clearly identifies the demo, and saved records survive. The confirmed problem is the nonsensical comparison, not data loss or incorrect real-history counting. Scope the comparison to the example's own inputs or suppress it in example mode.

### C03 — Scenario PDF/clipboard omit the completed baseline and difference

**Medium; high confidence; release-requirement gap.** The on-page comparison is assembled from a separate `baselineDays` prop in `ResultsPanel.tsx`; `TravelReport`/`reportText` have no baseline or delta fields (`src/services/report.ts:29`, `:97`).

Minimal reproduction: year 2026; completed foreign `2026-01-01–2026-10-12`; proposed foreign `2026-10-13–2026-12-31`; enable comparison at reference date Oct 13. Download PDF and copy report.

**Expected:** the reviewable scenario output includes completed coverage **0/365**, scenario coverage **365/365**, and change **+365**, with projection provenance.

**Actual:** page shows the baseline/delta, but both exported formats contain only the scenario result. The PDF correctly distinguishes 285 completed and 80 projected foreign days; these are different quantities and do not replace the omitted completed coverage calculation. [Screenshot 09](output/release-review/screenshots/09-future-scenario-desktop.png), [actual PDF](output/release-review/reports/projected-scenario.pdf), [clipboard text](output/release-review/reports/projected-scenario.txt).

The report remains reproducible, but the preparer must independently rerun it to recover the comparison. This weakens the plan's shared page/copy/PDF and actual-versus-scenario reporting promise. Add comparison context to the shared report rather than introducing a second export calculation path.

### C04 — Routine multiperiod PDF creates a nearly empty trailing page

**Low; high confidence; nonblocking.** The two-record/two-support report generates two pages, with only the final disclaimer on page 2. All substantive evidence is on page 1. Four-record declaration output also spills a few source URLs and the disclaimer to page 2. `src/services/reportPdf.ts:31` paginates individual text lines without keeping short closing blocks together.

**Expected:** compact pagination without a disclaimer-only extra page; **actual:** [multiple-periods.pdf](output/release-review/reports/multiple-periods.pdf), page 2. Nothing is missing or numerically wrong. This is print usability, not a release blocker.

## 4. Tax-law interpretation questions

### Q01 — Precisely what tax-home facts must hold for the displayed coverage?

**Highest consequence, but not a confirmed defect in the scoped raw-presence arithmetic.** Foreign tax home cannot be treated as a generic checkbox unrelated to the counted days. Section 1.911-2(a) requires foreign tax home throughout the 330 full presence days supporting qualification. The app records physical location, assumptions and proposals, but no tax-home timeline. [Regulation](https://www.ecfr.gov/current/title-26/section-1.911-2).

Concrete challenge: record full foreign days **2025-01-01–2025-11-26**. Raw count is 330 and actual app coverage is **365/365**, status “Physical-presence threshold met.” Suppose the person's foreign tax home actually began **April 1** and there are no other supporting foreign days: only **240** of those foreign days coincide with a foreign tax home. The physical travel count remains correct, but those facts do not supply 330 days satisfying the joint requirement. The same location records produce different tax conclusions; the tool cannot distinguish them.

Expected within the present product contract: retain the raw result, but explain specifically that its counted supporting foreign days must be independently checked against foreign tax-home facts. Expected as an established FEIE qualifying-period conclusion under the hypothetical facts: no ordinary period supported by 330 such days. Actual: the raw positive result and generic separate-review caveat. This is an interpretation/content risk, not evidence that the application promised to model tax home and failed to do so.

Do **not** “fix” this by automatically restricting all coverage to foreign-presence dates or simply clipping the union to a tax-home range. Section 1.911-3(d)(3)'s first sentence refers to meeting tax-home and presence requirements, while its later explanation allows a physical-presence period to contain days without a foreign tax home. Its moving example gives a qualifying period beginning before the foreign tax home was established. The partial-year sample's **219 covered days**, versus 184 calendar days from July 1 to Dec 31, illustrates why mechanical clipping needs specialist justification. [Regulation and example](https://www.ecfr.gov/current/title-26/section-1.911-3).

The IRS's general computation page describes qualifying days with reference to tax home and presence/residence. Publication 54 separately ties the 330 supporting days and eligible income to the relevant tax-home facts. These sources require careful reconciliation, not replacing the calculation with a simplistic 330-day numerator. [IRS computation guidance](https://www.irs.gov/individuals/international-taxpayers/figuring-the-foreign-earned-income-exclusion), [Publication 54, chapter 4 and foreign-income FAQs](https://www.irs.gov/publications/p54).

Before publication, make the conditional premise explicit next to the result and in reports, with a concise changing-tax-home example. Qualified tax review should approve how the raw union may be used for an exclusion-limit calculation. A tax-home editor or full eligibility interview is not required for this scoped release.

### Q02 — How should multiple supports be presented with Form 2555?

The union rule has primary administrative support; two periods need not be forced into a single best-window model. However, the form has one line-16 range. The report appropriately retains actual twelve-month supports and warns against entering their combined span as one period. [Form](https://www.irs.gov/pub/irs-pdf/f2555.pdf), [IRM](https://www.irs.gov/irm/part21/irm_21-008-001r).

The multiple-period sample covers all 366 days using two supports of 188 and 178 selected-year days, with 375 passing periods overall. All reconcile. What remains unresolved is the preparer's filing/attachment method and supporting travel presentation, not the set arithmetic. Keep the warning, seek a preparer-approved example, and avoid advertising a filing-ready Form 2555 workflow.

### Q03 — February 29 endpoint and date-only travel exceptions

The corresponding-day rule does not expressly resolve a Feb 29 start's missing anniversary in the reviewed text. The separate sensitivity is a reasonable conservative response. The baseline and longer alternative must remain visibly distinct. A specialist may settle a convention later; no silent leap clamp should replace the present disclosure. [Physical-presence regulation](https://www.ecfr.gov/current/title-26/section-1.911-2).

Ordinary arrival/departure guidance is useful, but full days depend on actual itinerary facts. IRS guidance includes an overflight example and short foreign-to-foreign transit rules. The software cannot establish those facts from two dates or a country note. The current help qualifies ordinary endpoints and refers users to exceptions, which is proportionate. This review found no reason to require a flight-time engine. [IRS physical-presence guidance](https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion-physical-presence-test).

## 5. Architecture and complexity review

The comparison shows **56 changed files, 2,286 added and 3,717 removed lines**. Non-test application TypeScript/TSX/CSS falls from approximately **3,342 to 1,597 lines**. Line count is not itself quality evidence; the important reduction is in independent mutable truths and interaction machinery.

| Area | Alpha → candidate | Assessment |
| --- | --- | --- |
| Calculation semantics | Single greatest-overlap windows and rounded fractions → exhaustive relevant ordinary starts, union coverage, compact supports, exact fractions, separate leap sensitivity | Material justified behavior change; old boundary failures independently retested |
| Travel model | Two editable complementary interval lists and mode-transfer state → version-1 records with kind/status/note; derived normalized segments | Strong simplification; one durable source makes reconciliation possible |
| Foreign assumptions | Implicit complement across a broad horizon → explicit bounded declaration plus explicit exceptions | Necessary extra distinction; prevents missing records from becoming positive facts |
| Time/evidence | Foreign/U.S. binary inference → unknown/nonqualifying/assumed/projected provenance, UTC reference-date cutoff | Real complexity serving correctness; cannot be removed merely for shorter forms |
| History scope | Selected-year clipping could erase history → all-years source, bounded calculation horizon | Correct separation; returning-user workflow works |
| Reporting | Large result component with separate export derivations → shared structured report/text and lazy PDF renderer | Appropriate; C03 shows comparison data still sits outside that shared model |
| Interface | Custom calendar, modal mode conversion, tied-window bars → labeled interval form, table, native disclosures | Proportionate and more efficient; no argument for restoring alpha's controls |
| Dependencies | Existing static React/Vite/jsPDF stack; compatible React plugin; browser/axe development tooling | No new runtime backend/account infrastructure; test additions justified |

Removed/materially altered capabilities include calendar quick-add, mode reinterpretation/conversion, timeline bars, raw tied-best-window display, development sample presets/archive, and arbitrary partial-year adapter inputs. The old “optimal”/“maximum benefit” storytelling and deadline-dependent default year are gone. The new previous-UTC-year default and explicit calendar-year contract are documented. Proposal comparison is now reachable, whereas the alpha planning guidance referenced an unwired toggle.

These removals do not undermine the product's essential job. Direct intervals, compact supporting proof and preserved facts serve it better. Arbitrary partial-year rejection prevents a misleading denominator; it is an intentional compatibility change, not a regression to conceal.

Remaining complexity is modest: normalization scans records for each day in an approximately three-year horizon; history renders all rows; undo retains one snapshot; a separate legacy `calculateFeie` adapter still exposes `best_windows` and the poorly named `us_days_remaining` field for a foreign-day deficit. The application uses `assessTravel`; future maintenance should keep the adapter's restricted contract explicit and prevent divergent evidence semantics. No demonstrated performance failure justifies speculative indexing, virtualization infrastructure, or a rewrite.

Documented gaps: C03 falls short of fully shared comparison reporting; “import previews records” in README is more generous than the count-only review actually shown; the blanket incomplete-status rule needs revision or more precise explanation. Concurrent tabs, untagged PDF, real-device coverage and source licensing remain disclosed limitations, not newly discovered defects.

## 6. UX/UI findings

The running application looks credible and restrained: consistent spacing, readable headings, a clear primary action, visible focus, and a stable desktop input/result relationship. Native controls suit a utility. It is much closer to a professional calculator than the alpha's giant calendar and promotional result cards. Additional decoration would not solve its remaining issues.

| Requested workflow | Observed result and user consequence |
| --- | --- |
| Abroad resident entering several years of U.S. visits | Declaration plus December/January visit, July visit and separate transit exception works; 2025 shows 347 assumed foreign days and 365 coverage days. Useful but requires understanding two different record meanings |
| Foreign-stay entry | Direct first/last full-day fields work; editing the endpoint from 329 to 330 changes the result correctly; stored record is corrected in place |
| Incomplete history | Unknown entries and absent dates remain visible in normalized evidence; 300-day sample stays incomplete. C01 identifies the case where the explanatory conclusion goes too far |
| Future trip | Comparison shows completed and scenario coverage and keeps source statuses; actual future sample has 285 completed plus 80 projected foreign days. C03 weakens the exported handoff |
| Near threshold | 329-day deficit explanation is explicitly tied to the same period and avoids recommending an itinerary; 330-day success correctly shows 365 covered days, with unknown days still listed |
| Backup restoration and year changes | Actual downloaded four-record JSON imported through review/merge, then reload and switching to 2024 retain all four records; replacement path also exercised for synthetic fixtures |
| Tax preparer | Exact fractions, supports, source identifiers and normalized ranges permit reconstruction; tax-home premise and multi-period filing still need professional interpretation |

Principal usability concerns, in priority order:

1. **Declarations need a concrete introductory example.** The U.S. entry notice explains the bounded range and exceptions, and the acknowledgment is explicit. Yet “Enter U.S. visits” initially selects a U.S. record, while the useful first step for an abroad resident is usually choosing a declaration in the dropdown. The two convenience buttons and five-option type selector partly duplicate each other. A short example (“declare Jan 1–Dec 31 abroad; add June 1–10 U.S.; mark uncertain/transit dates”) would clarify the model without a wizard. Keep the distinction itself.
2. **Mobile history correction is workable but inefficient.** Document width remained **390px**; the 620px history table scrolls inside its region. Edit/Delete are off the initial horizontal view and, when reached, identifying dates are off the opposite side. [Screenshot 16](output/release-review/screenshots/16-mobile-history-actions.png). Consider a small-screen row arrangement or keeping the identifying range with its actions. This is not the former whole-page overflow defect.
3. **First-use mobile density delays the task.** In the restored U.S. workflow the first date input begins about **885px** from document top. Scope, year, comparison, entry convenience, type and several paragraphs precede it. The empty result also shows an arbitrary closest period and a 330-day deficit before any evidence exists. Preserve essential scope/full-day explanations, but shorten repetition and prioritize an actionable empty state. This is a refinement, not a reason to remove evidence safeguards.
4. **Import review exposes only count.** A four-record backup preview says “Review import: 4 records”; it shows no date span, types, proposals or representative rows before replacement. A wrong same-size backup is hard to recognize. Explicit acknowledgment, merge rejection and session undo mitigate loss. Show a compact contents summary before replace; do not require a new account/import service. [Screenshot 14](output/release-review/screenshots/14-backup-import-review-mobile.png).
5. **Error recovery is safe but could guide focus better.** Overlap edits retain the old history and the unsaved correction with an explicit conflict message. Reversed-date submission announces an alert and flags date fields, but keyboard focus remains on Save; the generic “Record 3” message is less useful than naming start/end. Move focus to the relevant field/error for efficient correction. This was directly measured, not inferred from axe success.

Accessibility is materially improved: associated date labels, native buttons/selects/disclosures, readable status announcements, skip link, 44px control sizing, and visible focus are present. The full suite found no automated WCAG A/AA violations in its empty/populated states across five projects. That is limited evidence, not full conformance. Manual browser exploration checked correction focus and local table scrolling; no OS screen-reader, native mobile date-picker, Safari or assistive PDF reading test was performed. A 500-character unbroken note wrapped within the table rather than hiding actions or widening the page; do not report it as an overflow bug.

Contemporary comparison was scoped to live page content/control structure: [Calculator.net's tax calculator](https://www.calculator.net/tax-calculator.html) labels the tax year and relates inputs to source documents; [Omni's date calculator](https://www.omnicalculator.com/everyday-life/date) centers direct date entry and explains the operation. The candidate now shares that useful direct-entry pattern. It could better connect travel documents, assumptions and the headline coverage quantity. I did not execute competitor calculations or conduct a controlled comparative visual/usability study, so no unsupported speed or accessibility ranking is claimed. The current [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) informed the label, focus, content wrapping and form checks; incidental stylistic preferences are not release blockers.

## 7. PDF and clipboard assessment

These are actual downloaded PDFs and native clipboard contents from the production build, not reconstructed report mockups. Eight primary captures explicitly compared clipboard text with the report textarea; the additional definitive-failure capture also read native clipboard output. Python independently reconstructed the foreign-date sets from normalized report ranges, enumerated passing periods, checked union/fraction and every supporting/closest-period evidence count, and compared every nonempty clipboard body line with extracted PDF text after whitespace normalization. **All nine reports reconciled with zero numeric or text-omission issues.** See [reconciliation](output/release-review/data/report-reconciliation.json).

| Actual sample | Result and key evidence | PDF pages |
| --- | --- | --- |
| [Ordinary recorded year](output/release-review/reports/ordinary-recorded.pdf) | 365/365; supporting period contains 365 recorded foreign days | 1 |
| [Partial year](output/release-review/reports/partial-year.pdf) | 219/365; 330 full foreign days; May 27–May 26 containing period | 1 |
| [Definitive nonqualifying](output/release-review/reports/nonqualifying-confirmed.pdf) | 0/366; full horizon classified; closest foreign count 329 | 1 |
| [Incomplete evidence](output/release-review/reports/incomplete.pdf) | 0/365; closest period has 300 foreign days and 65 unknown | 1 |
| [Projected travel](output/release-review/reports/projected-scenario.pdf) | 365/365 scenario; 285 recorded completed and 80 projected foreign days | 1 |
| [Multiple supports](output/release-review/reports/multiple-periods.pdf) | 366/366; 375 passing periods, two compact supports | 2 |
| [Declaration and U.S. exceptions](output/release-review/reports/declared-with-us-visits.pdf) | 365/365; 347 assumed foreign days, zero supporting unknown days | 2 |
| [Exact 330](output/release-review/reports/threshold-330.pdf) | 365/365 despite 35 supporting unknown days; no unknown date counted foreign | 1 |
| [329 with non-decisive missing future dates](output/release-review/reports/nonqualifying.pdf) | 0/365; upper bound remains 329, but label is incomplete (C01) | 1 |

Corresponding `.txt` files are the captured clipboard reports; `.pdf-text.txt` files are extracted PDF text. Neither is a JSON restore backup. The package also includes a genuine four-record JSON backup.

Facts, declarations, unknown dates and proposed dates are distinguishable in source rows and normalized segments. Original source dates remain intact even where evaluation clips the derived horizon. Record identifiers link sources to segments, and versions/as-of/generated dates allow reproduction. The exact rational fraction accompanies the rounded decimal. Counts for assumed/projected foreign days can overlap; this is explicitly disclosed rather than incorrectly presented as additive categories.

Remaining report issues:

- **C03:** scenario baseline/delta is missing from both export formats. This is the main handoff defect.
- The general tax-home caveat does not explain the supporting-days premise as specifically as Q01 requires.
- Normalized rows use technical terms (`foreign`, `assumed`, `recorded`, `completed/unknown`) and repeat long identifiers. They are useful audit evidence but laborious to scan. A small legend and short display references linked to retained full identifiers would help; do not drop provenance.
- Fourteen numbered notes/URLs occupy much of even a one-record report, including generic warnings unrelated to that case. Preserve necessary scope and authoritative references, but separate essential case assumptions from reusable background. The report is a working appendix rather than a polished preparer summary.
- C04 demonstrates avoidable pagination. Repeated page headers/footers and versions work correctly.
- PDFs are untagged, core-font text; the disclosed Unicode escape approach is a tradeoff. ASCII synthetic notes were used here. Existing tests cover glyph preservation, but this review did not independently certify Unicode rendering or accessible reading order.

There is no evidence of missing travel rows or conflicting page/copy/PDF day counts in the reviewed outputs. A PDF labeled “threshold met” is still conditional working documentation, not proof of complete FEIE eligibility or a completed tax return.

## 8. Test coverage gaps

Passing gates are meaningful but do not cover the newly exposed contexts. Add targeted regression coverage when fixing logic; none was added during this review.

| Gap | Targeted check that would catch it |
| --- | --- |
| Any unknown automatically means inconclusive | C01's two U.S. ranges and one unknown date; also a real 329-day history whose candidate upper bounds never reach 330 |
| Example mixed with saved baseline | Saved 366-day 2024 result, comparison unchecked, preview 2025; assert no cross-year delta or saved-history baseline appears |
| Shared scenario comparison output | Assert baseline coverage, denominator, scenario coverage and delta agree across page, clipboard and PDF |
| Routine PDF pagination boundaries | Two-source/two-support report; detect a final page containing only disclaimer or URLs, rather than only asserting valid bytes/page footers |
| Import recognition | Preview an equal-record-count backup with different date spans/proposals before replacement; verify meaningful summary and safe cancellation |
| Error focus and mobile correction | Reverse dates using keyboard, then correct; locate/Edit a specific history row at 390px while preserving its identity |
| Legal application | Preparer-approved fixtures distinguishing 330 physical days from 330 days with a foreign tax home, and multi-period filing presentation; software assertions alone cannot resolve these questions |

The existing “independent” domain test reuses some application date helpers for day enumeration; my separate Python oracle avoids that coupling and expands the year/density range. Existing tests already cover the earlier boundaries, union/disjoint behavior, leap sensitivity, persistence/import conflicts, future/proposal isolation, export denial/fallback and large PDFs. Do not inflate this review's ad hoc helper into permanent regression coverage or claim every listed gap invalidates those tests.

## 9. Prioritized recommended changes

| Priority | Change | Timing and reason |
| --- | --- | --- |
| **P1** | State that counted supporting foreign days require independently verified foreign tax home; distinguish raw union coverage from an established exclusion-limit numerator; get qualified review of the changing-tax-home example | **Before publication.** Highest potential tax-use consequence; a content/scope clarification can preserve the narrow product without adding a tax engine |
| **P1** | Remove the unrelated saved-history baseline from example preview (C02) | **Before publication.** Demonstrated incorrect comparison in a prominent first-use path; small isolated fix |
| **P1** | Put same-year completed baseline, scenario coverage and delta into the shared report (C03) | **Before publication.** Preserves the intended preparer comparison and page/export consistency |
| **P2** | Revise C01's inference/explanation; preferably calculate per-candidate upper bounds from known foreign plus unknown days | **Before publication recommended.** Avoid false claims that inconsequential missing evidence prevents a threshold conclusion; no need to alter core count arithmetic |
| **P2** | Add a short bounded-declaration example and a date/type/proposal summary before replacement imports | First usability follow-up; useful within existing workflow, no new infrastructure |
| **P2** | Improve mobile row/action association and validation focus | Follow-up; correction is currently possible and history is preserved |
| **P3** | Prevent orphan PDF endings; streamline repeated notes and add a normalized-evidence legend | Defer if necessary; legibility/content integrity already pass |
| **P3** | Real Safari/iOS/Android and screen-reader checks; accessible/tagged Unicode PDF; large-history navigation and concurrent-tab work if demanded | Explicitly scoped follow-up; current limits should remain disclosed |

Obtain a preparer-approved multiple-period filing example before making any filing-ready claim. Until then, retain the existing warning and working-report positioning. Keep leap sensitivity visible; resolving that legal convention is not a reason to silently choose one endpoint or block ordinary supported cases.

No backend, account, income calculator, flight-import integration, decorative dashboard, new application framework, or general rewrite is recommended. Source licensing must be settled before public source redistribution, as already documented; hosted publication checks remain separate from this local review.

## 10. Release recommendation

**Proceed with a narrowly scoped public release after a small corrective pass, rather than publishing this exact candidate unchanged.** The ordinary calculation engine has survived independent boundary, leap, density, union and deduplication challenges; persistent history and report provenance fulfill the central product purpose. The additional evidence distinctions are warranted and the architecture is proportionate.

Before publication, clarify the tax-home premise, fix the example comparison and export comparison gap, and correct or qualify the inconclusive-status inference. Add targeted regressions for those changes and rerun the relevant checks. These are bounded corrections, not evidence of a failed development effort or a need to restore the alpha design.

Mobile editing efficiency, first-use density, richer import preview, PDF note/pagination polish and broader device/assistive checks can follow with their present limitations disclosed. Public positioning should remain “physical-presence planning and preparer working evidence,” with no complete eligibility, established exclusion dollars, or tax-savings claim. This review does not authorize publication and does not certify an individual filing position.
