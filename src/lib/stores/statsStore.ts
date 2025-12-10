/**
 * Stats Store v2 - Hierarchical Stats System
 *
 * Provides stats tracking with module → subtopic → problemType hierarchy.
 * Supports per-difficulty tracking and migration from old flat format.
 */

import { getAllModules } from "@/lib/stores/topicsStore";

// ============================================
// TYPE DEFINITIONS
// ============================================

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

/**
 * Stats for a single difficulty level.
 */
export interface DifficultyStats {
  attempts: number;
  solved: number;
  avgTimeTakenMs: number;
  lastAttemptAt: number;
}

/**
 * Stats for a problem type.
 */
export interface ProblemTypeStats {
  problemTypeId: string;
  problemTypeName: string;
  beginner: DifficultyStats;
  intermediate: DifficultyStats;
  advanced: DifficultyStats;
  attempts: number;
  solved: number;
}

/**
 * Stats for a subtopic.
 */
export interface SubtopicStats {
  subtopicId: string;
  subtopicName: string;
  problemTypes: ProblemTypeStats[];
  attempts: number;
  solved: number;
  masteryPercent: number;
}

/**
 * Stats for a module.
 */
export interface ModuleStats {
  moduleId: string;
  moduleName: string;
  subtopics: SubtopicStats[];
  attempts: number;
  solved: number;
  masteryPercent: number;
}

/**
 * Global stats structure v2.
 */
export interface GlobalStatsV2 {
  version: 3;
  totalAttempts: number;
  totalSolved: number;
  totalTimeTakenMs: number;
  modulesTouched: number;
  subtopicsTouched: number;
  masteryPercent: number;
  modules: ModuleStats[];
  lastUpdatedAt: number;
}

/**
 * Input for recording an attempt.
 */
export interface RecordAttemptInput {
  moduleId: string;
  subtopicId: string;
  problemTypeId: string;
  correct: boolean;
  timeTakenMs: number;
  difficulty?: DifficultyLevel;
}

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEY_V2 = "pytrix_stats_v2";
const STORAGE_KEY_OLD = "pypractice-stats";
// const STATS_VERSION = 3;

// ============================================
// HELPER FUNCTIONS
// ============================================

function createEmptyDifficultyStats(): DifficultyStats {
  return {
    attempts: 0,
    solved: 0,
    avgTimeTakenMs: 0,
    lastAttemptAt: 0,
  };
}

function createEmptyProblemTypeStats(
  problemTypeId: string,
  problemTypeName: string
): ProblemTypeStats {
  return {
    problemTypeId,
    problemTypeName,
    beginner: createEmptyDifficultyStats(),
    intermediate: createEmptyDifficultyStats(),
    advanced: createEmptyDifficultyStats(),
    attempts: 0,
    solved: 0,
  };
}

function createEmptySubtopicStats(
  subtopicId: string,
  subtopicName: string
): SubtopicStats {
  return {
    subtopicId,
    subtopicName,
    problemTypes: [],
    attempts: 0,
    solved: 0,
    masteryPercent: 0,
  };
}

function createEmptyModuleStats(
  moduleId: string,
  moduleName: string
): ModuleStats {
  return {
    moduleId,
    moduleName,
    subtopics: [],
    attempts: 0,
    solved: 0,
    masteryPercent: 0,
  };
}

export function createEmptyStatsV2(): GlobalStatsV2 {
  return {
    version: 3,
    totalAttempts: 0,
    totalSolved: 0,
    totalTimeTakenMs: 0,
    modulesTouched: 0,
    subtopicsTouched: 0,
    masteryPercent: 0,
    modules: [],
    lastUpdatedAt: Date.now(),
  };
}

function calculateMastery(attempts: number, solved: number): number {
  if (attempts === 0) return 0;
  return Math.min(100, Math.round((solved / attempts) * 100));
}

function updateAvgTime(
  currentAvg: number,
  currentCount: number,
  newTime: number
): number {
  if (currentCount === 0) return newTime;
  return Math.round((currentAvg * currentCount + newTime) / (currentCount + 1));
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Get stats from localStorage (v2 format).
 */
export function getStatsV2(): GlobalStatsV2 {
  if (typeof window === "undefined") {
    return createEmptyStatsV2();
  }

  const stored = localStorage.getItem(STORAGE_KEY_V2);
  if (!stored) {
    // Check if old stats exist and need migration
    const oldStats = localStorage.getItem(STORAGE_KEY_OLD);
    if (oldStats) {
      console.log("[statsStore] Old stats detected, run migration script.");
    }

    const empty = createEmptyStatsV2();
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(empty));
    return empty;
  }

  try {
    const parsed = JSON.parse(stored) as GlobalStatsV2;
    return parsed;
  } catch {
    console.warn("[statsStore] Corrupted stats v2, resetting.");
    const empty = createEmptyStatsV2();
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(empty));
    return empty;
  }
}

/**
 * Save stats to localStorage.
 */
export function saveStatsV2(stats: GlobalStatsV2): void {
  if (typeof window === "undefined") return;
  stats.lastUpdatedAt = Date.now();
  localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(stats));
}

/**
 * Record an attempt with full hierarchy.
 */
export function recordAttempt(input: RecordAttemptInput): GlobalStatsV2 {
  const {
    moduleId,
    subtopicId,
    problemTypeId,
    correct,
    timeTakenMs,
    difficulty = "beginner",
  } = input;

  const stats = getStatsV2();

  // Find or create module
  let moduleStats = stats.modules.find((m) => m.moduleId === moduleId);
  if (!moduleStats) {
    // Get module name from topicsStore
    const modules = getAllModules();
    const moduleData = modules.find((m) => m.id === moduleId);
    moduleStats = createEmptyModuleStats(
      moduleId,
      moduleData?.name || moduleId
    );
    stats.modules.push(moduleStats);
  }

  // Find or create subtopic
  let subtopicStats = moduleStats.subtopics.find(
    (s) => s.subtopicId === subtopicId
  );
  if (!subtopicStats) {
    const modules = getAllModules();
    const moduleData = modules.find((m) => m.id === moduleId);
    const subtopicData = moduleData?.subtopics.find((s) => s.id === subtopicId);
    subtopicStats = createEmptySubtopicStats(
      subtopicId,
      subtopicData?.name || subtopicId
    );
    moduleStats.subtopics.push(subtopicStats);
  }

  // Find or create problem type
  let problemTypeStats = subtopicStats.problemTypes.find(
    (p) => p.problemTypeId === problemTypeId
  );
  if (!problemTypeStats) {
    const modules = getAllModules();
    const moduleData = modules.find((m) => m.id === moduleId);
    const subtopicData = moduleData?.subtopics.find((s) => s.id === subtopicId);
    const ptData = subtopicData?.problemTypes.find(
      (p) => p.id === problemTypeId
    );
    problemTypeStats = createEmptyProblemTypeStats(
      problemTypeId,
      ptData?.name || problemTypeId
    );
    subtopicStats.problemTypes.push(problemTypeStats);
  }

  // Update difficulty-specific stats
  const diffStats = problemTypeStats[difficulty];
  diffStats.attempts++;
  if (correct) diffStats.solved++;
  diffStats.avgTimeTakenMs = updateAvgTime(
    diffStats.avgTimeTakenMs,
    diffStats.attempts - 1,
    timeTakenMs
  );
  diffStats.lastAttemptAt = Date.now();

  // Update problem type aggregates
  problemTypeStats.attempts++;
  if (correct) problemTypeStats.solved++;

  // Update subtopic aggregates
  subtopicStats.attempts++;
  if (correct) subtopicStats.solved++;
  subtopicStats.masteryPercent = calculateMastery(
    subtopicStats.attempts,
    subtopicStats.solved
  );

  // Update module aggregates
  moduleStats.attempts++;
  if (correct) moduleStats.solved++;
  moduleStats.masteryPercent = calculateMastery(
    moduleStats.attempts,
    moduleStats.solved
  );

  // Update global aggregates
  stats.totalAttempts++;
  if (correct) stats.totalSolved++;
  stats.totalTimeTakenMs += timeTakenMs;
  stats.masteryPercent = calculateMastery(
    stats.totalAttempts,
    stats.totalSolved
  );
  stats.modulesTouched = stats.modules.filter((m) => m.attempts > 0).length;
  stats.subtopicsTouched = stats.modules.reduce(
    (sum, m) => sum + m.subtopics.filter((s) => s.attempts > 0).length,
    0
  );

  saveStatsV2(stats);
  return stats;
}

/**
 * Get module stats by ID.
 */
export function getModuleStats(moduleId: string): ModuleStats | null {
  const stats = getStatsV2();
  return stats.modules.find((m) => m.moduleId === moduleId) || null;
}

/**
 * Get subtopic stats.
 */
export function getSubtopicStats(
  moduleId: string,
  subtopicId: string
): SubtopicStats | null {
  const moduleStats = getModuleStats(moduleId);
  if (!moduleStats) return null;
  return moduleStats.subtopics.find((s) => s.subtopicId === subtopicId) || null;
}

/**
 * Get weakest modules (lowest mastery with at least 1 attempt).
 */
export function getWeakestModules(count: number = 3): ModuleStats[] {
  const stats = getStatsV2();

  return [...stats.modules]
    .filter((m) => m.attempts > 0)
    .sort((a, b) => a.masteryPercent - b.masteryPercent)
    .slice(0, count);
}

/**
 * Get weakest subtopics across all modules.
 */
export function getWeakestSubtopics(count: number = 3): Array<{
  moduleId: string;
  subtopic: SubtopicStats;
}> {
  const stats = getStatsV2();

  const allSubtopics: Array<{ moduleId: string; subtopic: SubtopicStats }> = [];

  for (const mod of stats.modules) {
    for (const subtopic of mod.subtopics) {
      if (subtopic.attempts > 0) {
        allSubtopics.push({ moduleId: mod.moduleId, subtopic });
      }
    }
  }

  return allSubtopics
    .sort((a, b) => a.subtopic.masteryPercent - b.subtopic.masteryPercent)
    .slice(0, count);
}

/**
 * Get untouched modules (0 attempts).
 */
export function getUntouchedModules(): string[] {
  const stats = getStatsV2();
  const touchedIds = new Set(stats.modules.map((m) => m.moduleId));

  const allModules = getAllModules();
  return allModules
    .filter(
      (m) =>
        !touchedIds.has(m.id) ||
        stats.modules.find((s) => s.moduleId === m.id)?.attempts === 0
    )
    .map((m) => m.id);
}

/**
 * Reset all stats.
 */
export function resetStatsV2(): GlobalStatsV2 {
  if (typeof window === "undefined") {
    return createEmptyStatsV2();
  }

  const empty = createEmptyStatsV2();
  localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(empty));
  return empty;
}

/**
 * Reset stats for a specific module.
 */
export function resetModuleStats(moduleId: string): GlobalStatsV2 {
  const stats = getStatsV2();

  const moduleStats = stats.modules.find((m) => m.moduleId === moduleId);
  if (moduleStats) {
    // Subtract from totals
    stats.totalAttempts -= moduleStats.attempts;
    stats.totalSolved -= moduleStats.solved;

    // Remove the module
    stats.modules = stats.modules.filter((m) => m.moduleId !== moduleId);

    // Recalculate
    stats.masteryPercent = calculateMastery(
      stats.totalAttempts,
      stats.totalSolved
    );
    stats.modulesTouched = stats.modules.filter((m) => m.attempts > 0).length;
    stats.subtopicsTouched = stats.modules.reduce(
      (sum, m) => sum + m.subtopics.filter((s) => s.attempts > 0).length,
      0
    );
  }

  saveStatsV2(stats);
  return stats;
}

// ============================================
// LEGACY COMPATIBILITY (getStats wrapper)
// ============================================

// Re-export old types for compatibility
export type { DifficultyLevel as DifficultyLevelLegacy };

/**
 * Legacy TopicStats format for backward compatibility.
 */
export interface TopicStats {
  topic: string;
  beginner: { attempts: number; solved: number };
  intermediate: { attempts: number; solved: number };
  advanced: { attempts: number; solved: number };
  attempts: number;
  solved: number;
}

/**
 * Legacy GlobalStats format for backward compatibility.
 */
export interface GlobalStats {
  totalAttempts: number;
  totalSolved: number;
  topicsTouched: number;
  masteryPercent: number;
  perTopic: TopicStats[];
}

/**
 * Legacy getStats() for backward compatibility.
 * Converts v2 stats to old format.
 */
export function getStats(): GlobalStats {
  const v2 = getStatsV2();

  // Convert modules to flat topics
  const perTopic: TopicStats[] = [];

  for (const mod of v2.modules) {
    // Add module as a topic
    perTopic.push({
      topic: mod.moduleName,
      beginner: { attempts: 0, solved: 0 },
      intermediate: { attempts: 0, solved: 0 },
      advanced: { attempts: 0, solved: 0 },
      attempts: mod.attempts,
      solved: mod.solved,
    });

    // Add each subtopic as a topic (for dashboard compatibility)
    for (const subtopic of mod.subtopics) {
      const aggregated: TopicStats = {
        topic: subtopic.subtopicName,
        beginner: { attempts: 0, solved: 0 },
        intermediate: { attempts: 0, solved: 0 },
        advanced: { attempts: 0, solved: 0 },
        attempts: subtopic.attempts,
        solved: subtopic.solved,
      };

      // Aggregate difficulty stats from problem types
      for (const pt of subtopic.problemTypes) {
        aggregated.beginner.attempts += pt.beginner.attempts;
        aggregated.beginner.solved += pt.beginner.solved;
        aggregated.intermediate.attempts += pt.intermediate.attempts;
        aggregated.intermediate.solved += pt.intermediate.solved;
        aggregated.advanced.attempts += pt.advanced.attempts;
        aggregated.advanced.solved += pt.advanced.solved;
      }

      perTopic.push(aggregated);
    }
  }

  return {
    totalAttempts: v2.totalAttempts,
    totalSolved: v2.totalSolved,
    topicsTouched: v2.subtopicsTouched,
    masteryPercent: v2.masteryPercent,
    perTopic,
  };
}

/**
 * Legacy incrementAttempt for backward compatibility.
 */
export function incrementAttempt(
  topicName: string,
  isCorrect: boolean,
  difficulty: DifficultyLevel = "beginner"
): GlobalStats {
  // Try to find matching module/subtopic
  const modules = getAllModules();

  for (const mod of modules) {
    for (const subtopic of mod.subtopics) {
      if (
        subtopic.name.toLowerCase() === topicName.toLowerCase() ||
        mod.name.toLowerCase() === topicName.toLowerCase()
      ) {
        // Use first problem type as fallback
        const firstPt = subtopic.problemTypes[0];
        if (firstPt) {
          recordAttempt({
            moduleId: mod.id,
            subtopicId: subtopic.id,
            problemTypeId: firstPt.id,
            correct: isCorrect,
            timeTakenMs: 0,
            difficulty,
          });
        }
        break;
      }
    }
  }

  return getStats();
}

/**
 * Legacy resetStats for backward compatibility.
 */
export function resetStats(): GlobalStats {
  resetStatsV2();
  return getStats();
}

/**
 * Legacy resetTopicStats for backward compatibility.
 */
export function resetTopicStats(topicId: string): GlobalStats {
  // Try to find matching module
  const stats = getStatsV2();
  const moduleStats = stats.modules.find(
    (m) =>
      m.moduleId === topicId ||
      m.moduleName.toLowerCase() === topicId.toLowerCase()
  );

  if (moduleStats) {
    resetModuleStats(moduleStats.moduleId);
  }

  return getStats();
}

/**
 * Legacy getTopicStats for backward compatibility.
 */
export function getTopicStats(topicName: string): TopicStats | null {
  const stats = getStats();
  return (
    stats.perTopic.find(
      (t) => t.topic.toLowerCase() === topicName.toLowerCase()
    ) || null
  );
}

/**
 * Legacy getWeakestTopics for backward compatibility.
 */
export function getWeakestTopics(count: number = 3): string[] {
  const stats = getStats();
  return stats.perTopic
    .filter((t) => t.attempts > 0)
    .sort((a, b) => {
      const rateA = a.attempts > 0 ? a.solved / a.attempts : 0;
      const rateB = b.attempts > 0 ? b.solved / b.attempts : 0;
      return rateA - rateB;
    })
    .slice(0, count)
    .map((t) => t.topic);
}

// Export storage keys for migration
export { STORAGE_KEY_V2, STORAGE_KEY_OLD };
