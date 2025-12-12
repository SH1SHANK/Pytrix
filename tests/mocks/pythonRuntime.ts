/**
 * Mock Python Runtime
 *
 * Mocks Pyodide execution for testing without loading the actual runtime.
 */

import { vi } from "vitest";
import type { ExecutionResult, RuntimeInfo } from "@/lib/runtime/pythonRuntime";
import { RuntimeStatus } from "@/lib/runtime/runtimeConfig";

// Current mock state
let mockStatus: RuntimeStatus = RuntimeStatus.READY;
let mockVersion: string | null = "3.11.3";
let mockError: string | null = null;

// Default execution result
let defaultResult: ExecutionResult = {
  success: true,
  stdout: "",
  stderr: "",
  returnValue: undefined,
  executionTimeMs: 50,
};

// Queue of results for sequential calls
let resultQueue: ExecutionResult[] = [];

/**
 * Set the next execution result
 */
export function setMockExecutionResult(result: Partial<ExecutionResult>) {
  defaultResult = {
    success: result.success ?? true,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    returnValue: result.returnValue,
    error: result.error,
    traceback: result.traceback,
    executionTimeMs: result.executionTimeMs ?? 50,
  };
}

/**
 * Queue multiple results for sequential calls
 */
export function queueMockResults(results: Partial<ExecutionResult>[]) {
  resultQueue = results.map((r) => ({
    success: r.success ?? true,
    stdout: r.stdout ?? "",
    stderr: r.stderr ?? "",
    returnValue: r.returnValue,
    error: r.error,
    traceback: r.traceback,
    executionTimeMs: r.executionTimeMs ?? 50,
  }));
}

/**
 * Set mock runtime status
 */
export function setMockRuntimeStatus(
  status: RuntimeStatus,
  version?: string,
  error?: string
) {
  mockStatus = status;
  if (version !== undefined) mockVersion = version;
  if (error !== undefined) mockError = error;
}

/**
 * Reset mock state
 */
export function resetMockPythonRuntime() {
  mockStatus = RuntimeStatus.READY;
  mockVersion = "3.11.3";
  mockError = null;
  defaultResult = {
    success: true,
    stdout: "",
    stderr: "",
    returnValue: undefined,
    executionTimeMs: 50,
  };
  resultQueue = [];
}

/**
 * Get mock implementations
 */
export const mockRunPython = vi
  .fn()
  .mockImplementation(async (code: string): Promise<ExecutionResult> => {
    // Use queued result if available
    if (resultQueue.length > 0) {
      return resultQueue.shift()!;
    }

    // Check for common error patterns in code for realistic testing
    if (code.includes("syntax_error")) {
      return {
        success: false,
        stdout: "",
        stderr: "",
        error: "SyntaxError: invalid syntax",
        traceback:
          'Traceback (most recent call last):\n  File "<string>", line 1\nSyntaxError: invalid syntax',
        executionTimeMs: 10,
      };
    }

    if (code.includes("infinite_loop")) {
      return {
        success: false,
        stdout: "",
        stderr: "",
        error: "Execution timeout (10s limit)",
        executionTimeMs: 10000,
      };
    }

    return { ...defaultResult };
  });

export const mockInitPyodide = vi
  .fn()
  .mockImplementation(async (): Promise<boolean> => {
    if (mockStatus === RuntimeStatus.ERROR) {
      return false;
    }
    mockStatus = RuntimeStatus.READY;
    return true;
  });

export const mockGetRuntimeInfo = vi
  .fn()
  .mockImplementation((): RuntimeInfo => {
    return {
      status: mockStatus,
      version: mockVersion,
      error: mockError,
      pyodideVersion: "0.29.0",
      heapSize: 1024 * 1024 * 10,
      initTimeMs: 100,
      lastRunMs: 50,
    };
  });

export const mockIsRuntimeReady = vi.fn().mockImplementation((): boolean => {
  return mockStatus === "ready";
});

export const mockSubscribeToRuntimeStatus = vi
  .fn()
  .mockImplementation((listener: (info: RuntimeInfo) => void): (() => void) => {
    // Immediately call with current status
    listener({
      status: mockStatus,
      version: mockVersion,
      error: mockError,
      pyodideVersion: "0.29.0",
      heapSize: 1024 * 1024 * 10,
      initTimeMs: 100,
      lastRunMs: 50,
    });
    // Return unsubscribe function
    return vi.fn();
  });

/**
 * Setup python runtime mocks
 */
export function setupPythonRuntimeMocks() {
  vi.mock("@/lib/runtime/pythonRuntime", () => ({
    runPython: mockRunPython,
    initPyodide: mockInitPyodide,
    getRuntimeInfo: mockGetRuntimeInfo,
    isRuntimeReady: mockIsRuntimeReady,
    subscribeToRuntimeStatus: mockSubscribeToRuntimeStatus,
    getPythonVersion: vi.fn().mockReturnValue(mockVersion),
    resetRuntime: vi.fn(),
  }));
}
