# Contributing

Use a focused branch and preserve existing user changes. Install with `npm ci` using a supported Node version (see `package.json`).

Before changing counting or evidence rules, read [the calculation specification](docs/CALCULATION-SPEC.md). Use primary tax authorities and keep unresolved interpretation explicit. Add targeted regression cases rather than changing expectations to match incorrect behavior.

Keep one versioned travel-history source. Year/view changes must preserve recorded facts; proposals must remain separate from completed evidence. Results and exports must derive from the normalized engine input. Keep the application static, with no external travel-data submission.

Run `npm run check` before review. For interaction or layout changes, install browsers with `npx playwright install chromium firefox`, run `npm run test:e2e`, and inspect representative desktop/mobile output. CI runs the same production-bundle browser checks. Do not claim accessibility or tax-law certification from automated checks alone.

Maintain [the release plan](docs/RELEASE-PLAN.md), [progress log](docs/PROGRESS.md), and [readiness evidence](docs/RELEASE-READINESS.md). Use small coherent commits and describe behavior, verification, and meaningful limitations. Browser artifacts belong under ignored `output/playwright/`, `test-results/`, or `playwright-report/`.

Bug reports should include reproducible full-day date ranges, record types/statuses, selected calendar year and explicit assumptions. Avoid committing real personal travel details or credentials. Push, publish and deployment require user authorization. Licensing must be settled before redistributing source.
