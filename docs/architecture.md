# Architecture

A static React/TypeScript application built with Vite. No server, database, account, analytics or external travel-data submission. All evaluation and persistence happen in the browser. PDF code loads only when requested.

## Source of truth and data flow

`TravelHistory` in `domain/history.ts` is the sole record model. Versioned records contain inclusive dates, type, completed/proposed status, id and note. Declared foreign-presence ranges supply a bounded assumption. Explicit U.S., nonqualifying or unknown records override that assumption. Proposals form a separate scenario layer. Conflicting overlaps in a layer are rejected.

`useTravelHistory` owns history and independent year/view/scenario preferences. `historyStorage` handles versioned local storage and recoverable errors. Record editing is an atomic save from a form draft; incomplete drafts never affect results. Year/view changes never reinterpret or clamp source records. Portable JSON is validated before merge/replacement. Unreadable stored data is preserved until explicit reset/replacement, and can be downloaded for recovery.

`normalizeHistory` derives daily evidence segments only for the selected evaluation horizon. Every segment retains recorded/assumed/unrecorded provenance, proposal/future status and source record ids. Unrecorded dates stay unknown. Completed evaluation excludes today's UTC date and later; scenario evaluation includes those dates as projected.

`assessTravel` passes the foreign segments to `evaluateFeie` and assigns an evidence-aware result status. `buildReport` consumes that exact normalized evidence and calculation. Results, clipboard and PDF all use this shared structured report. They never reconstruct travel from independent mutable lists.

## Calculation

`dates.ts` uses deterministic UTC date-only arithmetic. `occupancy.ts` builds day occupancy and prefix sums. `feie.ts` exhaustively evaluates relevant ordinary-date twelve-calendar-month periods, counts foreign days, retains passing periods, computes their merged tax-year union and selects a compact deterministic interval cover. Integer numerator/denominator and raw fractions are preserved; display rounding is separate.

February 29 starts are evaluated separately under the longer endpoint interpretation. If they add coverage beyond ordinary-date support, the assessment exposes review-required sensitivity instead of silently certifying the result. See [CALCULATION-SPEC.md](CALCULATION-SPEC.md) for authority, formulas, boundaries and limitations.

The lower-level `calculateFeie` adapter remains for source reuse and legacy interval callers. It requires complete calendar-year bounds and explicit foreign coverage in U.S. mode. The application uses the richer `assessTravel` path; the lower-level adapter alone does not assign evidence statuses.

## Presentation and reporting

Direct interval entry precedes results, followed by the all-years history and backup controls. U.S./foreign entry choices are form conveniences, not history conversions. Native controls, explicit labels, focus styles, keyboard-accessible disclosures and local table scrolling replace the large calendar/modal flow. The example uses a separate in-memory dataset; proposed travel overlays completed history only during comparison.

Reports include period evidence, union coverage, exact fraction, source records, all normalized horizon segments, assumptions, as-of/generated dates and application/calculation versions. PDF pagination repeats context and numbering on every page. Export errors have visible fallback instructions. Unsuccessful/incomplete reports remain exportable. JSON backups serve restoration; PDFs do not.

## Verification and constraints

Vitest covers calculation regression/oracle cases, evidence normalization, persistence, validated import/merge, StrictMode state, interface flows and real PDF generation. Playwright exercises the production bundle in Chromium and Firefox at desktop/mobile sizes plus Chromium tablet, including axe checks, native Chromium clipboard, JSON restore and PDF downloads. Configurations and tests are included in TypeScript checks. CI is checked in but has not been run remotely unless readiness explicitly says otherwise.

Supported records span 1900–2100; evaluated calendar years span 1901–2099. Backups are limited to 2 MB and 5,000 records; notes to 500 characters. Those bounds protect a synchronous browser utility and do not certify every tax year's law. Local storage is private to a browser profile/origin, not encrypted, backed up or synchronized. Use one editing tab at a time. Source reuse does not imply npm distribution or a serverless API.
