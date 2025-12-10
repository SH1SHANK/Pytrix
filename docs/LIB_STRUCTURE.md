# lib/ Folder Structure

The `lib/` folder is organized into feature-based subfolders for clarity and maintainability.

## Subfolders

| Folder       | Purpose                                            |
| ------------ | -------------------------------------------------- |
| `ai/`        | Gemini client, model router, BYOK integration      |
| `question/`  | Question generation, templates, diversity          |
| `auto-mode/` | Adaptive practice mode (AutoRunV2)                 |
| `stores/`    | Persisted state (stats, settings, topics, history) |
| `runtime/`   | Python execution (Pyodide)                         |
| `search/`    | Command palette search index                       |
| `safety/`    | API rate limiting and safety controls              |
| `types/`     | Shared type definitions                            |
| `utils/`     | Generic utilities                                  |

## Import Patterns

```typescript
// Import from specific module files
import { getQuestion } from "@/lib/question/questionService";
import { getStats } from "@/lib/stores/statsStore";
import { createAutoRunV2 } from "@/lib/auto-mode";

// Import types
import type { Question, Evaluation } from "@/lib/types";
```

## Where to Add New Code

| Type of Code               | Location         |
| -------------------------- | ---------------- |
| Question generation logic  | `lib/question/`  |
| Auto mode / adaptive logic | `lib/auto-mode/` |
| Persisted state stores     | `lib/stores/`    |
| AI / LLM integration       | `lib/ai/`        |
| Python runtime             | `lib/runtime/`   |
| Shared types               | `lib/types/`     |
| Generic helpers            | `lib/utils/`     |

## Notes

- **stores/index.ts**: Does not re-export modules because `statsStore` and `topicsStore` both export `getModuleStats()` with different purposes. Import from the specific module you need.
- **V1 Compatibility**: `auto-mode/autoModeService.ts` includes deprecated aliases (`getSaveFiles`, `createSaveFile`, etc.) for backwards compatibility.
