/**
 * Topics Store
 *
 * Centralized store for topics data with helper query functions.
 * Components should import from this store instead of directly importing topics.json.
 */

import topicsData from "@/data/topics.json";
import type { TopicsData, Module, Subtopic, ProblemType } from "@/types/topics";

// Cast imported JSON to typed data
const data: TopicsData = topicsData as TopicsData;

// ============================================================================
// Data Accessors
// ============================================================================

/**
 * Get all modules
 */
export function getAllModules(): Module[] {
  return data.modules;
}

/**
 * Get a module by its ID
 */
export function getModuleById(moduleId: string): Module | undefined {
  return data.modules.find((m) => m.id === moduleId);
}

/**
 * Get a module by its order number (1-20)
 */
export function getModuleByOrder(order: number): Module | undefined {
  return data.modules.find((m) => m.order === order);
}

/**
 * Get a subtopic by its ID (searches across all modules)
 */
export function getSubtopicById(subtopicId: string): Subtopic | undefined {
  for (const mod of data.modules) {
    const subtopic = mod.subtopics.find((st) => st.id === subtopicId);
    if (subtopic) return subtopic;
  }
  return undefined;
}

/**
 * Get a subtopic with its parent module
 */
export function getSubtopicWithModule(
  subtopicId: string
): { subtopic: Subtopic; module: Module } | undefined {
  for (const mod of data.modules) {
    const subtopic = mod.subtopics.find((st) => st.id === subtopicId);
    if (subtopic) return { subtopic, module: mod };
  }
  return undefined;
}

/**
 * Get a problem type by its ID (searches across all subtopics)
 */
export function getProblemTypeById(
  problemTypeId: string
): ProblemType | undefined {
  for (const mod of data.modules) {
    for (const subtopic of mod.subtopics) {
      const pt = subtopic.problemTypes.find((p) => p.id === problemTypeId);
      if (pt) return pt;
    }
  }
  return undefined;
}

/**
 * Get a problem type with its parent subtopic and module
 */
export function getProblemTypeWithContext(problemTypeId: string):
  | {
      problemType: ProblemType;
      subtopic: Subtopic;
      module: Module;
    }
  | undefined {
  for (const mod of data.modules) {
    for (const subtopic of mod.subtopics) {
      const problemType = subtopic.problemTypes.find(
        (p) => p.id === problemTypeId
      );
      if (problemType) return { problemType, subtopic, module: mod };
    }
  }
  return undefined;
}

// ============================================================================
// List Queries
// ============================================================================

/**
 * List all subtopics from a specific module
 */
export function listSubtopics(moduleId: string): Subtopic[] {
  const mod = getModuleById(moduleId);
  return mod?.subtopics ?? [];
}

/**
 * List all problem types from a specific subtopic
 */
export function listProblemTypes(subtopicId: string): ProblemType[] {
  const subtopic = getSubtopicById(subtopicId);
  return subtopic?.problemTypes ?? [];
}

/**
 * List all problem types from a specific module
 */
export function listModuleProblemTypes(moduleId: string): ProblemType[] {
  const mod = getModuleById(moduleId);
  if (!mod) return [];
  return mod.subtopics.flatMap((st) => st.problemTypes);
}

/**
 * List all problem archetypes from a specific module
 */
export function listProblemArchetypes(moduleId: string): string[] {
  const mod = getModuleById(moduleId);
  return mod?.problemArchetypes ?? [];
}

// ============================================================================
// Search & Filter
// ============================================================================

/**
 * Search modules by name (case-insensitive)
 */
export function searchModules(query: string): Module[] {
  const q = query.toLowerCase();
  return data.modules.filter((m) => m.name.toLowerCase().includes(q));
}

/**
 * Search subtopics by name across all modules (case-insensitive)
 */
export function searchSubtopics(
  query: string
): Array<{ subtopic: Subtopic; module: Module }> {
  const q = query.toLowerCase();
  const results: Array<{ subtopic: Subtopic; module: Module }> = [];

  for (const mod of data.modules) {
    for (const subtopic of mod.subtopics) {
      if (subtopic.name.toLowerCase().includes(q)) {
        results.push({ subtopic, module: mod });
      }
    }
  }

  return results;
}

/**
 * Search problem types by name across all modules (case-insensitive)
 */
export function searchProblemTypes(query: string): Array<{
  problemType: ProblemType;
  subtopic: Subtopic;
  module: Module;
}> {
  const q = query.toLowerCase();
  const results: Array<{
    problemType: ProblemType;
    subtopic: Subtopic;
    module: Module;
  }> = [];

  for (const mod of data.modules) {
    for (const subtopic of mod.subtopics) {
      for (const pt of subtopic.problemTypes) {
        if (pt.name.toLowerCase().includes(q)) {
          results.push({ problemType: pt, subtopic, module: mod });
        }
      }
    }
  }

  return results;
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get overall statistics about the topics data
 */
export function getTopicsStats(): {
  version: string;
  moduleCount: number;
  subtopicCount: number;
  problemTypeCount: number;
  archetypeCount: number;
} {
  const subtopicCount = data.modules.reduce(
    (acc, m) => acc + m.subtopics.length,
    0
  );
  const problemTypeCount = data.modules.reduce(
    (acc, m) =>
      acc + m.subtopics.reduce((a, st) => a + st.problemTypes.length, 0),
    0
  );
  const archetypeCount = data.modules.reduce(
    (acc, m) => acc + m.problemArchetypes.length,
    0
  );

  return {
    version: data.version,
    moduleCount: data.modules.length,
    subtopicCount,
    problemTypeCount,
    archetypeCount,
  };
}

/**
 * Get statistics for a specific module
 */
export function getModuleStats(
  moduleId: string
): { subtopicCount: number; problemTypeCount: number } | undefined {
  const mod = getModuleById(moduleId);
  if (!mod) return undefined;

  const problemTypeCount = mod.subtopics.reduce(
    (acc, st) => acc + st.problemTypes.length,
    0
  );

  return {
    subtopicCount: mod.subtopics.length,
    problemTypeCount,
  };
}

// ============================================================================
// Random Selection (for practice features)
// ============================================================================

/**
 * Get a random module
 */
export function getRandomModule(): Module {
  const idx = Math.floor(Math.random() * data.modules.length);
  return data.modules[idx];
}

/**
 * Get a random subtopic from a specific module (or any module if not specified)
 */
export function getRandomSubtopic(moduleId?: string): Subtopic | undefined {
  const mod = moduleId ? getModuleById(moduleId) : getRandomModule();
  if (!mod || mod.subtopics.length === 0) return undefined;

  const idx = Math.floor(Math.random() * mod.subtopics.length);
  return mod.subtopics[idx];
}

/**
 * Get a random problem type from a specific subtopic (or any if not specified)
 */
export function getRandomProblemType(
  subtopicId?: string
): ProblemType | undefined {
  const subtopic = subtopicId
    ? getSubtopicById(subtopicId)
    : getRandomSubtopic();
  if (!subtopic || subtopic.problemTypes.length === 0) return undefined;

  const idx = Math.floor(Math.random() * subtopic.problemTypes.length);
  return subtopic.problemTypes[idx];
}

// ============================================================================
// Exports for Direct Data Access (use sparingly)
// ============================================================================

/**
 * Get the raw topics data (prefer using helper functions instead)
 */
export function getTopicsData(): TopicsData {
  return data;
}

/**
 * Re-export types for convenience
 */
export type { TopicsData, Module, Subtopic, ProblemType } from "@/types/topics";
