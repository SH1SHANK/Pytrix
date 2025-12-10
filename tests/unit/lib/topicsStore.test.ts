/**
 * Topics Store Unit Tests
 *
 * Tests for the centralized topics data access layer:
 * - Data accessors (getModuleById, getSubtopicById, etc.)
 * - List queries
 * - Search functions
 * - Statistics
 * - Random selection
 */

import { describe, it, expect } from "vitest";
import {
  getAllModules,
  getModuleById,
  getModuleByOrder,
  getSubtopicById,
  getSubtopicWithModule,
  getProblemTypeById,
  getProblemTypeWithContext,
  listSubtopics,
  listProblemTypes,
  listModuleProblemTypes,
  listProblemArchetypes,
  searchModules,
  searchSubtopics,
  searchProblemTypes,
  getTopicsStats,
  getModuleStats,
  getRandomModule,
  getRandomSubtopic,
  getRandomProblemType,
  getTopicsData,
} from "@/lib/stores/topicsStore";

describe("topicsStore", () => {
  describe("getAllModules", () => {
    it("should return an array of modules", () => {
      const modules = getAllModules();

      expect(Array.isArray(modules)).toBe(true);
      expect(modules.length).toBeGreaterThan(0);
    });

    it("should have modules with required properties", () => {
      const modules = getAllModules();
      const firstModule = modules[0];

      expect(firstModule.id).toBeDefined();
      expect(firstModule.name).toBeDefined();
      expect(firstModule.subtopics).toBeDefined();
      expect(Array.isArray(firstModule.subtopics)).toBe(true);
    });
  });

  describe("getModuleById", () => {
    it("should return module when found", () => {
      const modules = getAllModules();
      const firstModule = modules[0];

      const found = getModuleById(firstModule.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(firstModule.id);
    });

    it("should return undefined for non-existent module", () => {
      const found = getModuleById("non-existent-module-id");
      expect(found).toBeUndefined();
    });
  });

  describe("getModuleByOrder", () => {
    it("should return module by order number", () => {
      const topicsModule = getModuleByOrder(1);

      expect(topicsModule).toBeDefined();
      expect(topicsModule?.order).toBe(1);
    });

    it("should return undefined for invalid order", () => {
      const topicsModule = getModuleByOrder(999);
      expect(topicsModule).toBeUndefined();
    });
  });

  describe("getSubtopicById", () => {
    it("should find subtopic across all modules", () => {
      const modules = getAllModules();
      const firstSubtopic = modules[0].subtopics[0];

      const found = getSubtopicById(firstSubtopic.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(firstSubtopic.id);
    });

    it("should return undefined for non-existent subtopic", () => {
      const found = getSubtopicById("non-existent-subtopic");
      expect(found).toBeUndefined();
    });
  });

  describe("getSubtopicWithModule", () => {
    it("should return subtopic with its parent module", () => {
      const modules = getAllModules();
      const firstSubtopic = modules[0].subtopics[0];

      const result = getSubtopicWithModule(firstSubtopic.id);

      expect(result).toBeDefined();
      expect(result?.subtopic.id).toBe(firstSubtopic.id);
      expect(result?.module.id).toBe(modules[0].id);
    });

    it("should return undefined for non-existent subtopic", () => {
      const result = getSubtopicWithModule("non-existent");
      expect(result).toBeUndefined();
    });
  });

  describe("getProblemTypeById", () => {
    it("should find problem type across all subtopics", () => {
      const modules = getAllModules();
      const firstPT = modules[0].subtopics[0].problemTypes[0];

      const found = getProblemTypeById(firstPT.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(firstPT.id);
    });

    it("should return undefined for non-existent problem type", () => {
      const found = getProblemTypeById("non-existent-pt");
      expect(found).toBeUndefined();
    });
  });

  describe("getProblemTypeWithContext", () => {
    it("should return problem type with parent context", () => {
      const modules = getAllModules();
      const firstPT = modules[0].subtopics[0].problemTypes[0];

      const result = getProblemTypeWithContext(firstPT.id);

      expect(result).toBeDefined();
      expect(result?.problemType.id).toBe(firstPT.id);
      expect(result?.subtopic).toBeDefined();
      expect(result?.module).toBeDefined();
    });

    it("should return undefined for non-existent problem type", () => {
      const result = getProblemTypeWithContext("non-existent");
      expect(result).toBeUndefined();
    });
  });

  describe("listSubtopics", () => {
    it("should list subtopics for a valid module", () => {
      const modules = getAllModules();
      const firstModule = modules[0];

      const subtopics = listSubtopics(firstModule.id);

      expect(subtopics).toEqual(firstModule.subtopics);
    });

    it("should return empty array for non-existent module", () => {
      const subtopics = listSubtopics("non-existent");
      expect(subtopics).toEqual([]);
    });
  });

  describe("listProblemTypes", () => {
    it("should list problem types for a valid subtopic", () => {
      const modules = getAllModules();
      const firstSubtopic = modules[0].subtopics[0];

      const problemTypes = listProblemTypes(firstSubtopic.id);

      expect(problemTypes).toEqual(firstSubtopic.problemTypes);
    });

    it("should return empty array for non-existent subtopic", () => {
      const problemTypes = listProblemTypes("non-existent");
      expect(problemTypes).toEqual([]);
    });
  });

  describe("listModuleProblemTypes", () => {
    it("should list all problem types from a module", () => {
      const modules = getAllModules();
      const firstModule = modules[0];

      const problemTypes = listModuleProblemTypes(firstModule.id);

      expect(problemTypes.length).toBeGreaterThan(0);
    });

    it("should return empty array for non-existent module", () => {
      const problemTypes = listModuleProblemTypes("non-existent");
      expect(problemTypes).toEqual([]);
    });
  });

  describe("listProblemArchetypes", () => {
    it("should list archetypes for a module", () => {
      const modules = getAllModules();
      const moduleWithArchetypes = modules.find(
        (m) => m.problemArchetypes?.length > 0
      );

      if (moduleWithArchetypes) {
        const archetypes = listProblemArchetypes(moduleWithArchetypes.id);
        expect(archetypes.length).toBeGreaterThan(0);
      }
    });
  });

  describe("searchModules", () => {
    it("should find modules by name (case-insensitive)", () => {
      const modules = getAllModules();
      const firstName = modules[0].name.toLowerCase().substring(0, 5);

      const results = searchModules(firstName);

      expect(results.length).toBeGreaterThan(0);
    });

    it("should return empty array for no matches", () => {
      const results = searchModules("zzzznonexistent");
      expect(results).toEqual([]);
    });
  });

  describe("searchSubtopics", () => {
    it("should search subtopics across all modules", () => {
      const modules = getAllModules();
      const firstName = modules[0].subtopics[0].name.substring(0, 3);

      const results = searchSubtopics(firstName);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].subtopic).toBeDefined();
      expect(results[0].module).toBeDefined();
    });
  });

  describe("searchProblemTypes", () => {
    it("should search problem types across all modules", () => {
      const modules = getAllModules();
      const firstPT = modules[0].subtopics[0].problemTypes[0];
      const searchTerm = firstPT.name.substring(0, 4);

      const results = searchProblemTypes(searchTerm);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].problemType).toBeDefined();
      expect(results[0].subtopic).toBeDefined();
      expect(results[0].module).toBeDefined();
    });
  });

  describe("getTopicsStats", () => {
    it("should return overall statistics", () => {
      const stats = getTopicsStats();

      expect(stats.version).toBeDefined();
      expect(stats.moduleCount).toBeGreaterThan(0);
      expect(stats.subtopicCount).toBeGreaterThan(0);
      expect(stats.problemTypeCount).toBeGreaterThan(0);
      expect(typeof stats.archetypeCount).toBe("number");
    });
  });

  describe("getModuleStats", () => {
    it("should return stats for a valid module", () => {
      const modules = getAllModules();
      const firstModule = modules[0];

      const stats = getModuleStats(firstModule.id);

      expect(stats).toBeDefined();
      expect(stats?.subtopicCount).toBeGreaterThan(0);
      expect(stats?.problemTypeCount).toBeGreaterThan(0);
    });

    it("should return undefined for non-existent module", () => {
      const stats = getModuleStats("non-existent");
      expect(stats).toBeUndefined();
    });
  });

  describe("getRandomModule", () => {
    it("should return a valid module", () => {
      const topicsModule = getRandomModule();

      expect(topicsModule).toBeDefined();
      expect(topicsModule.id).toBeDefined();
      expect(topicsModule.name).toBeDefined();
    });
  });

  describe("getRandomSubtopic", () => {
    it("should return a subtopic from any module", () => {
      const subtopic = getRandomSubtopic();

      expect(subtopic).toBeDefined();
      expect(subtopic?.id).toBeDefined();
    });

    it("should return a subtopic from a specific module", () => {
      const modules = getAllModules();
      const firstModule = modules[0];

      const subtopic = getRandomSubtopic(firstModule.id);

      expect(subtopic).toBeDefined();
    });

    it("should return undefined for non-existent module", () => {
      const subtopic = getRandomSubtopic("non-existent");
      expect(subtopic).toBeUndefined();
    });
  });

  describe("getRandomProblemType", () => {
    it("should return a problem type", () => {
      const pt = getRandomProblemType();

      expect(pt).toBeDefined();
      expect(pt?.id).toBeDefined();
    });

    it("should return a problem type from a specific subtopic", () => {
      const modules = getAllModules();
      const firstSubtopic = modules[0].subtopics[0];

      const pt = getRandomProblemType(firstSubtopic.id);

      expect(pt).toBeDefined();
    });
  });

  describe("getTopicsData", () => {
    it("should return the raw topics data", () => {
      const data = getTopicsData();

      expect(data).toBeDefined();
      expect(data.version).toBeDefined();
      expect(data.modules).toBeDefined();
      expect(Array.isArray(data.modules)).toBe(true);
    });
  });
});
