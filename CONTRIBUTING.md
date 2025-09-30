# Contributing

Thanks for your interest in improving the FEIE Window Optimizer! This guide covers the workflow and quality expectations for new contributions.

## Getting set up
1. Fork the repository or create a branch from `main`.
2. Install dependencies with `npm install`.
3. Run `npm test -- --run` to verify the baseline passes.

## Development workflow
- Keep the TypeScript domain utilities pure so they can be reused across environments.
- When adjusting date logic, add Vitest coverage in `src/domain/__tests__` or `src/services/__tests__`.
- Prefer small, focused commits using the conventional prefix style (`feat`, `fix`, `docs`, `test`, `chore`, `refactor`).
- Update documentation (README, docs/architecture.md) whenever you add new modes, validation rules, or deployment steps.
- Validate the UI with `npm run dev`; ensure interval validation errors surface immediately and read well.

## Pull requests
- Summarize the change, list test commands executed, and mention any remaining limitations.
- Screenshots or short screen recordings are helpful when altering the planner or results presentation.
- Tag relevant issues/feature requests or create one if none exists.

## Coding standards
- TypeScript strict mode is enabled; pass `npm run build` before requesting review.
- Default to ASCII in source files unless existing content requires Unicode.
- Use descriptive inline comments only when logic is non-obvious (avoid restating what the code already expresses).

## Bug reports & feature requests
- Include sample travel intervals and tax year(s) that reproduce the issue.
- Note whether the bug appears in U.S. or foreign mode and whether the quick-add planner was involved.
- If the issue touches FEIE policy interpretation, share links or references that justify the update.

Thanks again for helping make the FEIE Window Optimizer more reliable and useful!

