/**
 * Test Runner Service
 *
 * Executes user code against test cases via Pyodide.
 * Each test case is executed independently with its own timeout.
 *
 * Features:
 * - Per-test-case execution with timeout
 * - Function detection (solution, solve, or first defined function)
 * - Deterministic output comparison
 * - Isolated error handling per test
 */

import {
  runPython,
  isRuntimeReady,
  initPyodide,
  runTestCases as runTestCasesInWorker,
} from "./pythonRuntime";
import { TestCase } from "@/lib/types/common";

// ============================================
// TYPES
// ============================================

export type TestStatus = "passed" | "failed" | "error" | "timeout" | "pending";

export interface TestCaseResult {
  testCaseId: string;
  testCaseIndex: number;
  status: TestStatus;
  expectedOutput: string;
  actualOutput: string;
  executionTimeMs: number;
  error?: string;
  traceback?: string;
}

export interface TestRunSummary {
  totalTests: number;
  passedCount: number;
  failedCount: number;
  errorCount: number;
  timeoutCount: number;
  totalExecutionTimeMs: number;
  results: TestCaseResult[];
}

export interface TestRunnerOptions {
  /** Timeout per test case in milliseconds (default: 5000) */
  timeoutMs?: number;
  /** Entry function name to call (default: auto-detect) */
  entryFunction?: string;
  /** Whether to trim whitespace when comparing outputs (default: true) */
  trimOutput?: boolean;
  /** Whether to normalize line endings (default: true) */
  normalizeLineEndings?: boolean;
}

// ============================================
// OUTPUT COMPARISON
// ============================================

/**
 * Normalize output for comparison
 */
function normalizeOutput(
  output: string,
  options: TestRunnerOptions = {}
): string {
  let normalized = output;

  // Normalize line endings
  if (options.normalizeLineEndings !== false) {
    normalized = normalized.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  }

  // Trim whitespace
  if (options.trimOutput !== false) {
    normalized = normalized.trim();
  }

  return normalized;
}

/**
 * Compare expected and actual outputs
 */
function compareOutputs(
  expected: string,
  actual: string,
  options: TestRunnerOptions = {}
): boolean {
  const normalizedExpected = normalizeOutput(expected, options);
  const normalizedActual = normalizeOutput(actual, options);
  return normalizedExpected === normalizedActual;
}

// ============================================
// FUNCTION DETECTION
// ============================================

/**
 * Detect the entry function in user code.
 * Looks for common function names: solution, solve, or the first defined function.
 */
function detectEntryFunction(code: string): string | null {
  // Priority order for function names
  const priorityNames = ["solution", "solve", "main"];

  // Check for priority function names
  for (const name of priorityNames) {
    const regex = new RegExp(`^def\\s+${name}\\s*\\(`, "m");
    if (regex.test(code)) {
      return name;
    }
  }

  // Fall back to first defined function
  const firstFunctionMatch = code.match(/^def\s+(\w+)\s*\(/m);
  if (firstFunctionMatch) {
    return firstFunctionMatch[1];
  }

  return null;
}

/**
 * Parse test input into Python literal format.
 * Handles common cases: strings, numbers, lists, dicts.
 */
function parseTestInput(input: string): string {
  // Already looks like Python? Return as-is
  if (
    input.startsWith("[") ||
    input.startsWith("{") ||
    input.startsWith("(") ||
    input.startsWith('"') ||
    input.startsWith("'") ||
    /^-?\d+(\.\d+)?$/.test(input.trim())
  ) {
    return input;
  }

  // Check if it's a variable assignment like s = "hello"
  const assignmentMatch = input.match(/^\s*\w+\s*=\s*(.+)$/);
  if (assignmentMatch) {
    return assignmentMatch[1].trim();
  }

  // Treat as string literal
  return JSON.stringify(input);
}

// ============================================
// TEST EXECUTION
// ============================================

/**
 * Run a single test case against user code.
 */
async function runSingleTest(
  code: string,
  testCase: TestCase,
  testIndex: number,
  entryFunction: string,
  options: TestRunnerOptions = {}
): Promise<TestCaseResult> {
  const startTime = performance.now();
  const timeoutMs = options.timeoutMs ?? 5000;

  try {
    // Parse the input
    const parsedInput = parseTestInput(testCase.input);

    // Build execution code
    const executionCode = `
${code}

# Execute the function and capture result
_test_result = ${entryFunction}(${parsedInput})
print(_test_result if _test_result is not None else "")
`;

    // Execute with timeout
    const result = await runPython(executionCode, { timeoutMs });
    const executionTimeMs = performance.now() - startTime;

    if (!result.success) {
      // Check for timeout
      if (result.error?.includes("timeout")) {
        return {
          testCaseId: testCase.id,
          testCaseIndex: testIndex,
          status: "timeout",
          expectedOutput: testCase.expectedOutput,
          actualOutput: "",
          executionTimeMs,
          error: "Execution timed out",
        };
      }

      // Other errors
      return {
        testCaseId: testCase.id,
        testCaseIndex: testIndex,
        status: "error",
        expectedOutput: testCase.expectedOutput,
        actualOutput: result.stdout || "",
        executionTimeMs,
        error: result.error,
        traceback: result.traceback,
      };
    }

    // Compare outputs
    const actualOutput = result.stdout || "";
    const passed = compareOutputs(
      testCase.expectedOutput,
      actualOutput,
      options
    );

    return {
      testCaseId: testCase.id,
      testCaseIndex: testIndex,
      status: passed ? "passed" : "failed",
      expectedOutput: testCase.expectedOutput,
      actualOutput: normalizeOutput(actualOutput, options),
      executionTimeMs,
    };
  } catch (err) {
    const executionTimeMs = performance.now() - startTime;
    return {
      testCaseId: testCase.id,
      testCaseIndex: testIndex,
      status: "error",
      expectedOutput: testCase.expectedOutput,
      actualOutput: "",
      executionTimeMs,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Run all test cases against user code.
 * Returns a summary of all results.
 */
export async function runTestCases(
  code: string,
  testCases: TestCase[],
  options: TestRunnerOptions = {}
): Promise<TestRunSummary> {
  const startTime = performance.now();

  // Ensure runtime is ready
  if (!isRuntimeReady()) {
    const initialized = await initPyodide();
    if (!initialized) {
      return {
        totalTests: testCases.length,
        passedCount: 0,
        failedCount: 0,
        errorCount: testCases.length,
        timeoutCount: 0,
        totalExecutionTimeMs: performance.now() - startTime,
        results: testCases.map((tc, i) => ({
          testCaseId: tc.id,
          testCaseIndex: i,
          status: "error" as TestStatus,
          expectedOutput: tc.expectedOutput,
          actualOutput: "",
          executionTimeMs: 0,
          error: "Python runtime failed to initialize",
        })),
      };
    }
  }

  // Detect entry function
  const entryFunction = options.entryFunction || detectEntryFunction(code);
  if (!entryFunction) {
    return {
      totalTests: testCases.length,
      passedCount: 0,
      failedCount: 0,
      errorCount: testCases.length,
      timeoutCount: 0,
      totalExecutionTimeMs: performance.now() - startTime,
      results: testCases.map((tc, i) => ({
        testCaseId: tc.id,
        testCaseIndex: i,
        status: "error" as TestStatus,
        expectedOutput: tc.expectedOutput,
        actualOutput: "",
        executionTimeMs: 0,
        error:
          "No entry function found. Define a function named 'solution' or 'solve'.",
      })),
    };
  }

  // Run test cases in worker (batch)
  try {
    const rawResults = await runTestCasesInWorker(
      code,
      entryFunction,
      testCases,
      options.timeoutMs
    );

    const results: TestCaseResult[] = rawResults.map((r) => ({
      testCaseId: r.testCaseId,
      testCaseIndex: r.testCaseIndex,
      status: r.status,
      expectedOutput: r.expectedOutput,
      actualOutput: r.actualOutput,
      executionTimeMs: r.executionTimeMs,
      error: r.error?.message,
      traceback: r.error?.traceback,
    }));

    // Aggregate results
    const passedCount = results.filter((r) => r.status === "passed").length;
    const failedCount = results.filter((r) => r.status === "failed").length;
    const errorCount = results.filter((r) => r.status === "error").length;
    const timeoutCount = results.filter((r) => r.status === "timeout").length;

    return {
      totalTests: testCases.length,
      passedCount,
      failedCount,
      errorCount,
      timeoutCount,
      totalExecutionTimeMs: performance.now() - startTime,
      results,
    };
  } catch (err) {
    return {
      totalTests: testCases.length,
      passedCount: 0,
      failedCount: 0,
      errorCount: testCases.length,
      timeoutCount: 0,
      totalExecutionTimeMs: performance.now() - startTime,
      results: testCases.map((tc, i) => ({
        testCaseId: tc.id,
        testCaseIndex: i,
        status: "error" as TestStatus,
        expectedOutput: tc.expectedOutput,
        actualOutput: "",
        executionTimeMs: 0,
        error: err instanceof Error ? err.message : String(err),
      })),
    };
  }
}

/**
 * Run a single test case by index.
 * Useful for "Run Single" button in UI.
 */
export async function runSingleTestCase(
  code: string,
  testCases: TestCase[],
  testIndex: number,
  options: TestRunnerOptions = {}
): Promise<TestCaseResult> {
  if (testIndex < 0 || testIndex >= testCases.length) {
    return {
      testCaseId: "invalid",
      testCaseIndex: testIndex,
      status: "error",
      expectedOutput: "",
      actualOutput: "",
      executionTimeMs: 0,
      error: `Invalid test index: ${testIndex}`,
    };
  }

  // Ensure runtime is ready
  if (!isRuntimeReady()) {
    const initialized = await initPyodide();
    if (!initialized) {
      return {
        testCaseId: testCases[testIndex].id,
        testCaseIndex: testIndex,
        status: "error",
        expectedOutput: testCases[testIndex].expectedOutput,
        actualOutput: "",
        executionTimeMs: 0,
        error: "Python runtime failed to initialize",
      };
    }
  }

  // Detect entry function
  const entryFunction = options.entryFunction || detectEntryFunction(code);
  if (!entryFunction) {
    return {
      testCaseId: testCases[testIndex].id,
      testCaseIndex: testIndex,
      status: "error",
      expectedOutput: testCases[testIndex].expectedOutput,
      actualOutput: "",
      executionTimeMs: 0,
      error:
        "No entry function found. Define a function named 'solution' or 'solve'.",
    };
  }

  return runSingleTest(
    code,
    testCases[testIndex],
    testIndex,
    entryFunction,
    options
  );
}

/**
 * Convert TestCaseResult to the format expected by TestCasesPanel.
 */
export function toTestCasesPanelResult(result: TestCaseResult): {
  status: "pending" | "running" | "passed" | "failed";
  actualOutput?: string;
  executionTimeMs?: number;
  error?: string;
} {
  return {
    status:
      result.status === "passed"
        ? "passed"
        : result.status === "pending"
        ? "pending"
        : "failed",
    actualOutput: result.actualOutput,
    executionTimeMs: result.executionTimeMs,
    error: result.error || result.traceback,
  };
}
