/**
 * Python Runtime Configuration
 *
 * Centralized constants and types for the Pyodide-based Python runtime.
 * All magic numbers and strings are defined here for maintainability.
 */

// ============================================
// CDN CONFIGURATION
// ============================================

/**
 * Pyodide CDN base URL.
 * Can be overridden via environment variable for staging/testing.
 */
export const PYODIDE_CDN_URL =
  process.env.NEXT_PUBLIC_PYODIDE_CDN_URL ||
  "https://cdn.jsdelivr.net/pyodide/v0.27.0/full/";

/**
 * Pyodide version for display purposes.
 */
export const PYODIDE_VERSION = "0.27.0";

// ============================================
// RUNTIME STATUS
// ============================================

/**
 * Runtime lifecycle states.
 */
export enum RuntimeStatus {
  /** Worker not yet created */
  UNLOADED = "unloaded",
  /** Worker created, Pyodide loading */
  LOADING = "loading",
  /** Pyodide ready, accepting commands */
  READY = "ready",
  /** Currently executing Python code */
  RUNNING = "running",
  /** Fatal error, worker needs restart */
  ERROR = "error",
}

// ============================================
// ERROR CLASSIFICATION
// ============================================

/**
 * Typed error categories for structured error handling.
 * These map to Python exception types where applicable.
 */
export enum ErrorType {
  /** Code has syntax errors */
  SYNTAX_ERROR = "syntax_error",
  /** Runtime exception during execution */
  RUNTIME_ERROR = "runtime_error",
  /** Execution exceeded time limit */
  TIMEOUT = "timeout",
  /** User-initiated or automatic interrupt */
  INTERRUPTED = "interrupted",
  /** Memory allocation failure */
  MEMORY_ERROR = "memory_error",
  /** Output exceeded max length */
  OUTPUT_OVERFLOW = "output_overflow",
  /** Worker or Pyodide initialization failure */
  INIT_ERROR = "init_error",
  /** Unknown or unclassified error */
  UNKNOWN = "unknown",
}

// ============================================
// EXECUTION LIMITS
// ============================================

/**
 * Default timeout per execution in milliseconds.
 */
export const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Default timeout per test case in milliseconds.
 */
export const DEFAULT_TEST_TIMEOUT_MS = 5_000;

/**
 * Maximum stdout/stderr length before truncation (characters).
 */
export const MAX_OUTPUT_LENGTH = 50_000;

/**
 * Signal value to write to interrupt buffer (SIGINT equivalent).
 */
export const INTERRUPT_SIGNAL = 2;

/**
 * Size of the SharedArrayBuffer for interrupt signaling.
 */
export const INTERRUPT_BUFFER_SIZE = 1;

// ============================================
// WORKER MESSAGES
// ============================================

/**
 * Command types sent from main thread to worker.
 */
export enum WorkerCommandType {
  /** Initialize Pyodide in worker */
  INIT = "init",
  /** Execute Python code */
  RUN = "run",
  /** Run multiple test cases against code */
  RUN_TESTS = "run_tests",
  /** Request current status */
  STATUS = "status",
}

/**
 * Response types sent from worker to main thread.
 */
export enum WorkerResponseType {
  /** Initialization complete */
  INIT_COMPLETE = "init_complete",
  /** Execution result */
  RUN_RESULT = "run_result",
  /** Test run results */
  TEST_RESULTS = "test_results",
  /** Status response */
  STATUS = "status",
  /** Error response */
  ERROR = "error",
}
