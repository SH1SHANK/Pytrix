/**
 * Stats Migration Script
 *
 * Migrates old flat pypractice-stats to new hierarchical pytrix_stats_v2.
 *
 * Run with: npx tsx scripts/migrate-stats.ts
 */

// This script is designed to be run in a browser context via the console
// or as a Node.js script after mocking localStorage

const STORAGE_KEY_OLD = "pypractice-stats";
const STORAGE_KEY_V2 = "pytrix_stats_v2";

interface OldDifficultyStats {
  attempts: number;
  solved: number;
}

interface OldTopicStats {
  topic: string;
  beginner?: OldDifficultyStats;
  intermediate?: OldDifficultyStats;
  advanced?: OldDifficultyStats;
  attempts: number;
  solved: number;
}

interface OldGlobalStats {
  version?: number;
  totalAttempts: number;
  totalSolved: number;
  topicsTouched: number;
  masteryPercent: number;
  perTopic: OldTopicStats[];
}

interface NewDifficultyStats {
  attempts: number;
  solved: number;
  avgTimeTakenMs: number;
  lastAttemptAt: number;
}

interface NewProblemTypeStats {
  problemTypeId: string;
  problemTypeName: string;
  beginner: NewDifficultyStats;
  intermediate: NewDifficultyStats;
  advanced: NewDifficultyStats;
  attempts: number;
  solved: number;
}

interface NewSubtopicStats {
  subtopicId: string;
  subtopicName: string;
  problemTypes: NewProblemTypeStats[];
  attempts: number;
  solved: number;
  masteryPercent: number;
}

interface NewModuleStats {
  moduleId: string;
  moduleName: string;
  subtopics: NewSubtopicStats[];
  attempts: number;
  solved: number;
  masteryPercent: number;
}

interface NewGlobalStats {
  version: 3;
  totalAttempts: number;
  totalSolved: number;
  totalTimeTakenMs: number;
  modulesTouched: number;
  subtopicsTouched: number;
  masteryPercent: number;
  modules: NewModuleStats[];
  lastUpdatedAt: number;
}

// Topic name to module ID mapping (best effort)
const TOPIC_TO_MODULE_MAP: Record<string, string> = {
  strings: "string-manipulation",
  string: "string-manipulation",
  "string manipulation": "string-manipulation",
  lists: "lists-and-arrays",
  list: "lists-and-arrays",
  arrays: "lists-and-arrays",
  array: "lists-and-arrays",
  dictionaries: "dictionaries-and-hashmaps",
  dictionary: "dictionaries-and-hashmaps",
  dict: "dictionaries-and-hashmaps",
  hashmaps: "dictionaries-and-hashmaps",
  hashmap: "dictionaries-and-hashmaps",
  loops: "loops-and-iteration",
  loop: "loops-and-iteration",
  iteration: "loops-and-iteration",
  recursion: "recursion",
  "sorting and searching": "sorting-and-searching",
  sorting: "sorting-and-searching",
  searching: "sorting-and-searching",
  "linked lists": "linked-lists",
  "linked list": "linked-lists",
  stacks: "stacks-and-queues",
  queues: "stacks-and-queues",
  stack: "stacks-and-queues",
  queue: "stacks-and-queues",
  trees: "trees-and-graphs",
  tree: "trees-and-graphs",
  graphs: "trees-and-graphs",
  graph: "trees-and-graphs",
  "dynamic programming": "dynamic-programming",
  dp: "dynamic-programming",
};

function createEmptyDiffStats(): NewDifficultyStats {
  return {
    attempts: 0,
    solved: 0,
    avgTimeTakenMs: 0,
    lastAttemptAt: 0,
  };
}

function calculateMastery(attempts: number, solved: number): number {
  if (attempts === 0) return 0;
  return Math.min(100, Math.round((solved / attempts) * 100));
}

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function migrateStats(oldStats: OldGlobalStats): NewGlobalStats {
  const newStats: NewGlobalStats = {
    version: 3,
    totalAttempts: oldStats.totalAttempts || 0,
    totalSolved: oldStats.totalSolved || 0,
    totalTimeTakenMs: 0, // No time data in old format
    modulesTouched: 0,
    subtopicsTouched: 0,
    masteryPercent: oldStats.masteryPercent || 0,
    modules: [],
    lastUpdatedAt: Date.now(),
  };

  // Group old topics by inferred module
  const moduleMap = new Map<string, OldTopicStats[]>();

  for (const oldTopic of oldStats.perTopic || []) {
    const topicLower = oldTopic.topic.toLowerCase();
    const moduleId =
      TOPIC_TO_MODULE_MAP[topicLower] || toKebabCase(oldTopic.topic);

    if (!moduleMap.has(moduleId)) {
      moduleMap.set(moduleId, []);
    }
    moduleMap.get(moduleId)!.push(oldTopic);
  }

  // Convert to new structure
  for (const [moduleId, topics] of moduleMap.entries()) {
    // Use first topic name as module name (best effort)
    const moduleName = topics[0]?.topic || moduleId;

    const moduleStats: NewModuleStats = {
      moduleId,
      moduleName,
      subtopics: [],
      attempts: 0,
      solved: 0,
      masteryPercent: 0,
    };

    for (const oldTopic of topics) {
      const subtopicId = toKebabCase(oldTopic.topic);
      const subtopicStats: NewSubtopicStats = {
        subtopicId,
        subtopicName: oldTopic.topic,
        problemTypes: [],
        attempts: oldTopic.attempts || 0,
        solved: oldTopic.solved || 0,
        masteryPercent: calculateMastery(
          oldTopic.attempts || 0,
          oldTopic.solved || 0
        ),
      };

      // Create a synthetic problem type with the old difficulty stats
      const problemTypeStats: NewProblemTypeStats = {
        problemTypeId: `${subtopicId}-general`,
        problemTypeName: `${oldTopic.topic} (migrated)`,
        beginner: oldTopic.beginner
          ? {
              ...createEmptyDiffStats(),
              attempts: oldTopic.beginner.attempts,
              solved: oldTopic.beginner.solved,
            }
          : createEmptyDiffStats(),
        intermediate: oldTopic.intermediate
          ? {
              ...createEmptyDiffStats(),
              attempts: oldTopic.intermediate.attempts,
              solved: oldTopic.intermediate.solved,
            }
          : createEmptyDiffStats(),
        advanced: oldTopic.advanced
          ? {
              ...createEmptyDiffStats(),
              attempts: oldTopic.advanced.attempts,
              solved: oldTopic.advanced.solved,
            }
          : createEmptyDiffStats(),
        attempts: oldTopic.attempts || 0,
        solved: oldTopic.solved || 0,
      };

      subtopicStats.problemTypes.push(problemTypeStats);
      moduleStats.subtopics.push(subtopicStats);
      moduleStats.attempts += subtopicStats.attempts;
      moduleStats.solved += subtopicStats.solved;
    }

    moduleStats.masteryPercent = calculateMastery(
      moduleStats.attempts,
      moduleStats.solved
    );
    newStats.modules.push(moduleStats);
  }

  // Calculate global touched counts
  newStats.modulesTouched = newStats.modules.filter(
    (m) => m.attempts > 0
  ).length;
  newStats.subtopicsTouched = newStats.modules.reduce(
    (sum, m) => sum + m.subtopics.filter((s) => s.attempts > 0).length,
    0
  );

  return newStats;
}

// ============================================
// BROWSER MIGRATION FUNCTION
// ============================================

/**
 * Run this function in the browser console to migrate stats.
 */
export function runMigration(): { success: boolean; message: string } {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return {
      success: false,
      message: "This script must be run in a browser environment.",
    };
  }

  // Check for existing v2 stats
  const existingV2 = localStorage.getItem(STORAGE_KEY_V2);
  if (existingV2) {
    try {
      const parsed = JSON.parse(existingV2);
      if (parsed.version === 3 && parsed.modules?.length > 0) {
        return {
          success: true,
          message: `Stats v2 already exists with ${parsed.modules.length} modules. Skipping migration.`,
        };
      }
    } catch {
      // Corrupted, will overwrite
    }
  }

  // Load old stats
  const oldStatsRaw = localStorage.getItem(STORAGE_KEY_OLD);
  if (!oldStatsRaw) {
    return {
      success: true,
      message: "No old stats found. Nothing to migrate.",
    };
  }

  try {
    const oldStats = JSON.parse(oldStatsRaw) as OldGlobalStats;
    const newStats = migrateStats(oldStats);

    // Save new stats
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(newStats));

    // Backup old stats (don't delete)
    localStorage.setItem(`${STORAGE_KEY_OLD}_backup`, oldStatsRaw);

    return {
      success: true,
      message: `Migration complete! Migrated ${newStats.modules.length} modules, ${newStats.subtopicsTouched} subtopics. Total: ${newStats.totalAttempts} attempts.`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Migration failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

/**
 * Rollback to old stats format.
 */
export function rollbackMigration(): { success: boolean; message: string } {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return {
      success: false,
      message: "This script must be run in a browser environment.",
    };
  }

  const backup = localStorage.getItem(`${STORAGE_KEY_OLD}_backup`);
  if (!backup) {
    return {
      success: false,
      message: "No backup found. Cannot rollback.",
    };
  }

  localStorage.setItem(STORAGE_KEY_OLD, backup);
  localStorage.removeItem(STORAGE_KEY_V2);

  return {
    success: true,
    message: "Rollback complete. Old stats restored.",
  };
}

// ============================================
// CLI ENTRY (for Node.js with mocked localStorage)
// ============================================

// If running directly (not imported)
if (typeof require !== "undefined" && require.main === module) {
  console.log("=== Stats Migration Script ===");
  console.log("");
  console.log("This script migrates pypractice-stats to pytrix_stats_v2.");
  console.log("");
  console.log("To run in the browser:");
  console.log("1. Open your app in the browser");
  console.log("2. Open DevTools (F12)");
  console.log("3. Go to Console tab");
  console.log("4. Paste and run:");
  console.log("");
  console.log("   const result = (() => {");
  console.log("     // Copy the runMigration function here");
  console.log("     return runMigration();");
  console.log("   })();");
  console.log("   console.log(result);");
  console.log("");
}

export { migrateStats };
