/**
 * Python Runtime Service
 *
 * Provides in-browser Python execution using Pyodide (Python via WebAssembly).
 * Uses CDN-based loading to avoid bundler issues with Next.js/Turbopack.
 *
 * Features:
 * - Lazy loading of Pyodide from CDN
 * - Timeout protection against infinite loops
 * - Capture of stdout/stderr
 * - Python version info
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

// Pyodide CDN URL
const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";

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
// CDN SCRIPT LOADING
// ============================================

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize Pyodide runtime.
 * Loads from CDN to avoid bundler issues.
 */
export async function initPyodide(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // Already loaded or loading
  if (pyodideInstance) return true;
  if (runtimeStatus === "loading") {
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
    // Load Pyodide script from CDN
    await loadScript(`${PYODIDE_CDN}pyodide.js`);

    // Access global loadPyodide function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const loadPyodideFunc = (window as any).loadPyodide;
    if (!loadPyodideFunc) {
      throw new Error("Pyodide script loaded but loadPyodide not found");
    }

    pyodideInstance = await loadPyodideFunc({
      indexURL: PYODIDE_CDN,
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
 */
export async function runPython(
  code: string,
  timeoutMs: number = 10000
): Promise<ExecutionResult> {
  const startTime = performance.now();

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
      setTimeout(
        () => reject(new Error("Execution timeout (10s limit)")),
        timeoutMs
      );
    });

    const executionPromise = pyodideInstance.runPythonAsync(code);

    let returnValue: unknown;
    try {
      returnValue = await Promise.race([executionPromise, timeoutPromise]);
    } catch (execError) {
      await pyodideInstance.runPythonAsync(`
sys.stdout = _old_stdout
sys.stderr = _old_stderr
      `);

      const errorMessage =
        execError instanceof Error ? execError.message : String(execError);
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

export function getPythonVersion(): string | null {
  return pythonVersion;
}

export function isRuntimeReady(): boolean {
  return runtimeStatus === "ready" && pyodideInstance !== null;
}

export function resetRuntime(): void {
  pyodideInstance = null;
  runtimeStatus = "unloaded";
  pythonVersion = null;
  initError = null;
  notifyStatusChange();
}
