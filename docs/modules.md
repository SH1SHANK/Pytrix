# Pytrix Modules Reference

Detailed documentation for each core module in the Pytrix codebase.

---

## Module Overview

Pytrix's `lib/` folder is organized into feature-based subfolders:

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

---

## AI Module (`lib/ai/`)

The AI module handles all communication with Google's Gemini API.

### Files

| File                    | Purpose                                |
| ----------------------- | -------------------------------------- |
| `aiClient.ts`           | Primary client-side API wrapper        |
| `geminiClient.ts`       | Low-level Gemini SDK wrapper           |
| `modelRouter.ts`        | Model fallback and rate limit handling |
| `internalTestClient.ts` | Testing utilities                      |
| `index.ts`              | Module exports                         |

### aiClient.ts

The main entry point for AI functionality. All AI calls should go through this module.

#### Key Exports

```typescript
// Question generation
function generateQuestion(
  topic: string,
  difficulty: Difficulty
): Promise<Question>;

// Hint system
function getHints(
  question: Question,
  code: string,
  hintsCount: number
): Promise<Hint>;

// Solution reveal
function revealSolution(
  question: Question,
  failedAttempts: number,
  hintsUsed?: number
): Promise<{ referenceSolution: string }>;

// Code evaluation
function evaluateCode(
  question: Question,
  code: string,
  executionContext?: ExecutionContext
): Promise<EvaluationResult>;

// Solution optimization
function optimizeSolution(
  question: Question,
  userCode: string
): Promise<OptimizedSolution | null>;

// Connection test
function testApiConnection(): Promise<{ valid: boolean; error?: string }>;
```

#### Error Classes

```typescript
class ApiKeyNotConfiguredError extends Error {
  errorType: "NO_API_KEY";
}

class ClientLimitError extends Error {
  errorType: "CLIENT_LIMIT_REACHED";
  safetyResult: SafetyCheckResult;
}

class ApiError extends Error {
  errorType: ApiErrorType;
  status?: number;
}
```

#### Error Types

| Type                   | Cause                  | User Action          |
| ---------------------- | ---------------------- | -------------------- |
| `NO_API_KEY`           | Key not configured     | Show onboarding      |
| `INVALID_KEY`          | 401/403 from Gemini    | Check key            |
| `RATE_LIMIT`           | 429 from Gemini        | Wait and retry       |
| `QUOTA_EXCEEDED`       | Daily limit reached    | Check Google console |
| `NETWORK_ERROR`        | 5xx or network failure | Retry                |
| `CLIENT_LIMIT_REACHED` | Session safety cap     | Refresh page         |

### geminiClient.ts

Low-level wrapper around the Gemini SDK.

```typescript
// Create a new client instance
function createGeminiClient(apiKey: string): GoogleGenerativeAI;

// Get a model with the given API key
function getModelWithKey(
  apiKey: string,
  modelNameOrAlias: string
): GenerativeModel;

// Test if an API key is valid
function testApiKey(
  apiKey: string
): Promise<{ valid: boolean; error?: string }>;
```

### modelRouter.ts

Handles model selection, fallback logic, and error classification.

```typescript
type TaskType =
  | "question-generation"
  | "evaluation"
  | "hint"
  | "solution"
  | "optimization";

interface AIResult<T> {
  success: boolean;
  data?: T;
  message?: string;
  modelUsed?: string;
  usage?: { inputTokens: number; outputTokens: number };
  errorType?:
    | "rate_limit"
    | "config_error"
    | "ai_unavailable"
    | "api_key_required";
}

function callGeminiWithFallback<T>(
  apiKey: string,
  task: TaskType,
  prompt: string,
  parseResponse?: (text: string) => T
): Promise<AIResult<T>>;
```

---

## Question Module (`lib/question/`)

Handles question generation with a two-layer approach: templates + optional LLM enhancement.

### Files

| File                       | Purpose                      |
| -------------------------- | ---------------------------- |
| `questionService.ts`       | Main generation orchestrator |
| `questionTemplates.ts`     | Template definitions         |
| `diversityService.ts`      | Prevents duplicate questions |
| `questionFingerprint.ts`   | Question fingerprinting      |
| `archetypeRegistry.ts`     | Problem archetype registry   |
| `difficultyValidator.ts`   | Difficulty validation        |
| `mockQuestions.ts`         | Mock questions for testing   |
| `questionBufferService.ts` | Question prefetching         |
| `index.ts`                 | Module exports               |

### questionService.ts

The main question generation service.

#### Key Types

```typescript
interface GenerateQuestionOptions {
  problemTypeId: string;
  difficulty: Difficulty;
  preferLLM?: boolean;
  apiKey?: string;
  additionalContext?: string;
  includeReferenceSolution?: boolean;
  skipDiversityCheck?: boolean;
}

interface QuestionResult {
  success: boolean;
  question?: Question;
  source: "template" | "llm" | "fallback";
  error?: GenerationError;
  modelUsed?: string;
  usage?: { inputTokens: number; outputTokens: number };
}

enum GenerationErrorCode {
  PROBLEM_TYPE_NOT_FOUND = "PROBLEM_TYPE_NOT_FOUND",
  TEMPLATE_GENERATION_FAILED = "TEMPLATE_GENERATION_FAILED",
  LLM_CALL_FAILED = "LLM_CALL_FAILED",
  LLM_PARSE_FAILED = "LLM_PARSE_FAILED",
  VALIDATION_FAILED = "VALIDATION_FAILED",
  MAX_RETRIES_EXCEEDED = "MAX_RETRIES_EXCEEDED",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}
```

#### Main Function

```typescript
async function generateQuestion(
  options: GenerateQuestionOptions
): Promise<QuestionResult>;
```

**Flow:**

1. Load base template from `questionTemplates.ts`
2. If `preferLLM=true` and API key provided: try LLM generation
3. On LLM failure or disabled: fall back to template
4. Validate and normalize result
5. Record fingerprint for diversity tracking

### diversityService.ts

Prevents repetitive questions by tracking fingerprints.

```typescript
// Check if a question would be a consecutive repeat
function isConsecutiveRepeat(fingerprint: string): boolean;

// Record a question fingerprint
function recordFingerprint(fingerprint: string): void;

// Get recent fingerprints
function getRecentFingerprints(count?: number): string[];

// Generate diversity constraints for LLM prompts
function getDiversityConstraints(): string;
```

### questionTemplates.ts

Contains template definitions for each problem type and difficulty combination.

```typescript
interface QuestionTemplate {
  id: string;
  problemTypeId: string;
  problemTypeName: string;
  moduleId: string;
  moduleName: string;
  subtopicId: string;
  subtopicName: string;
  difficulty: Difficulty;
  title: string;
  promptTemplate: string;
  compactPrompt: string;
  sampleInputs: string[];
  sampleOutputs: string[];
  edgeCases: EdgeCase[];
  constraints: string[];
  hints: string[];
  tags: string[];
  estimatedMinutes: number;
  starterCode: string;
  testCases: TestCaseTemplate[];
}
```

---

## Runtime Module (`lib/runtime/`)

Handles Python code execution using Pyodide in a Web Worker.

### Files

| File               | Purpose                   |
| ------------------ | ------------------------- |
| `pythonRuntime.ts` | Main runtime orchestrator |
| `pythonWorker.ts`  | Web Worker implementation |
| `testRunner.ts`    | Test case execution       |
| `runtimeConfig.ts` | Configuration and types   |
| `workerTypes.ts`   | Worker message types      |
| `index.ts`         | Module exports            |

### pythonRuntime.ts

The main Python runtime service.

#### Types

```typescript
interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  returnValue?: unknown;
  error?: string;
  traceback?: string;
  executionTimeMs: number;
}

interface RuntimeInfo {
  status: RuntimeStatus;
  version: string | null;
  error: string | null;
  pyodideVersion: string | null;
  heapSize: number | null;
  initTimeMs: number | null;
  lastRunMs: number | null;
}

interface RunOptions {
  timeoutMs?: number;
  prelude?: string;
  context?: Record<string, unknown>;
}

enum RuntimeStatus {
  UNLOADED = "unloaded",
  LOADING = "loading",
  READY = "ready",
  RUNNING = "running",
  ERROR = "error",
}
```

#### Key Functions

```typescript
// Initialize Pyodide runtime
async function initPyodide(): Promise<boolean>;

// Run Python code
async function runPython(
  code: string,
  options?: RunOptions
): Promise<ExecutionResult>;

// Run test cases
async function runTestCases(
  code: string,
  entryFunction: string,
  testCases: TestCase[],
  timeoutMs?: number
): Promise<TestCaseResultData[]>;

// Abort running execution
function abortExecution(): void;

// Get current runtime info
function getRuntimeInfo(): RuntimeInfo;

// Subscribe to status changes
function subscribeToRuntimeStatus(
  listener: (info: RuntimeInfo) => void
): () => void;
```

#### Architecture Notes

- **Singleton Pattern**: One runtime instance per page
- **Web Worker**: Non-blocking execution in separate thread
- **SharedArrayBuffer**: Enables true interruption via interrupt flag
- **Lazy Loading**: Pyodide (~15MB) loaded on first use

### testRunner.ts

Handles test case execution and result evaluation.

```typescript
interface TestCaseResult {
  testCaseId: string;
  status: "passed" | "failed" | "error" | "timeout";
  expectedOutput: string;
  actualOutput: string;
  error?: string;
  executionTimeMs: number;
}

// Run a single test case
async function runSingleTestCase(
  code: string,
  entryFunction: string,
  testCase: TestCase,
  timeoutMs: number
): Promise<TestCaseResult>;
```

---

## Auto Mode Module (`lib/auto-mode/`)

Implements the adaptive practice system with curriculum-aware progression.

### Files

| File                 | Purpose                        |
| -------------------- | ------------------------------ |
| `autoModeService.ts` | Run management and queue logic |
| `autoRunTypes.ts`    | Type definitions               |
| `index.ts`           | Module exports                 |

### autoRunTypes.ts

Core types for Auto Mode.

```typescript
type DifficultyLevel = "beginner" | "intermediate" | "advanced";

interface TopicQueueEntry {
  subtopicId: string;
  subtopicName: string;
  moduleId: string;
  moduleName: string;
  isRemediation?: boolean;
}

interface AutoRunV2 {
  id: string;
  name: string;
  createdAt: number;
  lastActiveAt: number;
  status: "active" | "completed" | "paused";

  // Mini-curriculum state
  miniCurriculumCompleted: boolean;
  miniCurriculumProgress: number;

  // Queue state
  topicQueue: TopicQueueEntry[];
  currentQueueIndex: number;

  // Streak and progression
  currentStreak: number;
  bestStreak: number;
  totalQuestionsAttempted: number;
  totalCorrect: number;

  // Difficulty per subtopic
  difficultyPointer: Record<string, DifficultyLevel>;

  // Settings
  aggressiveProgression: boolean;
  remediationMode: boolean;
}

interface AutoRunConfig {
  streakToPromote: number; // default: 3
  aggressiveStreakToPromote: number; // default: 2
  extraRemediationCount: number; // default: 2
  miniCurriculumSize: number; // default: 12
  decayHours: number; // default: 24
  prefetchBufferSize: number; // default: 2
}
```

### autoModeService.ts

The main Auto Mode service.

#### CRUD Operations

```typescript
// Create a new run
function createAutoRunV2(
  name?: string,
  options?: Partial<
    Pick<AutoRunV2, "aggressiveProgression" | "remediationMode">
  >
): AutoRunV2;

// Load a run by ID
function loadAutoRunV2(runId: string): AutoRunV2 | null;

// Get all runs
function getAllAutoRunsV2(): AutoRunV2[];

// Delete a run
function deleteAutoRunV2(runId: string): boolean;

// Update run name
function updateRunName(runId: string, newName: string): boolean;
```

#### Queue Management

```typescript
// Get current queue entry
function getCurrentQueueEntry(run: AutoRunV2): TopicQueueEntry | null;

// Advance to next question
function advanceQueue(run: AutoRunV2): AutoRunV2;

// Skip to next module (neutral action)
function skipToNextModule(run: AutoRunV2): AutoRunV2;

// Jump to specific queue index
function jumpToQueueIndex(run: AutoRunV2, targetIndex: number): AutoRunV2;
```

#### Difficulty Management

```typescript
// Get subtopic difficulty
function getSubtopicDifficulty(
  run: AutoRunV2,
  subtopicId: string
): DifficultyLevel;

// Promote difficulty (on streak)
function promoteSubtopicDifficulty(
  run: AutoRunV2,
  subtopicId: string
): AutoRunV2;

// Demote difficulty (on failure)
function demoteSubtopicDifficulty(
  run: AutoRunV2,
  subtopicId: string
): AutoRunV2;
```

#### Progression Logic

```typescript
// Record correct answer
function recordCorrectAnswer(run: AutoRunV2, subtopicId: string): AutoRunV2;
// - Increments streak
// - Promotes difficulty if streak >= threshold
// - Advances queue

// Record incorrect answer
function recordIncorrectAnswer(run: AutoRunV2, subtopicId: string): AutoRunV2;
// - Resets streak to 0
// - Demotes difficulty
// - Injects remediation questions if enabled
```

---

## Stores Module (`lib/stores/`)

Centralized state management using Zustand with localStorage persistence.

### Files

| File                    | Purpose                    |
| ----------------------- | -------------------------- |
| `settingsStore.ts`      | Application settings       |
| `statsStore.ts`         | Practice statistics        |
| `historyStore.ts`       | Session history            |
| `topicsStore.ts`        | Topic data access          |
| `apiKeyStore.ts`        | API key storage            |
| `usageStore.ts`         | API usage tracking         |
| `apiUsageEntryStore.ts` | Detailed usage entries     |
| `index.ts`              | Module exports (selective) |

> [!NOTE]
> The `index.ts` does not re-export all modules because `statsStore` and `topicsStore` both export `getModuleStats()` with different purposes. Import from specific modules.

### settingsStore.ts

Manages all application settings.

```typescript
interface SettingsState {
  general: GeneralSettings
  appearance: AppearanceSettings
  editor: EditorSettings
  practice: PracticeSettings
  keyBindings: KeyBinding[]
  advanced: AdvancedSettings
  privacy: PrivacySettings

  // Onboarding
  hasCompletedOnboarding: boolean
  onboardingStep: number
  apiKeyLastVerified: string | null

  // Actions
  updateGeneral: (settings: Partial<GeneralSettings>) => void
  updateAppearance: (settings: Partial<AppearanceSettings>) => void
  updateEditor: (settings: Partial<EditorSettings>) => void
  // ... more update functions
  resetToDefaults: () => void
  clearAllData: () => void
}

const useSettingsStore = create<SettingsState>()(persist(...))
```

### statsStore.ts

Tracks practice statistics with hierarchical structure.

```typescript
interface GlobalStatsV2 {
  version: 3;
  totalAttempts: number;
  totalSolved: number;
  totalTimeTakenMs: number;
  modulesTouched: number;
  subtopicsTouched: number;
  masteryPercent: number;
  currentManualStreak: number;
  modules: ModuleStats[];
  lastUpdatedAt: number;
}

// Record a practice attempt
function recordAttempt(input: RecordAttemptInput): GlobalStatsV2;

// Get stats
function getStatsV2(): GlobalStatsV2;
function getModuleStats(moduleId: string): ModuleStats | null;
function getSubtopicStats(
  moduleId: string,
  subtopicId: string
): SubtopicStats | null;

// Analytics
function getWeakestModules(count?: number): ModuleStats[];
function getWeakestSubtopics(
  count?: number
): Array<{ moduleId: string; subtopic: SubtopicStats }>;
function getUntouchedModules(): string[];

// Management
function resetStatsV2(): GlobalStatsV2;
```

### apiKeyStore.ts

Manages API key persistence.

```typescript
interface UserApiConfig {
  provider: "gemini";
  apiKey: string;
  createdAt: number;
}

// Check if configured
function isApiKeyConfigured(): boolean;

// Load/save
function loadUserApiConfig(): UserApiConfig | null;
function saveUserApiConfig(config: UserApiConfig): void;
function clearUserApiConfig(): void;

// Get key for provider
function getApiKeyForProvider(provider: string): string | null;

// Helper to create config
function createApiConfig(provider: "gemini", apiKey: string): UserApiConfig;
```

**Storage Key:** `pypractice_api_config_v1`

### topicsStore.ts

Provides access to the topics/curriculum data.

```typescript
// Get all modules
function getAllModules(): Module[];

// Get specific module
function getModule(moduleId: string): Module | null;

// Get subtopic
function getSubtopic(moduleId: string, subtopicId: string): Subtopic | null;

// Get problem type
function getProblemType(
  moduleId: string,
  subtopicId: string,
  problemTypeId: string
): ProblemType | null;

// Search
function searchTopics(query: string): SearchResult[];
```

---

## Import Patterns

### Recommended Imports

```typescript
// Import from specific module files
import { getQuestion } from "@/lib/question/questionService";
import { getStatsV2 } from "@/lib/stores/statsStore";
import { createAutoRunV2 } from "@/lib/auto-mode";

// Import types
import type { Question, Difficulty } from "@/lib/types";

// AI client (primary entry point)
import { generateQuestion, evaluateCode } from "@/lib/ai/aiClient";

// Runtime
import { runPython, initPyodide } from "@/lib/runtime";
```

### Where to Add New Code

| Type of Code               | Location         |
| -------------------------- | ---------------- |
| Question generation logic  | `lib/question/`  |
| Auto mode / adaptive logic | `lib/auto-mode/` |
| Persisted state stores     | `lib/stores/`    |
| AI / LLM integration       | `lib/ai/`        |
| Python runtime             | `lib/runtime/`   |
| Shared types               | `lib/types/`     |
| Generic helpers            | `lib/utils/`     |

---

## Extension Examples

### Adding a New AI Feature

1. **Add API route:**

```typescript
// src/app/api/ai/new-feature/route.ts
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("X-API-Key");
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key required", errorType: "api_key_required" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const result = await callGeminiWithFallback(apiKey, "hint", prompt);

  return NextResponse.json({
    data: result.data,
    usage: result.usage,
  });
}
```

2. **Add client function:**

```typescript
// src/lib/ai/aiClient.ts
export async function newFeature(params: Params): Promise<Result> {
  const apiKey = getApiKey();

  const response = await fetch("/api/ai/new-feature", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify(params),
  });

  const data = await handleResponse(response);
  recordUsageIfPresent(data.usage, { feature: "new-feature" });
  return data.data;
}
```

### Adding a New Store

```typescript
// src/lib/stores/myStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MyState {
  items: Item[];
  addItem: (item: Item) => void;
  removeItem: (id: string) => void;
}

export const useMyStore = create<MyState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => ({
          items: [...state.items, item],
        })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
    }),
    { name: "pytrix-my-store" }
  )
);
```
