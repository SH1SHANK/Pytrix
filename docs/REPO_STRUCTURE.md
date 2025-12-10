# Repository Structure

## Directory Overview

```
pypractice-mvp/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── api/             # API routes
│   │   ├── history/         # History page
│   │   ├── insights/        # API usage insights
│   │   ├── modules/         # Curriculum browser
│   │   ├── practice/        # Practice workspace + auto mode
│   │   └── support/         # Settings, help, bug report
│   ├── components/
│   │   ├── ui/              # shadcn/ui primitives
│   │   ├── layout/          # AppShell, AppSidebar
│   │   ├── automode/        # Auto mode components
│   │   ├── dashboard/       # Dashboard cards/grids
│   │   ├── modules/         # Curriculum components
│   │   ├── onboarding/      # First-time user flow
│   │   ├── practice/        # Runner, editor, panels
│   │   ├── insights/        # Charts, tables
│   │   └── help/            # Help components
│   ├── lib/                  # Core services and utilities
│   ├── hooks/                # Custom React hooks
│   ├── data/                 # Static data (topics.json)
│   └── types/                # TypeScript definitions
├── tests/
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── e2e/                 # Playwright E2E tests
├── docs/                     # Developer documentation
└── public/                   # Static assets
```

## Key Files

| File                     | Purpose             |
| ------------------------ | ------------------- |
| `lib/questionService.ts` | Question generation |
| `lib/statsStore.ts`      | Stats persistence   |
| `lib/autoModeService.ts` | Auto mode logic     |
| `lib/pythonRuntime.ts`   | Pyodide execution   |
| `lib/aiClient.ts`        | Gemini AI client    |
| `lib/topicsStore.ts`     | Topic data access   |
| `data/topics.json`       | Curriculum data     |

## Where to Add New Features

| Feature Type | Location                      |
| ------------ | ----------------------------- |
| New page     | `src/app/[route]/page.tsx`    |
| UI component | `src/components/[feature]/`   |
| Core service | `src/lib/`                    |
| Custom hook  | `src/hooks/`                  |
| API route    | `src/app/api/`                |
| Tests        | `tests/unit/` or `tests/e2e/` |

## Conventions

### Naming

- **Components**: PascalCase (`AutoModeStatsBar.tsx`)
- **Hooks**: `use` prefix (`useHydration.ts`)
- **Services**: camelCase with suffix (`statsStore.ts`)
- **Tests**: `.test.ts` / `.test.tsx`

### Testing

- Unit tests: Vitest + @testing-library/react
- E2E tests: Playwright
- Run: `npm run test` / `npm run test:e2e`

### Styling

- Tailwind CSS for all styling
- shadcn/ui for component primitives
- Phosphor icons for iconography
