import { describe, it, expect, vi, beforeEach } from "vitest";
import { runTestCases } from "@/lib/runtime/testRunner";
import { evaluateCode } from "@/lib/ai/aiClient";
import * as pythonRuntime from "@/lib/runtime/pythonRuntime";
import { PYODIDE_VERSION, PYODIDE_CDN_URL } from "@/lib/runtime/runtimeConfig";
import { Difficulty } from "@/lib/types";

// Mock AI client dependencies
vi.mock("@/lib/ai/modelRouter", () => ({
  callGeminiWithFallback: vi.fn(),
  parseJsonResponse: vi.fn(),
}));

vi.mock("@/lib/stores/apiKeyStore", () => ({
  getApiKeyForProvider: vi.fn(() => "mock-key"),
  isApiKeyConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/safety/apiSafetyController", () => ({
  checkAndRecordCall: vi.fn(() => ({ allowed: true })),
}));

// Mock Python Runtime
vi.mock("@/lib/runtime/pythonRuntime", () => ({
  initPyodide: vi.fn().mockResolvedValue(true),
  isRuntimeReady: vi.fn().mockReturnValue(true),
  runPython: vi.fn(),
  runTestCases: vi.fn().mockImplementation(async (code, entry, testCases) => {
    // Simulate generic pass
    return testCases.map(
      (tc: { id: string; expectedOutput: string }, i: number) => ({
        testCaseId: tc.id,
        testCaseIndex: i,
        status: "passed",
        expectedOutput: tc.expectedOutput,
        actualOutput: tc.expectedOutput,
        executionTimeMs: 10,
      })
    );
  }),
}));

describe("Practice Pipeline Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fetch for AI Client
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        evaluation: {
          isCorrect: true,
          feedback: "Good job",
          score: 100,
        },
        usage: { model: "gemini", inputTokens: 10, outputTokens: 10 },
      }),
    });
  });

  it("PYODIDE_VERSION and URL should be correct", () => {
    // pyodide_version_check
    expect(PYODIDE_VERSION).toBe("0.27.0");
    expect(PYODIDE_CDN_URL).toContain("0.27.0");
  });

  it("Question Service should return structured test cases (QService_returns_testcases)", async () => {
    // We test getTemplateQuestion with a valid ID from topics.json
    const { getTemplateQuestion } = await import(
      "@/lib/question/questionService"
    );
    const question = getTemplateQuestion("indexing-and-slicing", "beginner");

    expect(question).toBeDefined();
    if (question) {
      expect(question.testCases.length).toBeGreaterThanOrEqual(3);
      question.testCases.forEach((tc) => {
        expect(tc.id).toBeDefined();
        expect(tc.input).toBeDefined();
        expect(tc.expectedOutput).toBeDefined();
      });
    }
  });

  it("Runtime should use worker batch execution (worker_per_test_calls, no_main_thread_exec)", async () => {
    const code = "def solution(x): return x";
    const testCases = [
      { id: "1", input: "1", expectedOutput: "1" },
      { id: "2", input: "2", expectedOutput: "2" },
      { id: "3", input: "3", expectedOutput: "3" },
    ];

    await runTestCases(code, testCases);

    expect(pythonRuntime.runTestCases).toHaveBeenCalledTimes(1);
    expect(pythonRuntime.runTestCases).toHaveBeenCalledWith(
      code,
      "solution",
      testCases,
      undefined
    );
  });

  it("AI Client should include test results in payload (ai_feedback_accuracy)", async () => {
    const question = {
      id: "q1",
      title: "Test",
      topicId: "t1",
      topicName: "Topic",
      topic: "strings",
      difficulty: "beginner" as Difficulty,
      description: "desc",
      inputDescription: "",
      outputDescription: "",
      constraints: [],
      sampleInput: "",
      sampleOutput: "",
      starterCode: "",
      referenceSolution: null,
      testCases: [],
    };
    const code = "print('hello')";
    const context = {
      stdout: "output",
      stderr: "",
      didExecute: true,
      testResults: [
        {
          testCaseId: "1",
          status: "passed" as const,
          expectedOutput: "a",
          actualOutput: "a",
        },
      ],
    };

    await evaluateCode(question, code, context);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/ai/evaluate-code",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("testResults"),
      })
    );

    // Inspect body more closely
    const callArgs = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    const body = JSON.parse(callArgs[1].body as string);
    expect(body.testResults).toHaveLength(1);
    expect(body.testResults[0].status).toBe("passed");
  });
});
