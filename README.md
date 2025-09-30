# FEIE Window Optimizer

A modular Foreign Earned Income Exclusion (FEIE) planner that evaluates every possible 12-month window spanning a U.S. tax year and the required "+/- 1 year" coverage to surface the period(s) with the strongest tax benefit. The tool is designed for static deployment (Vite + React) with reusable TypeScript domain logic suitable for serverless or SSR integrations.

## Why it exists
- **FEIE qualification clarity** – Translates complex IRS residency rules into day-level insights, highlighting the windows that deliver at least 330 qualifying foreign days.
- **Planning assistance** – Shows how many days abroad are still required when a traveler is short of the threshold and suggests optimal start dates.
- **Extensible architecture** – Pure TypeScript domain layer, validation utilities, and UI separation enable reuse across channels (web, API, CLI).

## Features
- Tax year selector with smart defaults (previous year until October 15) and +/- 7 year range.
- Automatic expansion of the evaluation window to one year before and after the chosen tax year.
- Dual input modes (U.S. presence or Foreign travel) with live validation and explicit error codes.
- Quick-add calendar planner for both modes, supporting multi-year travel selection with visual feedback.
- Optimized-window storytelling – clearly communicates the best FEIE window(s) and why they matter.
- Planning insights that reveal remaining qualifying days when the threshold is not yet met.

## Getting started
```bash
npm install
npm run dev
```

The development server runs on Vite. Start the UI, select the appropriate tax year, and enter either U.S. or foreign intervals using the calendar or manual fields. Validation feedback appears inline.

### Testing
```bash
npm test -- --run
```

Vitest covers domain logic (interval normalization, inversion, FEIE evaluation) and the calculator service. Extend the suite when adding new validation scenarios or traversal rules.

## Project structure
```
src/
  app/        # React components, hooks, and styles
  domain/     # Pure calculation + validation utilities
  services/   # Calculator service wiring domain logic to I/O contracts
  index.ts    # Library entry point exporting types + calculator
```

Key docs:
- `docs/architecture.md` – High-level layering and deployment notes.

## Deployment
The app ships as a static bundle via `npm run build`. Deploy to any static host (Vercel, Netlify, S3) or embed the `calculateFeie` function into serverless handlers.

## Contributing
1. Fork or branch from `main`.
2. Install dependencies and run the Vitest suite.
3. Follow the existing TypeScript style and keep helpers pure when possible.
4. Submit changes with meaningful commit prefixes (e.g., `feat`, `fix`, `chore`).
5. Document new behaviors in README or docs as needed.

Please open issues for feature requests, validation edge cases, or FEIE policy clarifications.

## License
Specify licensing before publishing (e.g., MIT, Apache 2.0). Add the chosen license file at the repo root.

## Suggested GitHub metadata
- **Description**: "Plan optimized FEIE 12-month windows with smart validation, calendar inputs, and planning insights."
- **Topics**: `feie`, `tax-planning`, `react`, `typescript`, `financial-tools`, `vite`

