/**
 * Worker Communication Types
 *
 * Type definitions for the RPC-style communication between
 * the main thread and the Python execution worker.
 */

import type { TestCase } from "@/lib/types/common";
import {
  WorkerCommandType,
  WorkerResponseType,
  ErrorType,
  RuntimeStatus,
} from "./runtimeConfig";

// ============================================
// COMMANDS (Main Thread → Worker)
// ============================================

/**
 * Initialize the Pyodide runtime in the worker.
 */
export interface InitCommand {
  type: WorkerCommandType.INIT;
  /** SharedArrayBuffer for interrupt signaling */
  interruptBuffer: SharedArrayBuffer;
}

/**
 * Execute Python code and return result.
 */
export interface RunCommand {
  type: WorkerCommandType.RUN;
  /** Unique execution ID for tracking */
  executionId: string;
  /** Python code to execute */
  code: string;
  /** Timeout in milliseconds */
  timeoutMs: number;
  /** Optional prelude code to run first */
  prelude?: string;
  /** Optional context variables to inject */
  context?: Record<string, unknown>;
}

/**
 * Run test cases against user code.
 */
export interface RunTestsCommand {
  type: WorkerCommandType.RUN_TESTS;
  /** Unique execution ID for tracking */
  executionId: string;
  /** User's Python code */
  code: string;
  /** Entry function name to call */
  entryFunction: string;
  /** Test cases to run */
  testCases: TestCase[];
  /** Timeout per test case in milliseconds */
  timeoutMs: number;
}

/**
 * Request current worker status.
 */
export interface StatusCommand {
  type: WorkerCommandType.STATUS;
}

/**
 * Union of all commands.
 */
export type WorkerCommand =
  | InitCommand
  | RunCommand
  | RunTestsCommand
  | StatusCommand;

// ============================================
// RESPONSES (Worker → Main Thread)
// ============================================

/**
 * Initialization complete response.
 */
export interface InitCompleteResponse {
  type: WorkerResponseType.INIT_COMPLETE;
  success: boolean;
  pythonVersion?: string;
  pyodideVersion?: string;
  heapSize?: number;
  initTimeMs?: number;
  error?: string;
}

/**
 * Result of a single Python execution.
 */
export interface ExecutionResultData {
  success: boolean;
  stdout: string;
  stderr: string;
  returnValue?: unknown;
  executionTimeMs: number;
  error?: {
    type: ErrorType;
    message: string;
    traceback?: string;
  };
}

/**
 * Run result response.
 */
export interface RunResultResponse {
  type: WorkerResponseType.RUN_RESULT;
  executionId: string;
  result: ExecutionResultData;
}

/**
 * Result of a single test case execution.
 */
export interface TestCaseResultData {
  testCaseId: string;
  testCaseIndex: number;
  status: "passed" | "failed" | "error" | "timeout";
  expectedOutput: string;
  actualOutput: string;
  executionTimeMs: number;
  error?: {
    type: ErrorType;
    message: string;
    traceback?: string;
  };
}

/**
 * Test results response.
 */
export interface TestResultsResponse {
  type: WorkerResponseType.TEST_RESULTS;
  executionId: string;
  results: TestCaseResultData[];
  totalExecutionTimeMs: number;
}

/**
 * Status response.
 */
export interface StatusResponse {
  type: WorkerResponseType.STATUS;
  status: RuntimeStatus;
  pythonVersion?: string;
}

/**
 * Error response for unrecoverable errors.
 */
export interface ErrorResponse {
  type: WorkerResponseType.ERROR;
  executionId?: string;
  error: {
    type: ErrorType;
    message: string;
  };
}

/**
 * Union of all responses.
 */
export type WorkerResponse =
  | InitCompleteResponse
  | RunResultResponse
  | TestResultsResponse
  | StatusResponse
  | ErrorResponse;

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Pending execution tracking.
 */
export interface PendingExecution {
  executionId: string;
  resolve: (result: ExecutionResultData | TestCaseResultData[]) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}
