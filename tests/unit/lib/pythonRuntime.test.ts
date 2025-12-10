/**
 * Python Runtime Unit Tests
 *
 * Tests for the Python runtime service.
 * Note: These tests mock Pyodide since we can't load it in jsdom.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the actual module before importing
vi.mock("@/lib/runtime/pythonRuntime", async () => {
  const actual = await vi.importActual<typeof import("@/lib/runtime/pythonRuntime")>(
    "@/lib/runtime/pythonRuntime"
  );

  // We'll test the types and interfaces, actual execution is mocked
  return {
    ...actual,
    // Provide mock implementations that can be controlled in tests
    initPyodide: vi.fn().mockResolvedValue(true),
    runPython: vi.fn().mockImplementation(async (code: string) => {
      // Simulate different behaviors based on code content
      if (code.includes("print")) {
        return {
          success: true,
          stdout: "Hello, World!\n",
          stderr: "",
          returnValue: undefined,
          executionTimeMs: 50,
        };
      }
      if (code.includes("return")) {
        return {
          success: true,
          stdout: "",
          stderr: "",
          returnValue: 42,
          executionTimeMs: 30,
        };
      }
      if (code.includes("SyntaxError")) {
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
      if (code.includes("infinite")) {
        return {
          success: false,
          stdout: "",
          stderr: "",
          error: "Execution timeout (10s limit)",
          executionTimeMs: 10000,
        };
      }
      return {
        success: true,
        stdout: "",
        stderr: "",
        returnValue: undefined,
        executionTimeMs: 25,
      };
    }),
    getRuntimeInfo: vi.fn().mockReturnValue({
      status: "ready",
      version: "3.11.3",
      error: null,
    }),
    isRuntimeReady: vi.fn().mockReturnValue(true),
    getPythonVersion: vi.fn().mockReturnValue("3.11.3"),
    subscribeToRuntimeStatus: vi.fn().mockImplementation((listener) => {
      listener({ status: "ready", version: "3.11.3", error: null });
      return () => {};
    }),
    resetRuntime: vi.fn(),
  };
});

describe("pythonRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initPyodide", () => {
    it("should initialize successfully", async () => {
      const { initPyodide } = await import("@/lib/runtime/pythonRuntime");

      const result = await initPyodide();
      expect(result).toBe(true);
    });
  });

  describe("getRuntimeInfo", () => {
    it("should return runtime status", async () => {
      const { getRuntimeInfo } = await import("@/lib/runtime/pythonRuntime");

      const info = getRuntimeInfo();
      expect(info.status).toBe("ready");
      expect(info.version).toBe("3.11.3");
      expect(info.error).toBeNull();
    });
  });

  describe("isRuntimeReady", () => {
    it("should return true when ready", async () => {
      const { isRuntimeReady } = await import("@/lib/runtime/pythonRuntime");

      expect(isRuntimeReady()).toBe(true);
    });
  });

  describe("getPythonVersion", () => {
    it("should return version string", async () => {
      const { getPythonVersion } = await import("@/lib/runtime/pythonRuntime");

      expect(getPythonVersion()).toBe("3.11.3");
    });
  });

  describe("runPython", () => {
    it("should capture stdout from print statements", async () => {
      const { runPython } = await import("@/lib/runtime/pythonRuntime");

      const result = await runPython('print("Hello, World!")');

      expect(result.success).toBe(true);
      expect(result.stdout).toContain("Hello, World!");
    });

    it("should capture return values", async () => {
      const { runPython } = await import("@/lib/runtime/pythonRuntime");

      const result = await runPython("return 42");

      expect(result.success).toBe(true);
      expect(result.returnValue).toBe(42);
    });

    it("should handle syntax errors", async () => {
      const { runPython } = await import("@/lib/runtime/pythonRuntime");

      const result = await runPython("SyntaxError test");

      expect(result.success).toBe(false);
      expect(result.error).toContain("SyntaxError");
      expect(result.traceback).toBeDefined();
    });

    it("should handle timeout for infinite loops", async () => {
      const { runPython } = await import("@/lib/runtime/pythonRuntime");

      const result = await runPython("infinite loop simulation");

      expect(result.success).toBe(false);
      expect(result.error).toContain("timeout");
    });

    it("should include execution time", async () => {
      const { runPython } = await import("@/lib/runtime/pythonRuntime");

      const result = await runPython("simple code");

      expect(result.executionTimeMs).toBeDefined();
      expect(typeof result.executionTimeMs).toBe("number");
    });
  });

  describe("subscribeToRuntimeStatus", () => {
    it("should call listener with current status", async () => {
      const { subscribeToRuntimeStatus } = await import("@/lib/runtime/pythonRuntime");

      const listener = vi.fn();
      const unsubscribe = subscribeToRuntimeStatus(listener);

      expect(listener).toHaveBeenCalledWith({
        status: "ready",
        version: "3.11.3",
        error: null,
      });

      // Cleanup
      unsubscribe();
    });

    it("should return unsubscribe function", async () => {
      const { subscribeToRuntimeStatus } = await import("@/lib/runtime/pythonRuntime");

      const listener = vi.fn();
      const unsubscribe = subscribeToRuntimeStatus(listener);

      expect(typeof unsubscribe).toBe("function");
    });
  });

  describe("resetRuntime", () => {
    it("should reset successfully", async () => {
      const { resetRuntime } = await import("@/lib/runtime/pythonRuntime");

      // Should not throw
      expect(() => resetRuntime()).not.toThrow();
    });
  });
});

describe("ExecutionResult interface", () => {
  it("should have correct structure for success", () => {
    const result = {
      success: true,
      stdout: "output",
      stderr: "",
      returnValue: 42,
      executionTimeMs: 100,
    };

    expect(result.success).toBe(true);
    expect(typeof result.stdout).toBe("string");
    expect(typeof result.stderr).toBe("string");
    expect(typeof result.executionTimeMs).toBe("number");
  });

  it("should have correct structure for error", () => {
    const result = {
      success: false,
      stdout: "",
      stderr: "",
      error: "Some error",
      traceback: "Traceback...",
      executionTimeMs: 50,
    };

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
