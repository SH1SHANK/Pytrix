/**
 * Python Worker
 *
 * Dedicated Web Worker for Pyodide execution.
 * Provides true non-blocking execution and interrupt capability.
 *
 * Features:
 * - Pyodide initialization with interrupt buffer
 * - Per-execution isolated globals
 * - StringIO buffer reuse for stdout/stderr
 * - PyProxy tracking and cleanup
 * - Structured error classification
 */

import {
  PYODIDE_CDN_URL,
  RuntimeStatus,
  ErrorType,
  WorkerCommandType,
  WorkerResponseType,
  MAX_OUTPUT_LENGTH,
  INTERRUPT_SIGNAL,
} from "./runtimeConfig";
import type {
  WorkerCommand,
  WorkerResponse,
  ExecutionResultData,
  TestCaseResultData,
} from "./workerTypes";

// ============================================
// WORKER STATE
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pyodide: any = null;
let status: RuntimeStatus = RuntimeStatus.UNLOADED;
let pythonVersion: string | undefined;
let interruptBuffer: Uint8Array | null = null;

// ============================================
// UTILITIES
// ============================================

/**
 * Post a typed response to the main thread.
 */
function postResponse(response: WorkerResponse): void {
  self.postMessage(response);
}

/**
 * Classify Python exceptions into typed error categories.
 */
function classifyError(errorMessage: string): ErrorType {
  if (errorMessage.includes("SyntaxError")) {
    return ErrorType.SYNTAX_ERROR;
  }
  if (errorMessage.includes("MemoryError")) {
    return ErrorType.MEMORY_ERROR;
  }
  if (
    errorMessage.includes("KeyboardInterrupt") ||
    errorMessage.includes("interrupted")
  ) {
    return ErrorType.INTERRUPTED;
  }
  if (
    errorMessage.includes("timeout") ||
    errorMessage.includes("Timeout") ||
    errorMessage.includes("timed out")
  ) {
    return ErrorType.TIMEOUT;
  }
  if (
    errorMessage.includes("Error") ||
    errorMessage.includes("Exception") ||
    errorMessage.includes("Traceback")
  ) {
    return ErrorType.RUNTIME_ERROR;
  }
  return ErrorType.UNKNOWN;
}

/**
 * Extract a sanitized traceback from error message.
 */
function extractTraceback(errorMessage: string): string | undefined {
  const tracebackMatch = errorMessage.match(/Traceback[\s\S]*$/);
  if (tracebackMatch) {
    // Limit traceback length for UI
    return tracebackMatch[0].slice(0, 2000);
  }
  return undefined;
}

/**
 * Truncate output if it exceeds max length.
 */
function truncateOutput(output: string): string {
  if (output.length > MAX_OUTPUT_LENGTH) {
    return (
      output.slice(0, MAX_OUTPUT_LENGTH) +
      `\n\n[Output truncated at ${MAX_OUTPUT_LENGTH} characters]`
    );
  }
  return output;
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize Pyodide in the worker.
 */
async function initialize(sharedBuffer: SharedArrayBuffer): Promise<void> {
  if (pyodide !== null) {
    // Already initialized - return cached info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const heapSize = (pyodide as any)._module?.HEAP8?.length || 0;
    postResponse({
      type: WorkerResponseType.INIT_COMPLETE,
      success: true,
      pythonVersion,
      pyodideVersion: pyodide.version,
      heapSize,
    });
    return;
  }

  status = RuntimeStatus.LOADING;
  const startTime = performance.now();

  try {
    // Set up interrupt buffer
    interruptBuffer = new Uint8Array(sharedBuffer);

    // Import Pyodide dynamically from CDN
    const pyodideModule = await import(
      /* webpackIgnore: true */ PYODIDE_CDN_URL + "pyodide.mjs"
    );
    const loadPyodide = pyodideModule.loadPyodide;

    pyodide = await loadPyodide({
      indexURL: PYODIDE_CDN_URL,
    });

    // Set up interrupt buffer for true interruption
    pyodide.setInterruptBuffer(interruptBuffer);

    // Get Python version
    pythonVersion = pyodide.runPython(`
import sys
f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    `);

    // Calculate telemetry
    const initTimeMs = Math.round(performance.now() - startTime);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const heapSize = (pyodide as any)._module?.HEAP8?.length || 0;
    const pyodideVersion = pyodide.version;

    status = RuntimeStatus.READY;

    postResponse({
      type: WorkerResponseType.INIT_COMPLETE,
      success: true,
      pythonVersion,
      pyodideVersion,
      heapSize,
      initTimeMs,
    });

    console.log(
      `[PythonWorker] Initialized Python ${pythonVersion} (Pyodide ${pyodideVersion}) in ${initTimeMs}ms`
    );
  } catch (err) {
    status = RuntimeStatus.ERROR;
    const errorMessage = err instanceof Error ? err.message : String(err);

    postResponse({
      type: WorkerResponseType.INIT_COMPLETE,
      success: false,
      error: errorMessage,
    });

    console.error("[PythonWorker] Initialization failed:", errorMessage);
  }
}

// ============================================
// EXECUTION
// ============================================

/**
 * Execute Python code with isolated globals.
 */
async function executeCode(
  executionId: string,
  code: string,
  timeoutMs: number,
  prelude?: string
): Promise<void> {
  if (pyodide === null) {
    postResponse({
      type: WorkerResponseType.RUN_RESULT,
      executionId,
      result: {
        success: false,
        stdout: "",
        stderr: "",
        executionTimeMs: 0,
        error: {
          type: ErrorType.INIT_ERROR,
          message: "Python runtime not initialized",
        },
      },
    });
    return;
  }

  status = RuntimeStatus.RUNNING;
  const startTime = performance.now();

  // Track PyProxy objects for cleanup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proxiesToDestroy: any[] = [];

  try {
    // Clear interrupt buffer
    if (interruptBuffer) {
      interruptBuffer[0] = 0;
    }

    // Create isolated globals for this execution
    const isolatedGlobals = pyodide.globals.get("dict")();
    proxiesToDestroy.push(isolatedGlobals);

    // Copy builtins to isolated globals
    const builtins = pyodide.globals.get("__builtins__");
    isolatedGlobals.set("__builtins__", builtins);

    // Set up stdout/stderr capture in isolated namespace
    // We save the CURRENT sys.stdout/stderr to local variables in this namespace
    // to ensure we can restore them correctly, avoiding NameError.
    pyodide.runPython(
      `
import sys
from io import StringIO
_saved_stdout = sys.stdout
_saved_stderr = sys.stderr
_exec_stdout = StringIO()
_exec_stderr = StringIO()
sys.stdout = _exec_stdout
sys.stderr = _exec_stderr
`,
      { globals: isolatedGlobals }
    );

    // Run prelude if provided
    if (prelude) {
      await pyodide.runPythonAsync(prelude, { globals: isolatedGlobals });
    }

    // Set up timeout (this is a backup - true interrupt is via buffer)
    let timeoutFired = false;
    const timeoutId = setTimeout(() => {
      timeoutFired = true;
      if (interruptBuffer) {
        interruptBuffer[0] = INTERRUPT_SIGNAL;
      }
    }, timeoutMs);

    // Execute user code
    let returnValue: unknown;
    let executionError:
      | { type: ErrorType; message: string; traceback?: string }
      | undefined;

    try {
      returnValue = await pyodide.runPythonAsync(code, {
        globals: isolatedGlobals,
      });

      // Handle PyProxy return values
      if (returnValue !== undefined && returnValue !== null) {
        if (
          typeof returnValue === "object" &&
          returnValue !== null &&
          "toJs" in returnValue &&
          typeof (returnValue as { toJs: () => unknown }).toJs === "function"
        ) {
          const pyProxy = returnValue as {
            toJs: () => unknown;
            destroy?: () => void;
          };
          const jsValue = pyProxy.toJs();
          proxiesToDestroy.push(returnValue);
          returnValue = jsValue;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (timeoutFired || errorMessage.includes("KeyboardInterrupt")) {
        executionError = {
          type: ErrorType.TIMEOUT,
          message: `Execution timed out after ${timeoutMs}ms`,
        };
      } else {
        executionError = {
          type: classifyError(errorMessage),
          message: errorMessage,
          traceback: extractTraceback(errorMessage),
        };
      }
    } finally {
      clearTimeout(timeoutId);
    }

    // Capture stdout/stderr
    const stdout =
      pyodide.runPython("_exec_stdout.getvalue()", {
        globals: isolatedGlobals,
      }) || "";
    const stderr =
      pyodide.runPython("_exec_stderr.getvalue()", {
        globals: isolatedGlobals,
      }) || "";

    // Restore original stdout/stderr
    pyodide.runPython(
      `
sys.stdout = _original_stdout
sys.stderr = _original_stderr
`,
      { globals: isolatedGlobals }
    );

    const executionTimeMs = performance.now() - startTime;

    const result: ExecutionResultData = {
      success: !executionError,
      stdout: truncateOutput(stdout),
      stderr: truncateOutput(stderr),
      returnValue: executionError ? undefined : returnValue,
      executionTimeMs,
      error: executionError,
    };

    status = RuntimeStatus.READY;

    postResponse({
      type: WorkerResponseType.RUN_RESULT,
      executionId,
      result,
    });
  } catch (err) {
    const executionTimeMs = performance.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);

    status = RuntimeStatus.READY;

    postResponse({
      type: WorkerResponseType.RUN_RESULT,
      executionId,
      result: {
        success: false,
        stdout: "",
        stderr: "",
        executionTimeMs,
        error: {
          type: classifyError(errorMessage),
          message: errorMessage,
          traceback: extractTraceback(errorMessage),
        },
      },
    });
  } finally {
    // Clean up all PyProxy objects
    for (const proxy of proxiesToDestroy) {
      try {
        if (proxy && typeof proxy.destroy === "function") {
          proxy.destroy();
        }
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

// ============================================
// TEST CASE EXECUTION
// ============================================

/**
 * Run test cases against user code.
 */
async function runTestCases(
  executionId: string,
  code: string,
  entryFunction: string,
  testCases: Array<{ id: string; input: string; expectedOutput: string }>,
  timeoutMs: number
): Promise<void> {
  if (pyodide === null) {
    postResponse({
      type: WorkerResponseType.ERROR,
      executionId,
      error: {
        type: ErrorType.INIT_ERROR,
        message: "Python runtime not initialized",
      },
    });
    return;
  }

  status = RuntimeStatus.RUNNING;
  const startTime = performance.now();

  // Track PyProxy objects for cleanup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proxiesToDestroy: any[] = [];

  try {
    const isolatedGlobals = pyodide.globals.get("dict")();
    proxiesToDestroy.push(isolatedGlobals);

    const builtins = pyodide.globals.get("__builtins__");
    isolatedGlobals.set("__builtins__", builtins);

    // Prepare Test Harness Script
    // We inject the test cases and a runner function directly into Python.
    const testCasesJson = JSON.stringify(testCases);
    const maxOutputLen = MAX_OUTPUT_LENGTH;

    const harnessCode = `
import sys
import json
import traceback
import ast
from io import StringIO
import time

# User Code
${code}

# Test Data
_test_cases = json.loads('${testCasesJson
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")}')
_results = []
_max_output_len = ${maxOutputLen}

def _truncate(s):
    if len(s) > _max_output_len:
        return s[:_max_output_len] + f"\\n\\n[Output truncated at {_max_output_len} characters]"
    return s

def _run_tests():
    for i, tc in enumerate(_test_cases):
        input_val = tc['input']
        expected_out = tc['expectedOutput']
        tc_id = tc['id']
        
        # Capture stdout
        _saved_stdout = sys.stdout
        _saved_stderr = sys.stderr
        _buf = StringIO()
        sys.stdout = _buf
        
        start_time = time.time()
        status = "executed"
        error_info = None
        
        # Default results
        ret = None
        output = ""
        
        try:
            # Entry function check
            entry_func = globals().get('${entryFunction}')
            if not entry_func:
                raise NameError("Function '${entryFunction}' not found")
            
            # Execute
            call_str = f"${entryFunction}({input_val})"
            ret = eval(call_str)
                
        except Exception:
            status = "error"
            exc_type, exc_value, exc_traceback = sys.exc_info()
            tb = "".join(traceback.format_exception(exc_type, exc_value, exc_traceback))
            error_info = {
                "type": "RuntimeError",
                "message": str(exc_value),
                "traceback": tb[:2000]
            }
        finally:
            sys.stdout = _saved_stdout
            sys.stderr = _saved_stderr
            
        duration_ms = (time.time() - start_time) * 1000
        output = _buf.getvalue().strip()
        
        # Determine pass/fail
        res_status = "failed"
        actual_val_display = ""
        
        if status == "error":
            res_status = "error"
        else:
            # Logic: If return value exists, compare values (parsed).
            # If return value is None, compare stdout.
            
            if ret is not None:
                # Return Value Mode
                try:
                    # Use ast.literal_eval for Python-format expected values
                    expected_val = ast.literal_eval(expected_out)
                except:
                    # Fallback to raw string comparison
                    expected_val = expected_out

                # Check equality 
                if ret == expected_val:
                    res_status = "passed"
                
                # Format actual output for display using Python repr()
                # This matches how expected values are formatted
                actual_val_display = repr(ret)
            else:
                # Stdout Mode
                # Compare stripped output
                if output == expected_out.strip():
                    res_status = "passed"
                actual_val_display = output

        _results.append({
            "testCaseId": tc_id,
            "testCaseIndex": i,
            "status": res_status,
            "expectedOutput": expected_out,
            "actualOutput": _truncate(actual_val_display),
            "executionTimeMs": duration_ms,
            "error": error_info
        })
        
    return json.dumps(_results)

_json_results = _run_tests()
`;

    // Execute the harness

    // Clear buffer
    if (interruptBuffer) interruptBuffer[0] = 0;

    // Set timeout for the WHOLE batch
    let timeoutFired = false;
    const timeoutId = setTimeout(() => {
      timeoutFired = true;
      if (interruptBuffer) {
        interruptBuffer[0] = INTERRUPT_SIGNAL;
      }
    }, timeoutMs);

    try {
      await pyodide.runPythonAsync(harnessCode, { globals: isolatedGlobals });

      // Retrieve results
      const jsonResults = isolatedGlobals.get("_json_results");
      const results = JSON.parse(jsonResults);

      status = RuntimeStatus.READY;

      postResponse({
        type: WorkerResponseType.TEST_RESULTS,
        executionId,
        results,
        totalExecutionTimeMs: performance.now() - startTime,
      });
    } catch (err) {
      // Batch error (timeout or crash)
      const errorMessage = err instanceof Error ? err.message : String(err);

      const overallStatus =
        timeoutFired || errorMessage.includes("KeyboardInterrupt")
          ? "timeout"
          : "error";
      const errorType =
        overallStatus === "timeout"
          ? ErrorType.TIMEOUT
          : ErrorType.RUNTIME_ERROR;

      // If batch failed, return error for all
      const hardFailResults: TestCaseResultData[] = testCases.map((tc, i) => ({
        testCaseId: tc.id,
        testCaseIndex: i,
        status: overallStatus,
        expectedOutput: tc.expectedOutput,
        actualOutput: "",
        executionTimeMs: 0,
        error: {
          type: errorType,
          message: errorMessage,
          traceback: extractTraceback(errorMessage),
        },
      }));

      status = RuntimeStatus.READY;
      postResponse({
        type: WorkerResponseType.TEST_RESULTS,
        executionId,
        results: hardFailResults,
        totalExecutionTimeMs: performance.now() - startTime,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err) {
    // Init error or catastrophic failure
    const errorMessage = err instanceof Error ? err.message : String(err);
    status = RuntimeStatus.READY;
    postResponse({
      type: WorkerResponseType.ERROR,
      executionId,
      error: {
        type: ErrorType.RUNTIME_ERROR,
        message: errorMessage,
      },
    });
  } finally {
    for (const proxy of proxiesToDestroy) {
      try {
        if (proxy && typeof proxy.destroy === "function") {
          proxy.destroy();
        }
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

// ============================================
// MESSAGE HANDLER
// ============================================

self.onmessage = async (event: MessageEvent<WorkerCommand>) => {
  const command = event.data;

  switch (command.type) {
    case WorkerCommandType.INIT:
      await initialize(command.interruptBuffer);
      break;

    case WorkerCommandType.RUN:
      await executeCode(
        command.executionId,
        command.code,
        command.timeoutMs,
        command.prelude
      );
      break;

    case WorkerCommandType.RUN_TESTS:
      await runTestCases(
        command.executionId,
        command.code,
        command.entryFunction,
        command.testCases,
        command.timeoutMs
      );
      break;

    case WorkerCommandType.STATUS:
      postResponse({
        type: WorkerResponseType.STATUS,
        status,
        pythonVersion,
      });
      break;

    default:
      console.warn("[PythonWorker] Unknown command:", command);
  }
};

// Signal worker is ready
console.log("[PythonWorker] Worker script loaded");
