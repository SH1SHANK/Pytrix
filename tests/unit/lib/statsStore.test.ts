/**
 * Stats Store Unit Tests
 *
 * Tests the hierarchical stats system including:
 * - Recording attempts (correct/incorrect)
 * - Mastery calculation
 * - Module/subtopic aggregation
 * - Weakness identification
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock topicsStore before imports
vi.mock("@/lib/stores/topicsStore", () => ({
  getAllModules: vi.fn(() => [
    {
      id: "strings",
      name: "Strings",
      subtopics: [
        {
          id: "string-basics",
          name: "String Basics",
          problemTypes: [{ id: "string-reverse", name: "Reverse String" }],
        },
        {
          id: "string-formatting",
          name: "String Formatting",
          problemTypes: [{ id: "f-string-basics", name: "F-String Basics" }],
        },
      ],
    },
    {
      id: "arrays",
      name: "Arrays",
      subtopics: [
        {
          id: "array-basics",
          name: "Array Basics",
          problemTypes: [{ id: "sum-elements", name: "Sum Elements" }],
        },
      ],
    },
    {
      id: "lists",
      name: "Lists",
      subtopics: [
        {
          id: "list-basics",
          name: "List Basics",
          problemTypes: [
            { id: "problem-0", name: "Problem 0" },
            { id: "problem-1", name: "Problem 1" },
            { id: "problem-2", name: "Problem 2" },
            { id: "problem-3", name: "Problem 3" },
            { id: "problem-4", name: "Problem 4" },
          ],
        },
      ],
    },
  ]),
}));

import {
  getStatsV2,
  saveStatsV2,
  recordAttempt,
  getModuleStats,
  getSubtopicStats,
  getWeakestModules,
  getWeakestSubtopics,
  resetStatsV2,
  resetModuleStats,
  createEmptyStatsV2,
  type RecordAttemptInput,
} from "@/lib/stores/statsStore";

describe("statsStore", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("createEmptyStatsV2", () => {
    it("should create empty stats with version 3", () => {
      const stats = createEmptyStatsV2();

      expect(stats.version).toBe(3);
      expect(stats.totalAttempts).toBe(0);
      expect(stats.totalSolved).toBe(0);
      expect(stats.masteryPercent).toBe(0);
      expect(stats.modules).toEqual([]);
    });
  });

  describe("getStatsV2 / saveStatsV2", () => {
    it("should return empty stats when no data exists", () => {
      const stats = getStatsV2();

      expect(stats.totalAttempts).toBe(0);
      expect(stats.totalSolved).toBe(0);
    });

    it("should save and retrieve stats", () => {
      const stats = createEmptyStatsV2();
      stats.totalAttempts = 10;
      stats.totalSolved = 5;

      saveStatsV2(stats);

      const retrieved = getStatsV2();
      expect(retrieved.totalAttempts).toBe(10);
      expect(retrieved.totalSolved).toBe(5);
    });
  });

  describe("recordAttempt", () => {
    it("should record a correct attempt", () => {
      const input: RecordAttemptInput = {
        moduleId: "strings",
        subtopicId: "string-basics",
        problemTypeId: "string-reverse",
        correct: true,
        timeTakenMs: 30000,
        difficulty: "beginner",
      };

      const stats = recordAttempt(input);

      expect(stats.totalAttempts).toBe(1);
      expect(stats.totalSolved).toBe(1);
      expect(stats.modulesTouched).toBe(1);
    });

    it("should record an incorrect attempt", () => {
      const input: RecordAttemptInput = {
        moduleId: "strings",
        subtopicId: "string-basics",
        problemTypeId: "string-reverse",
        correct: false,
        timeTakenMs: 45000,
        difficulty: "beginner",
      };

      const stats = recordAttempt(input);

      expect(stats.totalAttempts).toBe(1);
      expect(stats.totalSolved).toBe(0);
    });

    it("should create module stats hierarchy", () => {
      const input: RecordAttemptInput = {
        moduleId: "arrays",
        subtopicId: "array-basics",
        problemTypeId: "sum-elements",
        correct: true,
        timeTakenMs: 20000,
        difficulty: "beginner",
      };

      recordAttempt(input);

      const moduleStats = getModuleStats("arrays");
      expect(moduleStats).not.toBeNull();
      expect(moduleStats?.moduleId).toBe("arrays");
      expect(moduleStats?.attempts).toBe(1);
      expect(moduleStats?.solved).toBe(1);
    });

    it("should accumulate attempts correctly", () => {
      const baseInput: Omit<RecordAttemptInput, "correct"> = {
        moduleId: "strings",
        subtopicId: "string-basics",
        problemTypeId: "string-reverse",
        timeTakenMs: 30000,
        difficulty: "beginner",
      };

      recordAttempt({ ...baseInput, correct: true });
      recordAttempt({ ...baseInput, correct: true });
      recordAttempt({ ...baseInput, correct: false });

      const stats = getStatsV2();
      expect(stats.totalAttempts).toBe(3);
      expect(stats.totalSolved).toBe(2);
    });

    it("should update subtopic stats", () => {
      const input: RecordAttemptInput = {
        moduleId: "strings",
        subtopicId: "string-formatting",
        problemTypeId: "f-string-basics",
        correct: true,
        timeTakenMs: 25000,
        difficulty: "intermediate",
      };

      recordAttempt(input);

      const subtopicStats = getSubtopicStats("strings", "string-formatting");
      expect(subtopicStats).not.toBeNull();
      expect(subtopicStats?.subtopicId).toBe("string-formatting");
      expect(subtopicStats?.attempts).toBe(1);
    });

    it("should track difficulty-specific stats", () => {
      recordAttempt({
        moduleId: "strings",
        subtopicId: "string-basics",
        problemTypeId: "string-reverse",
        correct: true,
        timeTakenMs: 20000,
        difficulty: "beginner",
      });

      recordAttempt({
        moduleId: "strings",
        subtopicId: "string-basics",
        problemTypeId: "string-reverse",
        correct: false,
        timeTakenMs: 40000,
        difficulty: "intermediate",
      });

      const subtopicStats = getSubtopicStats("strings", "string-basics");
      expect(subtopicStats?.problemTypes).toBeDefined();
      expect(subtopicStats?.problemTypes.length).toBe(1);
    });
  });

  describe("mastery calculation", () => {
    it("should calculate mastery as 0 with no attempts", () => {
      const stats = getStatsV2();
      expect(stats.masteryPercent).toBe(0);
    });

    it("should calculate mastery percentage correctly", () => {
      // 4 correct, 1 incorrect = 80%
      for (let i = 0; i < 4; i++) {
        recordAttempt({
          moduleId: "lists",
          subtopicId: "list-basics",
          problemTypeId: `problem-${i}`,
          correct: true,
          timeTakenMs: 30000,
          difficulty: "beginner",
        });
      }
      recordAttempt({
        moduleId: "lists",
        subtopicId: "list-basics",
        problemTypeId: "problem-4",
        correct: false,
        timeTakenMs: 30000,
        difficulty: "beginner",
      });

      const stats = getStatsV2();
      expect(stats.totalAttempts).toBe(5);
      expect(stats.totalSolved).toBe(4);
      expect(stats.masteryPercent).toBe(80);
    });
  });

  describe("getWeakestModules", () => {
    it("should return empty array with no stats", () => {
      const weakest = getWeakestModules(3);
      expect(weakest).toEqual([]);
    });

    it("should return modules sorted by mastery (lowest first)", () => {
      // Module strings: 1/2 = 50%
      recordAttempt({
        moduleId: "strings",
        subtopicId: "string-basics",
        problemTypeId: "string-reverse",
        correct: true,
        timeTakenMs: 1000,
        difficulty: "beginner",
      });
      recordAttempt({
        moduleId: "strings",
        subtopicId: "string-basics",
        problemTypeId: "string-reverse",
        correct: false,
        timeTakenMs: 1000,
        difficulty: "beginner",
      });

      // Module arrays: 3/3 = 100%
      for (let i = 0; i < 3; i++) {
        recordAttempt({
          moduleId: "arrays",
          subtopicId: "array-basics",
          problemTypeId: "sum-elements",
          correct: true,
          timeTakenMs: 1000,
          difficulty: "beginner",
        });
      }

      const weakest = getWeakestModules(2);
      expect(weakest.length).toBe(2);
      // strings should come first (lower mastery - 50% vs 100%)
      expect(weakest[0].moduleId).toBe("strings");
    });
  });

  describe("getWeakestSubtopics", () => {
    it("should return empty array with no stats", () => {
      const weakest = getWeakestSubtopics(3);
      expect(weakest).toEqual([]);
    });
  });

  describe("resetStatsV2", () => {
    it("should reset all stats to empty", () => {
      // Add some data
      recordAttempt({
        moduleId: "strings",
        subtopicId: "string-basics",
        problemTypeId: "string-reverse",
        correct: true,
        timeTakenMs: 1000,
        difficulty: "beginner",
      });

      expect(getStatsV2().totalAttempts).toBe(1);

      const reset = resetStatsV2();

      expect(reset.totalAttempts).toBe(0);
      expect(reset.modules).toEqual([]);
    });
  });

  describe("resetModuleStats", () => {
    it("should reset only the specified module", () => {
      // Add data to two modules
      recordAttempt({
        moduleId: "strings",
        subtopicId: "string-basics",
        problemTypeId: "string-reverse",
        correct: true,
        timeTakenMs: 1000,
        difficulty: "beginner",
      });
      recordAttempt({
        moduleId: "arrays",
        subtopicId: "array-basics",
        problemTypeId: "sum-elements",
        correct: true,
        timeTakenMs: 1000,
        difficulty: "beginner",
      });

      resetModuleStats("arrays");

      const strings = getModuleStats("strings");
      const arrays = getModuleStats("arrays");

      expect(strings).not.toBeNull();
      expect(strings?.attempts).toBe(1);
      // arrays module should be removed (not just zeroed)
      expect(arrays).toBeNull();
    });
  });
});
