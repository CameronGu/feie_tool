# Development progress

## 2026-10-12 — baseline and execution contract

- Working tree inspected: clean on `refactor/project-update`, starting from alpha tag `2025-alpha.1` (`9df6883`). Prior user dependency updates and assessments are preserved.
- Read the README, architecture document, project assessment and product review; inspected domain, service and state implementation. The mutable complementary lists, year-clamping effect, truncated start enumeration and zero-overlap qualification are present.
- Created sequenced release plan and verification gates. Before source edits, `npm run build` passed. `npm test -- --run` returned 11 passes / 6 failures (17 tests): four stale-date hook assertions, both UI tests timing out, and React static-flag warnings. The extra UI timeout versus the historical 12/5 result establishes baseline timing instability, not a new source regression.
- Research opened IRS physical-presence and calculation guidance, 2025 Form 2555 and instructions, Publication 54, October 2026 IRM and current 26 CFR §§1.911-2/3.
- Next: finish sourced calculation contract, reproduce boundary failures in permanent tests, implement union and supporting-period selection. Then replace contradictory travel state with a persistent record model.

This log records completed actions and evidence; pending verification is never a pass.
