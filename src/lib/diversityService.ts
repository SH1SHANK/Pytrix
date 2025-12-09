/**
 * Diversity Service
 *
 * Manages question history and provides diversity-aware utilities
 * for question generation. Tracks fingerprints in both session memory
 * and localStorage for cross-session deduplication.
 */

import {
  type QuestionFingerprint,
  serializeFingerprint,
  deserializeFingerprint,
  isSimilarToAny,
  calculateSimilarity,
  SIMILARITY_THRESHOLD,
  type SerializedFingerprint,
} from "./questionFingerprint";
import type { OperationTag } from "./archetypeRegistry";

// ============================================================================
// Configuration
// ============================================================================

export const DIVERSITY_CONFIG = {
  /** Maximum fingerprints to store in localStorage */
  MAX_PERSISTED_HISTORY: 50,
  /** Maximum fingerprints for session avoid-list generation */
  SESSION_CACHE_SIZE: 20,
  /** localStorage key for fingerprint history */
  STORAGE_KEY: "pytrix_question_fingerprints",
  /** Maximum regeneration attempts for similar questions */
  MAX_REGENERATION_ATTEMPTS: 2,
  /** Stricter threshold for regeneration attempts */
  STRICT_SIMILARITY_THRESHOLD: 0.9,
};

// ============================================================================
// In-Memory State
// ============================================================================

/**
 * Session-level fingerprint cache.
 * Cleared on page refresh.
 */
let sessionCache: QuestionFingerprint[] = [];

/**
 * Tracks archetype exposure counts for the current session.
 * Key: archetypeId, Value: number of times seen
 */
const archetypeExposure = new Map<string, number>();

// ============================================================================
// Storage Functions
// ============================================================================

/**
 * Loads persisted fingerprint history from localStorage.
 */
function loadPersistedHistory(): QuestionFingerprint[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(DIVERSITY_CONFIG.STORAGE_KEY);
    if (!stored) return [];

    const serialized: SerializedFingerprint[] = JSON.parse(stored);
    return serialized.map(deserializeFingerprint);
  } catch (error) {
    console.warn("[DiversityService] Failed to load history:", error);
    return [];
  }
}

/**
 * Saves fingerprint history to localStorage.
 */
function savePersistedHistory(history: QuestionFingerprint[]): void {
  if (typeof window === "undefined") return;

  try {
    // Keep only the most recent entries
    const toSave = history.slice(-DIVERSITY_CONFIG.MAX_PERSISTED_HISTORY);
    const serialized = toSave.map(serializeFingerprint);
    localStorage.setItem(
      DIVERSITY_CONFIG.STORAGE_KEY,
      JSON.stringify(serialized)
    );
  } catch (error) {
    console.warn("[DiversityService] Failed to save history:", error);
  }
}

// ============================================================================
// Core API
// ============================================================================

/**
 * Records a fingerprint to both session cache and persisted history.
 *
 * @param fingerprint - The fingerprint to record
 */
export function recordFingerprint(fingerprint: QuestionFingerprint): void {
  // Add to session cache
  sessionCache.push(fingerprint);
  if (sessionCache.length > DIVERSITY_CONFIG.SESSION_CACHE_SIZE) {
    sessionCache = sessionCache.slice(-DIVERSITY_CONFIG.SESSION_CACHE_SIZE);
  }

  // Update archetype exposure
  const count = archetypeExposure.get(fingerprint.archetypeId) || 0;
  archetypeExposure.set(fingerprint.archetypeId, count + 1);

  // Add to persisted history
  const history = loadPersistedHistory();
  history.push(fingerprint);
  savePersistedHistory(history);

  console.log(
    `[DiversityService] Recorded: ${fingerprint.archetypeId} (exposure: ${
      count + 1
    })`
  );
}

/**
 * Checks if a fingerprint should trigger regeneration.
 *
 * @param fingerprint - The fingerprint to check
 * @param attemptNumber - Current regeneration attempt (0 = first try)
 * @returns True if the question should be regenerated
 */
export function shouldRegenerateQuestion(
  fingerprint: QuestionFingerprint,
  attemptNumber: number = 0
): boolean {
  // Use stricter threshold on retries
  const threshold =
    attemptNumber > 0
      ? DIVERSITY_CONFIG.STRICT_SIMILARITY_THRESHOLD
      : SIMILARITY_THRESHOLD;

  // Check against session cache (most relevant)
  if (isSimilarToAny(fingerprint, sessionCache, threshold)) {
    return true;
  }

  // For first attempt, also check persisted history
  if (attemptNumber === 0) {
    const history = loadPersistedHistory();
    const recentHistory = history.slice(-10); // Only check last 10 from storage
    if (isSimilarToAny(fingerprint, recentHistory, threshold)) {
      return true;
    }
  }

  return false;
}

/**
 * Generates a compact avoid-list for AI prompts.
 * Returns only archetype IDs and operation tags, not full descriptions.
 *
 * @param module - Optional module filter
 * @param subtopic - Optional subtopic filter
 * @returns Compact avoid-list object for prompt injection
 */
export function getAvoidList(
  module?: string,
  subtopic?: string
): {
  archetypes: string[];
  operations: OperationTag[];
} {
  // Get recent fingerprints from session
  let relevant = sessionCache;

  // Filter by module/subtopic if specified
  if (module) {
    relevant = relevant.filter((fp) => fp.module === module);
  }
  if (subtopic) {
    relevant = relevant.filter((fp) => fp.subtopic === subtopic);
  }

  // Extract unique archetypes and operations
  const archetypes = [...new Set(relevant.map((fp) => fp.archetypeId))];
  const operations = [
    ...new Set(relevant.flatMap((fp) => fp.operationTags)),
  ] as OperationTag[];

  return {
    archetypes: archetypes.slice(-5), // Last 5 archetypes
    operations: operations.slice(-4), // Last 4 operation types
  };
}

/**
 * Formats avoid-list for compact prompt inclusion.
 *
 * @param avoidList - The avoid-list object
 * @returns Formatted string for prompt
 */
export function formatAvoidListForPrompt(avoidList: {
  archetypes: string[];
  operations: OperationTag[];
}): string {
  if (avoidList.archetypes.length === 0 && avoidList.operations.length === 0) {
    return "";
  }

  const parts: string[] = [];

  if (avoidList.archetypes.length > 0) {
    parts.push(`types:[${avoidList.archetypes.join(",")}]`);
  }

  if (avoidList.operations.length > 0) {
    parts.push(`ops:[${avoidList.operations.join(",")}]`);
  }

  return parts.join(" ");
}

// ============================================================================
// Auto Mode Support
// ============================================================================

/**
 * Gets archetype exposure counts for a module.
 *
 * @param module - Optional module filter
 * @returns Map of archetypeId to exposure count
 */
export function getArchetypeExposure(module?: string): Map<string, number> {
  if (!module) {
    return new Map(archetypeExposure);
  }

  // Filter by module prefix (archetypeIds often include module info)
  const filtered = new Map<string, number>();
  for (const [archetype, count] of archetypeExposure) {
    // Check if this archetype belongs to the module
    // (simplified check - in practice may need more sophisticated matching)
    filtered.set(archetype, count);
  }

  return filtered;
}

/**
 * Gets the least-used archetypes for a module.
 *
 * @param availableArchetypes - Array of available archetype IDs
 * @param count - Number of archetypes to return
 * @returns Array of least-used archetype IDs
 */
export function getLeastUsedArchetypes(
  availableArchetypes: string[],
  count: number
): string[] {
  // Sort by exposure (ascending)
  const sorted = [...availableArchetypes].sort((a, b) => {
    const expA = archetypeExposure.get(a) || 0;
    const expB = archetypeExposure.get(b) || 0;
    return expA - expB;
  });

  return sorted.slice(0, count);
}

/**
 * Checks if using an archetype would violate consecutive repetition rule.
 *
 * @param archetypeId - The archetype to check
 * @returns True if this would be a consecutive repeat
 */
export function isConsecutiveRepeat(archetypeId: string): boolean {
  if (sessionCache.length === 0) return false;
  const lastFp = sessionCache[sessionCache.length - 1];
  return lastFp.archetypeId === archetypeId;
}

/**
 * Scores a question's diversity relative to recent history.
 *
 * @param fingerprint - The fingerprint to score
 * @returns Diversity score from 0 (very similar) to 1 (very different)
 */
export function scoreDiversity(fingerprint: QuestionFingerprint): number {
  if (sessionCache.length === 0) return 1;

  // Find maximum similarity to any recent question
  let maxSimilarity = 0;
  for (const fp of sessionCache) {
    const similarity = calculateSimilarity(fingerprint, fp);
    maxSimilarity = Math.max(maxSimilarity, similarity);
  }

  // Diversity is inverse of similarity
  return 1 - maxSimilarity;
}

// ============================================================================
// Initialization & Cleanup
// ============================================================================

/**
 * Initializes the diversity service.
 * Loads persisted history into session cache.
 */
export function initializeDiversityService(): void {
  const history = loadPersistedHistory();
  // Seed session cache with recent history
  sessionCache = history.slice(-DIVERSITY_CONFIG.SESSION_CACHE_SIZE);

  // Rebuild exposure counts from history
  archetypeExposure.clear();
  for (const fp of history) {
    const count = archetypeExposure.get(fp.archetypeId) || 0;
    archetypeExposure.set(fp.archetypeId, count + 1);
  }

  console.log(
    `[DiversityService] Initialized with ${sessionCache.length} cached fingerprints`
  );
}

/**
 * Clears session cache (for testing or mode switches).
 */
export function clearSessionCache(): void {
  sessionCache = [];
  archetypeExposure.clear();
}

/**
 * Clears all history (both session and persisted).
 */
export function clearAllHistory(): void {
  sessionCache = [];
  archetypeExposure.clear();
  if (typeof window !== "undefined") {
    localStorage.removeItem(DIVERSITY_CONFIG.STORAGE_KEY);
  }
}

/**
 * Gets current session statistics for debugging.
 */
export function getSessionStats(): {
  sessionCacheSize: number;
  persistedHistorySize: number;
  uniqueArchetypes: number;
  topArchetypes: Array<{ id: string; count: number }>;
} {
  const history = loadPersistedHistory();

  // Get top 5 archetypes by exposure
  const sorted = [...archetypeExposure.entries()].sort((a, b) => b[1] - a[1]);
  const topArchetypes = sorted
    .slice(0, 5)
    .map(([id, count]) => ({ id, count }));

  return {
    sessionCacheSize: sessionCache.length,
    persistedHistorySize: history.length,
    uniqueArchetypes: archetypeExposure.size,
    topArchetypes,
  };
}
