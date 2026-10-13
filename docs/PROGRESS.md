# Development progress

## 2026-10-12 — baseline and execution contract

- Working tree inspected: clean on `refactor/project-update`, starting from alpha tag `2025-alpha.1` (`9df6883`). Prior user dependency updates and assessments are preserved.
- Read the README, architecture document, project assessment and product review; inspected domain, service and state implementation. The mutable complementary lists, year-clamping effect, truncated start enumeration and zero-overlap qualification are present.
- Created sequenced release plan and verification gates. Before source edits, `npm run build` passed. `npm test -- --run` returned 11 passes / 6 failures (17 tests): four stale-date hook assertions, both UI tests timing out, and React static-flag warnings. The extra UI timeout versus the historical 12/5 result establishes baseline timing instability, not a new source regression.
- Research opened IRS physical-presence and calculation guidance, 2025 Form 2555 and instructions, Publication 54, October 2026 IRM and current 26 CFR §§1.911-2/3.
- Next: finish sourced calculation contract, reproduce boundary failures in permanent tests, implement union and supporting-period selection. Then replace contradictory travel state with a persistent record model.

This log records completed actions and evidence; pending verification is never a pass.

## 2026-10-12 — milestone A core

- Added both audit boundary cases as permanent tests and observed both fail against alpha before changing the engine.
- Engine now enumerates only intersecting ordinary calendar periods, including January 2 of the prior year, computes merged union coverage, selects a compact deterministic supporting-period cover, and retains exact integer counts and unrounded ratios. Single-best fields remain temporarily for the old interface and will be retired from reporting in D.
- Confirmed the union interpretation against IRM 21.8.1.3.2(9)(d) and 26 CFR §1.911-3(d)(3). Form 2555's single range is a documented filing question; reports will list supporting ranges rather than invent a form entry.
- Leap-start ambiguity is handled by a separate sensitivity result. Ordinary-period support remains the baseline; alternate coverage is explicitly marked for review only when it adds days.
- Service rejects partial calendar years, accepts older reusable history, and requires explicit foreign coverage for U.S. mode. The current UI has not yet been migrated to that safer contract.
- Verification: targeted domain/service suite **27/27 pass** (3 files), including independent daily oracle and union counterexample. Production build/type check passes. Baseline UI failures are still scheduled for B/C; this checkpoint is not a release.
- Next: persistent travel records with bounded foreign assumptions, explicit exceptions, unknown and proposed days; shared input normalization feeding calculation and reporting.

## 2026-10-12 — milestone B core

- Added a validated version-1 travel history, bounded foreign declarations with explicit U.S./other/unknown exceptions, and a separate proposal overlay. Source history is independent of selected year and entry view.
- One normalized daily-segment source supplies the engine and future reports, including source record ids, assumed/recorded basis and projected flags. Today's UTC date and later cannot masquerade as completed full days.
- Added JSON parsing/serialization and merge validation, browser storage with visible failure messages, preservation of unreadable storage until explicit reset/replacement, atomic record correction/deletion, undo, and year/view changes without source mutation.
- Targeted domain/service/new-hook suite: **56/56 tests pass** (7 files), including StrictMode, reload, old-year retention, malformed/versioned import, conflicting merge, proposal isolation and unavailable storage. Build/type check passes.
- One test initially included 2023 completed foreign history while expecting no 2024 qualifying period; corrected the fixture to start in 2024 because prior-year qualifying periods correctly intersect 2024. No calculation behavior was weakened to satisfy the fixture.
- Next: expose the new state through direct accessible interval entry and safe import/reset controls, then verify actual browser workflows. Shared report model is being built for the new result view; it is not yet wired into the application.

## 2026-10-12 — milestones C/D implementation and initial browser evidence

- Replaced the unused dual-list hook and calendar-heavy components with direct labeled interval entry, all-years history, correction/deletion/undo, safe import preview with merge or acknowledged replacement, deliberate reset, scenario comparison and a separate example preview. Entry views change only the new-record convenience, never recorded facts. The former mode-transfer modal and 1,512-button calendar were removed.
- Added a shared report model consumed by results, clipboard and PDF. Reports include exact union fraction, supporting periods, normalized evidence/provenance, source records and notes, generated/as-of dates, versions and scope assumptions. Incomplete/unsuccessful reports are exportable. PDF is loaded on demand, repeats context/page counts on every page, and preserves unsupported Unicode as explicit code points rather than losing text.
- All current tests: **71/71 pass across 9 files**; type check and production build pass. Seven reporting tests include real PDF bytes and a >5-page document with repeated headers/footers. Fixed a jsPDF internal typing mismatch discovered by the build, without weakening runtime checks.
- Initial real Firefox inspection: desktop 1440×1000 and mobile 390×844, entered 2024 Jan 1–Nov 30, saw 335 foreign days and 366/366 coverage. Populated mobile document width **390px** at a 390px viewport; first date input top **885px**, zero unnamed inputs. Visually inspected desktop/mobile full-page captures in ignored `output/playwright/`.
- Compatible Vite 8 React plugin installed (6.1.2); `npm ls --depth=0` succeeds. Added development-only Playwright and axe tools, installed Chromium/Firefox, pinned a supported Node range, and started production browser/CI verification. No runtime service or data submission added.
- Browser test results, real downloaded PDF inspection, clean install verification and final readiness audit are pending. No release claim yet.
