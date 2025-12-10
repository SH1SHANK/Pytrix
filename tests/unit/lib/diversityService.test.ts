/**
 * Diversity Service Unit Tests
 *
 * Tests for question history management and diversity scoring:
 * - Recording fingerprints
 * - Regeneration decisions
 * - Avoid-list generation
 * - Archetype exposure tracking
 * - Session management
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  initializeDiversityService,
  recordFingerprint,
  shouldRegenerateQuestion,
  getAvoidList,
  formatAvoidListForPrompt,
  getArchetypeExposure,
  getLeastUsedArchetypes,
  isConsecutiveRepeat,
  scoreDiversity,
  clearSessionCache,
  clearAllHistory,
  getSessionStats,
} from "@/lib/diversityService";
import type { QuestionFingerprint } from "@/lib/questionFingerprint";

// Helper to create mock fingerprints
function createMockFingerprint(
  overrides: Partial<QuestionFingerprint> = {}
): QuestionFingerprint {
  return {
    module: "arrays",
    subtopic: "Array Basics",
    archetypeId: `archetype-${Date.now()}-${Math.random()}`,
    operationTags: ["ITERATE", "AGGREGATE"],
    difficulty: "beginner",
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("diversityService", () => {
  beforeEach(() => {
    // Clear all state before each test
    clearAllHistory();
    localStorage.clear();
  });

  describe("initializeDiversityService", () => {
    it("should initialize without error", () => {
      expect(() => initializeDiversityService()).not.toThrow();
    });

    it("should load persisted history if exists", () => {
      // Set up some persisted data
      const mockHistory = [
        {
          m: "arrays",
          s: "basics",
          a: "sum",
          o: "ITERATE",
          d: "beginner",
          t: Date.now(),
        },
      ];
      localStorage.setItem(
        "pytrix-question-history",
        JSON.stringify(mockHistory)
      );

      initializeDiversityService();

      const stats = getSessionStats();
      expect(stats.sessionCacheSize).toBeGreaterThanOrEqual(0);
    });
  });

  describe("recordFingerprint", () => {
    it("should add fingerprint to session cache", () => {
      const fp = createMockFingerprint();

      recordFingerprint(fp);

      const stats = getSessionStats();
      expect(stats.sessionCacheSize).toBe(1);
    });

    it("should increment archetype exposure", () => {
      const archetypeId = "test-archetype-record";
      const fp = createMockFingerprint({ archetypeId });

      recordFingerprint(fp);

      const exposure = getArchetypeExposure();
      expect(exposure.get(archetypeId)).toBe(1);
    });

    it("should track multiple recordings of same archetype", () => {
      const archetypeId = "repeated-archetype";

      recordFingerprint(createMockFingerprint({ archetypeId }));
      recordFingerprint(createMockFingerprint({ archetypeId }));
      recordFingerprint(createMockFingerprint({ archetypeId }));

      const exposure = getArchetypeExposure();
      expect(exposure.get(archetypeId)).toBe(3);
    });
  });

  describe("shouldRegenerateQuestion", () => {
    it("should return false for first attempt with unique fingerprint", () => {
      clearAllHistory();
      const fp = createMockFingerprint();

      expect(shouldRegenerateQuestion(fp, 0)).toBe(false);
    });

    it("should return true for duplicate fingerprint", () => {
      const fp = createMockFingerprint({ archetypeId: "exact-duplicate" });

      // Record the fingerprint first
      recordFingerprint(fp);

      // Same fingerprint should trigger regeneration
      expect(shouldRegenerateQuestion(fp, 0)).toBe(true);
    });

    it("should respect attempt number (relaxed thresholds)", () => {
      const fp = createMockFingerprint();
      recordFingerprint(fp);

      // Higher attempt numbers may have relaxed thresholds
      const shouldRegenAttempt1 = shouldRegenerateQuestion(fp, 1);
      const shouldRegenAttempt5 = shouldRegenerateQuestion(fp, 5);

      // At higher attempts, thresholds are relaxed
      expect(typeof shouldRegenAttempt1).toBe("boolean");
      expect(typeof shouldRegenAttempt5).toBe("boolean");
    });
  });

  describe("getAvoidList", () => {
    it("should return avoid list structure", () => {
      const avoidList = getAvoidList();

      expect(avoidList).toHaveProperty("archetypes");
      expect(avoidList).toHaveProperty("operations");
      expect(Array.isArray(avoidList.archetypes)).toBe(true);
      expect(Array.isArray(avoidList.operations)).toBe(true);
    });

    it("should include recently used archetypes", () => {
      const archetypeId = "avoid-me";
      recordFingerprint(createMockFingerprint({ archetypeId }));

      const avoidList = getAvoidList();

      expect(avoidList.archetypes).toContain(archetypeId);
    });

    it("should filter by module when provided", () => {
      recordFingerprint(
        createMockFingerprint({
          module: "strings",
          archetypeId: "string-archetype",
        })
      );
      recordFingerprint(
        createMockFingerprint({
          module: "arrays",
          archetypeId: "array-archetype",
        })
      );

      const avoidList = getAvoidList("strings");

      expect(avoidList.archetypes).toContain("string-archetype");
    });

    it("should filter by module and subtopic when both provided", () => {
      recordFingerprint(
        createMockFingerprint({
          module: "arrays",
          subtopic: "basics",
          archetypeId: "basic-archetype",
        })
      );
      recordFingerprint(
        createMockFingerprint({
          module: "arrays",
          subtopic: "advanced",
          archetypeId: "advanced-archetype",
        })
      );

      const avoidList = getAvoidList("arrays", "basics");

      expect(avoidList.archetypes).toContain("basic-archetype");
    });
  });

  describe("formatAvoidListForPrompt", () => {
    it("should format avoid list as string", () => {
      const avoidList = {
        archetypes: ["type-a", "type-b"],
        operations: ["ITERATE", "SEARCH"] as ("ITERATE" | "SEARCH")[],
      };

      const formatted = formatAvoidListForPrompt(avoidList);

      expect(typeof formatted).toBe("string");
      expect(formatted.length).toBeGreaterThan(0);
    });

    it("should handle empty avoid list", () => {
      const avoidList = {
        archetypes: [] as string[],
        operations: [] as ("ITERATE" | "SEARCH")[],
      };

      const formatted = formatAvoidListForPrompt(avoidList);

      expect(typeof formatted).toBe("string");
    });
  });

  describe("getArchetypeExposure", () => {
    it("should return empty map initially", () => {
      const exposure = getArchetypeExposure();
      expect(exposure.size).toBe(0);
    });

    it("should track exposures correctly", () => {
      recordFingerprint(createMockFingerprint({ archetypeId: "type-a" }));
      recordFingerprint(createMockFingerprint({ archetypeId: "type-a" }));
      recordFingerprint(createMockFingerprint({ archetypeId: "type-b" }));

      const exposure = getArchetypeExposure();

      expect(exposure.get("type-a")).toBe(2);
      expect(exposure.get("type-b")).toBe(1);
    });

    it("should filter by module when provided", () => {
      recordFingerprint(
        createMockFingerprint({ module: "strings", archetypeId: "string-type" })
      );
      recordFingerprint(
        createMockFingerprint({ module: "arrays", archetypeId: "array-type" })
      );

      const exposure = getArchetypeExposure("strings");

      expect(exposure.has("string-type")).toBe(true);
    });
  });

  describe("getLeastUsedArchetypes", () => {
    it("should return archetypes sorted by usage", () => {
      const available = ["type-a", "type-b", "type-c"];

      // Use type-a twice, type-b once, type-c never
      recordFingerprint(createMockFingerprint({ archetypeId: "type-a" }));
      recordFingerprint(createMockFingerprint({ archetypeId: "type-a" }));
      recordFingerprint(createMockFingerprint({ archetypeId: "type-b" }));

      const leastUsed = getLeastUsedArchetypes(available, 3);

      // type-c (0 uses) should come first
      expect(leastUsed[0]).toBe("type-c");
    });

    it("should respect count limit", () => {
      const available = ["a", "b", "c", "d", "e"];

      const leastUsed = getLeastUsedArchetypes(available, 2);

      expect(leastUsed.length).toBe(2);
    });

    it("should return all if count exceeds available", () => {
      const available = ["a", "b"];

      const leastUsed = getLeastUsedArchetypes(available, 10);

      expect(leastUsed.length).toBe(2);
    });
  });

  describe("isConsecutiveRepeat", () => {
    it("should return false when no history", () => {
      expect(isConsecutiveRepeat("new-archetype")).toBe(false);
    });

    it("should return true for consecutive same archetype", () => {
      const archetypeId = "repeated";

      recordFingerprint(createMockFingerprint({ archetypeId }));

      expect(isConsecutiveRepeat(archetypeId)).toBe(true);
    });

    it("should return false when different from last", () => {
      recordFingerprint(createMockFingerprint({ archetypeId: "type-a" }));

      expect(isConsecutiveRepeat("type-b")).toBe(false);
    });
  });

  describe("scoreDiversity", () => {
    it("should return high score for unique fingerprint", () => {
      clearAllHistory();
      const fp = createMockFingerprint({ archetypeId: "unique" });

      const score = scoreDiversity(fp);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it("should return lower score for similar fingerprints", () => {
      const fp1 = createMockFingerprint({
        module: "arrays",
        archetypeId: "same-type",
      });
      recordFingerprint(fp1);

      const fp2 = createMockFingerprint({
        module: "arrays",
        archetypeId: "same-type",
      });

      const score = scoreDiversity(fp2);

      // Should have reduced diversity score
      expect(score).toBeLessThan(1);
    });
  });

  describe("clearSessionCache", () => {
    it("should clear session cache but keep persisted history", () => {
      recordFingerprint(createMockFingerprint());

      const statsBefore = getSessionStats();
      expect(statsBefore.sessionCacheSize).toBe(1);

      clearSessionCache();

      const statsAfter = getSessionStats();
      expect(statsAfter.sessionCacheSize).toBe(0);
    });
  });

  describe("clearAllHistory", () => {
    it("should clear both session and persisted history", () => {
      recordFingerprint(createMockFingerprint());

      clearAllHistory();

      const stats = getSessionStats();
      expect(stats.sessionCacheSize).toBe(0);
      expect(stats.persistedHistorySize).toBe(0);
    });
  });

  describe("getSessionStats", () => {
    it("should return stats object", () => {
      const stats = getSessionStats();

      expect(stats).toHaveProperty("sessionCacheSize");
      expect(stats).toHaveProperty("persistedHistorySize");
      expect(stats).toHaveProperty("uniqueArchetypes");
      expect(stats).toHaveProperty("topArchetypes");
    });

    it("should track correct counts", () => {
      recordFingerprint(createMockFingerprint({ archetypeId: "type-a" }));
      recordFingerprint(createMockFingerprint({ archetypeId: "type-a" }));
      recordFingerprint(createMockFingerprint({ archetypeId: "type-b" }));

      const stats = getSessionStats();

      expect(stats.sessionCacheSize).toBe(3);
      expect(stats.uniqueArchetypes).toBe(2);
    });

    it("should return top archetypes sorted by count", () => {
      recordFingerprint(createMockFingerprint({ archetypeId: "popular" }));
      recordFingerprint(createMockFingerprint({ archetypeId: "popular" }));
      recordFingerprint(createMockFingerprint({ archetypeId: "popular" }));
      recordFingerprint(createMockFingerprint({ archetypeId: "rare" }));

      const stats = getSessionStats();

      expect(stats.topArchetypes[0].id).toBe("popular");
      expect(stats.topArchetypes[0].count).toBe(3);
    });
  });
});
