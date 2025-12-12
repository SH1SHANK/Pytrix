# Contribution Guide

Welcome to Pytrix! We're excited that you want to contribute. This guide will help you get started.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Code Standards](#code-standards)
4. [Testing](#testing)
5. [Pull Request Process](#pull-request-process)
6. [Architecture Guidelines](#architecture-guidelines)
7. [Documentation](#documentation)
8. [Community](#community)

---

## Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **npm** 10.x or higher (or pnpm)
- **Git** for version control
- A code editor (VS Code recommended)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Pytrix.git
   cd Pytrix
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/SH1SHANK/Pytrix.git
   ```

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Development Setup

### Recommended VS Code Extensions

- **ESLint** — Linting integration
- **Tailwind CSS IntelliSense** — Tailwind autocomplete
- **TypeScript Vue Plugin (Volar)** — Better TypeScript support
- **Prettier** — Code formatting (optional)

### Environment Files

No environment variables are required for basic development. The app uses a BYOK model where users provide their own API key.

For API integration tests (optional):

```bash
cp tests/env.test.local.example .env.test.local
# Edit .env.test.local with your test API key
```

> [!CAUTION]
> Never commit `.env.test.local` or any file containing API keys.

---

## Code Standards

### TypeScript

We use TypeScript in strict mode. Key rules:

```typescript
// ✅ Good: Explicit types for function parameters
function calculateMastery(attempts: number, solved: number): number {
  return attempts > 0 ? Math.round((solved / attempts) * 100) : 0
}

// ❌ Bad: Using 'any'
function processData(data: any) { ... }

// ✅ Good: Use specific types or generics
function processData<T extends Record<string, unknown>>(data: T) { ... }
```

### Naming Conventions

| Type             | Convention               | Example                               |
| ---------------- | ------------------------ | ------------------------------------- |
| Components       | PascalCase               | `QuestionPanel.tsx`                   |
| Hooks            | `use` prefix             | `useHydration.ts`                     |
| Services/Stores  | camelCase with suffix    | `statsStore.ts`, `questionService.ts` |
| Types/Interfaces | PascalCase               | `Question`, `AutoRunV2`               |
| Constants        | SCREAMING_SNAKE_CASE     | `DEFAULT_TIMEOUT_MS`                  |
| Test files       | `.test.ts` / `.test.tsx` | `statsStore.test.ts`                  |

### File Organization

```
src/
├── app/                  # Next.js pages (App Router)
│   ├── api/             # API routes
│   ├── [route]/         # Page routes
│   └── layout.tsx       # Root layout
├── components/
│   ├── ui/              # shadcn/ui primitives
│   └── [feature]/       # Feature-specific components
├── lib/
│   ├── ai/              # AI/LLM integration
│   ├── stores/          # Zustand stores
│   └── [feature]/       # Feature modules
├── hooks/               # Custom React hooks
├── types/               # Shared TypeScript types
└── data/                # Static data files
```

### ESLint

We use ESLint for code quality. Run before committing:

```bash
npm run lint
```

Fix auto-fixable issues:

```bash
npm run lint -- --fix
```

### Component Guidelines

```tsx
// ✅ Good: Clear component structure
interface QuestionPanelProps {
  question: Question;
  onHintRequest: () => void;
}

export function QuestionPanel({ question, onHintRequest }: QuestionPanelProps) {
  // 1. Hooks
  const [expanded, setExpanded] = useState(false);

  // 2. Derived state
  const hasTestCases = question.testCases.length > 0;

  // 3. Effects
  useEffect(() => {
    // Side effects
  }, [question.id]);

  // 4. Handlers
  const handleExpand = () => setExpanded(true);

  // 5. Render
  return <div>{/* JSX */}</div>;
}
```

---

## Testing

### Test Stack

| Tool                       | Purpose                    |
| -------------------------- | -------------------------- |
| **Vitest**                 | Unit and integration tests |
| **@testing-library/react** | React component testing    |
| **Playwright**             | End-to-end browser tests   |
| **jsdom**                  | DOM simulation             |

### Running Tests

```bash
# All tests
npm run test

# Watch mode (development)
npm run test:watch

# Unit tests only
npm run test:unit

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Writing Unit Tests

```typescript
// tests/unit/lib/myFeature.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { myFunction } from "@/lib/myFeature";

describe("myFunction", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should return expected value", () => {
    const result = myFunction("input");
    expect(result).toBe("expected");
  });

  it("should handle edge case", () => {
    expect(() => myFunction("")).toThrow();
  });
});
```

### Writing E2E Tests

```typescript
// tests/e2e/myFlow.test.ts
import { test, expect } from "@playwright/test";

test.describe("My Feature", () => {
  test.beforeEach(async ({ page }) => {
    // Skip onboarding
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

  test("should complete the flow", async ({ page }) => {
    await page.goto("/my-page");
    await page.getByRole("button", { name: "Action" }).click();
    await expect(page.getByText("Success")).toBeVisible();
  });
});
```

### Test Coverage Requirements

For new features:

- Unit tests for all public functions
- Integration tests for complex flows
- E2E tests for user-facing features

Minimum coverage targets:

- Statements: 70%
- Branches: 60%
- Functions: 70%

---

## Pull Request Process

### Branch Naming

```
feature/short-description    # New features
fix/issue-description       # Bug fixes
docs/what-changed          # Documentation
refactor/what-changed      # Code refactoring
test/what-tested          # Test additions
```

### Before Opening a PR

1. **Sync with upstream:**

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks:**

   ```bash
   npm run lint
   npm run build
   npm run test
   ```

3. **Write meaningful commit messages:**

   ```
   feat: add question prefetching for faster Auto Mode

   - Implement QuestionBufferService
   - Prefetch 2 questions ahead
   - Add tests for buffer management

   Closes #123
   ```

### PR Requirements

- [ ] All CI checks pass (lint, build)
- [ ] Tests added for new functionality
- [ ] Documentation updated if needed
- [ ] No unrelated changes
- [ ] Clear description of what and why

### PR Template

```markdown
## Description

Brief description of changes.

## Type

- [ ] Feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Refactor

## Testing

Describe how you tested the changes.

## Screenshots (if UI changes)

Add screenshots or recordings.

## Checklist

- [ ] Lint passes
- [ ] Build passes
- [ ] Tests added/updated
- [ ] Docs updated
```

### Review Process

1. **Automated checks** run on all PRs
2. **Maintainer review** required for approval
3. **Address feedback** with additional commits or amendments
4. **Squash and merge** when approved

---

## Architecture Guidelines

### Where to Add New Features

| Feature Type | Location                      |
| ------------ | ----------------------------- |
| New page     | `src/app/[route]/page.tsx`    |
| UI component | `src/components/[feature]/`   |
| Core service | `src/lib/[feature]/`          |
| Custom hook  | `src/hooks/`                  |
| API route    | `src/app/api/`                |
| Tests        | `tests/unit/` or `tests/e2e/` |

### State Management

Use **Zustand** for application state:

```typescript
// ✅ Good: Zustand store with persistence
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MyStore {
  value: string;
  setValue: (value: string) => void;
}

export const useMyStore = create<MyStore>()(
  persist(
    (set) => ({
      value: "",
      setValue: (value) => set({ value }),
    }),
    { name: "pytrix-my-store" }
  )
);
```

### AI Integration Pattern

Always use `aiClient.ts` for AI features:

```typescript
// ✅ Good: Use aiClient
import { generateQuestion } from "@/lib/ai/aiClient"

// ❌ Bad: Direct API calls
fetch("/api/ai/generate-question", { ... })
```

### Error Handling

Use typed errors and user-friendly messages:

```typescript
// ✅ Good: Typed error handling
try {
  const question = await generateQuestion(topic, difficulty);
} catch (error) {
  if (error instanceof ApiKeyNotConfiguredError) {
    // Show settings prompt
  } else if (error instanceof ClientLimitError) {
    // Show limit message
  } else {
    // Generic error handling
  }
}
```

---

## Documentation

### Code Documentation

Use JSDoc for public functions:

````typescript
/**
 * Generates a question for the given topic and difficulty.
 *
 * @param topic - The topic or subtopic name
 * @param difficulty - Difficulty level
 * @returns Promise resolving to a Question object
 * @throws {ApiKeyNotConfiguredError} If no API key is configured
 * @throws {ClientLimitError} If session limit is exceeded
 *
 * @example
 * ```typescript
 * const question = await generateQuestion("Strings", "beginner")
 * ```
 */
export async function generateQuestion(
  topic: string,
  difficulty: Difficulty
): Promise<Question> {
  // ...
}
````

### README Updates

Update README.md for:

- New features
- Changed installation steps
- New dependencies
- Breaking changes

### Docs Updates

Update files in `docs/` for:

- API changes → `api-reference.md`
- Architecture changes → `architecture.md`
- New modules → `modules.md`

---

## Community

### Getting Help

- Open a [Discussion](https://github.com/SH1SHANK/Pytrix/discussions) for questions
- Check existing [Issues](https://github.com/SH1SHANK/Pytrix/issues) for known problems

### Reporting Bugs

Include:

1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser/OS information
5. Screenshots if applicable

### Suggesting Features

Open an issue with:

1. Problem you're solving
2. Proposed solution
3. Alternatives considered
4. Willingness to implement

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./licensing.md).

---

## Thank You!

Every contribution helps make Pytrix better. Whether it's:

- Fixing a typo
- Reporting a bug
- Adding a feature
- Improving documentation

We appreciate your time and effort! 🎉
