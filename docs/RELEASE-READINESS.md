# Release readiness

Primary candidate: **0.2.0-rc.3**, calculation/assessment **physical-presence-2.2**. Branch: `refactor/project-update`. **Locally verified and ready for final user acceptance of the production report redesign.** Final-refinement foundation `f4e8d9d`, approved prototype `3ecac30`, implementation `6a126fb` and comparison refinement `be90c92` are recoverable local checkpoints. No push, deployment or publication is authorized.

## rc.3 production report redesign — verification complete

The default PDF and clipboard now use the approved concise workpaper presentation: Physical Presence Test, tax year, precise coverage/foreign-day labels, exact fraction and decimal, necessary supporting periods and nonduplicated contributions, relevant original travel dates/clipped counts, concise explanation, actual declarations and case limitations. Two or three case-relevant primary references remain in the standard report. The optional **Include detailed supporting records** PDF appendix is off by default and shares the exact history, year, cutoff and scenario, including matched completed support. JSON backup remains separate.

| Gate | Final rc.3 evidence |
| --- | --- |
| Unit/integration, TypeScript, production build | `npm run check`: **106/106 tests in 11 files**, TypeScript and build pass. Dependency tree and whitespace checks pass; no runtime dependencies added. |
| Complete production browser suite | **59 passed / six expected skips**, 65 cases in one uninterrupted two-worker invocation against an exact isolated source/build copy; zero failures, retries or flaky cases. Chromium desktop/mobile/tablet and Firefox desktop/mobile. Four skips avoid repeating native fixture collection outside Chromium desktop; two are Firefox native-clipboard permission cases. |
| Approved 2025 evidence | Actual standard PDF is **one A4 page**: 330 assumed foreign + 35 U.S. = 365 period days, 351/365 = 0.961644 (96.16%). Original December 13, 2025–January 13, 2026 trip remains intact, contributing only five days to the selected period. Unrelated records are absent; relevant source IDs/evidence appear only in the matching appendix. |
| Ongoing / comparison / assessment evidence | Ongoing declaration remains open and computes its actual additional periods/365-day coverage. Full year, multiple periods, incomplete evidence, conclusive failure, positive/negative comparisons and a fully overridden completed declaration all reconcile against the unchanged engine. Proposed foreign date ranges are explicit; baseline-only assumptions remain identified. |
| Document rendering | **25 native PDFs / 64 rendered A4 pages** across all five configurations, text extracts, individual page rasters and compact contact sheets are in the review package. All actual text bounds, collisions, page footers and principal PDF/clipboard content are checked. Multiple-period/scenario standards use two readable pages; long notes produce a five-page standard and ten-page combined report. Primary link annotations and embedded Unicode mappings were inspected. |
| Export UI / privacy | Actual desktop and mobile appendix controls, default-off behavior, PDF download, native Chromium clipboard and unchanged history verified. Initial interaction does not load PDF code/fonts. Prior release evidence and the approved prototype are preserved. No account, backend or external travel-data submission. |
| Deterministic fonts | Licensed bundled Noto Sans derivatives retain 2,840 original cmap characters; no runtime system path or remote fonts. Font modules total about **296 KB gzip**, PDF renderer about **3.2 KB gzip**, all lazy. Ordinary downloaded PDF is about 33 KB. License ships in the static build. |

Actual review: [review manifest and all samples](../output/playwright/report-redesign/REVIEW.md), [primary PDF](../output/playwright/report-redesign/chromium-desktop/standard-2025.pdf), [PDF contact sheet](../output/playwright/report-redesign/pdf-contact-sheet.png), [desktop/mobile controls](../output/playwright/report-redesign/export-controls-contact-sheet.png), [browser results](../output/playwright/report-redesign/browser-results.json), [PDF inspection](../output/playwright/report-redesign/pdf-inspection.json). Artifacts are synthetic, local and ignored; committed browser fixtures and `scripts/inspect-preparer-pdfs.py` reproduce them. Final suite copy: `/tmp/feie-report-rc3-final-c62hti84`.

An interim run was stopped after a legacy test requested the removed log counter; it is not final acceptance evidence. The corrected test verifies actual period dates/cards. Final checks run on the subsequent source include the baseline-assumption regression and unbroken-description/long-identifier PDF test. See PROGRESS.md for execution details.

**Remaining limits:** PDFs are untagged and assistive reading order is not certified. Latin/Greek/Cyrillic render directly; CJK/emoji/other unsupported glyphs retain explicit code points in PDF, while clipboard/JSON preserve original Unicode. Viewport emulation is not native phone/Safari certification. Remote CI, hosting and qualified tax-home/multi-period/leap interpretation review remain outside this local acceptance. These are documented scope limits, not claims of full FEIE eligibility or actual exclusion amounts. No known blocker remains in the verified software scope. No push, publication or deployment.

## Approved visual prototype — preserved reference

The final rc.2 refinements are preserved in local commit `f4e8d9d`. The proposed replacement presentation is now available under [output/report-prototype](../output/report-prototype/DESIGN-NOTES.md): one-page standard 2025 report, plain text, secondary scenarios and optional technical appendix. All seven A4 pages were rendered and visually inspected; independent calendar/PDF checks reconcile the approved 330 + 35 = 365 and 351/365 = 0.961644 (96.16%). `npm run check` passes 101 tests, TypeScript and build. Three scoped existing Chromium desktop workflows pass (one navigation-only retry); details are recorded in PROGRESS.md.

**This preserved visual prototype was approved for the production redesign above; it is historical design evidence.** At that prototype checkpoint, production PDF/clipboard code and calculation version `physical-presence-2.2` were unchanged; the approved production integration is verified above. No push, publication or deployment. Tax-home, eligibility and multi-period filing review remain outside this visual approval.

## Preserved rc.2 final refinement status (historical)

The changes are confined to a device-local completed-day default and explicit manual/export boundary, PDF hierarchy and whitespace, saved-year/example distinction, and this status document. Ordinary arithmetic and the accepted ongoing-presence/history/scenario foundation are retained. Reports may use a second page for readability, with all evidence, source identifiers, caveats and references retained. All final gates and actual production visual checks below are complete.

| Final gate | Evidence |
| --- | --- |
| Unit/integration, TypeScript, build | `npm run check`: **101/101 tests in 11 files**, full TypeScript and production build pass. No dependencies added. `npm ls --depth=0` and whitespace checks pass. |
| Complete production browser coverage | **53 passed / two expected Firefox native-clipboard skips** across 55 cases and five projects, verified in groups against the identical final source/build. Chromium desktop: 11 passes; Chromium mobile/tablet: 22 passes; Firefox desktop/mobile: 20 passes and two skips. Includes all five local-midnight/adjustment/example regressions and accepted corrective workflows. |
| Completed-day boundary | At 2026-11-27T01:30Z in Managua, 329 foreign days are completed and Nov 26 remains projected. At local midnight, 330 are recorded completed with zero projected foreign days. The containing future-ending period keeps its accepted projected assessment. Seven timezone/calendar fixtures cover positive offsets, New Year, leap day and daylight-saving transitions; manual validation and both exports are tested. |
| Actual visual inspection | Inspected finished desktop/mobile first use, visible cutoff, isolated demonstration/saved settings, ongoing status, history actions and confirmed ending. Both date inputs remain in the first mobile viewport; first input top remains below 650px. Ten selected original screenshots include before references. |
| Native PDF inspection | Ordinary, scenario and two-support reports are each **two readable A4 pages**. Inspected all six page rasters; extracted exact counts/support dates/cutoff, retained source ids, and all five live reference destinations. Supporting evidence and provenance share page two. The large fixture remains ten pages, with first/last records and all footers retained; final raster inspected. |

Execution details: the initial final-suite runner received SIGTERM after all 11 desktop cases passed; its remaining configurations were run in smaller groups. Two existing cases timed out during concurrent recording/action work (Chromium mobile C01 import; Firefox desktop C03 scenario checkbox). Both passed unchanged on isolated `--last-failed --workers=1` reruns, in 4.6 and 13.5 seconds. These are complete unique-case results after retries, not a claim of one uninterrupted green command. Prefer one worker for capture-heavy local verification. Full-App StrictMode integration tests now have a scoped 15-second allowance matching the existing lifecycle test; assertions remain intact.

Local final evidence: [compact gallery](../output/playwright/refinement-review/index.html), [review manifest](../output/playwright/refinement-review/REVIEW-MANIFEST.md), [PDF reconciliation](../output/playwright/refinement-review/pdf-inspection.json). Synthetic artifacts remain ignored and outside commits; accepted before references are unchanged.

**Historical rc.2 recommendation:** retained as a locally verified private candidate; the rc.3 status above supersedes this report presentation. No known unresolved software blocker remains in the tested scope. Specialist tax application/filing review below remains necessary before filing reliance or publication. Native-device/Safari/assistive testing, tagged Unicode PDF, remote CI and hosted configuration remain unverified scope limits; historical detail is retained in the appendix. No push, publication or deployment occurred.

## Specialist tax review

Before filing reliance or publication, a qualified preparer should review:

- Whether the user's foreign tax home applies throughout the 330 supporting presence days; the changing-tax-home example illustrates why physical days alone do not establish the joint requirement. No tax-home timeline is calculated.
- How to present multiple valid supporting periods with Form 2555 line 16's single range and any attachment/election treatment. The software's union arithmetic and source ranges are independently testable.
- The February 29 endpoint convention when the explicit sensitivity changes the conclusion, and any case-specific transit or relief provisions outside the ordinary date-only model.

These are application-of-tax-law and filing questions, separate from software verification. Current research scope remains the 2025 instructions and cited published guidance. The product makes no full eligibility or tax-savings claim.

## Preserved rc.2 foundation — before final refinements

Candidate **0.2.0-rc.2**, calculation/assessment **physical-presence-2.1**: **locally verified for the scoped private planning and preparer-evidence workflow**. Ordinary window enumeration, day counting and union arithmetic are unchanged. No push, deployment or publication occurred. The historical rc.1 readiness claims below do not replace this audit.

| Requirement | Corrective evidence |
| --- | --- |
| C01 / empty results | Permanent one-unknown-date and 329-day upper-bound fixtures; unresolved elapsed dates can establish a conclusive ordinary failure below 330. Empty/proposal-only completed views prompt for evidence without arbitrary candidate/deficit. Known evidence displays the strongest supported period and a separately maximized possible bound. |
| C02 | Saved 2024 history never becomes the 2025 example baseline; production tests verify no comparison in the example. |
| C03 | Shared same-history/year/as-of report fields carry completed/scenario numerators, denominator and signed delta. Positive and negative changes tested; mismatched baselines rejected. Page, native clipboard and actual scenario PDF agree. |
| C04 / report hierarchy | Summary, periods and case assumptions precede source/normalized details, provenance and linked references. Actual ordinary, projected and two-support PDFs are each one A4 page. All source ids and normalized evidence remain. Large reports retain pagination/context without a reference-only final page. |
| Foreign baseline | Direct U.S.-entry setup with first full day, ongoing/specified end and acknowledgment; immediate return to U.S. visits. One validated version-1 record extension, no additional store. Summary/edit/confirmed end tested with three visits and retained declaration id/history. Ended declaration remains editable. |
| Mobile UX | First date input is within the first 844px viewport (asserted top <650px). Stacked records keep dates, type/status, actual notes and actions together. In-place visit correction, validation focus and recognizable import/cancel/replacement tested. |
| Tax-home wording | Explicit premise for the 330 supporting days beside results and in reports; shared changing-tax-home example. Raw coverage is not an established exclusion-limit numerator. No automatic tax-home clipping or eligibility engine. |
| Production visual review | Actual rc.2 desktop/mobile originals, viewport details, native workflow recordings and downloaded PDF rasters inspected; original independent screenshots remain unchanged before references. This is additional evidence beyond code review and axe. |

Final gates: `npm run check` **90/90 tests in 10 files**, TypeScript and production build pass. `npm run test:e2e -- --workers=1` **48 passed / 2 expected Firefox native-clipboard skips** across 50 cases and five projects. `npm ls --depth=0` and `git diff --check` pass. Installed dependencies were reused; no dependency additions or new clean installation. A capture-heavy run timed out in Firefox after reaching the end/PDF state; redundant nonselected screenshots were removed, the long capture test received an explicit extended allowance, and the final complete run passed.

Local evidence: [gallery](../output/playwright/corrective-review/index.html), [manifest](../output/playwright/corrective-review/REVIEW-MANIFEST.md), [PDF reconciliation](../output/playwright/corrective-review/pdf-inspection.json). The package has 30 selected full screenshots (26 after, four original before), 26 viewport details, three native recordings, standalone screenshot/workflow archives and linked PDFs. Captures use isolated synthetic browser contexts; no user storage, profiles, traces or credentials are exported. Recordings use reduced fixed video canvases and can briefly resize during full-page screenshot capture; gray canvas/zoom transitions at those instants are capture artifacts. Screenshots retain original resolution. Local evidence is ignored under `output/playwright/`.

Remaining limits: **qualified tax review of the changing-tax-home example and multi-period filing is still outstanding before publication or filing reliance**. February 29 interpretation stays explicit. No Safari, real iOS/Android, OS screen-reader certification, tagged Unicode PDF, remote CI or hosted configuration verification was performed. No publication is authorized. No known unresolved blocker remains in the verified local software scope.

## Historical appendix — rc.1 audit (superseded)

The following dated findings preserve earlier evidence. Their version, test totals and layout observations are historical, not the current release status. The independent `SECOND-PASS-REVIEW.md` and corrective acceptance supersede this audit.

Candidate: **0.2.0-rc.1**, calculation **physical-presence-2**.
Branch: `refactor/project-update`. Assessment: October 12, 2026 America/Managua; UTC test/report timestamps extend into October 13.

Status: **ready for local review as a scoped first-release candidate**. The final source passes all local gates below, including the file-control keyboard refinement. No deployment, push or publication has occurred.

### Definition-of-done audit

| Requirement | Authoritative evidence |
| --- | --- |
| 1. Explicit sourced physical-presence specification | `CALCULATION-SPEC.md` documents rules, formulas, boundaries, assumptions, authorities and legal questions; IRS guidance, 2025 Form 2555/instructions, Publication 54, current IRM and 26 CFR were consulted live |
| 2. Correct known boundary failures | `domain/__tests__/feie.test.ts`: both cases failed against alpha, now pass; earliest Jan 2 prior-year period and exclusion of zero-overlap periods are permanent regressions |
| 3. Multiple-period coverage | Engine merges the union of passing period intersections; a counterexample covers 366 days using two supporting periods while every single passing period covers less; independent daily oracle, disjoint coverage and exact fractions pass |
| 4. Persistent transferable history | One versioned history; StrictMode year/view retention and reload tests; all five browser projects pass JSON download, deliberate reset, import review/merge and reload; domain tests cover malformed/incompatible data, conflicts and UTF-8 size limits |
| 5. Explicit evidence assumptions | Unrecorded dates remain unknown; U.S. entry alone cannot qualify; bounded foreign declarations require acknowledgment; explicit unknown/nonqualifying exceptions override declarations; future/proposed dates are separate |
| 6. Desktop/mobile primary workflow | Production workflows pass at desktop 1440×1000, tablet 768×1024 and mobile 390×844; direct entry, year/view changes, correction, reload, backup and proposal/example flows exercised; actual desktop/mobile screenshots inspected |
| 7. Page/export consistency | `normalizeHistory` supplies both engine input and `buildReport`; results, copy and PDF consume that report; source ids, assumptions and normalized foreign/U.S. segments survive view changes in regression/browser tests |
| 8. Preparer evidence | Exact fraction, union dates, supporting period dates/counts, recorded/assumed/projected/unknown evidence, source records/notes, normalized horizon, scope, as-of/generated dates and versions; incomplete reports export; real ordinary and multipage PDFs inspected |
| 9. Passing engineering checks | Clean `npm ci`, valid `npm ls --depth=0`; `npm run check` passes 79 tests plus full TypeScript/build; Vite 8.3.4 with compatible React plugin 6.1.2; CI definition checked in |
| 10. Critical accessibility repairs | Inputs have labels; native controls/disclosures replace the modal/calendar flow; visible focus and skip-link tested; all five browser projects have zero axe violations in tested empty/populated states; document width stays within viewport |
| 11. Proportionate limitations | Tax/home/income scope, leap-start sensitivity, multi-period filing question, local storage, PDF Unicode/tagging and device/assistive testing limits disclosed below, in the application/report, and README |
| 12. Running application inspected | Real Firefox development and production inspection; isolated Chromium/Firefox production tests; one-page ordinary and 10-page large browser PDF fixtures; page/text/raster checks and screenshots under ignored local artifact directories |
| 13. Reliable readiness record | This document separates passing local evidence from legal interpretation, remote CI and real-device work that have not been performed |

### Verification results

| Command/check | Result |
| --- | --- |
| `npm ci` | Pass from lockfile on Node 20.19.0 / npm 11.3.0; 170 installed packages; npm reported zero known vulnerabilities at installation |
| `npm ls --depth=0` | Pass; no invalid peer dependency tree |
| `npm run check` | Pass: full TypeScript check, **79/79 tests in 10 files**, production build |
| `npm run test:e2e` | Final full run: **28 passed / 2 intentionally skipped**, across 30 cases and five projects; includes file-control keyboard refinement; 2.9 minutes |
| Browser accessibility | Zero axe WCAG 2 A/AA, 2.1 AA and 2.2 AA violations in the tested empty and populated states across five projects; keyboard labels/focus checked separately |
| Mobile layout | Populated page document width **390px** at a **390px** viewport; first full-day field about **885px** from document top, versus ~4,957px in the alpha review; table overflow stays local |
| Clipboard | Native Chromium copy/readback on desktop/mobile/tablet; Firefox dispatch matches shared report; unit test covers denied clipboard and copyable-text fallback |
| PDF | Real browser downloads in all five projects; ordinary declaration/U.S.-visit report **1 A4 page**; 120-record incomplete report **10 pages**; text extraction confirms first/last record and all page footers; ordinary/multipage raster inspected; actual PDF unit tests verify pagination/context and visible export-error fallback |
| Privacy | Browser primary-flow test observes no requests outside the local application; source has no backend, account, analytics or external travel-data submission |
| CI | `.github/workflows/verify.yml` runs clean install, checks and production browser tests on Node 22; **not executed remotely**, because no push is authorized |

Two expected browser skips are the **native Chromium clipboard-permission tests in Firefox desktop/mobile**. Firefox still exercises report copy dispatch/integrity, all primary workflows, ordinary and large PDF download, backup restore, scenario isolation and accessibility. Mobile configurations use desktop browser engines at narrow viewports, not native phones.

Offline installation initially lacked a cached tarball; authorized network installation succeeded. A browser launch during dependency replacement failed to resolve transient modules; all reported release results come from later stable, sequential install/build/test runs. The old audit test failures were reproduced before implementation. Stale mode/calendar fixtures were replaced with tests of preserved record facts and the new workflows, rather than making the old incorrect behavior pass.

### Calculation and product limits

- **Scope:** this tool establishes modeled ordinary physical-presence counts and conditional calendar-year coverage from user evidence. It does not establish foreign tax home, citizenship/residency, eligible foreign earned income, elections, housing exclusions, actual exclusion dollars or tax savings. Waivers, special relief, bona fide residence and unlawful-presence rules are outside the model. Full foreign days must be entered correctly; a date-only tool does not reconstruct flights/time zones or independently verify country/transit facts.
- **February 29 starts:** reviewed sources do not explicitly settle the absent corresponding-date convention. Ordinary-date periods provide independently supported baseline coverage; a longer-convention sensitivity result is exposed whenever it adds coverage. An affected case is marked review-required, not silently certified.
- **Multiple-period filing:** the IRS manual explicitly defines days within one or more qualifying periods and the engine computes their union. Form 2555 line 16 requests one period. Reports list actual supporting twelve-month ranges and require preparer review of filing/attachment treatment; they do not auto-fill an official form or invent a longer period.
- **Year/record limits:** current research is anchored to 2025 instructions and current published guidance/2026 IRM, not certification of every historic/future tax year's law. Technical dates support records 1900–2100 and calendar-year evaluation 1901–2099. Backups/history share a 2 MB UTF-8 bound, maximum 5,000 records and 500-character notes. In-memory drafts are saved only after a valid record submission.
- **Local persistence:** browser/origin storage is plaintext, can be cleared or unavailable, and is not synchronized. Visible errors and JSON backup are provided. Use one editing tab at a time; concurrent-tab conflict coordination is not implemented. Changing browser/profile or local origin requires backup/restore.
- **PDF accessibility/Unicode:** visual and text output is verified; PDF is untagged and screen-reader reading order is not certified. Unsupported core-font glyphs use explicit Unicode code points; copy text/JSON preserve original characters. The labeled webpage and copyable report provide text alternatives.
- **Platforms:** no real iOS/Android, Safari/WebKit, OS screen-reader, complete manual WCAG audit or broad device/zoom certification was performed. Automated axe success is limited evidence, not a conformance certificate.
- **Publication:** no live host, production HTTPS/header configuration, remote CI run or deployment was verified. Source licensing is undecided and should be settled before public source redistribution. No publication was performed or authorized.

These limits are explicit scope boundaries for a narrow, private planning and preparer-documentation candidate. No known unresolved ordinary-counting, history-loss, report-integrity, test or primary-workflow blocker remains in the verified scope.

### Nonblocking refinements

Native-device and assistive-technology testing; tagged PDF/embedded Unicode fonts; searching/paging very large histories; concurrent-tab coordination. Independent tax-professional review is appropriate before relying on a filing position, particularly the two interpretation questions above.

### Review and reproduction

```sh
npm ci
npm run check
npx playwright install chromium firefox
npm run test:e2e
npm run dev
```

A local production preview was started at `http://127.0.0.1:4173`; its availability depends on the local process remaining alive. To restart: `npm run build`, then `npm run preview -- --host 127.0.0.1 --port 4173`.

Plan: `RELEASE-PLAN.md`. Specification: `CALCULATION-SPEC.md`. Decisions/checkpoints: `PROGRESS.md`. Historical alpha assessments remain unchanged. Local browser/PDF evidence is ignored under `output/playwright/`; browser download/trace output is under `test-results/` and the HTML report under `playwright-report/`. Artifacts contain synthetic test records, not user travel data.
