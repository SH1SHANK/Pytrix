# Pytrix Testing Documentation

This document describes the testing infrastructure, how to run tests, and guidelines for adding new tests.

## Test Stack

| Tool                       | Purpose                       |
| -------------------------- | ----------------------------- |
| **Vitest**                 | Unit and integration tests    |
| **@testing-library/react** | React component testing       |
| **Playwright**             | End-to-end browser tests      |
| **jsdom**                  | DOM simulation for unit tests |

## Folder Structure

```
tests/
├── setup.ts                  # Global test setup (mocks, cleanup)
├── env.test.local.example    # Template for real API testing
├── README.md                 # This file
├── mocks/
│   ├── index.ts              # Central mock exports
│   ├── factories.ts          # Mock data factories
│   ├── modelRouter.ts        # LLM/AI call mocks
│   └── pythonRuntime.ts      # Pyodide execution mocks
├── unit/
│   └── lib/
│       ├── statsStore.test.ts        # Stats tracking tests
│       ├── autoModeService.test.ts   # Auto mode save files & queue
│       ├── questionService.test.ts   # Question generation tests
│       ├── pythonRuntime.test.ts     # Python execution tests
│       ├── settingsStore.test.ts     # Settings persistence tests
│       └── apiUsageEntryStore.test.ts # API usage tracking tests
├── integration/              # (Future) Page/component integration tests
│   └── app/
└── e2e/
    ├── dashboard-flow.test.ts    # Dashboard navigation tests
    ├── manual-flow.test.ts       # Manual practice flow tests
    ├── command-center.test.ts    # Command palette tests
    ├── onboarding.test.ts        # First-time user flow tests
    ├── auto-mode.test.ts         # Auto mode flow tests
    └── settings.test.ts          # Settings persistence tests
```

## Running Tests

### All Tests (Unit + Integration)

```bash
npm run test
```

### Watch Mode (Development)

```bash
npm run test:watch
```

### Unit Tests Only

```bash
npm run test:unit
```

### Integration Tests Only

```bash
npm run test:integration
```

### E2E Tests (Browser)

```bash
npm run test:e2e
```

> **Note:** E2E tests require a running dev server. Playwright will automatically start one if not already running.

### Coverage Report

```bash
npm run test:coverage
```

### CI Pipeline

```bash
npm run test:ci
```

Runs all tests suitable for CI (unit, integration, and E2E).

## Environment Variables for Testing

### Local Development (No API Key Needed)

All tests run **without requiring any API keys** by default. LLM calls and network requests are mocked.

### Real API Integration Tests (Optional)

For maintainers who want to run real API integration tests:

1. Copy the template:

   ```bash
   cp tests/env.test.local.example .env.test.local
   ```

2. Edit `.env.test.local` and add your test API key:

   ```bash
   INTERNAL_GEMINI_KEY="your-actual-api-key"
   ```

3. Tests that use real API calls will automatically detect this key and run.

> **⚠️ Important:**
>
> - `.env.test.local` is in `.gitignore` - never commit API keys
> - Only use test/development API keys
> - Real API tests are skipped automatically when the key is missing

## Writing New Tests

### Unit Tests

Unit tests go in `tests/unit/lib/` and test pure functions and stores.

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("myFunction", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should do something", () => {
    const result = myFunction("input");
    expect(result).toBe("expected");
  });
});
```

#### Mocking Dependencies

```typescript
// Mock a module before imports
vi.mock("@/lib/someModule", () => ({
  someFunction: vi.fn(() => "mocked value"),
}));
```

#### Resetting Zustand Stores

```typescript
import { useMyStore } from "@/lib/myStore";

beforeEach(() => {
  // Reset to initial state
  useMyStore.setState({ items: [] });
});
```

### E2E Tests

E2E tests go in `tests/e2e/` and test complete user flows.

```typescript
import { test, expect } from "@playwright/test";

test.describe("My Feature", () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated state
    await page.addInitScript(() => {
      localStorage.setItem(
        "pytrix-settings",
        JSON.stringify({
          state: { hasCompletedOnboarding: true },
          version: 1,
        })
      );
    });
  });

  test("should navigate correctly", async ({ page }) => {
    await page.goto("/my-page");
    await expect(page.getByRole("heading")).toBeVisible();
  });
});
```

### Using Mock Factories

```typescript
import {
  createMockQuestion,
  createMockStats,
  createMockSaveFile,
} from "../mocks";

const question = createMockQuestion({
  title: "Custom Title",
  difficulty: "intermediate",
});

const stats = createMockStats({
  totalAttempts: 50,
  totalSolved: 40,
});
```

## Test File Index

| File                         | Coverage                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| `statsStore.test.ts`         | Recording attempts, mastery calculation, module/subtopic aggregation, reset functionality |
| `autoModeService.test.ts`    | Save file CRUD, topic queue generation, topic rotation                                    |
| `questionService.test.ts`    | Template-based question generation, fallback behavior                                     |
| `pythonRuntime.test.ts`      | Execution result capture, error handling, runtime status                                  |
| `settingsStore.test.ts`      | Settings updates, onboarding state, persistence                                           |
| `apiUsageEntryStore.test.ts` | Usage recording, filtering, aggregation, date ranges                                      |
| `dashboard-flow.test.ts`     | Dashboard navigation, module cards, practice buttons                                      |
| `manual-flow.test.ts`        | Manual practice page, module selection, difficulty                                        |
| `command-center.test.ts`     | Command palette, search, navigation                                                       |
| `onboarding.test.ts`         | First-time user experience, API key setup                                                 |
| `auto-mode.test.ts`          | Adaptive mode, run management                                                             |
| `settings.test.ts`           | Settings page, theme persistence                                                          |

## Best Practices

1. **Isolate tests** - Each test should be independent; use `beforeEach` to reset state
2. **Mock external dependencies** - Never call real APIs in unit tests
3. **Test behavior, not implementation** - Focus on what the code does, not how
4. **Use descriptive test names** - `should return empty array when no data exists`
5. **Keep tests fast** - Unit tests should complete in milliseconds
6. **Use factories for test data** - Avoid duplicating mock data setup

## Troubleshooting

### Tests fail with "localStorage is not defined"

Make sure `tests/setup.ts` is included in `vitest.config.ts`:

```typescript
setupFiles: ["./tests/setup.ts"],
```

### Zustand store state leaking between tests

Reset the store in `beforeEach`:

```typescript
beforeEach(() => {
  useMyStore.setState(initialState);
});
```

### E2E tests timing out

Increase the timeout or check that the dev server is running:

```typescript
await expect(element).toBeVisible({ timeout: 10000 });
```

### Mock not being applied

Ensure `vi.mock()` is called before any imports of the mocked module.
