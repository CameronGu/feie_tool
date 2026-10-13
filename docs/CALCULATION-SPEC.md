# Physical-presence calculation contract

Status: research draft, 2026-10-12. Calculation version will change when this contract is implemented. This is a calendar-year physical-presence planning utility, not a completed Form 2555, eligibility certificate, income calculation or tax-savings optimizer.

## Primary authorities

Reviewed live on 2026-10-12:

1. [26 CFR §1.911-2(a), (d), (g), (h)](https://www.ecfr.gov/current/title-26/section-1.911-2): citizenship/residency and foreign tax home are separate prerequisites. Presence requires 330 full days in twelve consecutive calendar months. Short travel between foreign locations has specific exceptions; U.S. territories are not foreign countries.
2. [26 CFR §1.911-3(d)(3)](https://www.ecfr.gov/current/title-26/section-1.911-3): qualifying-period coverage differs from days physically abroad. A period can include days outside a foreign country or without a foreign tax home. The application's coverage is conditional on independently satisfying tax-home and other requirements.
3. [IRS physical-presence guidance](https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion-physical-presence-test): periods must intersect the year at issue; ordinary endpoints are the day before the corresponding date twelve months later. Partial arrival/departure days generally do not count. Short travel between foreign countries may preserve full days; extended international transit does not.
4. [IRM 21.8.1.3.2(9)(d), effective 2026-10-01](https://www.irs.gov/irm/part21/irm_21-008-001r): defines a qualifying day as a day within one or more qualifying periods. The live manual's section number and paragraph, rather than its generated HTML anchor, are the reference. The IRM is IRS administrative guidance, not a replacement for statute/regulations.
5. [IRS exclusion computation guidance](https://www.irs.gov/individuals/international-taxpayers/figuring-the-foreign-earned-income-exclusion): the calendar-year fraction uses qualifying days divided by 365 or 366. Income and housing provisions determine the actual exclusion, outside this application.
6. [2025 Form 2555 instructions, Part III/line 16](https://www.irs.gov/instructions/i2555): the period includes 365/366 days and intersects 2025; both endpoints are required. [2025 Form 2555, lines 16, 18, 38–39](https://www.irs.gov/pub/irs-pdf/f2555.pdf) requests a single period and supporting travel; its fraction is rounded for entry. A supporting report listing multiple periods is not an official form entry.
7. [Publication 54 (12/2025), physical presence and foreign income FAQs](https://www.irs.gov/publications/p54): distinguishes presence days, qualifying-period coverage, foreign tax home and eligible income; actual income exclusion is not necessarily the statutory maximum.

## Product interpretation and boundaries

- Store date-only ISO calendar days; arithmetic uses UTC solely to avoid machine timezone drift. A recorded foreign range means its **first and last full foreign days**, inclusive, not unchecked flight dates. Users classify travel/transit, territory, international-water and unknown dates explicitly. No geographic inference from a country name.
- Count a foreign day only once. Unrecorded dates are unknown. U.S. entry requires an explicit bounded declaration of foreign days except recorded nonqualifying/unknown exceptions; no implicit all-history foreign complement.
- Evaluate complete calendar tax years only. Reject arbitrary partial-year API bounds instead of using a misleading denominator. Stored history is independent of the evaluation horizon.
- Enumerate every relevant ordinary daily start from January 2 of the prior year through December 31 of the selected year. Keep only periods whose inclusive end is on/after January 1 of the selected year. Horizon extends far enough to contain every such period. Exactly 330 counts; 329 does not.
- Compute the union of **all** qualifying-period intersections with the selected year. Merge overlaps and adjacency and count each covered day once. Do not sum period overlaps. This follows the IRM's explicit union definition and the regulation's any-period definition; it replaces single-best-window ranking. The result is modeled physical-presence coverage, conditional on separately verified tax-home and eligibility facts.
- Retain a deterministic compact set of actual supporting twelve-month periods whose intersections cover that union. For each uncovered earliest covered day, choose a qualifying period covering it with the farthest end; ties use earliest start. Repeat until all union segments are covered. This is an interval-cover algorithm, not a financial optimization.
- Preserve integer numerator/denominator and unrounded ratio in outputs. Round only display values; always show the exact fraction alongside the decimal.
- Completed records, explicit assumptions, unknown dates and future/proposed records must remain distinguishable. A projected calculation cannot establish completed presence. A failed lower-bound calculation with unknown dates is incomplete, not conclusive failure.

## Questions requiring explicit treatment

1. **February 29 starts:** the corresponding date does not exist the following year. Reviewed IRS/regulatory text does not explicitly choose between February 27 and February 28 as the inclusive endpoint (365 versus 366 days). Do not silently apply generic year-clamping. Implement a sensitivity calculation and report when this ambiguity changes coverage; use independently supported ordinary-date periods for the defensible baseline. A February 29 start ending February 27 is dominated by the ordinary February 28 start one day earlier; the longer alternative may add coverage and requires preparer review. No general 365-day shortcut.
2. **Multiple periods on Form 2555:** the IRS form has a single line-16 range while administrative guidance defines coverage across periods. Report all supporting ranges and the union with an explicit preparer note; do not invent a single >12-month range or auto-fill a tax form. Filing attachment/election treatment remains a preparer question.
3. **Travel exceptions:** a date-only utility cannot independently establish sub-24-hour transit treatment or time-zone flight facts. Users may mark full foreign days only after checking the referenced rule; otherwise record nonqualifying/unknown. Waivers, combat-zone rules, unlawful presence and bona fide residence are outside the implemented ordinary physical-presence test.
4. **Year scope:** research is anchored to the 2025 form and currently published rules, including the 2026 IRM. No monetary limits are hard-coded. Historical/future special relief and rule changes are not certified by a successful day count.

## Permanent test examples to implement

| Example | Expected behavior |
| --- | --- |
| 2023-01-02–2023-11-27 full foreign days, tax year 2024 | 330; supporting 2023-01-02–2024-01-01; one day of 2024 covered |
| 2025-02-05–2025-12-31 full foreign days, tax year 2024 | No intersecting qualifying period; no positive result from a 2025-only period |
| 329 versus 330 foreign days | Threshold exact, inclusive |
| 2023-03-01 start | Ends 2024-02-29, 366 days |
| February 29 start | Sensitivity exposed when coverage differs; not silently clamped |
| Two qualifying periods covering more of a year than either alone | Union coverage exceeds best single overlap, without double counting |
| Foreign days separated by U.S./nonqualifying/unknown days | Only modeled full foreign days count toward 330 |
| Partial-year bounds | Explicit unsupported-input error |
