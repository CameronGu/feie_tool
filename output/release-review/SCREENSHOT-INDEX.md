# Screenshot index

Production candidate 0.2.0-rc.1; isolated Chromium session; synthetic travel only. Desktop viewport 1440×1000; mobile viewport 390×844. Full-page images are taller than the viewport. Region images preserve actual dimensions. No privacy masks or restyling were used. No video was recorded; the requested compact package uses screenshots and actual reports.

| Image | Workflow / state | Viewport; image size |
| --- | --- | --- |
| [First use, desktop](screenshots/01-first-use-desktop.png) | Empty saved history, scope, direct entry and initial incomplete result. | 1440×1000; 1440×2105 (full page) |
| [First use, mobile](screenshots/02-first-use-mobile.png) | Same empty state at 390px; full page exposes the vertical task sequence. | 390×844; 390×4005 (full page) |
| [Foreign stay, ordinary year](screenshots/03-ordinary-foreign-desktop.png) | Recorded 2025 full year, 365/365 coverage and direct entry; ordinary-recorded.pdf. | 1440×1000; 1440×2144 (full page) |
| [Correction near threshold](screenshots/04-threshold-329-desktop.png) | Endpoint edited to Nov 25: 329 recorded days, no supported coverage. | 1440×1000; 1440×2231 (full page) |
| [Exact 330, mobile](screenshots/05-threshold-330-mobile.png) | Endpoint corrected to Nov 26: 330 foreign days, 365/365 coverage; threshold-330.pdf. | 390×844; 390×4029 (full page) |
| [Partial qualifying year](screenshots/06-partial-year-desktop.png) | July 2025 through May 2026 stay supports 219/365; partial-year.pdf. | 1440×1000; 1440×2207 (full page) |
| [329 days with withheld future evidence](screenshots/07-nonqualifying-desktop.png) | 2025 result remains incomplete despite upper-bound failure; nonqualifying.pdf. This is not the definitive not-met sample. | 1440×1000; 1440×2409 (full page) |
| [Incomplete history, mobile](screenshots/08-incomplete-evidence-mobile.png) | 300 foreign days plus unknown dates; incomplete.pdf. | 390×844; 390×4292 (full page) |
| [Future travel comparison](screenshots/09-future-scenario-desktop.png) | 2026 completed coverage 0 versus scenario 365; 285 completed plus 80 proposed foreign days; projected-scenario.pdf. | 1440×1000; 1440×2365 (full page) |
| [Multiple supporting periods](screenshots/10-multiple-periods-desktop.png) | 2024 union 366/366 with two twelve-month supports; multiple-periods.pdf. | 1440×1000; 1440×2558 (full page) |
| [Example context defect](screenshots/11-example-context-mismatch-desktop.png) | 2025 demo incorrectly subtracts saved 2024 coverage of 366 from 365 demo days (C02). | 1440×1000; 1440×2439 (full page) |
| [Abroad resident with U.S. visits](screenshots/12-bounded-declaration-desktop.png) | Multi-year bounded declaration plus visit and transit exceptions; 347 assumed foreign days; declared-with-us-visits.pdf. | 1440×1000; 1440×2427 (full page) |
| [Overlap correction error](screenshots/13-overlap-error-desktop.png) | Extending the July U.S. visit overlaps the transit record; existing history remains intact and correction is retained. | 1440×1000; 1440×2427 (full page) |
| [Backup import review, mobile](screenshots/14-backup-import-review-mobile.png) | Actual downloaded four-record JSON selected; count-only review before merge. | 390×844; 390×4603 (full page) |
| [Returning user, mobile](screenshots/15-restored-history-mobile.png) | Imported four records retained after reload and change to 2024; table requires local horizontal scrolling. | 390×844; 390×4387 (full page) |
| [Mobile history actions detail](screenshots/16-mobile-history-actions.png) | Actual history region scrolled right to Edit/Delete; identifying date column is off to the left. | 390×844; 324×531 (region) |
| [Definitive nonqualifying result](screenshots/17-confirmed-nonqualifying-desktop.png) | 2024 329-day foreign stay with the entire evaluation horizon classified; nonqualifying-confirmed.pdf. | 1440×1000; 1440×2270 (full page) |
| [One unknown day, false inconclusive explanation](screenshots/18-one-unknown-day-status-desktop.png) | Two U.S. ranges leave one unknown date; threshold is impossible, but app says missing evidence prevents a conclusion (C01). | 1440×1000; 1440×2335 (full page) |
| [Long note resilience, mobile](screenshots/19-long-note-table-mobile.png) | Allowed 500-character unbroken note wraps; actions remain available in the horizontally scrolled table. No overflow defect asserted. | 390×844; 324×934 (region) |
| [Bounded declaration form, mobile](screenshots/20-declaration-entry-mobile.png) | Unsaved synthetic declaration, direct dates and explicit exception acknowledgment; detail capture of actual form. | 390×844; 362×1041 (region) |
| [Mobile first viewport](screenshots/21-first-viewport-mobile.png) | Top 844px of the later synthetic review session; scope/year/settings precede the date fields. Not an empty first-use capture. | 390×844; 390×844 (viewport) |
| [Mobile result detail](screenshots/22-result-detail-mobile.png) | Later one-unknown-day status in a readable result-region capture; count and interpretation remain distinct. | 390×844; 362×1362 (region) |

Reports and clipboard samples are under `reports/`; `nonqualifying-confirmed` is the actual not-met case. The earlier `nonqualifying` sample demonstrates the conservative incomplete-status defect. Each `.pdf-text.txt` is extracted PDF text, while each ordinary `.txt` is native clipboard output.

See `data/report-reconciliation.json`, `data/independent-calculation-results.json`, and `data/reproduce-calculations.py` for independent arithmetic evidence. The JSON `returning-user-backup.json` is an actual application download, containing four synthetic records.

All requested traveler/preparer workflows were reached. Existing suite: 28 browser tests passed, two Firefox native-clipboard checks skipped as expected. No Safari/real phone/screen-reader certification, live hosting check or professional filing approval is implied. No external transactions were simulated or executed.

The capture series deliberately reuses an isolated synthetic browser profile, including reset, correction, import and replacement steps. Later statuses/feedback belong to that review chronology; screenshots are not fabricated pristine states. Sources/credentials, browser profiles, traces and raw logs are excluded.
