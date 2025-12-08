/**
 * Python Runtime Service
 *
 * Provides in-browser Python execution using Pyodide (Python via WebAssembly).
 *
 * Features:
 * - Lazy loading of Pyodide (only when needed)
 * - Timeout protection against infinite loops
 * - Capture of stdout/stderr
 * - Python version info
 *
 * Usage:
 *   await initPyodide();
 *   const result = await runPython("print('Hello!')");
 */

// ============================================
// TYPES
// ============================================

export type RuntimeStatus =
  | "unloaded"
  | "loading"
  | "ready"
  | "running"
  | "error";

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
}

// ============================================
// SINGLETON STATE
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pyodideInstance: any = null;
let runtimeStatus: RuntimeStatus = "unloaded";
let pythonVersion: string | null = null;
let initError: string | null = null;
let statusListeners: Array<(info: RuntimeInfo) => void> = [];

// ============================================
// STATUS MANAGEMENT
// ============================================

function notifyStatusChange() {
  const info = getRuntimeInfo();
  statusListeners.forEach((listener) => listener(info));
}

export function subscribeToRuntimeStatus(
  listener: (info: RuntimeInfo) => void
): () => void {
  statusListeners.push(listener);
  // Immediately notify with current status
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
  };
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize Pyodide runtime.
 * Call this once when the practice page loads.
 * Safe to call multiple times (will return existing instance).
 */
export async function initPyodide(): Promise<boolean> {
  // Already loaded or loading
  if (pyodideInstance) return true;
  if (runtimeStatus === "loading") {
    // Wait for ongoing initialization
    return new Promise((resolve) => {
      const unsubscribe = subscribeToRuntimeStatus((info) => {
        if (info.status === "ready") {
          unsubscribe();
          resolve(true);
        } else if (info.status === "error") {
          unsubscribe();
          resolve(false);
        }
      });
    });
  }

  runtimeStatus = "loading";
  initError = null;
  notifyStatusChange();

  try {
    // Dynamic import to enable lazy loading
    const { loadPyodide } = await import("pyodide");

    pyodideInstance = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
    });

    // Get Python version
    pythonVersion = await pyodideInstance.runPython(`
import sys
f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    `);

    runtimeStatus = "ready";
    notifyStatusChange();
    console.log(`[PythonRuntime] Initialized Python ${pythonVersion}`);
    return true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[PythonRuntime] Failed to initialize:", errorMessage);
    runtimeStatus = "error";
    initError = errorMessage;
    notifyStatusChange();
    return false;
  }
}

// ============================================
// EXECUTION
// ============================================

/**
 * Run Python code and capture output.
 *
 * @param code - Python code to execute
 * @param timeoutMs - Maximum execution time (default 10 seconds)
 * @returns ExecutionResult with stdout, stderr, and timing
 */
export async function runPython(
  code: string,
  timeoutMs: number = 10000
): Promise<ExecutionResult> {
  const startTime = performance.now();

  // Ensure runtime is ready
  if (!pyodideInstance) {
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

  runtimeStatus = "running";
  notifyStatusChange();

  try {
    // Set up stdout/stderr capture
    await pyodideInstance.runPythonAsync(`
import sys
from io import StringIO

_stdout_capture = StringIO()
_stderr_capture = StringIO()
_old_stdout = sys.stdout
_old_stderr = sys.stderr
sys.stdout = _stdout_capture
sys.stderr = _stderr_capture
    `);

    // Execute with timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Execution timeout")), timeoutMs);
    });

    const executionPromise = pyodideInstance.runPythonAsync(code);

    let returnValue: unknown;
    try {
      returnValue = await Promise.race([executionPromise, timeoutPromise]);
    } catch (execError) {
      // Restore stdout/stderr before handling error
      await pyodideInstance.runPythonAsync(`
sys.stdout = _old_stdout
sys.stderr = _old_stderr
      `);

      const errorMessage =
        execError instanceof Error ? execError.message : String(execError);

      // Get any captured output before the error
      const stdout = await pyodideInstance.runPython(
        "_stdout_capture.getvalue()"
      );
      const stderr = await pyodideInstance.runPython(
        "_stderr_capture.getvalue()"
      );

      runtimeStatus = "ready";
      notifyStatusChange();

      return {
        success: false,
        stdout: stdout || "",
        stderr: stderr || "",
        error: errorMessage,
        traceback: errorMessage.includes("Traceback")
          ? errorMessage
          : undefined,
        executionTimeMs: performance.now() - startTime,
      };
    }

    // Capture output and restore streams
    const stdout = await pyodideInstance.runPython(
      "_stdout_capture.getvalue()"
    );
    const stderr = await pyodideInstance.runPython(
      "_stderr_capture.getvalue()"
    );

    await pyodideInstance.runPythonAsync(`
sys.stdout = _old_stdout
sys.stderr = _old_stderr
    `);

    runtimeStatus = "ready";
    notifyStatusChange();

    return {
      success: true,
      stdout: stdout || "",
      stderr: stderr || "",
      returnValue,
      executionTimeMs: performance.now() - startTime,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[PythonRuntime] Execution error:", errorMessage);

    runtimeStatus = "ready";
    notifyStatusChange();

    return {
      success: false,
      stdout: "",
      stderr: "",
      error: errorMessage,
      executionTimeMs: performance.now() - startTime,
    };
  }
}

// ============================================
// UTILITIES
// ============================================

/**
 * Get the Python version string.
 */
export function getPythonVersion(): string | null {
  return pythonVersion;
}

/**
 * Check if runtime is ready to execute code.
 */
export function isRuntimeReady(): boolean {
  return runtimeStatus === "ready" && pyodideInstance !== null;
}

/**
 * Reset the runtime (for testing/debugging).
 */
export function resetRuntime(): void {
  pyodideInstance = null;
  runtimeStatus = "unloaded";
  pythonVersion = null;
  initError = null;
  notifyStatusChange();
}
