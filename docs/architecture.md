# FEIE Window Optimizer Architecture

## Core Assumptions
- All provided dates are ISO-8601 strings representing UTC dates without time components.
- Users may provide either US or Foreign travel periods; the system must invert and normalize as needed.
- Tax years may be partial and defined by explicit start and end dates; calculations rely solely on provided bounds.
- Validation must fail fast with explicit error payloads that match the shared TypeScript interfaces.

## Layered Structure
1. **Domain Layer (`src/domain`)**
   - `dates.ts`: Date parsing, formatting, indexing, and range generation utilities (pure functions, no runtime dependencies beyond standard libs).
   - `intervals.ts`: Interval validation, normalization, merging, inversion helpers. Enforces ordering, non-overlap, and boundary checks.
   - `feie.ts`: Core FEIE calculation orchestrating normalization, occupancy array creation, prefix sums, window enumeration, qualification, and planning results.
2. **Application Layer (`src/services`)**
   - `calculator.ts`: Public API aligning with `CalculatorInput` and `CalculatorOutput`, delegating to domain helpers, handling error mapping and planning mode toggles.
3. **UI Layer (`src/app`)**
   - React components providing two-mode input forms (US vs Foreign periods) with inline validation feedback.
   - Visualization and reporting components for optimized windows, interactive timelines, PDF export, clipboard sharing, and planning insights.
   - State management consolidated in `useCalculator`, which synchronizes US/foreign intervals, validation state, and calculator results in real-time.

## Validation Strategy
- Centralized validators in `intervals.ts` to ensure date formats, ordering, non-overlap, and bounds relative to `(tax_year_start - 1 year)` and `(tax_year_end + 1 year)`.
- Calculator-level guards to confirm mutually exclusive period inputs per mode and enforce required fields.
- Error codes enumerated in `src/domain/errors.ts` for reuse between services and UI, enabling consistent messaging.

## Testing Approach
- Use Vitest for domain-level unit tests: interval normalization, inversion, prefix sums, window enumeration, planning calculations.
- Snapshot representative outputs for regression coverage across edge cases (leap years, single-day intervals, overlapping inputs, etc.).

## Deployment Considerations
- Vite + React + TypeScript stack producing a static bundle deployable to static hosts or Vercel.
- All heavy computation resides in pure TypeScript modules, enabling reuse in SSR, client-side, or serverless contexts.
