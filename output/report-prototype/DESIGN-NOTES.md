# Preparer report visual prototype

Review artifact, October 13, 2026. Production calculation, PDF and clipboard implementations are unchanged. Final rc.2 refinements are recoverable at local commit `f4e8d9d9889ffa8e041f93cb431f7591bf86a67c`; the working tree was clean before this assignment. No real travel history or identifying record IDs were read or included.

## Review files

- [Standard 2025 PDF](standard-2025.pdf) and [actual rendered preview](standard-2025.png): the primary design for approval, one A4 page.
- [Plain-text clipboard example](clipboard-2025.txt): the same principal calculations, supporting period, original trip dates, clipped counts, assumptions and authority links; no ASCII layout.
- [Multiple supporting periods](multiple-periods.pdf): two separately stated periods, per-period thresholds and intersections, distinct coverage and filing-review note. Uses the existing synthetic 2024 regression to exercise a 366-day denominator.
- [Incomplete evidence](incomplete-result.pdf): 329 recorded foreign days, 36 unresolved candidate days, no established coverage; asks for missing facts without declaring ineligibility.
- [Unsuccessful ordinary assessment](unsuccessful-result.pdf): fully classified synthetic history, maximum and upper bound both 329; clearly states no supported period. This uses an explicitly labeled synthetic January 1, 2027 reference date, separate from the generation date.
- [Proposed comparison](proposed-comparison.pdf): completed 351/365 versus projected 365/365, +14 days / +3.84 percentage points. Shows both supporting periods and the proposed continuation. Its historical scenario reference date is January 14, 2026; later days remain proposed even though this prototype is generated later.
- [Optional detailed appendix](supporting-appendix.pdf): two A4 pages covering the full relevant synthetic source history, normalized evidence, synthetic source labels, classification, versions, cutoffs and linked primary references. The scenario material is explicitly separate from standard-case evidence. JSON history backup remains a separate application function; `reconciliation.json` is derived verification output, not a backup.
- [Review contact sheet](review-contact-sheet.png): index of all seven actual rendered pages. Each secondary PDF also has its own full-size PNG; the appendix previews are `supporting-appendix-1.png` and `supporting-appendix-2.png`.

## Layout and content

The header leads with Physical Presence Test and tax year. A single numerical area distinguishes tax-year coverage (navy) from the foreign-day threshold (teal). Supporting dates follow immediately; the relevant visit schedule is on the same page. The assessment says “Threshold met under declared assumptions,” without asserting foreign tax home, full FEIE eligibility, eligible income or an actual exclusion.

The standard sheet uses embedded Noto Sans, 19 mm side margins, a 25 pt title, 31 pt principal figures, 13 pt assessment/period dates and mostly 10 pt body text. Table notes use 9.5 pt; linked authorities use 8.5 pt; the secondary footer uses 7.5–8 pt. White space, thin rules and a lightly shaded table heading establish hierarchy without panels, charts or dashboard styling. Body text is not reduced to footnote size to meet the one-page preference.

Original travel dates are preserved: December 13, 2025–January 13, 2026 contributes only December 13–17 to the selected period. The report explicitly separates period coverage from foreign presence and states that coverage does not make U.S.-source employment income foreign earned income.

The standard fixture declares assumed foreign presence from January 1, 2015 **through December 31, 2025**, with the two approved U.S. exceptions. This synthetic bounded endpoint reproduces the approved 351-day result without inventing foreign presence in 2026 that could support additional periods. It is stated in both PDF and clipboard. Production integration must preserve the actual declaration boundaries and all relevant supporting periods, rather than hard-code these sample values.

## Counts and authority

- Supporting period December 18, 2024–December 17, 2025: 365 inclusive calendar days.
- Assumed full foreign days: 164 before the first visit + 166 between visits = 330.
- Recorded U.S. days within the period: 30 + 5 = 35; 330 + 35 = 365.
- Tax-year intersection January 1–December 17, 2025: 351 days; 351/365 = 0.9616438356164384, displayed as 0.961644 and 96.16%. These are display rounding, not an official Form 2555 entry or an income fraction.
- Multiple periods cover 188 + 178 = 366 distinct days; each independently has at least 330 full foreign days.
- The additional projected period has 163 assumed + 167 proposed foreign days, 32 recorded U.S. days and three unresolved days: 365 total. Those three days count as zero foreign. Its overlap with the completed period is counted once in the 365-day projected coverage.

Primary IRS sources checked live on October 13, 2026: [physical presence](https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion-physical-presence-test), [exclusion computation](https://www.irs.gov/individuals/international-taxpayers/figuring-the-foreign-earned-income-exclusion), [IRM 21.8.1.3.2(9)(d)](https://www.irs.gov/irm/part21/irm_21-008-001r) and [income sourcing](https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion-what-is-foreign-earned-income). The standard sheet links these short authority labels; the appendix adds regulations and Form 2555 instructions. The IRM is administrative guidance; tax-home and multi-period filing interpretation still require qualified review.

## Decisions for design approval

1. Approve the standard one-page hierarchy, numerical emphasis and on-page U.S. schedule. The optional two-page appendix carries identifiers and technical evidence, so preparers can scan the standard sheet independently.
2. Confirm that incomplete evidence should omit a headline percentage while stating “0/365 supported” in the explanation. A confirmed ordinary threshold failure shows zero coverage explicitly. This avoids presenting an incomplete record as a final eligibility conclusion.
3. Confirm four compact authority links in the standard sheet versus reducing them to two and moving the remainder to the appendix. The current choice supports review of counting, coverage, proration and income sourcing without extended legal text.

These are visual/content choices, not permission to integrate. Longer travel schedules or more periods should continue onto additional pages with repeated headings; prototype code is deliberately tailored to these fixtures and is not a production pagination implementation. The PDFs are selectable text with embedded fonts but are not tagged accessible PDFs; clipboard text is the accompanying plain-text alternative.

## Reproduction and verification

From the repository root:

```sh
node output/report-prototype/generate.mjs
python3 output/report-prototype/verify.py
```

Uses existing jsPDF and TypeScript dependencies, local Noto Sans fonts under `/usr/share/fonts/truetype/noto`, installed Poppler and Pillow. No dependencies were added. The generator reads unchanged calculation modules, transpiles them into a disposable temporary directory, then removes that directory. It never calls production export services or browser storage.

The generator asserts each fixture against `physical-presence-2.2`. The independent Python check recomputes the approved calendar counts, checks principal PDF/clipboard parity, A4 dimensions and page counts, examines actual text bounds and collisions, and renders every page at 144 dpi. Results are in `reconciliation.json`, `verification.json` and the PDF text extracts. All seven rendered pages were visually inspected; clipped-note wrapping and comparison-table line spacing were refined after inspection.

Application guardrail: `npm run check` passed TypeScript, 101/101 tests and the production build. Three existing Chromium desktop workflows passed in a temporary isolated copy: cutoff/example isolation, two-period PDF, and page/clipboard/PDF scenario comparison. The last needed one unchanged retry after `ERR_NETWORK_CHANGED` during initial navigation. This is scoped coverage, not a full five-project suite; results are recorded in `docs/PROGRESS.md`. No production report integration, push, publication or deployment is part of this assignment.
