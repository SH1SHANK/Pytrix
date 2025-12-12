# Pytrix API Reference

Complete API documentation for all public surfaces in Pytrix.

---

## Table of Contents

1. [AI Client API](#ai-client-api)
2. [Python Runtime API](#python-runtime-api)
3. [Question Service API](#question-service-api)
4. [Auto Mode Service API](#auto-mode-service-api)
5. [Stats Store API](#stats-store-api)
6. [Settings Store API](#settings-store-api)
7. [Type Definitions](#type-definitions)
8. [API Routes (HTTP)](#api-routes-http)

---

## AI Client API

**Module:** `@/lib/ai/aiClient`

The primary interface for all AI-powered features.

### generateQuestion

Generates a new question for a given topic and difficulty.

```typescript
function generateQuestion(
  topic: string,
  difficulty: Difficulty
): Promise<Question>;
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `topic` | `string` | Topic/subtopic name (e.g., "Basic String Operations") |
| `difficulty` | `Difficulty` | `"beginner"`, `"intermediate"`, or `"advanced"` |

**Returns:** `Promise<Question>` - Generated question object

**Throws:**

- `ApiKeyNotConfiguredError` - No API key in storage
- `ClientLimitError` - Session safety cap exceeded
- `ApiError` - API request failed

**Example:**

```typescript
import { generateQuestion } from "@/lib/ai/aiClient";

try {
  const question = await generateQuestion("Two-Pointer Techniques", "beginner");
  console.log(question.title, question.description);
} catch (error) {
  if (error instanceof ApiKeyNotConfiguredError) {
    // Redirect to settings
  }
}
```

---

### getHints

Retrieves a progressive hint for the current question.

```typescript
function getHints(
  question: Question,
  code: string,
  hintsCount: number
): Promise<Hint>;
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `question` | `Question` | Current question object |
| `code` | `string` | User's current code |
| `hintsCount` | `number` | Number of hints already given (0, 1, 2) |

**Returns:** `Promise<Hint>` - Hint object with `hint` string and `level` number

**Notes:**

- `hintsCount=0`: First hint (gentle nudge)
- `hintsCount=1`: Second hint (more explicit)
- `hintsCount=2`: Final hint (very specific)

---

### revealSolution

Reveals the reference solution for a question.

```typescript
function revealSolution(
  question: Question,
  failedAttempts: number,
  hintsUsed?: number
): Promise<{ referenceSolution: string }>;
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `question` | `Question` | Current question object |
| `failedAttempts` | `number` | Number of failed attempts |
| `hintsUsed` | `number` | Optional. Number of hints used (default: 0) |

**Returns:** `Promise<{ referenceSolution: string }>` - Object containing the solution code

---

### evaluateCode

Evaluates user's code against the question requirements.

```typescript
function evaluateCode(
  question: Question,
  code: string,
  executionContext?: ExecutionContext
): Promise<EvaluationResult>;
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `question` | `Question` | Current question object |
| `code` | `string` | User's submitted code |
| `executionContext` | `ExecutionContext` | Optional. Execution results (stdout, stderr, test results) |

**ExecutionContext Type:**

```typescript
interface ExecutionContext {
  stdout?: string;
  stderr?: string;
  didExecute?: boolean;
  testResults?: {
    testCaseId: string;
    status: "passed" | "failed" | "error" | "timeout";
    expectedOutput: string;
    actualOutput: string;
    error?: string;
  }[];
}
```

**Returns:** `Promise<EvaluationResult>`

```typescript
interface EvaluationResult {
  status: "correct" | "incorrect" | "error";
  explanation: string;
  expectedBehavior?: string;
  nextHint?: string | null;
}
```

---

### optimizeSolution

Gets an optimized/idiomatic version of the user's correct solution.

```typescript
function optimizeSolution(
  question: Question,
  userCode: string
): Promise<OptimizedSolution | null>;
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `question` | `Question` | Current question object |
| `userCode` | `string` | User's correct solution |

**Returns:** `Promise<OptimizedSolution | null>` - Optimized solution or `null` if unavailable

```typescript
interface OptimizedSolution {
  code: string;
  explanation: string;
  keyImprovements: string[];
}
```

**Notes:**

- Returns `null` gracefully if no API key configured
- Intended to be called only after the user has solved the problem correctly

---

### testApiConnection

Tests if the configured API key is valid.

```typescript
function testApiConnection(): Promise<{ valid: boolean; error?: string }>;
```

**Returns:** Object indicating validity and optional error message

---

## Python Runtime API

**Module:** `@/lib/runtime`

Interface for executing Python code in the browser.

### initPyodide

Initializes the Pyodide runtime.

```typescript
function initPyodide(): Promise<boolean>;
```

**Returns:** `Promise<boolean>` - `true` if initialization successful

**Notes:**

- Downloads Pyodide (~15MB) on first call
- Subsequent calls return immediately if already initialized
- Uses a Web Worker for non-blocking operation

---

### runPython

Executes Python code and captures output.

```typescript
function runPython(
  code: string,
  options?: RunOptions
): Promise<ExecutionResult>;
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `code` | `string` | Python code to execute |
| `options` | `RunOptions` | Optional. Execution options |

**RunOptions Type:**

```typescript
interface RunOptions {
  timeoutMs?: number; // Default: 5000
  prelude?: string; // Code to run before main code
  context?: Record<string, unknown>; // Variables to inject
}
```

**Returns:** `Promise<ExecutionResult>`

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
```

**Example:**

```typescript
import { runPython, initPyodide } from "@/lib/runtime";

await initPyodide();

const result = await runPython(`
def greet(name):
    return f"Hello, {name}!"
    
print(greet("World"))
`);

console.log(result.stdout); // "Hello, World!\n"
```

---

### runTestCases

Runs multiple test cases against user code.

```typescript
function runTestCases(
  code: string,
  entryFunction: string,
  testCases: TestCase[],
  timeoutMs?: number
): Promise<TestCaseResultData[]>;
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `code` | `string` | User's Python code |
| `entryFunction` | `string` | Name of function to test (e.g., `"solve"`) |
| `testCases` | `TestCase[]` | Array of test cases |
| `timeoutMs` | `number` | Optional. Timeout per test (default: 5000) |

**Returns:** `Promise<TestCaseResultData[]>`

```typescript
interface TestCaseResultData {
  testCaseId: string;
  status: "passed" | "failed" | "error" | "timeout";
  expectedOutput: string;
  actualOutput: string;
  error?: string;
  executionTimeMs: number;
}
```

---

### abortExecution

Aborts all running executions.

```typescript
function abortExecution(): void;
```

**Notes:**

- Uses SharedArrayBuffer to signal interrupt
- Triggers `KeyboardInterrupt` in Python

---

### getRuntimeInfo

Gets current runtime status and metadata.

```typescript
function getRuntimeInfo(): RuntimeInfo;
```

**Returns:**

```typescript
interface RuntimeInfo {
  status: "unloaded" | "loading" | "ready" | "running" | "error";
  version: string | null; // Python version (e.g., "3.11.3")
  pyodideVersion: string | null; // Pyodide version (e.g., "0.29.0")
  heapSize: number | null; // Bytes
  initTimeMs: number | null; // Cold start time
  lastRunMs: number | null; // Last execution time
  error: string | null;
}
```

---

### subscribeToRuntimeStatus

Subscribes to runtime status changes.

```typescript
function subscribeToRuntimeStatus(
  listener: (info: RuntimeInfo) => void
): () => void;
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `listener` | `function` | Callback invoked on status change |

**Returns:** Unsubscribe function

---

## Question Service API

**Module:** `@/lib/question/questionService`

Lower-level question generation with template support.

### generateQuestion

Generates a question with configurable options.

```typescript
function generateQuestion(
  options: GenerateQuestionOptions
): Promise<QuestionResult>;
```

**Parameters:**

```typescript
interface GenerateQuestionOptions {
  problemTypeId: string; // e.g., "indexing-and-slicing"
  difficulty: Difficulty;
  preferLLM?: boolean; // Use AI if available
  apiKey?: string; // Required if preferLLM=true
  additionalContext?: string; // Extra context for LLM
  includeReferenceSolution?: boolean;
  skipDiversityCheck?: boolean; // Skip duplicate detection
}
```

**Returns:**

```typescript
interface QuestionResult {
  success: boolean;
  question?: Question;
  source: "template" | "llm" | "fallback";
  error?: GenerationError;
  modelUsed?: string;
  usage?: { inputTokens: number; outputTokens: number };
}
```

---

## Auto Mode Service API

**Module:** `@/lib/auto-mode`

Adaptive practice mode management.

### createAutoRunV2

Creates a new Auto Mode run.

```typescript
function createAutoRunV2(
  name?: string,
  options?: Partial<
    Pick<AutoRunV2, "aggressiveProgression" | "remediationMode">
  >
): AutoRunV2;
```

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | `"Run #N"` | Run display name |
| `options.aggressiveProgression` | `boolean` | `false` | Promote after 2 correct (vs 3) |
| `options.remediationMode` | `boolean` | `true` | Inject remediation on failure |

**Returns:** New `AutoRunV2` object

---

### loadAutoRunV2

Loads an existing run by ID.

```typescript
function loadAutoRunV2(runId: string): AutoRunV2 | null;
```

---

### getAllAutoRunsV2

Gets all saved runs.

```typescript
function getAllAutoRunsV2(): AutoRunV2[];
```

---

### deleteAutoRunV2

Deletes a run.

```typescript
function deleteAutoRunV2(runId: string): boolean;
```

---

### advanceQueue

Advances to the next question in the run's queue.

```typescript
function advanceQueue(run: AutoRunV2): AutoRunV2;
```

**Notes:**

- Returns updated run (must be saved)
- Automatically extends queue if near end

---

### recordCorrectAnswer

Records a correct answer and handles streak/difficulty progression.

```typescript
function recordCorrectAnswer(run: AutoRunV2, subtopicId: string): AutoRunV2;
```

**Effects:**

- Increments streak
- Promotes difficulty if streak reaches threshold
- Updates statistics

---

### recordIncorrectAnswer

Records an incorrect answer and handles demotion/remediation.

```typescript
function recordIncorrectAnswer(run: AutoRunV2, subtopicId: string): AutoRunV2;
```

**Effects:**

- Resets streak to 0
- Demotes difficulty
- Injects remediation questions (if enabled)

---

## Stats Store API

**Module:** `@/lib/stores/statsStore`

Practice statistics tracking.

### getStatsV2

Gets global statistics.

```typescript
function getStatsV2(): GlobalStatsV2;
```

**Returns:**

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
```

---

### recordAttempt

Records a practice attempt.

```typescript
function recordAttempt(input: RecordAttemptInput): GlobalStatsV2;
```

**Parameters:**

```typescript
interface RecordAttemptInput {
  moduleId: string;
  subtopicId: string;
  problemTypeId: string;
  correct: boolean;
  timeTakenMs: number;
  difficulty?: DifficultyLevel;
}
```

---

### getModuleStats

Gets stats for a specific module.

```typescript
function getModuleStats(moduleId: string): ModuleStats | null;
```

---

### getWeakestSubtopics

Gets subtopics with lowest mastery (for targeted practice).

```typescript
function getWeakestSubtopics(
  count?: number
): Array<{ moduleId: string; subtopic: SubtopicStats }>;
```

---

### resetStatsV2

Resets all statistics.

```typescript
function resetStatsV2(): GlobalStatsV2;
```

---

## Settings Store API

**Module:** `@/lib/stores/settingsStore`

Application settings management (Zustand store).

### useSettingsStore

React hook for settings state.

```typescript
const useSettingsStore: UseBoundStore<StoreApi<SettingsState>>;
```

**Usage:**

```typescript
import { useSettingsStore } from "@/lib/stores/settingsStore";

function Component() {
  const theme = useSettingsStore((state) => state.appearance.theme);
  const updateAppearance = useSettingsStore((state) => state.updateAppearance);

  return (
    <button onClick={() => updateAppearance({ theme: "github-light" })}>
      Switch to Light
    </button>
  );
}
```

**Available Actions:**

- `updateGeneral(settings: Partial<GeneralSettings>)`
- `updateAppearance(settings: Partial<AppearanceSettings>)`
- `updateEditor(settings: Partial<EditorSettings>)`
- `updatePractice(settings: Partial<PracticeSettings>)`
- `updateKeyBinding(action: string, newKey: string)`
- `updateAdvanced(settings: Partial<AdvancedSettings>)`
- `updatePrivacy(settings: Partial<PrivacySettings>)`
- `completeOnboarding()`
- `resetToDefaults()`
- `clearAllData()`

---

## Type Definitions

### Core Types

```typescript
// Difficulty levels
type Difficulty = "beginner" | "intermediate" | "advanced";

// Run status
type RunStatus = "not_run" | "correct" | "incorrect" | "error";
```

### Question Types

```typescript
interface Question {
  id: string;
  topicId: string; // Normalized ID
  topicName: string; // Display name
  topic: string; // AI field
  difficulty: Difficulty;
  title: string;
  description: string;
  inputDescription: string;
  outputDescription: string;
  constraints: string[];
  sampleInput: string;
  sampleOutput: string;
  starterCode: string;
  referenceSolution: string | null;
  testCases: TestCase[]; // >= 3 required
}

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  description?: string;
}
```

### Hint Types

```typescript
interface Hint {
  hint: string;
  level: number; // 1 = gentle, 2 = more explicit
}
```

### Evaluation Types

```typescript
type EvaluationStatus = "correct" | "incorrect" | "error";

interface EvaluationResult {
  status: EvaluationStatus;
  explanation: string;
  expectedBehavior: string;
  nextHint: string | null;
}
```

### Topic Types

```typescript
interface Module {
  id: string; // kebab-case
  name: string;
  order: number;
  overview?: string;
  subtopics: Subtopic[];
  problemArchetypes: string[];
  pythonConsiderations?: string[];
}

interface Subtopic {
  id: string;
  name: string;
  sectionNumber?: string;
  concepts?: string[];
  problemTypes: ProblemType[];
}

interface ProblemType {
  id: string;
  name: string;
  description?: string;
}
```

### Auto Mode Types

```typescript
interface AutoRunV2 {
  id: string;
  name: string;
  createdAt: number;
  lastActiveAt: number;
  status: "active" | "completed" | "paused";

  miniCurriculumCompleted: boolean;
  miniCurriculumProgress: number;

  topicQueue: TopicQueueEntry[];
  currentQueueIndex: number;

  currentStreak: number;
  bestStreak: number;
  totalQuestionsAttempted: number;
  totalCorrect: number;

  difficultyPointer: Record<string, DifficultyLevel>;

  aggressiveProgression: boolean;
  remediationMode: boolean;
}

interface TopicQueueEntry {
  subtopicId: string;
  subtopicName: string;
  moduleId: string;
  moduleName: string;
  isRemediation?: boolean;
}
```

---

## API Routes (HTTP)

All routes require the `X-API-Key` header with the user's Gemini API key.

### POST /api/ai/generate-question

Generates a new question.

**Request:**

```json
{
  "topic": "Two-Pointer Techniques",
  "difficulty": "beginner"
}
```

**Response:**

```json
{
  "question": {
    /* Question object */
  },
  "usage": {
    "model": "gemini-1.5-flash",
    "inputTokens": 150,
    "outputTokens": 500
  }
}
```

---

### POST /api/ai/get-hints

Gets a hint for the current question.

**Request:**

```json
{
  "question": {
    /* Question object */
  },
  "code": "def solve(s): pass",
  "hintsCount": 0
}
```

**Response:**

```json
{
  "hint": {
    "hint": "Consider using two pointers...",
    "level": 1
  },
  "usage": {
    /* ... */
  }
}
```

---

### POST /api/ai/reveal-solution

Reveals the reference solution.

**Request:**

```json
{
  "question": {
    /* Question object */
  },
  "failedAttempts": 3
}
```

**Response:**

```json
{
  "referenceSolution": "def solve(s):\n    ...",
  "usage": {
    /* ... */
  }
}
```

---

### POST /api/ai/evaluate-code

Evaluates user code.

**Request:**

```json
{
  "question": {
    /* Question object */
  },
  "code": "def solve(s): return s[::-1]",
  "output": "olleh",
  "error": null
}
```

**Response:**

```json
{
  "evaluation": {
    "status": "correct",
    "explanation": "Your solution correctly reverses...",
    "expectedBehavior": "...",
    "nextHint": null
  },
  "usage": {
    /* ... */
  }
}
```

---

### POST /api/ai/optimize-solution

Gets an optimized version of a correct solution.

**Request:**

```json
{
  "question": {
    /* Question object */
  },
  "userCode": "def solve(s): ..."
}
```

**Response:**

```json
{
  "optimized": {
    "code": "def solve(s): ...",
    "explanation": "...",
    "keyImprovements": ["Used list comprehension", "..."]
  },
  "usage": {
    /* ... */
  }
}
```

---

### POST /api/ai/test-connection

Tests API key validity.

**Request:** (empty body)

**Response:**

```json
{
  "valid": true
}
```

or

```json
{
  "valid": false,
  "error": "Invalid API key"
}
```

---

## Error Responses

All API routes return errors in this format:

```json
{
  "error": "Human-readable error message",
  "errorType": "api_key_required" | "config_error" | "rate_limit" | "ai_unavailable"
}
```

**HTTP Status Codes:**
| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad request (invalid body) |
| 401 | Unauthorized (missing or invalid API key) |
| 429 | Rate limited |
| 500 | Server error |
