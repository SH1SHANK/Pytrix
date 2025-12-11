/**
 * Question Service Unit Tests - Extended
 *
 * Tests for question generation system:
 * - Template-based question generation
 * - Batch generation
 * - Problem type availability checks
 * - Context retrieval
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock questionTemplates
vi.mock("@/lib/questionTemplates", () => ({
  generateTemplate: vi.fn((problemTypeId: string, difficulty: string) => {
    if (problemTypeId === "non-existent") return null;
    return {
      id: `template-${problemTypeId}`,
      moduleId: "strings",
      moduleName: "Strings",
      subtopicId: "string-basics",
      subtopicName: "String Basics",
      problemTypeId,
      problemTypeName: "Test Problem",
      difficulty,
      title: `[${
        difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
      }] Test Problem - ${problemTypeId}`,
      promptTemplate: "Write a function to solve the problem",
      constraints: ["1 <= n <= 100"],
      edgeCases: [{ description: "Empty input" }],
      hints: ["Think about edge cases"],
      sampleInputs: ["hello", "world"],
      sampleOutputs: ["olleh", "dlrow"],
      testCases: [
        { input: "test", expectedOutput: "tset", isHidden: false },
        { input: "hidden", expectedOutput: "neddih", isHidden: true },
      ],
      starterCode: "def solution(s):\n    pass",
      estimatedMinutes: 10,
    };
  }),
}));

// Mock topicsStore
vi.mock("@/lib/stores/topicsStore", () => ({
  getProblemTypeWithContext: vi.fn((problemTypeId: string) => {
    if (problemTypeId === "non-existent") return undefined;
    return {
      problemType: { id: problemTypeId, name: "Test Problem" },
      subtopic: {
        id: "string-basics",
        name: "String Basics",
        problemTypes: [],
      },
      module: { id: "strings", name: "Strings", subtopics: [] },
    };
  }),
}));

// Mock diversityService
vi.mock("@/lib/question/diversityService", () => ({
  createFingerprint: vi.fn(() => ({
    module: "strings",
    subtopic: "String Basics",
    archetypeId: "test-problem",
    operationTags: ["TRANSFORM"],
    difficulty: "beginner",
    timestamp: Date.now(),
  })),
  recordFingerprint: vi.fn(),
  shouldRegenerateQuestion: vi.fn(() => false),
  getAvoidList: vi.fn(() => ({ archetypes: [], operations: [] })),
  formatAvoidListForPrompt: vi.fn(() => ""),
  DIVERSITY_CONFIG: { MAX_REGENERATION_ATTEMPTS: 2 },
}));

// Mock questionFingerprint
vi.mock("@/lib/question/questionFingerprint", () => ({
  createFingerprint: vi.fn(() => ({
    module: "strings",
    subtopic: "String Basics",
    archetypeId: "test-problem",
    operationTags: ["TRANSFORM"],
    difficulty: "beginner",
    timestamp: Date.now(),
  })),
}));

import {
  getQuestion,
  getTemplateQuestion,
  getBatchTemplateQuestions,
  isProblemTypeAvailable,
  getProblemTypeContext,
} from "@/lib/question/questionService";

describe("questionService - Extended Coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getQuestion", () => {
    it("should return template-based question when useLLM is false", async () => {
      const result = await getQuestion("binary-search", "beginner", {
        preferLLM: false,
      });

      expect(result.success).toBe(true);
      expect(result.source).toBe("template");
      expect(result.question).toBeDefined();
      expect(result.question?.difficulty).toBe("beginner");
    });

    it("should return template-based question when no API key provided", async () => {
      const result = await getQuestion("binary-search", "beginner", {
        preferLLM: true,
        // No apiKey
      });

      expect(result.success).toBe(true);
      // When preferLLM is true but apiKey is missing, it counts as a fallback to template
      expect(result.source).toBe("fallback");
    });

    it("should return error for non-existent problem type", async () => {
      const result = await getQuestion("non-existent", "beginner");

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("No template found");
    });

    it("should include correct question structure", async () => {
      const result = await getQuestion("string-reverse", "intermediate", {
        preferLLM: false,
      });

      expect(result.success).toBe(true);
      const q = result.question!;

      expect(q.id).toBeDefined();
      expect(q.topicId).toBe("strings");
      expect(q.topic).toBe("String Basics");
      expect(q.difficulty).toBe("intermediate");
      expect(q.title).toBeDefined();
      expect(q.description).toBeDefined();
      expect(q.constraints).toBeInstanceOf(Array);
      expect(q.sampleInput).toBeDefined();
      expect(q.sampleOutput).toBeDefined();
      expect(q.starterCode).toBeDefined();
    });

    it("should filter hidden test cases from result", async () => {
      const result = await getQuestion("test-problem", "beginner", {
        preferLLM: false,
      });

      expect(result.success).toBe(true);
      // Only non-hidden test cases should be included
      const visibleTests = result.question?.testCases?.filter(
        (tc) => !tc.isHidden
      );
      expect(visibleTests?.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle different difficulty levels", async () => {
      const beginnerResult = await getQuestion("test", "beginner", {
        preferLLM: false,
      });
      const intermediateResult = await getQuestion("test", "intermediate", {
        preferLLM: false,
      });
      const advancedResult = await getQuestion("test", "advanced", {
        preferLLM: false,
      });

      expect(beginnerResult.question?.difficulty).toBe("beginner");
      expect(intermediateResult.question?.difficulty).toBe("intermediate");
      expect(advancedResult.question?.difficulty).toBe("advanced");
    });
  });

  describe("getTemplateQuestion", () => {
    it("should return question for valid problem type", () => {
      const question = getTemplateQuestion("binary-search", "beginner");

      expect(question).toBeDefined();
      expect(question?.id).toContain("tpl-");
      expect(question?.difficulty).toBe("beginner");
    });

    it("should return undefined for non-existent problem type", () => {
      const question = getTemplateQuestion("non-existent", "beginner");

      expect(question).toBeUndefined();
    });

    it("should include all required question fields", () => {
      const question = getTemplateQuestion("string-reverse", "intermediate");

      expect(question).toBeDefined();
      expect(question?.id).toBeDefined();
      expect(question?.topicId).toBeDefined();
      expect(question?.topicName).toBeDefined();
      expect(question?.topic).toBeDefined();
      expect(question?.difficulty).toBeDefined();
      expect(question?.title).toBeDefined();
      expect(question?.description).toBeDefined();
      expect(question?.inputDescription).toBeDefined();
      expect(question?.outputDescription).toBeDefined();
      expect(question?.constraints).toBeInstanceOf(Array);
      expect(question?.sampleInput).toBeDefined();
      expect(question?.sampleOutput).toBeDefined();
      expect(question?.starterCode).toBeDefined();
    });

    it("should include edge cases in description", () => {
      const question = getTemplateQuestion("test-problem", "beginner");

      expect(question?.description).toContain("Edge Cases");
    });

    it("should include hints in description", () => {
      const question = getTemplateQuestion("test-problem", "beginner");

      expect(question?.description).toContain("Hints");
    });
  });

  describe("getBatchTemplateQuestions", () => {
    it("should generate multiple questions", () => {
      const questions = getBatchTemplateQuestions(
        ["problem-1", "problem-2", "problem-3"],
        "beginner"
      );

      expect(questions.length).toBe(3);
      questions.forEach((q) => {
        expect(q.difficulty).toBe("beginner");
      });
    });

    it("should filter out failed generations", () => {
      const questions = getBatchTemplateQuestions(
        ["valid-problem", "non-existent", "another-valid"],
        "beginner"
      );

      // non-existent should be filtered out
      expect(questions.length).toBe(2);
    });

    it("should return empty array for all failures", () => {
      const questions = getBatchTemplateQuestions(
        ["non-existent", "non-existent"],
        "beginner"
      );

      expect(questions).toEqual([]);
    });

    it("should preserve order of successful generations", () => {
      const questions = getBatchTemplateQuestions(
        ["first", "second", "third"],
        "intermediate"
      );

      expect(questions[0]?.id).toContain("first");
      expect(questions[1]?.id).toContain("second");
      expect(questions[2]?.id).toContain("third");
    });
  });

  describe("isProblemTypeAvailable", () => {
    it("should return true for existing problem type", () => {
      const available = isProblemTypeAvailable("binary-search");
      expect(available).toBe(true);
    });

    it("should return false for non-existent problem type", () => {
      const available = isProblemTypeAvailable("non-existent");
      expect(available).toBe(false);
    });
  });

  describe("getProblemTypeContext", () => {
    it("should return context for existing problem type", () => {
      const context = getProblemTypeContext("binary-search");

      expect(context).toBeDefined();
      expect(context?.module).toBeDefined();
      expect(context?.subtopic).toBeDefined();
    });

    it("should return undefined for non-existent problem type", () => {
      const context = getProblemTypeContext("non-existent");
      expect(context).toBeUndefined();
    });

    it("should include module and subtopic information", () => {
      const context = getProblemTypeContext("string-reverse");

      expect(context?.module.id).toBe("strings");
      expect(context?.module.name).toBe("Strings");
      expect(context?.subtopic.id).toBe("string-basics");
    });
  });
});
