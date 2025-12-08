/**
 * Stats Store - localStorage-backed stats system
 *
 * Provides real stats tracking that persists across sessions.
 * Designed to be replaceable with a backend later.
 */

import { TOPICS } from "./mockQuestions";

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface TopicStats {
  topic: string;
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

const DEFAULT_TOPICS = TOPICS.map((t) => t.name);

// ============================================
// HELPER FUNCTIONS
// ============================================

function createEmptyStats(): GlobalStats {
  return {
    totalAttempts: 0,
    totalSolved: 0,
    topicsTouched: 0,
    masteryPercent: 0,
    perTopic: DEFAULT_TOPICS.map((topic) => ({
      topic,
      attempts: 0,
      solved: 0,
    })),
  };
}

function calculateMastery(stats: GlobalStats): number {
  if (stats.totalAttempts === 0) return 0;
  // Mastery = (solved / attempts) * 100, capped at 100
  const ratio = stats.totalSolved / stats.totalAttempts;
  return Math.min(100, Math.round(ratio * 100));
}

function countTopicsTouched(perTopic: TopicStats[]): number {
  return perTopic.filter((t) => t.attempts > 0).length;
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Get stats from localStorage.
 * Initializes empty stats if none exist.
 */
export function getStats(): GlobalStats {
  if (typeof window === "undefined") {
    // Server-side: return empty stats
    return createEmptyStats();
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const empty = createEmptyStats();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
    return empty;
  }

  try {
    const parsed = JSON.parse(stored) as GlobalStats;
    // Ensure all topics exist (in case new topics were added)
    const existingTopics = new Set(parsed.perTopic.map((t) => t.topic));
    for (const topic of DEFAULT_TOPICS) {
      if (!existingTopics.has(topic)) {
        parsed.perTopic.push({ topic, attempts: 0, solved: 0 });
      }
    }
    return parsed;
  } catch {
    console.warn("[statsStore] Corrupted stats, resetting.");
    const empty = createEmptyStats();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
    return empty;
  }
}

/**
 * Increment attempt for a topic.
 * @param topicName - The topic name (e.g., "Strings")
 * @param isCorrect - Whether the attempt was successful
 */
export function incrementAttempt(
  topicName: string,
  isCorrect: boolean
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
    topicEntry = { topic: topicName, attempts: 0, solved: 0 };
    stats.perTopic.push(topicEntry);
  }

  topicEntry.attempts++;
  if (isCorrect) {
    topicEntry.solved++;
  }

  // Recalculate derived values
  stats.topicsTouched = countTopicsTouched(stats.perTopic);
  stats.masteryPercent = calculateMastery(stats);

  // Persist
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));

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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
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

  // Sort by solve rate (ascending), then by attempts (prefer touched)
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
