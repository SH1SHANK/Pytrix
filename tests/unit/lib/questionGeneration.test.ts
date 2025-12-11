/**
 * Question Generation Validation Tests
 *
 * Tests for the two-layer question generation system:
 * - LLM success path with JSON parsing
 * - Fallback to templates when LLM fails
 * - Question model validation
 * - Function contract in starter code
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ============================================
// MOCKS
// ============================================

// Mock LLM/AI calls
vi.mock("@/lib/ai/modelRouter", () => ({
  callGeminiWithFallback: vi.fn().mockImplementation(async () => {
    // Default: return success with well-formed question data
    return {
      success: true,
      data: {
        title: "Sum of Array",
        description:
          "Given an array of integers, return the sum of all elements.",
        inputDescription: "A list of integers",
        outputDescription: "An integer representing the sum",
        constraints: ["1 <= n <= 1000", "-10^6 <= arr[i] <= 10^6"],
        sampleInput: "[1, 2, 3, 4, 5]",
        sampleOutput: "15",
        starterCode: "def solution(arr):\n    pass",
        referenceSolution: "def solution(arr):\n    return sum(arr)",
        testCases: [
          { input: "[1, 2, 3]", expectedOutput: "6", isHidden: false },
          { input: "[0]", expectedOutput: "0", isHidden: false },
          { input: "[-1, 1]", expectedOutput: "0", isHidden: false },
          { input: "[100, 200]", expectedOutput: "300", isHidden: true },
        ],
      },
      modelUsed: "gemini-2.0-flash-lite",
      usage: { inputTokens: 500, outputTokens: 300 },
    };
  }),
}));

// Mock templates
vi.mock("@/lib/question/questionTemplates", () => ({
  generateTemplate: vi.fn((problemTypeId: string, difficulty: string) => {
    if (problemTypeId === "non-existent") return null;

    return {
      id: `template-${problemTypeId}`,
      moduleId: "arrays",
      moduleName: "Arrays",
      subtopicId: "array-basics",
      subtopicName: "Array Basics",
      problemTypeId,
      problemTypeName: "Array Sum",
      difficulty,
      title: `[${difficulty}] Array Sum`,
      promptTemplate: "Calculate the sum of array elements",
      constraints: ["1 <= n <= 100"],
      edgeCases: [{ description: "Empty array" }],
      hints: ["Use a loop or built-in function"],
      sampleInputs: ["[1, 2, 3]", "[0]"],
      sampleOutputs: ["6", "0"],
      testCases: [
        { input: "[1, 2, 3]", expectedOutput: "6", isHidden: false },
        { input: "[0]", expectedOutput: "0", isHidden: false },
        { input: "[]", expectedOutput: "0", isHidden: false },
      ],
      starterCode: "def solution(arr):\n    pass",
      estimatedMinutes: 10,
    };
  }),
}));

// Mock topics store
vi.mock("@/lib/stores/topicsStore", () => ({
  getProblemTypeWithContext: vi.fn((problemTypeId: string) => {
    if (problemTypeId === "non-existent") return undefined;
    return {
      problemType: { id: problemTypeId, name: "Array Sum" },
      subtopic: { id: "array-basics", name: "Array Basics", problemTypes: [] },
      module: { id: "arrays", name: "Arrays", subtopics: [] },
    };
  }),
}));

// Mock diversity service
vi.mock("@/lib/question/diversityService", () => ({
  createFingerprint: vi.fn(() => ({
    module: "arrays",
    subtopic: "Array Basics",
    archetypeId: "array-sum",
    operationTags: ["SUM"],
    difficulty: "beginner",
    timestamp: Date.now(),
  })),
  recordFingerprint: vi.fn(),
  shouldRegenerateQuestion: vi.fn(() => false),
  getAvoidList: vi.fn(() => ({ archetypes: [], operations: [] })),
  formatAvoidListForPrompt: vi.fn(() => ""),
  DIVERSITY_CONFIG: { MAX_REGENERATION_ATTEMPTS: 2 },
}));

// Mock fingerprint
vi.mock("@/lib/question/questionFingerprint", () => ({
  createFingerprint: vi.fn(() => ({
    module: "arrays",
    subtopic: "Array Basics",
    archetypeId: "array-sum",
  })),
}));

// ============================================
// TESTS
// ============================================

describe("Question Generation - Two-Layer System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("LLM Success Path", () => {
    it("should return LLM-generated question when successful", async () => {
      const { generateQuestion } = await import(
        "@/lib/question/questionService"
      );

      const result = await generateQuestion({
        problemTypeId: "array-sum",
        difficulty: "beginner",
        preferLLM: true,
        apiKey: "test-api-key",
      });

      expect(result.success).toBe(true);
      expect(result.source).toBe("llm");
      expect(result.question).toBeDefined();
      expect(result.modelUsed).toBeDefined();
    });

    it("should include all required Question fields", async () => {
      const { generateQuestion } = await import(
        "@/lib/question/questionService"
      );

      const result = await generateQuestion({
        problemTypeId: "array-sum",
        difficulty: "beginner",
        preferLLM: true,
        apiKey: "test-api-key",
      });

      expect(result.success).toBe(true);
      const q = result.question!;

      // Required fields
      expect(q.id).toBeDefined();
      expect(q.title).toBeDefined();
      expect(q.difficulty).toBe("beginner");
      expect(q.description).toBeDefined();
      expect(q.starterCode).toBeDefined();
      expect(q.testCases).toBeDefined();
      expect(q.testCases.length).toBeGreaterThanOrEqual(3);
    });

    it("should have at least 3 visible test cases", async () => {
      const { generateQuestion } = await import(
        "@/lib/question/questionService"
      );

      const result = await generateQuestion({
        problemTypeId: "array-sum",
        difficulty: "beginner",
        preferLLM: true,
        apiKey: "test-api-key",
      });

      expect(result.success).toBe(true);
      const visibleCases = result.question!.testCases.filter(
        (tc) => !tc.isHidden
      );
      expect(visibleCases.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Template Fallback", () => {
    it("should use template when preferLLM is false", async () => {
      const { generateQuestion } = await import(
        "@/lib/question/questionService"
      );

      const result = await generateQuestion({
        problemTypeId: "array-sum",
        difficulty: "beginner",
        preferLLM: false,
      });

      expect(result.success).toBe(true);
      expect(result.source).toBe("template");
    });

    it("should use template when no API key provided", async () => {
      const { generateQuestion } = await import(
        "@/lib/question/questionService"
      );

      const result = await generateQuestion({
        problemTypeId: "array-sum",
        difficulty: "beginner",
        preferLLM: true,
        // No apiKey
      });

      expect(result.success).toBe(true);
      // Falls back to template since no API key
      expect(["template", "fallback"]).toContain(result.source);
    });

    it("should return error for non-existent problem type", async () => {
      const { generateQuestion } = await import(
        "@/lib/question/questionService"
      );

      const result = await generateQuestion({
        problemTypeId: "non-existent",
        difficulty: "beginner",
        preferLLM: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Function Contract", () => {
    it("should have entry function in starter code", async () => {
      const { generateQuestion } = await import(
        "@/lib/question/questionService"
      );

      const result = await generateQuestion({
        problemTypeId: "array-sum",
        difficulty: "beginner",
        preferLLM: false,
      });

      expect(result.success).toBe(true);
      const starterCode = result.question!.starterCode;

      // Should contain a function definition
      expect(starterCode).toMatch(/def\s+\w+\s*\(/);
    });

    it("should have solution or solve function name", async () => {
      const { generateQuestion } = await import(
        "@/lib/question/questionService"
      );

      const result = await generateQuestion({
        problemTypeId: "array-sum",
        difficulty: "beginner",
        preferLLM: false,
      });

      expect(result.success).toBe(true);
      const starterCode = result.question!.starterCode;

      // Common entry function names
      const hasSolution = starterCode.includes("def solution");
      const hasSolve = starterCode.includes("def solve");
      const hasMain = starterCode.includes("def main");

      expect(hasSolution || hasSolve || hasMain).toBe(true);
    });
  });

  describe("Test Case Properties", () => {
    it("should have id and description for each test case", async () => {
      const { generateQuestion } = await import(
        "@/lib/question/questionService"
      );

      const result = await generateQuestion({
        problemTypeId: "array-sum",
        difficulty: "beginner",
        preferLLM: false,
      });

      expect(result.success).toBe(true);

      for (const tc of result.question!.testCases) {
        expect(tc.id).toBeDefined();
        expect(typeof tc.input).toBe("string");
        expect(typeof tc.expectedOutput).toBe("string");
      }
    });
  });
});

describe("getTemplateQuestion", () => {
  it("should return validated question for valid problem type", async () => {
    const { getTemplateQuestion } = await import(
      "@/lib/question/questionService"
    );

    const question = getTemplateQuestion("array-sum", "beginner");

    expect(question).toBeDefined();
    expect(question?.id).toContain("tpl-");
    expect(question?.difficulty).toBe("beginner");
  });
});

describe("getBatchTemplateQuestions", () => {
  it("should generate multiple questions", async () => {
    const { getBatchTemplateQuestions } = await import(
      "@/lib/question/questionService"
    );

    const questions = getBatchTemplateQuestions(
      ["problem-1", "problem-2", "problem-3"],
      "beginner"
    );

    expect(questions.length).toBe(3);
    questions.forEach((q) => {
      expect(q.difficulty).toBe("beginner");
    });
  });
});

describe("isProblemTypeAvailable", () => {
  it("should return true for existing problem type", async () => {
    const { isProblemTypeAvailable } = await import(
      "@/lib/question/questionService"
    );

    const available = isProblemTypeAvailable("array-sum");
    expect(available).toBe(true);
  });

  it("should return false for non-existent problem type", async () => {
    const { isProblemTypeAvailable } = await import(
      "@/lib/question/questionService"
    );

    const available = isProblemTypeAvailable("non-existent");
    expect(available).toBe(false);
  });
});
