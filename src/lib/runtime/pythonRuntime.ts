/**
 * Python Runtime Service
 *
 * Provides in-browser Python execution using Pyodide via Web Worker.
 * The worker handles actual execution, providing true non-blocking behavior
 * and interrupt capability via SharedArrayBuffer.
 *
 * Features:
 * - Non-blocking execution via Web Worker
 * - True interruption via SharedArrayBuffer + setInterruptBuffer
 * - Per-execution isolated globals
 * - Timeout protection with real cancellation
 * - Capture of stdout/stderr
 * - Python version info
 */

import {
  RuntimeStatus,
  ErrorType,
  WorkerCommandType,
  WorkerResponseType,
  DEFAULT_TIMEOUT_MS,
  INTERRUPT_BUFFER_SIZE,
  INTERRUPT_SIGNAL,
} from "./runtimeConfig";
import type {
  WorkerCommand,
  WorkerResponse,
  ExecutionResultData,
  PendingExecution,
  InitCompleteResponse,
  RunResultResponse,
  StatusResponse,
  ErrorResponse,
  TestResultsResponse,
  TestCaseResultData,
} from "./workerTypes";
import { TestCase } from "@/lib/types";

// ============================================
// TYPES (PUBLIC API)
// ============================================

export type { RuntimeStatus } from "./runtimeConfig";

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  returnValue?: unknown;
  error?: string;
  traceback?: string;
  executionTimeMs: number;
}

export interface RuntimeInfo {
  status: RuntimeStatus;
  version: string | null;
  error: string | null;
  pyodideVersion: string | null;
  heapSize: number | null;
  initTimeMs: number | null;
  lastRunMs: number | null;
}

export interface RunOptions {
  /** Timeout in milliseconds (default: 10000) */
  timeoutMs?: number;
  /** Python code to run before the main code */
  prelude?: string;
  /** Context variables to inject */
  context?: Record<string, unknown>;
}

// ============================================
// SINGLETON STATE
// ============================================

let worker: Worker | null = null;
let runtimeStatus: RuntimeStatus = RuntimeStatus.UNLOADED;
let pythonVersion: string | null = null;
let initError: string | null = null;
let interruptBuffer: SharedArrayBuffer | null = null;
let interruptView: Uint8Array | null = null;

// Telemetry state
let pyodideVersion: string | null = null;
let heapSize: number | null = null;
let initTimeMs: number | null = null;
let lastRunMs: number | null = null;

// Pending execution tracking
const pendingExecutions = new Map<string, PendingExecution>();

// Status listeners
let statusListeners: Array<(info: RuntimeInfo) => void> = [];

// Initialization promise for deduplication
let initPromise: Promise<boolean> | null = null;

// Execution ID counter
let executionCounter = 0;

// ============================================
// STATUS MANAGEMENT
// ============================================

function setStatus(newStatus: RuntimeStatus, error?: string): void {
  runtimeStatus = newStatus;
  if (error !== undefined) {
    initError = error;
  }
  notifyStatusChange();
}

function notifyStatusChange(): void {
  const info = getRuntimeInfo();
  statusListeners.forEach((listener) => listener(info));
}

export function subscribeToRuntimeStatus(
  listener: (info: RuntimeInfo) => void
): () => void {
  statusListeners.push(listener);
  listener(getRuntimeInfo());
  return () => {
    statusListeners = statusListeners.filter((l) => l !== listener);
  };
}

export function getRuntimeInfo(): RuntimeInfo {
  return {
    status: runtimeStatus,
    version: pythonVersion,
    error: initError,
    pyodideVersion,
    heapSize,
    initTimeMs,
    lastRunMs,
  };
}

// ============================================
// WORKER MANAGEMENT
// ============================================

/**
 * Create a unique execution ID.
 */
function createExecutionId(): string {
  return `exec-${Date.now()}-${++executionCounter}`;
}

/**
 * Post a command to the worker.
 */
function postCommand(command: WorkerCommand): void {
  if (!worker) {
    throw new Error("Worker not initialized");
  }
  worker.postMessage(command);
}

/**
 * Handle messages from the worker.
 */
function handleWorkerMessage(event: MessageEvent<WorkerResponse>): void {
  const response = event.data;

  switch (response.type) {
    case WorkerResponseType.INIT_COMPLETE:
      handleInitComplete(response);
      break;

    case WorkerResponseType.RUN_RESULT:
      handleRunResult(response);
      break;

    case WorkerResponseType.STATUS:
      handleStatusResponse(response);
      break;

    case WorkerResponseType.ERROR:
      handleErrorResponse(response);
      break;

    case WorkerResponseType.TEST_RESULTS:
      handleTestResults(response);
      break;
  }
}

function handleInitComplete(response: InitCompleteResponse): void {
  if (response.success) {
    pythonVersion = response.pythonVersion || null;
    pyodideVersion = response.pyodideVersion || null;
    heapSize = response.heapSize || null;
    initTimeMs = response.initTimeMs || null;
    setStatus(RuntimeStatus.READY);
    console.log(
      `[PythonRuntime] Initialized Python ${pythonVersion} (Pyodide ${pyodideVersion}) in ${initTimeMs}ms`
    );
  } else {
    setStatus(RuntimeStatus.ERROR, response.error || "Unknown init error");
    console.error("[PythonRuntime] Initialization failed:", response.error);
  }
}

function handleRunResult(response: RunResultResponse): void {
  const pending = pendingExecutions.get(response.executionId);
  if (!pending) {
    console.warn(
      `[PythonRuntime] No pending execution for ID: ${response.executionId}`
    );
    return;
  }

  clearTimeout(pending.timeoutId);
  pendingExecutions.delete(response.executionId);

  // Map internal result to public API
  pending.resolve(response.result);

  // Track last run time for telemetry
  lastRunMs = response.result.executionTimeMs;

  // Update status
  if (pendingExecutions.size === 0) {
    setStatus(RuntimeStatus.READY);
  }
}

function handleTestResults(response: TestResultsResponse): void {
  const pending = pendingExecutions.get(response.executionId);
  if (!pending) {
    return;
  }

  clearTimeout(pending.timeoutId);
  pendingExecutions.delete(response.executionId);

  pending.resolve(response.results);

  // Track last run time for telemetry
  lastRunMs = response.totalExecutionTimeMs;

  if (pendingExecutions.size === 0) {
    setStatus(RuntimeStatus.READY);
  }
}

function handleStatusResponse(response: StatusResponse): void {
  runtimeStatus = response.status;
  pythonVersion = response.pythonVersion || null;
  notifyStatusChange();
}

function handleErrorResponse(response: ErrorResponse): void {
  if (response.executionId) {
    const pending = pendingExecutions.get(response.executionId);
    if (pending) {
      clearTimeout(pending.timeoutId);
      pendingExecutions.delete(response.executionId);
      pending.reject(new Error(response.error.message));
    }
  } else {
    // Global error
    setStatus(RuntimeStatus.ERROR, response.error.message);
  }
}

function handleWorkerError(event: ErrorEvent): void {
  console.error("[PythonRuntime] Worker error:", event.message);
  setStatus(RuntimeStatus.ERROR, `Worker error: ${event.message}`);

  // Reject all pending executions
  for (const [id, pending] of pendingExecutions) {
    clearTimeout(pending.timeoutId);
    pending.reject(new Error("Worker error"));
    pendingExecutions.delete(id);
  }
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Check if SharedArrayBuffer is available.
 */
function isSharedArrayBufferAvailable(): boolean {
  try {
    return typeof SharedArrayBuffer !== "undefined";
  } catch {
    return false;
  }
}

/**
 * Initialize Pyodide runtime via Web Worker.
 */
export async function initPyodide(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // Already ready
  if (worker && runtimeStatus === RuntimeStatus.READY) {
    return true;
  }

  // Already initializing
  if (initPromise) {
    return initPromise;
  }

  initPromise = doInitialize();
  return initPromise;
}

async function doInitialize(): Promise<boolean> {
  setStatus(RuntimeStatus.LOADING);
  console.time("PythonRuntime Init");

  try {
    // Check SharedArrayBuffer support
    if (!isSharedArrayBufferAvailable()) {
      throw new Error(
        "SharedArrayBuffer not available. Ensure Cross-Origin-Isolation headers are set."
      );
    }

    // Create interrupt buffer
    interruptBuffer = new SharedArrayBuffer(INTERRUPT_BUFFER_SIZE);
    interruptView = new Uint8Array(interruptBuffer);

    // Create worker
    worker = new Worker(new URL("./pythonWorker.ts", import.meta.url), {
      type: "module",
    });

    // Set up message handlers
    worker.onmessage = handleWorkerMessage;
    worker.onerror = handleWorkerError;

    // Wait for initialization
    return new Promise<boolean>((resolve) => {
      const initHandler = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.type === WorkerResponseType.INIT_COMPLETE) {
          worker!.removeEventListener("message", initHandler);
          const response = event.data as InitCompleteResponse;

          if (response.success) {
            pythonVersion = response.pythonVersion || null;
            setStatus(RuntimeStatus.READY);
            console.timeEnd("PythonRuntime Init");
            resolve(true);
          } else {
            setStatus(RuntimeStatus.ERROR, response.error);
            resolve(false);
          }

          initPromise = null;
        }
      };

      worker!.addEventListener("message", initHandler);

      // Send init command
      const command: WorkerCommand = {
        type: WorkerCommandType.INIT,
        interruptBuffer: interruptBuffer!,
      };
      worker!.postMessage(command);
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[PythonRuntime] Failed to initialize:", errorMessage);
    setStatus(RuntimeStatus.ERROR, errorMessage);
    initPromise = null;
    return false;
  }
}

// ============================================
// EXECUTION
// ============================================

/**
 * Run Python code and capture output.
 */
export async function runPython(
  code: string,
  options: RunOptions = {}
): Promise<ExecutionResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const startTime = performance.now();

  // Ensure runtime is ready
  if (!worker || runtimeStatus !== RuntimeStatus.READY) {
    const initialized = await initPyodide();
    if (!initialized) {
      return {
        success: false,
        stdout: "",
        stderr: "",
        error: initError || "Failed to initialize Python runtime",
        executionTimeMs: performance.now() - startTime,
      };
    }
  }

  const executionId = createExecutionId();
  setStatus(RuntimeStatus.RUNNING);

  return new Promise<ExecutionResult>((resolve) => {
    // Set up timeout
    const timeoutId = setTimeout(() => {
      // Trigger interrupt
      if (interruptView) {
        interruptView[0] = INTERRUPT_SIGNAL;
      }

      // Give worker a moment to handle interrupt, then force resolve
      setTimeout(() => {
        const pending = pendingExecutions.get(executionId);
        if (pending) {
          pendingExecutions.delete(executionId);
          resolve({
            success: false,
            stdout: "",
            stderr: "",
            error: `Execution timed out after ${timeoutMs}ms`,
            executionTimeMs: performance.now() - startTime,
          });
        }
      }, 500);
    }, timeoutMs);

    // Register pending execution
    const pending: PendingExecution = {
      executionId,
      resolve: (result: ExecutionResultData | TestCaseResultData[]) => {
        if (Array.isArray(result)) {
          // Should not happen for runPython
          console.error("Unexpected batch result for single run");
          return;
        }
        resolve(mapResultToExecutionResult(result));
      },
      reject: (error: Error) => {
        resolve({
          success: false,
          stdout: "",
          stderr: "",
          error: error.message,
          executionTimeMs: performance.now() - startTime,
        });
      },
      timeoutId,
    };
    pendingExecutions.set(executionId, pending);

    // Send run command
    try {
      postCommand({
        type: WorkerCommandType.RUN,
        executionId,
        code,
        timeoutMs,
        prelude: options.prelude,
        context: options.context,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      pendingExecutions.delete(executionId);
      resolve({
        success: false,
        stdout: "",
        stderr: "",
        error: err instanceof Error ? err.message : String(err),
        executionTimeMs: performance.now() - startTime,
      });
    }
  });
}

/**
 * Run multiple test cases continuously in the worker.
 */
export async function runTestCases(
  code: string,
  entryFunction: string,
  testCases: TestCase[],
  timeoutMs: number = 5000
): Promise<TestCaseResultData[]> {
  // Ensure runtime is ready
  if (!worker || runtimeStatus !== RuntimeStatus.READY) {
    const initialized = await initPyodide();
    if (!initialized) {
      throw new Error(initError || "Failed to initialize runtime");
    }
  }

  const executionId = createExecutionId();
  setStatus(RuntimeStatus.RUNNING);

  return new Promise<TestCaseResultData[]>((resolve, reject) => {
    // Global timeout for the whole batch (safety net)
    const totalTimeout = timeoutMs * testCases.length + 5000;

    const timeoutId = setTimeout(() => {
      if (interruptView) {
        interruptView[0] = INTERRUPT_SIGNAL;
      }
      // Give it a moment to cleanup
      setTimeout(() => {
        const pending = pendingExecutions.get(executionId);
        if (pending) {
          pendingExecutions.delete(executionId);
          reject(
            new Error(`Batch execution timed out after ${totalTimeout}ms`)
          );
        }
      }, 500);
    }, totalTimeout);

    const pending: PendingExecution = {
      executionId,
      resolve: (results) => {
        resolve(results as TestCaseResultData[]);
      },
      reject,
      timeoutId,
    };
    pendingExecutions.set(executionId, pending);

    try {
      postCommand({
        type: WorkerCommandType.RUN_TESTS,
        executionId,
        code,
        entryFunction,
        testCases,
        timeoutMs,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      pendingExecutions.delete(executionId);
      reject(err);
    }
  });
}

/**
 * Map internal result to public ExecutionResult.
 */
function mapResultToExecutionResult(
  result: ExecutionResultData
): ExecutionResult {
  return {
    success: result.success,
    stdout: result.stdout,
    stderr: result.stderr,
    returnValue: result.returnValue,
    error: result.error?.message,
    traceback: result.error?.traceback,
    executionTimeMs: result.executionTimeMs,
  };
}

// ============================================
// ABORT
// ============================================

/**
 * Abort all running executions.
 * Sends interrupt signal via SharedArrayBuffer.
 */
export function abortExecution(): void {
  if (interruptView) {
    interruptView[0] = INTERRUPT_SIGNAL;
  }

  // Clean up pending executions
  for (const [id, pending] of pendingExecutions) {
    clearTimeout(pending.timeoutId);
    pending.resolve({
      success: false,
      stdout: "",
      stderr: "",
      executionTimeMs: 0,
      error: {
        type: ErrorType.INTERRUPTED,
        message: "Execution aborted by user",
      },
    });
    pendingExecutions.delete(id);
  }

  setStatus(RuntimeStatus.READY);
}

// ============================================
// UTILITIES
// ============================================

export function getPythonVersion(): string | null {
  return pythonVersion;
}

export function isRuntimeReady(): boolean {
  return runtimeStatus === RuntimeStatus.READY && worker !== null;
}

export function resetRuntime(): void {
  // Terminate worker
  if (worker) {
    worker.terminate();
    worker = null;
  }

  // Clear state
  pendingExecutions.clear();
  interruptBuffer = null;
  interruptView = null;
  pythonVersion = null;
  initError = null;
  initPromise = null;

  setStatus(RuntimeStatus.UNLOADED);
}

/**
 * Get the worker instance for advanced usage (e.g., testRunner).
 */
export function getWorker(): Worker | null {
  return worker;
}

/**
 * Get the interrupt buffer for direct access.
 */
export function getInterruptBuffer(): SharedArrayBuffer | null {
  return interruptBuffer;
}
