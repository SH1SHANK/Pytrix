import { describe, it, expect, vi, beforeEach } from "vitest";
import { getQuestion } from "@/lib/questionService";
import { generateTemplate } from "@/lib/questionTemplates";

// Mock dependencies
vi.mock("@/lib/ai/modelRouter", () => ({
  callGeminiWithFallback: vi.fn(),
}));

vi.mock("@/lib/questionTemplates", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/questionTemplates")
  >();
  return {
    ...actual,
    generateTemplate: vi.fn(),
  };
});

describe("questionService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getQuestion", () => {
    it("should return template-based question when useLLM is false", async () => {
      // Setup mock
      const mockTemplate = {
        id: "test-template",
        problemTypeId: "binary-search",
        problemTypeName: "Binary Search",
        moduleId: "algorithms",
        moduleName: "Algorithms",
        subtopicId: "search",
        subtopicName: "Search",
        difficulty: "beginner",
        title: "[Easy] Binary Search",
        promptTemplate: "Describe binary search",
        compactPrompt: "Task: Create...",
        sampleInputs: ["in"],
        sampleOutputs: ["out"],
        edgeCases: [],
        constraints: [],
        hints: [],
        tags: [],
        estimatedMinutes: 5,
        starterCode: "def solution(): pass",
        testCases: [{ input: "in", expectedOutput: "out", isHidden: false }],
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(generateTemplate).mockReturnValue(mockTemplate as any);

      const result = await getQuestion("binary-search", "beginner", {
        useLLM: false,
      });

      expect(result.success).toBe(true);
      expect(result.source).toBe("template");
      expect(result.question).toBeDefined();
      expect(result.question?.title).toBe("[Easy] Binary Search");
    });

    it("should fall back to template if template generation fails", async () => {
      vi.mocked(generateTemplate).mockReturnValue(undefined);
      const result = await getQuestion("invalid-id", "beginner");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Problem type not found");
    });
  });
});
