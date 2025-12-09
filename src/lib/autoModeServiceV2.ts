/**
 * Auto Mode Service v2 - Curriculum-Aware Adaptive Pacing
 *
 * Features:
 * - Mini-curriculum starting with String Manipulation
 * - Streak-based difficulty promotion/demotion
 * - Remediation injection on failure
 * - Decay for stale streaks
 */

import {
  getAllModules,
  getModuleById,
  type Module,
  type Subtopic,
} from "./topicsStore";
import { getStats } from "./statsStore";
import type { TopicQueueEntry } from "./autoModeService";
import {
  type AutoRunV2,
  // type AutoRunConfig,
  type DifficultyLevel,
  // type AttemptRecord,
  type AttemptResult,
  type AdaptiveAnalytics,
  DEFAULT_AUTO_RUN_CONFIG,
  STORAGE_KEY_V2,
  STORAGE_KEY_ANALYTICS,
} from "./autoRunTypes";

// ============================================
// STORAGE HELPERS
// ============================================

function generateId(): string {
  return `run-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

function getRunStorageKey(runId: string): string {
  return `${STORAGE_KEY_V2}_${runId}`;
}

// ============================================
// MINI-CURRICULUM GENERATION
// ============================================

/**
 * Generate a mini-curriculum focused on String Manipulation.
 * Orders subtopics from basic to advanced concepts.
 */
export function generateMiniCurriculum(
  size: number = DEFAULT_AUTO_RUN_CONFIG.miniCurriculumSize
): TopicQueueEntry[] {
  const stringModule = getModuleById("string-manipulation");

  if (!stringModule) {
    console.warn(
      "[autoModeServiceV2] String manipulation module not found, falling back"
    );
    return generateWeaknessBasedQueue([]);
  }

  // Order subtopics: basic operations first, then more advanced
  const basicKeywords = ["basic", "operation", "index", "slice"];
  const sortedSubtopics = [...stringModule.subtopics].sort((a, b) => {
    const aScore = basicKeywords.some((kw) => a.name.toLowerCase().includes(kw))
      ? 0
      : 1;
    const bScore = basicKeywords.some((kw) => b.name.toLowerCase().includes(kw))
      ? 0
      : 1;
    return aScore - bScore;
  });

  const queue: TopicQueueEntry[] = [];

  for (const subtopic of sortedSubtopics) {
    // Take first 2 problem types from each subtopic
    for (const pt of subtopic.problemTypes.slice(0, 2)) {
      queue.push({
        moduleId: stringModule.id,
        subtopicId: subtopic.id,
        problemTypeId: pt.id,
        moduleName: stringModule.name,
        subtopicName: subtopic.name,
        problemTypeName: pt.name,
      });

      if (queue.length >= size) break;
    }
    if (queue.length >= size) break;
  }

  // If we didn't get enough, pad with more problem types
  if (queue.length < size) {
    for (const subtopic of sortedSubtopics) {
      for (const pt of subtopic.problemTypes.slice(2)) {
        if (!queue.some((q) => q.problemTypeId === pt.id)) {
          queue.push({
            moduleId: stringModule.id,
            subtopicId: subtopic.id,
            problemTypeId: pt.id,
            moduleName: stringModule.name,
            subtopicName: subtopic.name,
            problemTypeName: pt.name,
          });
        }
        if (queue.length >= size) break;
      }
      if (queue.length >= size) break;
    }
  }

  return queue;
}

/**
 * Generate a weakness-based queue for after mini-curriculum.
 */
export function generateWeaknessBasedQueue(
  recentProblemTypes: string[]
): TopicQueueEntry[] {
  const modules = getAllModules();
  const stats = getStats();
  const topicStats = stats.perTopic;

  // Calculate mastery and sort
  const allEntries: Array<{
    entry: TopicQueueEntry;
    mastery: number;
  }> = [];

  for (const mod of modules) {
    // Skip string-manipulation for post-curriculum (already covered)
    // Actually include it but with lower priority

    for (const subtopic of mod.subtopics) {
      const stat = topicStats.find(
        (s) => s.topic.toLowerCase() === subtopic.name.toLowerCase()
      );
      const mastery =
        stat && stat.attempts > 0
          ? Math.round((stat.solved / stat.attempts) * 100)
          : 0;

      for (const pt of subtopic.problemTypes) {
        if (!recentProblemTypes.includes(pt.id)) {
          allEntries.push({
            entry: {
              moduleId: mod.id,
              subtopicId: subtopic.id,
              problemTypeId: pt.id,
              moduleName: mod.name,
              subtopicName: subtopic.name,
              problemTypeName: pt.name,
            },
            mastery,
          });
        }
      }
    }
  }

  // Sort by mastery (untouched first)
  allEntries.sort((a, b) => a.mastery - b.mastery);

  // Shuffle within same-mastery tiers
  const result: TopicQueueEntry[] = [];
  let currentMastery = -1;
  let currentTier: TopicQueueEntry[] = [];

  for (const { entry, mastery } of allEntries) {
    if (mastery !== currentMastery) {
      // Shuffle and push previous tier
      if (currentTier.length > 0) {
        shuffleArray(currentTier);
        result.push(...currentTier);
      }
      currentTier = [entry];
      currentMastery = mastery;
    } else {
      currentTier.push(entry);
    }
  }
  if (currentTier.length > 0) {
    shuffleArray(currentTier);
    result.push(...currentTier);
  }

  return result.slice(0, 50);
}

function shuffleArray<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ============================================
// RUN LIFECYCLE
// ============================================

/**
 * Create a new Auto Run v2.
 */
export function createAutoRunV2(
  name?: string,
  options?: Partial<
    Pick<AutoRunV2, "aggressiveProgression" | "remediationMode">
  >
): AutoRunV2 {
  const id = generateId();
  const now = Date.now();

  const run: AutoRunV2 = {
    id,
    version: 2,
    name: name?.trim() || `Run ${new Date().toLocaleDateString()}`,
    createdAt: now,
    lastUpdatedAt: now,

    topicQueue: generateMiniCurriculum(),
    currentIndex: 0,
    miniCurriculumComplete: false,

    streak: 0,
    difficultyPointer: {},

    completedQuestions: 0,
    perSubtopicStats: {},
    recentProblemTypes: [],

    aggressiveProgression: options?.aggressiveProgression ?? false,
    remediationMode: options?.remediationMode ?? true,
    prefetchSize: DEFAULT_AUTO_RUN_CONFIG.prefetchBufferSize,
  };

  // Persist
  saveRun(run);

  return run;
}

/**
 * Load a run by ID.
 */
export function loadAutoRunV2(runId: string): AutoRunV2 | null {
  if (typeof window === "undefined") return null;

  const key = getRunStorageKey(runId);
  const stored = localStorage.getItem(key);

  if (!stored) return null;

  try {
    const run = JSON.parse(stored) as AutoRunV2;
    // Apply decay if needed
    return applyDecay(run);
  } catch {
    console.warn(`[autoModeServiceV2] Corrupted run: ${runId}`);
    return null;
  }
}

/**
 * Get all run IDs from localStorage.
 */
export function getAllAutoRunIds(): string[] {
  if (typeof window === "undefined") return [];

  const ids: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(`${STORAGE_KEY_V2}_`)) {
      const id = key.replace(`${STORAGE_KEY_V2}_`, "");
      ids.push(id);
    }
  }
  return ids;
}

/**
 * Get all runs.
 */
export function getAllAutoRunsV2(): AutoRunV2[] {
  return getAllAutoRunIds()
    .map(loadAutoRunV2)
    .filter((r): r is AutoRunV2 => r !== null)
    .sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt);
}

/**
 * Save a run to localStorage.
 */
export function saveRun(run: AutoRunV2): void {
  if (typeof window === "undefined") return;
  const key = getRunStorageKey(run.id);
  localStorage.setItem(key, JSON.stringify(run));
}

/**
 * Delete a run.
 */
export function deleteAutoRunV2(runId: string): boolean {
  if (typeof window === "undefined") return false;
  const key = getRunStorageKey(runId);
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    return true;
  }
  return false;
}

// ============================================
// DECAY LOGIC
// ============================================

/**
 * Apply streak decay if run is stale.
 */
function applyDecay(run: AutoRunV2): AutoRunV2 {
  const config = { ...DEFAULT_AUTO_RUN_CONFIG, ...run.config };
  const decayThresholdMs = config.decayHours * 60 * 60 * 1000;
  const now = Date.now();

  if (now - run.lastUpdatedAt > decayThresholdMs && run.streak > 0) {
    const newStreak = Math.floor(run.streak / 2);
    console.log(
      `[autoModeServiceV2] Applying decay: streak ${run.streak} → ${newStreak}`
    );

    run.streak = newStreak;
    run.lastUpdatedAt = now;
    saveRun(run);

    // Track analytics
    incrementAnalytics("decaysApplied");
  }

  return run;
}

// ============================================
// DIFFICULTY MANAGEMENT
// ============================================

/**
 * Get current difficulty for a subtopic.
 */
export function getSubtopicDifficulty(
  run: AutoRunV2,
  subtopicId: string
): DifficultyLevel {
  return run.difficultyPointer[subtopicId] || "beginner";
}

/**
 * Promote difficulty for a subtopic.
 */
export function promoteSubtopicDifficulty(
  run: AutoRunV2,
  subtopicId: string
): AutoRunV2 {
  const current = getSubtopicDifficulty(run, subtopicId);
  let newLevel: DifficultyLevel = current;

  if (current === "beginner") {
    newLevel = "intermediate";
  } else if (current === "intermediate") {
    newLevel = "advanced";
  }

  if (newLevel !== current) {
    run.difficultyPointer[subtopicId] = newLevel;
    run.lastUpdatedAt = Date.now();
    saveRun(run);
    incrementAnalytics("promotions");
  }

  return run;
}

/**
 * Demote difficulty for a subtopic.
 */
export function demoteSubtopicDifficulty(
  run: AutoRunV2,
  subtopicId: string
): AutoRunV2 {
  const current = getSubtopicDifficulty(run, subtopicId);
  let newLevel: DifficultyLevel = current;

  if (current === "advanced") {
    newLevel = "intermediate";
  } else if (current === "intermediate") {
    newLevel = "beginner";
  }

  if (newLevel !== current) {
    run.difficultyPointer[subtopicId] = newLevel;
    run.lastUpdatedAt = Date.now();
    saveRun(run);
    incrementAnalytics("demotions");
  }

  return run;
}

// ============================================
// QUEUE MANAGEMENT
// ============================================

/**
 * Get current topic queue entry.
 */
export function getCurrentQueueEntry(run: AutoRunV2): TopicQueueEntry | null {
  if (run.currentIndex >= run.topicQueue.length) {
    return run.topicQueue[0] || null;
  }
  return run.topicQueue[run.currentIndex];
}

/**
 * Advance to next question in queue.
 */
export function advanceQueue(run: AutoRunV2): AutoRunV2 {
  run.currentIndex++;

  // Check if mini-curriculum complete
  if (
    !run.miniCurriculumComplete &&
    run.currentIndex >= run.topicQueue.length
  ) {
    run.miniCurriculumComplete = true;
    // Regenerate queue with weakness-based selection
    run.topicQueue = generateWeaknessBasedQueue(run.recentProblemTypes);
    run.currentIndex = 0;
  } else if (run.currentIndex >= run.topicQueue.length) {
    // Regenerate weakness-based queue
    run.topicQueue = generateWeaknessBasedQueue(run.recentProblemTypes);
    run.currentIndex = 0;
  }

  run.lastUpdatedAt = Date.now();
  saveRun(run);
  return run;
}

/**
 * Inject remediation questions into near-term queue.
 */
export function injectRemediationQuestions(
  run: AutoRunV2,
  subtopicId: string,
  count: number = DEFAULT_AUTO_RUN_CONFIG.extraRemediationCount
): AutoRunV2 {
  // Find problem types from this subtopic
  const modules = getAllModules();
  let targetSubtopic: Subtopic | null = null;
  let targetModule: Module | null = null;

  for (const mod of modules) {
    const st = mod.subtopics.find((s) => s.id === subtopicId);
    if (st) {
      targetSubtopic = st;
      targetModule = mod;
      break;
    }
  }

  if (!targetSubtopic || !targetModule) return run;

  // Create remediation entries (beginner difficulty)
  const remediationEntries: TopicQueueEntry[] = targetSubtopic.problemTypes
    .filter((pt) => !run.recentProblemTypes.includes(pt.id))
    .slice(0, count)
    .map((pt) => ({
      moduleId: targetModule!.id,
      subtopicId: targetSubtopic!.id,
      problemTypeId: pt.id,
      moduleName: targetModule!.name,
      subtopicName: targetSubtopic!.name,
      problemTypeName: pt.name,
    }));

  // Insert after current position
  const insertPos = run.currentIndex + 1;
  run.topicQueue.splice(insertPos, 0, ...remediationEntries);

  run.lastUpdatedAt = Date.now();
  saveRun(run);
  incrementAnalytics("remediationsTriggered");

  return run;
}

// ============================================
// ATTEMPT RECORDING
// ============================================

/**
 * Record an attempt and update adaptive state.
 */
export function recordAttemptV2(
  run: AutoRunV2,
  result: AttemptResult,
  _timeTakenMs: number // eslint-disable-line @typescript-eslint/no-unused-vars
): AutoRunV2 {
  const entry = getCurrentQueueEntry(run);
  if (!entry) return run;

  const config = { ...DEFAULT_AUTO_RUN_CONFIG, ...run.config };
  const streakThreshold = run.aggressiveProgression
    ? config.aggressiveStreakToPromote
    : config.streakToPromote;

  // Update per-subtopic stats
  if (!run.perSubtopicStats[entry.subtopicId]) {
    run.perSubtopicStats[entry.subtopicId] = {
      attempts: 0,
      solved: 0,
      lastAttemptAt: 0,
    };
  }
  run.perSubtopicStats[entry.subtopicId].attempts++;
  run.perSubtopicStats[entry.subtopicId].lastAttemptAt = Date.now();

  // Update recent problem types
  run.recentProblemTypes = [
    ...run.recentProblemTypes.slice(-4),
    entry.problemTypeId,
  ];

  if (result === "correct") {
    run.streak++;
    run.perSubtopicStats[entry.subtopicId].solved++;
    run.completedQuestions++;

    // Check for promotion
    if (run.streak >= streakThreshold) {
      run = promoteSubtopicDifficulty(run, entry.subtopicId);
    }
  } else if (result === "incorrect") {
    run.streak = 0;
    incrementAnalytics("streakResets");

    // Demote difficulty
    run = demoteSubtopicDifficulty(run, entry.subtopicId);

    // Inject remediation if enabled
    if (run.remediationMode) {
      run = injectRemediationQuestions(run, entry.subtopicId);
    }
  } else {
    // Partial - increment attempt but don't affect streak significantly
    run.completedQuestions++;
  }

  run.lastUpdatedAt = Date.now();
  saveRun(run);

  return run;
}

/**
 * Slow down: reset streak and inject beginner questions.
 */
export function slowDown(run: AutoRunV2): AutoRunV2 {
  const entry = getCurrentQueueEntry(run);
  if (!entry) return run;

  run.streak = 0;
  run.aggressiveProgression = false;

  // Inject extra beginner questions
  run = injectRemediationQuestions(
    run,
    entry.subtopicId,
    DEFAULT_AUTO_RUN_CONFIG.extraRemediationCount + 1
  );

  return run;
}

// ============================================
// ANALYTICS
// ============================================

function getAnalytics(): AdaptiveAnalytics {
  if (typeof window === "undefined") {
    return {
      promotions: 0,
      demotions: 0,
      remediationsTriggered: 0,
      streakResets: 0,
      decaysApplied: 0,
    };
  }

  const stored = localStorage.getItem(STORAGE_KEY_ANALYTICS);
  if (!stored) {
    return {
      promotions: 0,
      demotions: 0,
      remediationsTriggered: 0,
      streakResets: 0,
      decaysApplied: 0,
    };
  }

  try {
    return JSON.parse(stored);
  } catch {
    return {
      promotions: 0,
      demotions: 0,
      remediationsTriggered: 0,
      streakResets: 0,
      decaysApplied: 0,
    };
  }
}

function incrementAnalytics(key: keyof AdaptiveAnalytics): void {
  if (typeof window === "undefined") return;

  const analytics = getAnalytics();
  analytics[key]++;
  localStorage.setItem(STORAGE_KEY_ANALYTICS, JSON.stringify(analytics));
}

export { getAnalytics };

// ============================================
// HELPER EXPORTS
// ============================================

export { DEFAULT_AUTO_RUN_CONFIG };
