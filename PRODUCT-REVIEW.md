# FEIE Window Optimizer — Product Review

Reviewed October 12, 2026, America/Managua, with UTC browser/export timestamps extending into October 13. This is a product assessment, not an implementation roadmap. No application changes were made. The user independently updated dependencies during review; the updated production build was used for release-UI inspection. Technical inventory, exact verification commands and calculation probes: [PROJECT-STATE.md](PROJECT-STATE.md).

## Evidence and observation limits

Inspected the running development app and a newly built production preview in cached Firefox at **1440×1000 desktop** and **390×844 mobile viewport**. Exercised manual date entry, ordinary mode conversion, literal transfer, tax-year change, empty U.S. mode, development presets, clipboard copying, PDF download and some keyboard behavior. Inspected real screenshots, PDF text extraction and a rendered PDF page. Temporary artifacts are under `/tmp`; no screenshot gallery or other repository deliverables were added.

Browser observations below are direct unless labeled source-based or inferred. Mobile viewport emulation does not establish real iOS/Android browser, touch-keyboard, or screen-reader compatibility. No automated axe/WCAG suite or real assistive technology was available in the existing project. External comparison pages were accessed live through web tooling; their inspection depth is stated individually.

Key temporary observations, recorded here so the report does not depend on retaining screenshots:

| Observation | Recorded result |
|---|---|
| Development desktop | Clean two-column shell; manual date inputs approximately 3,409 px below document top; 1,512 calendar day buttons mounted |
| Development mobile empty state | Viewport 390 px; document width 518 px; results begin around y=3,616 px; sample controls contribute to overflow |
| **Production mobile empty state** | Viewport/document width both 390 px; document height 6,014 px; manual dates around y=4,957 px; results around y=5,058 px |
| **Production mobile populated result** | Viewport 390 px; document width **600 px** after qualifying literal-transfer example; whole-page horizontal overflow, screenshot shows clipped input panel |
| Valid 2025 example | Foreign Jan 1–Nov 30 produces 334 foreign days, selected Jan 1–Dec 31 period, 365 overlap days, fraction 1.000 |
| Empty U.S. mode | Immediately shows Qualified, 365 foreign days, fraction 1.000, while supporting travel table is empty |
| Tax-year change | Switching example from 2025 to 2027 blanks its entered dates |
| Mode dialog keyboard | Focus remained on underlying radio input outside dialog; Escape did not close dialog |
| Copy/PDF | Copy reported success; real `feie-window-summary-2025.pdf` downloaded and was readable |

Examples use the default 2025 tax year observed at review time. On October 15 the default changes according to UTC time, not a user-selected filing situation (`useCalculator.ts:69–86`).

## 1. Product purpose and scope

The product has a coherent core: help a person turn travel dates into candidate 12-month physical-presence periods and explain their relationship to a tax year. The static, account-free model fits a sensitive, occasional-use planning tool. Copy and PDF outputs serve a legitimate preparer handoff need. Neither accounts nor a backend are inherently necessary.

Its current claim is broader than its calculation. The heading/subtitle promise planning and validation of FEIE windows, while results say they capture “maximum FEIE benefit” (`App.tsx:60–61`; `ResultsPanel.tsx:386–388`). The engine ranks calendar overlap and has no income, tax-home, annual cap or tax-savings data (`domain/types.ts:8–35`; `domain/feie.ts:92–103`). It cannot demonstrate that financial outcome.

| Intended user | Current usefulness | Principal gap |
|---|---|---|
| American living abroad | Can evaluate a small, complete, carefully interpreted set of intervals | No durable history; missing prerequisites; year changes erase dates |
| Person investigating eligibility | Receives counts and an easy Qualified/Not qualified label | Label conflates one modeled day test with overall FEIE eligibility |
| Person planning travel | Can substitute future dates and observe counts | No proposed/completed distinction, saved baseline, actual trip recommendations or reachable planning toggle |
| Tax preparer | Receives a compact primary-window summary and travel table | Missing provenance/assumptions; supporting rows can disagree with evaluated data; no income context |

The **smallest credible product** is a dependable, explicitly scoped physical-presence window evaluator with trustworthy input interpretation, reusable travel records, understandable day counts, and an auditable preparer summary. It need not become full tax software. Multi-year history, cross-year windows and exports are core needs, not decorative expansion. A full-year visual calendar is an optional entry aid whose prominence should be judged against those needs.

Current scope expansion is mainly in the presentation and architecture: custom calendar interaction, two kinds of mode transfer, development-only historic presets, static bars called a timeline, and hooks/API for inaccessible planning insights. There is little unrelated product sprawl, but several partially connected features make the app look more capable than its actual workflow.

## 2. First-use experience

### What works

The name is consistent and prominent. A short subtitle identifies FEIE and 12-month windows. The tax-year selector states explicit January 1–December 31 bounds. Modes use ordinary radio controls, dates use native date fields, and calculations update automatically. There is no registration barrier or irrelevant onboarding. A user already familiar with FEIE can complete the basic in-range calculation without consulting the README.

### What a newcomer is likely to misunderstand

1. **Travel dates versus full qualifying days.** Foreign instructions ask for the first and final day of a stay; arrival day may be a partial foreign day. No example explains which date to enter when arriving in the morning, returning to the U.S., crossing the date line, or traveling over international waters (`RangePlanner.tsx:234–250`). IRS instructions distinguish full foreign days from interrupted travel. [IRS physical presence guidance](https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion-physical-presence-test).
2. **Unrecorded dates are treated as facts.** Foreign-mode gaps become U.S. days; U.S.-mode gaps become foreign days throughout the whole horizon. The user is never asked whether the log is complete. Switching an empty form to U.S. mode visibly produces a positive qualification result without any travel evidence (`calculator.ts:38–56`; browser verified).
3. **A positive count is not complete FEIE eligibility.** There are no questions about foreign tax home, taxpayer status, earnings or elections. A generic footer disclaimer does not explain these missing inputs beside “Qualified.” The official IRS overview has prerequisites beyond a travel count. [IRS FEIE overview](https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion).
4. **Entry horizon versus tax year.** Travel fields accept the surrounding three-year horizon, while an incomplete-row error says to select both dates “within the tax year” (`useCalculator.ts:147`). Users must infer that the selected year and travel-record scope are different concepts, despite the app destructively coupling them.
5. **“Select filing year.”** This can mean the year of filing rather than the tax year of income. The nearby explicit bounds mitigate, but do not remove, the ambiguity (`TaxYearSelector.tsx:24–35`).
6. **Planning control that does not exist.** Initial failure text instructs users to enable planning mode. No such control is rendered in `App` (`ResultsPanel.tsx:487–505`; `useCalculator.ts:358`).

Production has **no working example or sample-load control**: presets are gated by `import.meta.env.DEV` (`App.tsx:67`). This differs from development screenshots and README feature claims. The existing archive preset is not a usable example anyway: it loads long history and then displays “Interval lies outside allowed bounds.”

The blank foreign form is immediately presented as “Not qualified yet,” with 330 days needed. That reads as a determination despite no evidence having been supplied. A partially completed row instead resets Results to a generic “Enter tax year dates and travel intervals” message. The visual feedback moves between empty, failure and success without explaining confidence/completeness.

Ordinary errors are recoverable: start/end edits update immediately, reversed bounds are rejected, and overlap errors appear. However, overlap/duplicate errors are general rather than attached to the exact conflicting row pair (`useCalculator.ts:284–290`; `PeriodsEditor.tsx:72–98`). “Clear all intervals,” deletion, preset load and year-change date loss have no undo or confirmation. The source provides no unsaved-work navigation warning.

## 3. UI and visual quality

The page has a consistent light palette, restrained purple/green accents, rounded panels, readable system-font fallbacks and a clear product heading. Tables use proper summary labels and striped supporting rows. There is enough whitespace; this is not an unstyled engineering demo. These are strengths worth retaining.

It nevertheless feels like a development prototype once used, principally because the data/results hierarchy and state behavior are unfinished. Decorative polish cannot compensate for unsupported financial claims or silent loss of travel records.

| Dimension | Assessment | Evidence and distinction |
|---|---|---|
| Hierarchy | Purpose and result headings clear; entry method disproportionately dominant | Expanded year shows all 12 months before manual fields. On production mobile those fields are ~4,957 px down |
| Typography | Main body and headings readable; explanatory help is small | `app.css:218–220` uses 0.8rem; calendar weekdays 0.7rem. Smaller text is not automatically a defect, but tax assumptions deserve prominence |
| Spacing/alignment | Consistent card spacing; excessive vertical work for simple intervals | Nested panel/card/calendar spacing and default heading margins create a very long page |
| Color | Status uses text and color; weak contrast in year controls | Year heading inherits white button text on pale green/purple backgrounds; visible in production screenshot (`app.css:110,642–666`). Full contrast audit not performed |
| Visual consistency | Input/result cards look related; result area heavily nested | Summary table, travel table, explanatory card and timeline repeat the same result with different decimal formats |
| Density | Too sparse at task level despite many tiny controls | Desktop Results panel stretches beside the very tall editor, leaving large blank space below its result (`input-grid` and `.panel`) |
| Form controls | Native dates/select/radios familiar | Start/End labels are not associated with their inputs; no row identity for repeated Remove buttons |
| Date entry | Two entry methods available, useful for different preferences | Manual method buried below calendar; calendar says start/end but silently restarts selection when second date is earlier |
| Table presentation | Readable desktop summary; good row/column headings | Supporting table has a horizontal wrapper, but populated result still expands the entire mobile page |
| Mobile | Empty production state fits; populated state fails | Observed 390→600 px document width. Source uses a `1fr` grid with content-dependent minimum widths, fixed 480px travel-table minimum and no comprehensive row/panel shrinking rules |
| Focus | Native focus behavior plus explicit input focus ring | Modal lacks focus management; collapsed calendars remain tab candidates |
| Error presentation | Text inline/banner errors exist | Service errors can appear in both general banner and Results; generic no-330 narrative can accompany validation failure |
| Loading | Calculation is synchronous with no spinner, reasonable for normal engine speed | PDF button changes to Exporting; export failure is console-only |
| Success | Visible Qualified status and copy-success message | No live-region announcements; qualification language overstates what is known |
| Empty state | Technically populated with a calculation | Missing distinction between no data, incomplete evidence and insufficient presence |
| Credibility | Product name, explanatory bounds, date-stamped PDF are useful | Hard-coded Build v1.0.0 differs from package 0.1.0; public-facing precision/promises exceed validation |

Visual preferences: gradients, card radii and purple accents are stylistic choices and not release blockers. Usability defects: misplaced primary manual input, mobile horizontal overflow, low-contrast controls, inaccessible labels, misleading state and data loss have observable user consequences.

No recommendation here requires animation, a dashboard, more charts, accounts, or richer branding.

## 4. Travel-entry experience

### Suitability for several years of history

The current model is suitable for a short, disposable scenario, not maintaining a reusable travel log. It stores only page-memory date pairs, with no country, notes, supporting source, travel-day status or proposed/completed flag. Refresh loses them. Changing tax year can blank them. Older intervals are rejected by the service rather than retained separately from the relevant calculation subset (`useCalculator.ts:229–257`; `calculator.ts:31–48`).

The historic preset reveals the product need and architectural mismatch especially clearly: it contains 2016–2025 U.S. visits, broadens the displayed horizon, and is rejected by the calculation service. A user cannot enter their entire history once and reliably run multiple tax years without manually filtering/re-entering it. There is no data import or reloadable export.

### Existing interactions

| Interaction | Works / friction |
|---|---|
| Direct date fields | Fast and familiar once found; native format depends on browser/locale; missing accessible labels |
| Interval entry | Appropriate abstraction for multi-day stays; auto-added blank row helps continued entry; Add another can create redundant blanks |
| Calendar quick-add | Start then end adds an inclusive interval; single-day interval requires clicking same date twice; selecting earlier second date restarts rather than swaps |
| Cross-year selection | Draft can continue while another year is expanded; only one year expands at a time; no persistent textual draft-date summary |
| Calendar correction | No way to edit/move/delete an existing range directly; user must locate manual rows |
| Edit/delete | Manual fields and Remove buttons work for normal cases; no undo; repeated rows have weak identity |
| Clear all | Immediate irreversible loss within session; no confirmation/undo |
| Gaps/overlaps | Overlaps rejected, not combined; no visual conflict explanation; gaps silently assigned to opposite location |
| Arrival/departure days | Inclusive endpoints with no full-day instructions or transit option |
| Switching mode | Convert preserves physical interpretation in tested in-range example; “Keep same date ranges” reclassifies dates as the opposite location |
| Chronological history | Service/report data sorted; editable list stays in entry order; supporting table clips to one selected window |
| Future travel | Date controls accept future dates; treated identically to historical evidence; no baseline/alternative preservation |
| Updating history later | Absent across sessions; no persistence/import |

The mode-switch dialog asks users to choose between “Keep same date ranges” and “Convert for new mode” without explicitly stating that the first choice changes the meaning of every entered day (`App.tsx:124–134`). “Keep” sounds preservation-oriented even though the calculated travel facts change. This option does serve a real correction need—someone may have entered the right dates in the wrong mode—but that is different from switching the presentation of an existing log.

Conceptual alternatives worth evaluating later include an accessible interval-first log with the calendar as an optional aid; one underlying presence record model with selectable entry views; and distinguishing complete coverage from unknown dates. These address actual maintenance, correction and uncertainty needs. They are not designs or instructions to remove either U.S. or foreign entry mode. A person who tracks U.S. visits needs the convenience of that input mode, provided its foreign-complement assumption is explicit.

Bulk import or durable local records could reduce re-entry for multi-year users. Account-based sync is not an established need in this audit. Data portability should not be confused with a PDF that cannot restore the records.

## 5. Results and interpretability

The tested result makes several useful facts easy to locate: year, selected period, total modeled foreign days, overlap days and a compact travel breakdown. Its note accurately identifies the software's selection objective as maximizing overlap while reaching 330 modeled foreign days (`ResultsPanel.tsx:108`). The primary summary is more useful than showing only a Boolean result.

However, a user still cannot independently answer several essential questions:

| User question | Current answer quality |
|---|---|
| Do I qualify? | “Qualified” means an enumerated window reaches 330 marked foreign days. It does not establish overall FEIE eligibility |
| Why did I fail? | Gives deficit from the best foreign-day count, but no best failing period, excluded dates, missing-data confidence or qualifying-day explanation |
| Which period was selected? | Dates clearly displayed; first/earliest maximum-overlap tie chosen |
| Why that period? | Overlap objective explained, but tie-breaking and discarded lower-overlap candidates not explained |
| How many days qualify? | Reports foreign days across the whole window and overlap across the year; does not distinguish full-day evidence from assumed presence |
| How does the period intersect the tax year? | Overlap count exists; no year-clipped interval or explicit intersection formula shown |
| How is proration calculated? | Bare fraction in summary; timeline percentage. No numerator/denominator equation or supported assumptions next to it |
| Are alternatives available? | Lists only best ties; cannot select one to update summary/exports; lower-overlap passing periods absent |
| What does a future trip change? | User must overwrite current scenario and mentally compare results |
| What limits confidence? | No gap, inferred-date, future-travel, tax-home or income status shown |

The 2025 example has 334 foreign days inside a 365-day selected window and displays 1.000 proration. Those numbers are **not inherently contradictory**: presence-test days and exclusion-limit days are different concepts. The problem is that the app never explains the relationship or establishes the additional conditions. The detailed regulation permits a qualifying physical-presence period to contain nonforeign days. [26 CFR §1.911-3(d)(3)](https://www.ecfr.gov/current/title-26/section-1.911-3).

It would also be wrong to treat every period day as eligible foreign earnings. Work-location and eligibility conditions govern foreign earned income. The interface has none of that information. [IRS foreign earned income definition](https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion-what-is-foreign-earned-income).

Five quantities need separate names and explanations: full days counted for the presence test; all days in the 12-month period; relevant days in the selected tax year; days for exclusion-limit proration; and actual eligible income. The UI explicitly presents only the first as modeled, the window dates, and calendar overlap; it assumes the fourth and never calculates the fifth (`domain/types.ts:17–23`; `domain/feie.ts:98–103`).

“Stay abroad from [window start] through [window end]” is especially misleading for a retrospective result or one intentionally containing U.S. days (`ResultsPanel.tsx:387`). It frames a mathematical containing period as continuous recommended travel. “Every possible 12-month combination” is also unsupported by the demonstrated missed earliest candidate and zero-overlap qualification described in Project State §3.

The “timeline” is a static list of two percentages drawn from the same left origin. It has no common date axis, no U.S. travel marks, no tax-year shading and no legend. The overlap layer can cover the foreign layer. Users can read the text, but cannot use the bars to see when U.S. stays caused a failure or compare window placement (`Timeline.tsx:18–39`; `app.css:445–464`). This is a representational limitation, not an argument for an elaborate chart.

Planning insights are a raw foreign-day deficit and optional list of maximally foreign start dates, not an actionable prospective trip plan. When no window passes, useful working documentation cannot be exported because exports require a primary passing window (`ResultsPanel.tsx:54–56,399`). A preparer may need unsuccessful/incomplete cases too.

## 6. Output quality

### Clipboard

The actual browser action returned “Summary copied to clipboard.” Source inspection confirms plain text with the fields below. Independent system clipboard read-back was not performed; permission-denied/unsupported browser behavior was not exercised.

Formatting is usable for email or notes: each travel interval is a simple pipe-delimited line, with a short selection note and footer. However, the date arrow and missing duration unit in individual clipboard row values rely on context. The engine rounds to four decimal places, then copy text rounds to three; the counts themselves are the more reliable arithmetic evidence.

### PDF

A real 2025 PDF was downloaded, extracted with `pdftotext`, rendered with `pdftoppm`, and visually inspected. The one-page report is readable and restrained: prominent FEIE Window Summary title, year, labeled summary block, striped travel table and notes. It is generated as text/vector content rather than a screenshot of the entire webpage. The title is generic; the full product name appears in a small footer.

The footer is tiny and dense, wrapping product URL, developer credit, disclaimer, UTC generation date and hard-coded build into multiple lines. It is secondary attribution, but uses “Developed by Cameron Guthrie” rather than the preferred “by Cameron Guthrie.” Product name should remain primary; this wording/weight difference is a refinement, not a release blocker (`constants/meta.ts:1–7`; `AppFooter.tsx:11–25`).

### Preparer-documentation checklist

| Information | Clipboard | PDF | Assessment |
|---|---|---|---|
| Tax year | Yes | Yes | Clear |
| Selected qualifying period | Yes | Yes | Start/end dates, earliest selected tie only |
| Foreign-day count in window | Yes | Yes | No evidence that supplied days were full eligible days |
| Tax-year overlap count | Yes | Yes | Not separately identified as statutory eligible-day count |
| Proration fraction | Yes, three decimals | Yes, three decimals | No equation or denominator shown |
| Annual exclusion limit/dollar calculation | No | No | Current product does not calculate it |
| Supporting travel intervals | Window-clipped U.S./foreign rows | Same | Appropriate clipping in ordinary case; inferred versus entered rows indistinguishable; omissions after literal transfer |
| Whole original history | No | No | Cannot reconstruct input or repeat later years |
| Input mode / coverage completeness | No | No | Critical provenance missing |
| Full-day/transit/tax-home assumptions | No | No | Generic disclaimer only |
| Actual foreign income/work-location context | No | No | Cannot verify actual exclusion |
| Generation date | Yes, UTC date | Yes, UTC date | Actual PDF says 2026-10-13 during local Oct 12 session |
| Reproducible version | Hard-coded build | Hard-coded build | Not tied to package/revision |
| Product attribution | Product name + URL, developer | Small final-page footer | More concise secondary author wording would better match preference |
| Alternative periods | No | No | Only primary window exported |
| Failure/incomplete-case export | No | No | Export controls absent without passing primary window |

There is a **demonstrated content defect shared by both exports**. After literal foreign→U.S.→foreign transfer, the 2025 example still shows 334 foreign/365 overlap days but the supporting table drops the December 1–31 U.S. complement. The service evaluates a complement independently; report data comes from two UI lists, one of which literal transfer cleared (`useCalculator.ts:332–349`; `ResultsPanel.tsx:59–110`). This undermines the preparer's ability to reconcile the report.

PDF source includes table page breaks and repeated table headers (`ResultsPanel.tsx:238–323`). Multipage layout was not exercised; only the final page gets the attribution footer, and page numbering/full-report header repetition are not implemented. No explicit PDF tagging/accessibility structure is specified. Export failure logs to the console without a user-facing error (`ResultsPanel.tsx:366–369`). Native browser print has no dedicated print stylesheet; actual print output was not tested.

The outputs are a promising **working summary**, but are not yet sufficient independently reviewable tax-preparation documentation. The gap is provenance and calculation meaning, not visual decoration or an IRS-form replica.

## 7. Accessibility and device support

| Area | Evidence-based assessment |
|---|---|
| Desktop Firefox | Basic input/result/export flows work; persistent development React warnings; long calendar makes direct entry cumbersome |
| Mobile viewport | Production empty form fits at 390px; qualified result expands document to 600px. Results are below roughly five thousand pixels of input UI |
| Touch | Day buttons support click/tap; hover preview adds information unavailable on touch, but is not required to commit. Real touch devices untested |
| Target size | CSS day height 32px; observed widths roughly 22px in development and 28px in populated production; cramped for dense multi-year selection. Exact WCAG target-size conformance not established |
| Keyboard-only | Native inputs/buttons can receive focus; no calendar arrow-key navigation or roving tabindex. 1,512 day buttons mounted in default three-year coverage |
| Collapsed calendars | CSS clips at 90px instead of hiding/unmounting; buttons remain in accessibility snapshot and can receive programmatic focus with tabindex 0. Offscreen keyboard navigation risk follows from source; a full tab-through was not performed |
| Date labels | Both native date controls report `labels.length === 0`; Start/End labels lack `htmlFor`/wrapping input (`PeriodsEditor.tsx:76–92`) |
| Calendar accessible names | Buttons expose day-of-month alone, e.g. “1”; no full date, selected-state announcement or semantic date-grid navigation (`RangePlanner.tsx:289–309`) |
| Mode group | Wrapped radio labels are good; heading is not a fieldset legend or named radiogroup |
| Modal | Dialog has role, modal flag and title; focus stays outside it; Escape does not close; no focus trap/restore or background inertness (`App.tsx:121–140`) |
| Result/validation announcements | No aria-live/status/alert semantics for recalculations, copy feedback or inline errors; no aria-invalid/describedby links |
| Color/contrast | Body/result text looks readable; pale year controls with inherited white text visibly weak; muted dates and tiny footer need measured audit |
| Focus styles | Native button outlines remain; dates/select receive replacement focus rings; no demonstrated blanket removal of all focus indicators |
| Reduced motion | Calendar collapse/day transitions lack a reduced-motion alternative (`app.css:568,680`) |
| Zoom/dark mode | No user-scalable=no restriction. Root advertises light/dark while much CSS fixes light colors; real dark-mode/zoom combinations untested |
| Screen readers | Strong barriers inferred from actual labels/calendar/modal semantics; no real screen reader run, so no conformance claim |
| PDF/print | Readable visual PDF inspected; PDF reading order/tagging and browser print layout not verified |

A few DOM measurements and keyboard checks are useful evidence, not a substitute for a full accessibility audit. The source review also consulted the current [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md); findings above are prioritized by task impact rather than treating every stylistic guideline as a release requirement.

## 8. Contemporary product comparison

Four relevant currently accessible references were examined on the review date. These are interaction/content reference points, not tax-law authorities or endorsements. External page content was inspected through live web retrieval, **not** a full browser workflow or a comparative screenshot study. No claimed external export or dynamic behavior was independently executed.

| Reference and inspection scope | Relevant pattern | Comparison and suitability | Complexity to avoid |
|---|---|---|---|
| [Omni Calculator: Date Calculator](https://www.omnicalculator.com/everyday-life/date) — actual page exposes start/end inputs, resulting difference, share action and usage explanation | Direct date entry as primary task; contextual explanation adjacent to a compact calculator | FEIE buries its manual inputs beneath a full year of calendar months. Compact interval entry with clear counting conventions suits the job; share control's existence is observed, not its behavior | Do not import unrelated date calculators, broad content navigation or promotional features |
| [Calculator.net: Income Tax Calculator](https://www.calculator.net/tax-calculator.html) — form and explanatory content retrieved | Clearly identifies tax year, groups inputs, and includes contextual references such as relevant W-2 boxes | FEIE has a useful tax-year selector but little guidance about where to obtain travel facts or what a count means. Explicit scope and input context suit it | Its extensive income/deduction form would overwhelm a narrowly scoped presence-window tool; no need to copy full tax preparation |
| [IRS Interactive Tax Assistant: foreign-income exclusion](https://www.irs.gov/help/ita/can-i-exclude-income-earned-in-a-foreign-country) — landing page inspected; interview not completed | Declares target users, required information, estimated time and session limitations before beginning | FEIE's assumptions are implicit. A short scope/completeness explanation would fit, without turning it into an eligibility interview | IRS landing page's linked interview is a different product; do not claim its interaction/accessibility was inspected or require a ten-minute wizard |
| [Bankrate: Mortgage Calculator](https://www.bankrate.com/mortgages/mortgage-calculator/) — surrounding live instructions and formula/results explanations retrieved; dynamic calculator remained “Loading calculator” in retrieved content | Explains assumptions, calculation terms and how to interpret results | FEIE provides a fraction but no clear equation/limits. A concise explanation of the actual overlap objective would improve trust | Dynamic scenario/amortization behavior is described by the site, not independently observed. Lending-marketplace features and comprehensive financial projections would add irrelevant complexity |

Timeanddate's duration calculator returned HTTP 403 and Travelmath's date page could not be retrieved; neither is used for comparative claims. The comparisons above concern observed controls/content or explicitly identified site descriptions, not invented visual superiority. FEIE can remain simpler than all of them while becoming more transparent and dependable.

## 9. Product completeness and release readiness

| Category | Rating | Evidence |
|---|---|---|
| Calculation correctness | **Needs substantial work** | Valid earliest candidate skipped; zero-overlap window can qualify; full-day/completeness/tax prerequisites not established; no specialist-approved fixtures |
| Functional completeness | **Needs substantial work** | Basic calculation and successful exports work; planning toggle inaccessible; alternatives not selectable; no durable returning-user workflow |
| Data reliability | **Needs substantial work** | Refresh loses records; year switching blanks dates; archive rejected; literal transfers create incomplete supporting tables |
| Usability | **Needs substantial work** | Direct entry buried; mode reinterpretation ambiguous; missing/blank evidence treated as a result; mobile filled state overflows |
| Results clarity | **Needs substantial work** | Useful counts/dates, but conflated qualification claim, unsupported maximum-benefit claim and bare rounded fraction |
| Sharing and export | **Needs substantial work** | Real readable PDF/copy path; provenance missing and report rows can be incomplete; failure cases not exportable |
| Visual quality | **Needs minor work** | Cohesive desktop styling and readable PDF; spacing/contrast/repetition need refinement. Functional mobile overflow is rated under usability/device support, not excused as cosmetic |
| Accessibility | **Needs substantial work** | Missing date labels, ambiguous calendar names, huge tab sequence, modal focus/Escape defects, no live feedback |
| Maintainability | **Needs substantial work** | Small useful domain boundary, but synchronized travel models, coverage policies, mixed reporting responsibilities, hook-order violation and failing tests |
| Deployment readiness | **Needs substantial work** | Updated build passes and audit reports zero vulnerabilities; test suite fails; Vite/plugin peer mismatch; actual host/HTTPS/security-header behavior **not verified** |

The privacy-preserving account-free architecture is appropriate. Public release is blocked by dependable interpretation/calculation/data handling and accessible primary workflows, not by the absence of infrastructure, fancy visualizations or a user-account system.

## 10. Simplification opportunities

These are reassessment opportunities, not a delivery sequence or implementation plan.

| Source of complexity | What is necessary | What deserves reassessment | User need that must be preserved |
|---|---|---|---|
| Inherent FEIE rules | Rolling months, full days, cross-year relationships and distinct eligibility/income quantities | Promotional one-word qualification hides complexity rather than resolving it | Accurate physical-presence planning with clearly bounded claims |
| Reliable computation | Date normalization, precise intervals, validation, exhaustive relevant candidates, deterministic results | Divergent UI/service/engine coverage and partial-year API assumptions | Correctness and predictable validation |
| Interaction model | Efficient interval entry, correction, both U.S. and foreign input conveniences | Full-year calendar ahead of direct fields; clipped collapsed content; two transfer meanings presented as similar choices | Fast entry and correcting a wrongly chosen input mode |
| Historical architecture | Separation of domain, service and presentation is useful | Dual mutable row lists, canonical-mode markers, coverage overrides and duplicated reporting complements | Preserve actual history while changing the calculation view |
| Output model | Auditable summary, supporting intervals, generation context and portable working documentation | Summary/table/timeline repetition; custom PDF layout combined with UI state; rounded fractions as stand-alone facts | A preparer can reconcile and independently review what was evaluated |
| Initial release scope | Reliable window evaluation and explicit conditional interpretation | Monetary “maximum benefit” language without a monetary model; general-purpose library/SSR claims without distribution | A credible narrow tool, not an implied full tax service |
| Planning | Future what-if dates and intelligible deficit information | Unreachable mode; long raw optimal-start lists; hypothetical dates treated as completed evidence | A traveler can distinguish a proposed scenario from a proven travel record |
| History retention | Reuse across years without loss; reasonable data portability | Adding accounts/cloud storage is not justified solely to solve current state loss | Repeat use while preserving the simple private browser-based service |

Fewer features are not automatically better. U.S. entry, future planning, cross-year analysis and preparer export each have a real audience need. The opportunity is to make their meanings and data relationships coherent, not remove them to make an attractive demo easier.

## 11. Ranked findings register

Severity reflects user consequence, not implementation effort. Confidence describes the specific finding; it does not certify tax-law compliance. “Further investigation” identifies unresolved facts, not permission to implement changes.

### Release blockers

| Rank / ID | Category | Description and evidence | Severity | User consequence | Confidence | Relevant files/components | Further investigation |
|---|---|---|---|---|---|---|---|
| 1 / R01 | Tax scope and correctness | Qualified/maximum-benefit claims exceed a binary presence/overlap model; no tax-home/income/election inputs. Source and positive example verified | **Critical** | User may treat a conditional count as eligibility or maximum actual exclusion | High for scope mismatch; tax application requires expert | `types.ts:8`; `feie.ts:92`; `ResultsPanel.tsx:49,386` | Yes: specialist approval of claims, prerequisites and proration |
| 2 / R02 | Input completeness | Empty U.S. form immediately reports full-year qualification; all omitted dates become foreign; no completeness acknowledgment. Browser and engine verified | **Critical** | Missing records can look like positive evidence and materially inflate qualification | High | `calculator.ts:38–56`; `useCalculator.ts:269`; `ResultsPanel` | Yes: intended completeness/full-day contract |
| 3 / R03 | Calculation boundary | 330 foreign days on 2023 Jan 2–Nov 27 fail for 2024 because Jan 2 start is omitted. Independent engine probe | **High** | False negative for a qualifying period intersecting tax year | High | `feie.ts:14–16,29` | Specialist fixture confirmation; software defect reproduced |
| 4 / R04 | Calculation boundary | 2025 Feb 5–Dec 31 returns Qualified for tax year 2024 with zero overlap. Independent engine probe | **High** | Positive selected-year result with no relevant qualifying window | High | `feie.ts:79–103` | No reproduction gap; intended API/result semantics should be confirmed |
| 5 / R05 | Data integrity | Changing 2025 to 2027 blanks entered 2025 endpoints. No undo/notice. Browser verified | **High** | Travel history irrecoverably lost in the current session | High | `useCalculator.ts:229–257,321` | Retention/horizon contract; behavior already reproduced |
| 6 / R06 | Output integrity | Literal foreign→U.S.→foreign leaves supporting table missing U.S. complement while counts still use it. Browser verified | **High** | Preparer receives incomplete evidence for the calculation; copy/PDF share same data path | High | `useCalculator.ts:332–349`; `ResultsPanel.tsx:59–110` | Broader transfer/output cases; one exact failure established |
| 7 / R07 | Travel-day interpretation | Foreign stay endpoints counted as full days; no transit/unknown/location type; first/final-stay instruction incomplete | **High** | Near-threshold traveler may count ineligible arrival/transit days | High for missing model/guidance; itinerary effect case-dependent | `RangePlanner.tsx:234`; `occupancy.ts:23–38`; `types.ts:3` | Yes: full-day and location rules/examples |
| 8 / R08 | Data reliability | No persistence or reloadable history export; refresh resets travel records | **High** | Returning users must duplicate entry; accidental navigation loses work | High | `useCalculator.ts:169–180`; `AppFooter.tsx:31` | Product retention/privacy contract |
| 9 / R09 | Accessibility | Date inputs have zero associated labels; calendar exposes repeated numbers; modal leaves focus outside and ignores Escape | **High** | Keyboard/screen-reader users cannot reliably complete/understand primary tasks | High for inspected defects | `PeriodsEditor.tsx:76`; `RangePlanner.tsx:289`; `App.tsx:121` | Full keyboard/screen-reader audit still required |
| 10 / R10 | Device support | Production qualified result creates 600px document at 390px viewport; real screenshot/DOM measurement | **High** | Mobile users see clipped fields and must pan horizontally | High | `app.css:38,198,279–317,714`; `ResultsPanel` | Additional devices, zoom and result shapes |
| 11 / R11 | Runtime correctness | ResultsPanel invokes hooks only after a nullable early return; React static-flag warnings in tests/dev browser | **High** | Unstable rendering risk at ordinary incomplete/complete transitions; crash not demonstrated | High for violation/warnings | `ResultsPanel.tsx:39–54,112–123` | Other transitions/versions and production failure impact |
| 12 / R12 | Verification/toolchain | Updated suite: 12 pass/5 fail; plugin peer excludes Vite 8; npm reports invalid tree despite successful build | **High** | No dependable release validation baseline; security update compatibility incomplete | High | `package.json:21–26`; test files; `vite.config.ts` | Yes: frozen fixtures, timeout isolation, compatible clean-install behavior |

### Important but nonblocking deficiencies

These remain significant within an otherwise corrected narrow release; they do not outrank the blockers above.

| Rank / ID | Category | Description and evidence | Severity | User consequence | Confidence | Relevant files/components | Further investigation |
|---|---|---|---|---|---|---|---|
| 13 / R13 | Results explanation | Fraction has no equation; presence, overlap and income concepts insufficiently separated; “stay abroad” implies continuous travel | **High** | User cannot reconcile counts or safely interpret recommendation | High | `ResultsPanel.tsx:95,386–388,419`; `Timeline.tsx:38` | Tax reviewer/content validation |
| 14 / R14 | Entry usability | Production manual date entry ~4,957px down; 1,512 day buttons rendered in default horizon | **Medium** | Slow entry, poor keyboard navigation and high scrolling cost for simple trips | High | `PeriodsEditor.tsx:47–71`; `RangePlanner.tsx:253`; `app.css:689` | Representative user/device interaction study |
| 15 / R15 | Mode semantics | “Keep same date ranges” reclassifies location; choices do not explain difference clearly | **Medium** | User may unintentionally change history while trying to change input view | Medium for comprehension; behavior verified | `App.tsx:124–134`; `useCalculator.ts:332` | Usability test of wording/intent |
| 16 / R16 | Functional coherence | User instructed to enable planning mode, but no toggle is rendered | **Medium** | Dead-end guidance when qualification fails | High | `useCalculator.ts:358`; `ResultsPanel.tsx:487–505`; `App` | Intended public planning scope |
| 17 / R17 | Archive integration | Development archive expands form horizon but service rejects historic rows; browser error verified | **Medium** | Intended multi-year demonstration fails and obscures unsupported history workflow | High | `datasets.ts:30`; `useCalculator.ts:412`; `calculator.ts:31` | How historic records should be filtered for evaluation |
| 18 / R18 | Export completeness | No assumptions/input provenance, equation, alternative selection, unsuccessful-case export or raw-data recovery | **Medium** | Preparer must ask for missing context and independently reconstruct inputs | High | `ResultsPanel.tsx:123–170,399`; report checklist | Preparer review of minimum working-document requirements |
| 19 / R19 | Alternatives/planning | Only tied best windows shown; no selectable summary or saved before/after scenarios | **Medium** | Comparing a prospective trip or alternative period requires manual bookkeeping | High | `feie.ts:92–108`; `Timeline`; `ResultsPanel.tsx:51` | Verify actual scenario-comparison demand |

### Refinements

| Rank / ID | Category | Description and evidence | Severity | User consequence | Confidence | Relevant files/components | Further investigation |
|---|---|---|---|---|---|---|---|
| 20 / R20 | Accessibility/polish | Pale year controls inherit white text; clipped collapsed content, no reduced-motion handling/live updates | **Medium** | Weak readability and navigation feedback; avoidable assistive barriers | High for source/visual observations | `app.css:110,642–704`; `RangePlanner`; `ResultsPanel` | Measured contrast and full assistive-tech checks |
| 21 / R21 | Export robustness | PDF errors console-only; only one-page output tested; footer only final page | **Medium** | Download failure appears silent; large-report quality unknown | High for source; multipage impact unverified | `ResultsPanel.tsx:238–369` | Multipage/denied-download/clipboard-failure checks |
| 22 / R22 | Credibility/documentation | Package 0.1.0 vs Build v1.0.0; README overstates year range, public presets and package distribution | **Low** | Support and reproduced-report version unclear; expectations misleading | High | `version.ts:1`; `package.json:3`; `README.md:13–40` | Intended version/license/release policy |
| 23 / R23 | Presentation | Static bars obscure overlapping metrics; repetitive result cards; dense secondary attribution | **Low** | More visual weight than explanatory value | Medium | `Timeline.tsx:18–39`; `app.css:250,445`; `meta.ts:5` | User preference; no correctness investigation needed |

### Speculative opportunities requiring validation

| Rank / ID | Category | Description and evidence | Severity | User consequence | Confidence | Relevant files/components | Further investigation |
|---|---|---|---|---|---|---|---|
| 24 / R24 | Tax-model scope | Single-best-window objective may be insufficient where multiple qualifying periods/income timing matter; partial-year API denominator and leap-day starts need domain review | **High** | Potentially suboptimal/misleading exclusions beyond the simple calendar-year case; applicability unverified | Medium; not asserted as a proven public-UI tax defect | `feie.ts:38,92–103`; `calculator.ts:12`; `docs/architecture.md:6` | **Yes:** specialist examples and intended supported scope |
| 25 / R25 | Product/architecture | An interval-first reusable log and one normalized reporting source may reduce current synchronization/calendar burden | **Low** as an opportunity | Could reduce re-entry and divergent outputs; value must be validated | Medium | `useCalculator`; `PeriodsEditor`; `ResultsPanel` | User workflow validation; not a recommendation for wholesale rewrite |

The release decision should turn first on whether the application can make a correct, bounded claim from complete travel evidence, preserve that evidence, and explain/export the result coherently. The working basic flow, static architecture, cohesive desktop styling and readable one-page PDF provide a useful foundation; they do not establish public readiness.
