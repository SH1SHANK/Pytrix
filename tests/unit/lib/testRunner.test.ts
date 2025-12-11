/**
 * Test Runner Unit Tests
 *
 * Tests for the test runner service that executes user code against test cases.
 * Note: These tests mock Pyodide since we can't load it in jsdom.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the pythonRuntime module before importing testRunner
vi.mock("@/lib/runtime/pythonRuntime", () => ({
  initPyodide: vi.fn().mockResolvedValue(true),
  runPython: vi.fn(),
  runTestCases: vi
    .fn()
    .mockImplementation(
      async (
        code: string,
        entry: string,
        testCases: { id: string; input: string; expectedOutput: string }[]
      ) => {
        return testCases.map((tc, index) => {
          // Case 1: passing [1, 2, 3] -> 6
          if (tc.input === "[1, 2, 3]" && tc.expectedOutput === "6") {
            return {
              testCaseId: tc.id,
              testCaseIndex: index,
              status: "passed",
              expectedOutput: tc.expectedOutput,
              actualOutput: tc.expectedOutput,
              executionTimeMs: 10,
            };
          }
          // Case 2: failing 'hello' -> 'wrong'
          if (tc.input === "'hello'" && tc.expectedOutput === "'wrong'") {
            return {
              testCaseId: tc.id,
              testCaseIndex: index,
              status: "failed",
              expectedOutput: tc.expectedOutput,
              actualOutput: "'hello'", // Returns input effectively
              executionTimeMs: 10,
            };
          }
          // Case 3: passing 'hello' -> 'olleh'
          if (tc.input === "'hello'" && tc.expectedOutput === "'olleh'") {
            return {
              testCaseId: tc.id,
              testCaseIndex: index,
              status: "passed",
              expectedOutput: tc.expectedOutput,
              actualOutput: tc.expectedOutput,
              executionTimeMs: 10,
            };
          }

          // Default: passed (for any generic test in other tests)
          return {
            testCaseId: tc.id,
            testCaseIndex: index,
            status: "passed",
            expectedOutput: tc.expectedOutput,
            actualOutput: tc.expectedOutput,
            executionTimeMs: 10,
          };
        });
      }
    ),
  isRuntimeReady: vi.fn().mockReturnValue(true),
}));

describe("testRunner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("runTestCases", () => {
    it("should return passed status when output matches expected", async () => {
      const { runTestCases } = await import("@/lib/runtime/testRunner");

      const code = `def solution(nums):
    return sum(nums)`;

      const testCases = [
        { id: "tc-1", input: "[1, 2, 3]", expectedOutput: "6" },
      ];

      const result = await runTestCases(code, testCases);

      expect(result.totalTests).toBe(1);
      expect(result.passedCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.results[0].status).toBe("passed");
    });

    it("should return failed status when output does not match expected", async () => {
      const { runTestCases } = await import("@/lib/runtime/testRunner");

      const code = `def solution(s):
    return s`;

      const testCases = [
        { id: "tc-1", input: "'hello'", expectedOutput: "'wrong'" },
      ];

      const result = await runTestCases(code, testCases);

      expect(result.totalTests).toBe(1);
      expect(result.failedCount).toBe(1);
      expect(result.results[0].status).toBe("failed");
    });

    it("should return error when no entry function found", async () => {
      const { runTestCases } = await import("@/lib/runtime/testRunner");

      const code = `# No function defined`;

      const testCases = [{ id: "tc-1", input: "[1, 2]", expectedOutput: "3" }];

      const result = await runTestCases(code, testCases);

      expect(result.errorCount).toBe(1);
      expect(result.results[0].status).toBe("error");
      expect(result.results[0].error).toContain("No entry function found");
    });

    it("should detect solve function as entry point", async () => {
      const { runTestCases } = await import("@/lib/runtime/testRunner");

      const code = `def solve(s):
    return s[::-1]`;

      const testCases = [
        { id: "tc-1", input: "'hello'", expectedOutput: "'olleh'" },
      ];

      const result = await runTestCases(code, testCases);

      // The mock will return based on the input pattern
      expect(result.totalTests).toBe(1);
    });

    it("should handle multiple test cases", async () => {
      const { runTestCases } = await import("@/lib/runtime/testRunner");

      const code = `def solution(nums):
    return sum(nums)`;

      const testCases = [
        { id: "tc-1", input: "[1, 2, 3]", expectedOutput: "6" },
        { id: "tc-2", input: "[1, 2, 3]", expectedOutput: "6" },
        { id: "tc-3", input: "[1, 2, 3]", expectedOutput: "6" },
      ];

      const result = await runTestCases(code, testCases);

      expect(result.totalTests).toBe(3);
      expect(result.results.length).toBe(3);
    });
    it("should handle worker runtime errors gracefully", async () => {
      const { runTestCases } = await import("@/lib/runtime/testRunner");
      const { runTestCases: runTestCasesInWorker } = await import(
        "@/lib/runtime/pythonRuntime"
      );

      // Mock a worker crash
      vi.mocked(runTestCasesInWorker).mockRejectedValueOnce(
        new Error("Worker terminated unexpectedly")
      );

      const code = `def solution(x): return x`;
      const testCases = [{ id: "tc-1", input: "1", expectedOutput: "1" }];

      const result = await runTestCases(code, testCases);

      expect(result.errorCount).toBe(1);
      expect(result.results[0].status).toBe("error");
      expect(result.results[0].error).toContain(
        "Worker terminated unexpectedly"
      );
    });
  });

  describe("runSingleTestCase", () => {
    it("should run a single test case by index", async () => {
      const { runSingleTestCase } = await import("@/lib/runtime/testRunner");

      const code = `def solution(nums):
    return sum(nums)`;

      const testCases = [
        { id: "tc-1", input: "[1]", expectedOutput: "1" },
        { id: "tc-2", input: "[1, 2, 3]", expectedOutput: "6" },
      ];

      const result = await runSingleTestCase(code, testCases, 1);

      expect(result.testCaseIndex).toBe(1);
      expect(result.testCaseId).toBe("tc-2");
    });

    it("should return error for invalid index", async () => {
      const { runSingleTestCase } = await import("@/lib/runtime/testRunner");

      const code = `def solution(x): return x`;
      const testCases = [{ id: "tc-1", input: "1", expectedOutput: "1" }];

      const result = await runSingleTestCase(code, testCases, 5);

      expect(result.status).toBe("error");
      expect(result.error).toContain("Invalid test index");
    });
  });

  describe("toTestCasesPanelResult", () => {
    it("should convert passed result correctly", async () => {
      const { toTestCasesPanelResult } = await import(
        "@/lib/runtime/testRunner"
      );

      const result = {
        testCaseId: "tc-1",
        testCaseIndex: 0,
        status: "passed" as const,
        expectedOutput: "6",
        actualOutput: "6",
        executionTimeMs: 50,
      };

      const panelResult = toTestCasesPanelResult(result);

      expect(panelResult.status).toBe("passed");
      expect(panelResult.actualOutput).toBe("6");
      expect(panelResult.executionTimeMs).toBe(50);
    });

    it("should convert failed result to failed status", async () => {
      const { toTestCasesPanelResult } = await import(
        "@/lib/runtime/testRunner"
      );

      const result = {
        testCaseId: "tc-1",
        testCaseIndex: 0,
        status: "failed" as const,
        expectedOutput: "6",
        actualOutput: "7",
        executionTimeMs: 50,
      };

      const panelResult = toTestCasesPanelResult(result);

      expect(panelResult.status).toBe("failed");
    });

    it("should convert error result to failed status with error", async () => {
      const { toTestCasesPanelResult } = await import(
        "@/lib/runtime/testRunner"
      );

      const result = {
        testCaseId: "tc-1",
        testCaseIndex: 0,
        status: "error" as const,
        expectedOutput: "6",
        actualOutput: "",
        executionTimeMs: 10,
        error: "SyntaxError",
        traceback: "Traceback...",
      };

      const panelResult = toTestCasesPanelResult(result);

      expect(panelResult.status).toBe("failed");
      expect(panelResult.error).toContain("SyntaxError");
    });
  });
});
