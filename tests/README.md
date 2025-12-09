# Testing Strategy

This project uses a dual testing strategy:

## Unit Tests (Vitest)

For testing logic, utilities, and individual components.

- Run: `npm test`
- config: `vitest.config.ts`

## E2E Tests (Playwright)

For testing user flows and routes.

- Run: `npm run test:e2e` (requires dev server running or it will start one)
- config: `playwright.config.ts`

## Files

- `tests/unit/`: Unit tests (e.g., `questionService.test.ts`)
- `tests/e2e/`: End-to-end tests (e.g., `manual-flow.test.ts`)
