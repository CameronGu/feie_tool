# Release readiness

Candidate: **0.2.0-rc.1**, calculation **physical-presence-2**.
Branch: `refactor/project-update`. Assessment: October 12, 2026 America/Managua; UTC test/report timestamps extend into October 13.

Status: **ready for local review as a scoped first-release candidate**. The final source passes all local gates below, including the file-control keyboard refinement. No deployment, push or publication has occurred.

## Definition-of-done audit

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

## Verification results

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

## Calculation and product limits

- **Scope:** this tool establishes modeled ordinary physical-presence counts and conditional calendar-year coverage from user evidence. It does not establish foreign tax home, citizenship/residency, eligible foreign earned income, elections, housing exclusions, actual exclusion dollars or tax savings. Waivers, special relief, bona fide residence and unlawful-presence rules are outside the model. Full foreign days must be entered correctly; a date-only tool does not reconstruct flights/time zones or independently verify country/transit facts.
- **February 29 starts:** reviewed sources do not explicitly settle the absent corresponding-date convention. Ordinary-date periods provide independently supported baseline coverage; a longer-convention sensitivity result is exposed whenever it adds coverage. An affected case is marked review-required, not silently certified.
- **Multiple-period filing:** the IRS manual explicitly defines days within one or more qualifying periods and the engine computes their union. Form 2555 line 16 requests one period. Reports list actual supporting twelve-month ranges and require preparer review of filing/attachment treatment; they do not auto-fill an official form or invent a longer period.
- **Year/record limits:** current research is anchored to 2025 instructions and current published guidance/2026 IRM, not certification of every historic/future tax year's law. Technical dates support records 1900–2100 and calendar-year evaluation 1901–2099. Backups/history share a 2 MB UTF-8 bound, maximum 5,000 records and 500-character notes. In-memory drafts are saved only after a valid record submission.
- **Local persistence:** browser/origin storage is plaintext, can be cleared or unavailable, and is not synchronized. Visible errors and JSON backup are provided. Use one editing tab at a time; concurrent-tab conflict coordination is not implemented. Changing browser/profile or local origin requires backup/restore.
- **PDF accessibility/Unicode:** visual and text output is verified; PDF is untagged and screen-reader reading order is not certified. Unsupported core-font glyphs use explicit Unicode code points; copy text/JSON preserve original characters. The labeled webpage and copyable report provide text alternatives.
- **Platforms:** no real iOS/Android, Safari/WebKit, OS screen-reader, complete manual WCAG audit or broad device/zoom certification was performed. Automated axe success is limited evidence, not a conformance certificate.
- **Publication:** no live host, production HTTPS/header configuration, remote CI run or deployment was verified. Source licensing is undecided and should be settled before public source redistribution. No publication was performed or authorized.

These limits are explicit scope boundaries for a narrow, private planning and preparer-documentation candidate. No known unresolved ordinary-counting, history-loss, report-integrity, test or primary-workflow blocker remains in the verified scope.

## Nonblocking refinements

Native-device and assistive-technology testing; tagged PDF/embedded Unicode fonts; searching/paging very large histories; concurrent-tab coordination. Independent tax-professional review is appropriate before relying on a filing position, particularly the two interpretation questions above.

## Review and reproduction

```sh
npm ci
npm run check
npx playwright install chromium firefox
npm run test:e2e
npm run dev
```

A local production preview was started at `http://127.0.0.1:4173`; its availability depends on the local process remaining alive. To restart: `npm run build`, then `npm run preview -- --host 127.0.0.1 --port 4173`.

Plan: `RELEASE-PLAN.md`. Specification: `CALCULATION-SPEC.md`. Decisions/checkpoints: `PROGRESS.md`. Historical alpha assessments remain unchanged. Local browser/PDF evidence is ignored under `output/playwright/`; browser download/trace output is under `test-results/` and the HTML report under `playwright-report/`. Artifacts contain synthetic test records, not user travel data.
