# Pytrix Testing Guide

Everything you need to know about testing Pytrix — from running your first test to writing comprehensive test suites.

---

## Test Stack

| Tool                | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| **Vitest**          | Unit and integration tests — fast, modern, TypeScript-native       |
| **Testing Library** | React component testing — tests what users see, not implementation |
| **Playwright**      | End-to-end browser tests — real browsers, real interactions        |
| **jsdom**           | DOM simulation for unit tests when you don't need a full browser   |

---

## Quick Commands

```bash
npm run test          # Run all tests (unit + integration)
npm run test:watch    # Watch mode — re-runs on file changes
npm run test:unit     # Unit tests only
npm run test:e2e      # Browser tests (Playwright)
npm run test:coverage # Generate coverage report
npm run test:ci       # Full CI pipeline
```

E2E tests will automatically start a dev server if one isn't running.

---

## Folder Structure

```
tests/
├── setup.ts                  # Global test setup (mocks, cleanup)
├── env.test.local.example    # Template for real API testing
├── mocks/
│   ├── index.ts              # Central mock exports
│   ├── factories.ts          # Mock data factories
│   ├── modelRouter.ts        # AI call mocks
│   └── pythonRuntime.ts      # Pyodide execution mocks
├── unit/
│   └── lib/
│       ├── statsStore.test.ts
│       ├── autoModeService.test.ts
│       ├── questionService.test.ts
│       ├── pythonRuntime.test.ts
│       ├── settingsStore.test.ts
│       └── apiUsageEntryStore.test.ts
├── integration/
│   └── app/                  # Component integration tests
└── e2e/
    ├── dashboard-flow.test.ts
    ├── manual-flow.test.ts
    ├── command-center.test.ts
    ├── onboarding.test.ts
    ├── auto-mode.test.ts
    └── settings.test.ts
```

---

## API Keys and Testing

### Default: No API Key Required

All tests run with mocked AI calls by default. You don't need any API keys to run the test suite.

### Optional: Real API Integration Tests

If you're a maintainer and want to test against the real Gemini API:

```bash
# Copy the template
cp tests/env.test.local.example .env.test.local

# Add your test API key
echo 'INTERNAL_GEMINI_KEY="your-test-key"' >> .env.test.local
```

Tests that need real API access will automatically detect the key and run. Without the key, they're skipped — not failed.

**Important:**

- `.env.test.local` is gitignored — never commit API keys
- Use a test/development key, not your production key
- Real API tests count against your quota

---

## Writing Unit Tests

Unit tests live in `tests/unit/lib/` and test pure functions and stores.

### Basic Template

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { myFunction } from "@/lib/myModule";

describe("myFunction", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should return the expected result", () => {
    const result = myFunction("input");
    expect(result).toBe("expected");
  });

  it("should handle edge cases", () => {
    expect(() => myFunction("")).toThrow();
  });
});
```

### Mocking Modules

```typescript
// Mock BEFORE imports
vi.mock("@/lib/someModule", () => ({
  someFunction: vi.fn(() => "mocked value"),
}));

import { functionThatUsesSomeModule } from "@/lib/consumer";

it("uses the mocked module", () => {
  const result = functionThatUsesSomeModule();
  expect(result).toBe("mocked value");
});
```

### Resetting Zustand Stores

```typescript
import { useMyStore } from "@/lib/stores/myStore";

beforeEach(() => {
  useMyStore.setState({ items: [], count: 0 });
});
```

---

## Writing E2E Tests

E2E tests live in `tests/e2e/` and test complete user flows in a real browser.

### Basic Template

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    // Skip onboarding for faster tests
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

  test("should complete the user flow", async ({ page }) => {
    await page.goto("/my-page");
    await page.getByRole("button", { name: "Start" }).click();
    await expect(page.getByText("Success")).toBeVisible();
  });
});
```

### Tips for E2E Tests

- Use `getByRole` and `getByText` over CSS selectors
- Add `data-testid` attributes for complex elements
- Use `waitForLoadState("networkidle")` when waiting for async operations
- Set reasonable timeouts for slow operations

---

## Using Mock Factories

The `tests/mocks/factories.ts` file provides helpers to create test data:

```typescript
import {
  createMockQuestion,
  createMockStats,
  createMockSaveFile,
} from "../mocks";

// Create with defaults
const question = createMockQuestion();

// Override specific fields
const customQuestion = createMockQuestion({
  title: "Custom Title",
  difficulty: "advanced",
});

const stats = createMockStats({
  totalAttempts: 100,
  totalSolved: 85,
});
```

---

## Test Coverage by File

### Unit Tests

| File                         | What It Tests                                                      |
| ---------------------------- | ------------------------------------------------------------------ |
| `statsStore.test.ts`         | Recording attempts, mastery calculation, module aggregation, reset |
| `autoModeService.test.ts`    | Run CRUD, topic queue generation, difficulty progression           |
| `questionService.test.ts`    | Template generation, LLM fallback, validation                      |
| `pythonRuntime.test.ts`      | Code execution, error handling, runtime status                     |
| `settingsStore.test.ts`      | Settings updates, onboarding state, persistence                    |
| `apiUsageEntryStore.test.ts` | Usage recording, filtering, date range queries                     |

### E2E Tests

| File                     | What It Tests                                        |
| ------------------------ | ---------------------------------------------------- |
| `dashboard-flow.test.ts` | Dashboard navigation, module cards, practice buttons |
| `manual-flow.test.ts`    | Manual practice setup, module selection, difficulty  |
| `command-center.test.ts` | Command palette, search, keyboard navigation         |
| `onboarding.test.ts`     | First-time user experience, API key setup            |
| `auto-mode.test.ts`      | Adaptive mode, run management, progression           |
| `settings.test.ts`       | Settings page, theme persistence                     |

---

## Best Practices

**Isolate tests** — Each test should be independent. Use `beforeEach` to reset state.

**Mock external dependencies** — Never call real APIs in unit tests. That's what E2E tests with mocks are for.

**Test behavior, not implementation** — Focus on what the code does, not how it does it. Refactors shouldn't break tests.

**Use descriptive test names** — `"should return empty array when no data exists"` beats `"test case 3"`.

**Keep tests fast** — Unit tests should complete in milliseconds. If they're slow, you're testing too much.

**Use factories for test data** — Avoid duplicating mock data setup across files.

---

## Troubleshooting

### "localStorage is not defined"

The test setup file isn't being loaded. Check `vitest.config.ts`:

```typescript
setupFiles: ["./tests/setup.ts"],
```

### State leaking between tests

Zustand stores persist state between tests. Reset them:

```typescript
beforeEach(() => {
  useMyStore.setState(initialState);
});
```

### E2E tests timing out

Either increase the timeout or check that the dev server is running:

```typescript
await expect(element).toBeVisible({ timeout: 10000 });
```

Or start the server manually before running tests:

```bash
npm run dev &
npm run test:e2e
```

### Mocks not being applied

`vi.mock()` must be called before any imports of the mocked module. Put it at the top of your test file.

---

## Adding New Tests

When adding a new feature, add tests in this order:

1. **Unit tests** for the core logic (`tests/unit/lib/`)
2. **Integration tests** for component behavior (`tests/integration/`)
3. **E2E tests** for the complete user flow (`tests/e2e/`)

Run the full suite before opening a PR:

```bash
npm run lint && npm run build && npm run test
```

---

Need more help? Check the [Contributing Guide](../docs/contribution-guide.md) or open an issue.
