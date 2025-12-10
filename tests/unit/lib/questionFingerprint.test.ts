/**
 * Question Fingerprint Unit Tests
 *
 * Tests for question deduplication fingerprinting:
 * - createFingerprint
 * - calculateSimilarity
 * - isSimilarToAny
 * - findMostSimilar
 * - Serialization/deserialization
 * - Utility functions
 */

import { describe, it, expect } from "vitest";
import {
  createFingerprint,
  calculateSimilarity,
  isSimilarToAny,
  findMostSimilar,
  serializeFingerprint,
  deserializeFingerprint,
  fingerprintToString,
  matchesFilter,
  SIMILARITY_THRESHOLD,
  type QuestionFingerprint,
} from "@/lib/question/questionFingerprint";
import type { Question } from "@/lib/types";

// Helper to create a mock question
function createMockQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: "test-q-1",
    title: "[Easy] Test Question",
    topic: "Array Basics",
    topicId: "arrays",
    difficulty: "beginner",
    description: "A test question for unit testing",
    inputDescription: "An array of integers",
    outputDescription: "The result",
    constraints: ["1 <= n <= 100"],
    sampleInput: "[1, 2, 3]",
    sampleOutput: "6",
    estimatedMinutes: 10,
    starterCode: "def solution(arr):\n    pass",
    ...overrides,
  } as Question;
}

// Helper to create a mock fingerprint
function createMockFingerprint(
  overrides: Partial<QuestionFingerprint> = {}
): QuestionFingerprint {
  return {
    module: "arrays",
    subtopic: "Array Basics",
    archetypeId: "sum-elements",
    operationTags: ["ITERATE", "AGGREGATE"],
    difficulty: "beginner",
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("questionFingerprint", () => {
  describe("SIMILARITY_THRESHOLD", () => {
    it("should be a value between 0 and 1", () => {
      expect(SIMILARITY_THRESHOLD).toBeGreaterThan(0);
      expect(SIMILARITY_THRESHOLD).toBeLessThanOrEqual(1);
    });
  });

  describe("createFingerprint", () => {
    it("should create a fingerprint from a question", () => {
      const question = createMockQuestion();
      const fp = createFingerprint(question);

      expect(fp.module).toBe(question.topicId);
      expect(fp.subtopic).toBe(question.topic);
      expect(fp.difficulty).toBe(question.difficulty);
      expect(fp.timestamp).toBeDefined();
      expect(fp.archetypeId).toBeDefined();
      expect(Array.isArray(fp.operationTags)).toBe(true);
    });

    it("should use provided problemTypeId for archetype", () => {
      const question = createMockQuestion();
      const fp = createFingerprint(question, "custom-problem-type");

      expect(fp.archetypeId).toBe("custom-problem-type");
    });

    it("should derive archetype from question when problemTypeId not provided", () => {
      const question = createMockQuestion({
        title: "[Easy] Binary Search Test",
        topic: "binary-search",
      });
      const fp = createFingerprint(question);

      expect(fp.archetypeId).toBeDefined();
      expect(typeof fp.archetypeId).toBe("string");
    });
  });

  describe("calculateSimilarity", () => {
    it("should return 1 for identical fingerprints", () => {
      const fp = createMockFingerprint();
      const similarity = calculateSimilarity(fp, fp);

      expect(similarity).toBeCloseTo(1, 5);
    });

    it("should return 0 for completely different fingerprints", () => {
      const fp1 = createMockFingerprint({
        module: "strings",
        subtopic: "String Basics",
        archetypeId: "string-reverse",
        operationTags: ["TRANSFORM"],
        difficulty: "beginner",
      });
      const fp2 = createMockFingerprint({
        module: "trees",
        subtopic: "Binary Trees",
        archetypeId: "tree-traversal",
        operationTags: ["ITERATE", "SEARCH"],
        difficulty: "advanced",
      });

      const similarity = calculateSimilarity(fp1, fp2);

      expect(similarity).toBeLessThan(0.5);
    });

    it("should return partial similarity for partially matching fingerprints", () => {
      const fp1 = createMockFingerprint({
        module: "arrays",
        subtopic: "Array Basics",
        archetypeId: "sum-elements",
      });
      const fp2 = createMockFingerprint({
        module: "arrays",
        subtopic: "Array Basics",
        archetypeId: "max-elements", // Different archetype
      });

      const similarity = calculateSimilarity(fp1, fp2);

      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it("should weight archetype match heavily", () => {
      // Same archetype, different everything else
      const fp1 = createMockFingerprint({
        module: "arrays",
        subtopic: "Array Basics",
        archetypeId: "sum-elements",
        difficulty: "beginner",
      });
      const fp2 = createMockFingerprint({
        module: "lists",
        subtopic: "List Operations",
        archetypeId: "sum-elements",
        difficulty: "advanced",
      });

      const similarity = calculateSimilarity(fp1, fp2);

      // Archetype match should contribute significantly
      expect(similarity).toBeGreaterThan(0.3);
    });
  });

  describe("isSimilarToAny", () => {
    it("should return true when similar fingerprint exists in history", () => {
      const fp = createMockFingerprint();
      const history = [fp];

      expect(isSimilarToAny(fp, history)).toBe(true);
    });

    it("should return false when no similar fingerprints exist", () => {
      const fp = createMockFingerprint({
        module: "completely-different",
        archetypeId: "unique-type",
      });
      const history = [
        createMockFingerprint({
          module: "arrays",
          archetypeId: "sum-elements",
        }),
      ];

      expect(isSimilarToAny(fp, history)).toBe(false);
    });

    it("should return false for empty history", () => {
      const fp = createMockFingerprint();
      expect(isSimilarToAny(fp, [])).toBe(false);
    });

    it("should respect custom threshold", () => {
      const fp1 = createMockFingerprint();
      const fp2 = createMockFingerprint({
        archetypeId: "different-archetype",
      });

      // With very low threshold, should match
      expect(isSimilarToAny(fp1, [fp2], 0.1)).toBe(true);

      // With very high threshold, should not match
      expect(isSimilarToAny(fp1, [fp2], 0.99)).toBe(false);
    });
  });

  describe("findMostSimilar", () => {
    it("should return null for empty history", () => {
      const fp = createMockFingerprint();
      expect(findMostSimilar(fp, [])).toBeNull();
    });

    it("should return the most similar fingerprint", () => {
      const target = createMockFingerprint({
        module: "arrays",
        archetypeId: "sum-elements",
      });

      const history = [
        createMockFingerprint({
          module: "strings",
          archetypeId: "string-reverse",
        }),
        createMockFingerprint({
          module: "arrays",
          archetypeId: "sum-elements",
        }), // Most similar
        createMockFingerprint({
          module: "trees",
          archetypeId: "tree-traversal",
        }),
      ];

      const result = findMostSimilar(target, history);

      expect(result).not.toBeNull();
      expect(result?.fingerprint.archetypeId).toBe("sum-elements");
      expect(result?.similarity).toBeCloseTo(1, 5);
    });

    it("should include similarity score in result", () => {
      const target = createMockFingerprint();
      const history = [createMockFingerprint()];

      const result = findMostSimilar(target, history);

      expect(result?.similarity).toBeDefined();
      expect(typeof result?.similarity).toBe("number");
    });
  });

  describe("serializeFingerprint", () => {
    it("should create a compact serialized form", () => {
      const fp = createMockFingerprint();
      const serialized = serializeFingerprint(fp);

      expect(serialized.m).toBe(fp.module);
      expect(serialized.s).toBe(fp.subtopic);
      expect(serialized.a).toBe(fp.archetypeId);
      expect(serialized.d).toBe(fp.difficulty);
      expect(serialized.t).toBe(fp.timestamp);
      expect(typeof serialized.o).toBe("string");
    });

    it("should join operation tags with commas", () => {
      const fp = createMockFingerprint({
        operationTags: ["ITERATE", "SEARCH", "SORT"],
      });
      const serialized = serializeFingerprint(fp);

      expect(serialized.o).toBe("ITERATE,SEARCH,SORT");
    });
  });

  describe("deserializeFingerprint", () => {
    it("should restore fingerprint from serialized form", () => {
      const original = createMockFingerprint();
      const serialized = serializeFingerprint(original);
      const restored = deserializeFingerprint(serialized);

      expect(restored.module).toBe(original.module);
      expect(restored.subtopic).toBe(original.subtopic);
      expect(restored.archetypeId).toBe(original.archetypeId);
      expect(restored.difficulty).toBe(original.difficulty);
      expect(restored.timestamp).toBe(original.timestamp);
    });

    it("should restore operation tags as array", () => {
      const original = createMockFingerprint({
        operationTags: ["ITERATE", "AGGREGATE"],
      });
      const serialized = serializeFingerprint(original);
      const restored = deserializeFingerprint(serialized);

      expect(Array.isArray(restored.operationTags)).toBe(true);
      expect(restored.operationTags).toEqual(["ITERATE", "AGGREGATE"]);
    });

    it("should handle empty operation tags", () => {
      const serialized = {
        m: "module",
        s: "subtopic",
        a: "archetype",
        o: "",
        d: "beginner",
        t: Date.now(),
      };
      const restored = deserializeFingerprint(serialized);

      expect(restored.operationTags).toEqual([""]);
    });
  });

  describe("fingerprintToString", () => {
    it("should create a readable string representation", () => {
      const fp = createMockFingerprint({
        module: "arrays",
        subtopic: "basics",
        archetypeId: "sum",
        operationTags: ["ITERATE"],
        difficulty: "beginner",
      });

      const str = fingerprintToString(fp);

      expect(str).toContain("arrays");
      expect(str).toContain("basics");
      expect(str).toContain("sum");
      expect(str).toContain("ITERATE");
      expect(str).toContain("beginner");
    });
  });

  describe("matchesFilter", () => {
    it("should return true when fingerprint matches all criteria", () => {
      const fp = createMockFingerprint({
        module: "arrays",
        subtopic: "basics",
        archetypeId: "sum",
        difficulty: "beginner",
      });

      expect(
        matchesFilter(fp, {
          module: "arrays",
          subtopic: "basics",
          archetypeId: "sum",
          difficulty: "beginner",
        })
      ).toBe(true);
    });

    it("should return true for empty filter", () => {
      const fp = createMockFingerprint();
      expect(matchesFilter(fp, {})).toBe(true);
    });

    it("should return false when any criterion does not match", () => {
      const fp = createMockFingerprint({
        module: "arrays",
        subtopic: "basics",
      });

      expect(matchesFilter(fp, { module: "strings" })).toBe(false);
      expect(matchesFilter(fp, { subtopic: "advanced" })).toBe(false);
    });

    it("should match partial filters", () => {
      const fp = createMockFingerprint({
        module: "arrays",
        difficulty: "beginner",
      });

      expect(matchesFilter(fp, { module: "arrays" })).toBe(true);
      expect(matchesFilter(fp, { difficulty: "beginner" })).toBe(true);
    });
  });
});
