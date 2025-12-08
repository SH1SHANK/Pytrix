/**
 * Stats Store - localStorage-backed stats system
 *
 * Provides real stats tracking that persists across sessions.
 * Supports per-difficulty tracking (beginner, intermediate, advanced).
 * Designed to be replaceable with a backend later.
 */

import { TOPICS } from "./mockQuestions";

// ============================================
// TYPE DEFINITIONS
// ============================================

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export interface DifficultyStats {
  attempts: number;
  solved: number;
}

export interface TopicStats {
  topic: string;
  // Per-difficulty breakdown
  beginner: DifficultyStats;
  intermediate: DifficultyStats;
  advanced: DifficultyStats;
  // Aggregate totals (sum of all difficulties)
  attempts: number;
  solved: number;
}

export interface GlobalStats {
  totalAttempts: number;
  totalSolved: number;
  topicsTouched: number;
  masteryPercent: number;
  perTopic: TopicStats[];
}

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEY = "pypractice-stats";
const STATS_VERSION = 2; // Increment when schema changes

const DEFAULT_TOPICS = TOPICS.map((t) => t.name);

// ============================================
// HELPER FUNCTIONS
// ============================================

function createEmptyDifficultyStats(): DifficultyStats {
  return { attempts: 0, solved: 0 };
}

function createEmptyTopicStats(topic: string): TopicStats {
  return {
    topic,
    beginner: createEmptyDifficultyStats(),
    intermediate: createEmptyDifficultyStats(),
    advanced: createEmptyDifficultyStats(),
    attempts: 0,
    solved: 0,
  };
}

function createEmptyStats(): GlobalStats {
  return {
    totalAttempts: 0,
    totalSolved: 0,
    topicsTouched: 0,
    masteryPercent: 0,
    perTopic: DEFAULT_TOPICS.map((topic) => createEmptyTopicStats(topic)),
  };
}

function calculateMastery(stats: GlobalStats): number {
  if (stats.totalAttempts === 0) return 0;
  const ratio = stats.totalSolved / stats.totalAttempts;
  return Math.min(100, Math.round(ratio * 100));
}

function countTopicsTouched(perTopic: TopicStats[]): number {
  return perTopic.filter((t) => t.attempts > 0).length;
}

/**
 * Migrate old flat stats format to new difficulty-aware format.
 * Old format: { topic, attempts, solved }
 * New format: { topic, beginner, intermediate, advanced, attempts, solved }
 */
function migrateTopicStats(oldTopic: {
  topic: string;
  attempts?: number;
  solved?: number;
  beginner?: DifficultyStats;
  intermediate?: DifficultyStats;
  advanced?: DifficultyStats;
}): TopicStats {
  // If already has difficulty breakdown, return as-is
  if (oldTopic.beginner && oldTopic.intermediate && oldTopic.advanced) {
    return {
      topic: oldTopic.topic,
      beginner: oldTopic.beginner,
      intermediate: oldTopic.intermediate,
      advanced: oldTopic.advanced,
      attempts: oldTopic.attempts || 0,
      solved: oldTopic.solved || 0,
    };
  }

  // Migrate: put old flat stats into "beginner" tier (conservative assumption)
  const attempts = oldTopic.attempts || 0;
  const solved = oldTopic.solved || 0;

  return {
    topic: oldTopic.topic,
    beginner: { attempts, solved },
    intermediate: createEmptyDifficultyStats(),
    advanced: createEmptyDifficultyStats(),
    attempts,
    solved,
  };
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Get stats from localStorage.
 * Initializes empty stats if none exist.
 * Migrates old format if detected.
 */
export function getStats(): GlobalStats {
  if (typeof window === "undefined") {
    return createEmptyStats();
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const empty = createEmptyStats();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...empty, version: STATS_VERSION })
    );
    return empty;
  }

  try {
    const parsed = JSON.parse(stored);

    // Migrate per-topic entries
    const migratedPerTopic: TopicStats[] = (parsed.perTopic || []).map(
      migrateTopicStats
    );

    // Ensure all topics exist (in case new topics were added)
    const existingTopics = new Set(migratedPerTopic.map((t) => t.topic));
    for (const topic of DEFAULT_TOPICS) {
      if (!existingTopics.has(topic)) {
        migratedPerTopic.push(createEmptyTopicStats(topic));
      }
    }

    const stats: GlobalStats = {
      totalAttempts: parsed.totalAttempts || 0,
      totalSolved: parsed.totalSolved || 0,
      topicsTouched: parsed.topicsTouched || 0,
      masteryPercent: parsed.masteryPercent || 0,
      perTopic: migratedPerTopic,
    };

    // Persist migrated format if version changed
    if (parsed.version !== STATS_VERSION) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...stats, version: STATS_VERSION })
      );
    }

    return stats;
  } catch {
    console.warn("[statsStore] Corrupted stats, resetting.");
    const empty = createEmptyStats();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...empty, version: STATS_VERSION })
    );
    return empty;
  }
}

/**
 * Increment attempt for a topic at a specific difficulty.
 * @param topicName - The topic name (e.g., "Strings")
 * @param isCorrect - Whether the attempt was successful
 * @param difficulty - The difficulty level (beginner, intermediate, advanced)
 */
export function incrementAttempt(
  topicName: string,
  isCorrect: boolean,
  difficulty: DifficultyLevel = "beginner"
): GlobalStats {
  if (typeof window === "undefined") {
    return createEmptyStats();
  }

  const stats = getStats();

  // Update global counters
  stats.totalAttempts++;
  if (isCorrect) {
    stats.totalSolved++;
  }

  // Find or create topic entry
  let topicEntry = stats.perTopic.find(
    (t) => t.topic.toLowerCase() === topicName.toLowerCase()
  );

  if (!topicEntry) {
    topicEntry = createEmptyTopicStats(topicName);
    stats.perTopic.push(topicEntry);
  }

  // Update aggregate totals
  topicEntry.attempts++;
  if (isCorrect) {
    topicEntry.solved++;
  }

  // Update difficulty-specific stats
  const difficultyStats = topicEntry[difficulty];
  difficultyStats.attempts++;
  if (isCorrect) {
    difficultyStats.solved++;
  }

  // Recalculate derived values
  stats.topicsTouched = countTopicsTouched(stats.perTopic);
  stats.masteryPercent = calculateMastery(stats);

  // Persist
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...stats, version: STATS_VERSION })
  );

  return stats;
}

/**
 * Reset all stats to zero.
 */
export function resetStats(): GlobalStats {
  if (typeof window === "undefined") {
    return createEmptyStats();
  }

  const empty = createEmptyStats();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...empty, version: STATS_VERSION })
  );
  return empty;
}

/**
 * Get stats for a specific topic.
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
 * Get weakest topics (lowest solve rate with at least 1 attempt).
 * Used for Auto Mode topic queue generation.
 */
export function getWeakestTopics(count: number = 3): string[] {
  const stats = getStats();

  const sorted = [...stats.perTopic].sort((a, b) => {
    // Topics with 0 attempts should be prioritized
    if (a.attempts === 0 && b.attempts > 0) return -1;
    if (b.attempts === 0 && a.attempts > 0) return 1;
    if (a.attempts === 0 && b.attempts === 0) return 0;

    // Calculate solve rate
    const rateA = a.solved / a.attempts;
    const rateB = b.solved / b.attempts;

    return rateA - rateB; // Ascending (weakest first)
  });

  return sorted.slice(0, count).map((t) => t.topic);
}
