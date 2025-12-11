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
} from "@/lib/stores/topicsStore";
import { getStats } from "@/lib/stores/statsStore";
import {
  type AutoRunV2,
  type TopicQueueEntry,
  type DifficultyLevel,
  type AttemptResult,
  type AdaptiveAnalytics,
  DEFAULT_AUTO_RUN_CONFIG,
  STORAGE_KEY_V2,
  STORAGE_KEY_ANALYTICS,
} from "./autoRunTypes";
import { isConsecutiveRepeat } from "@/lib/question/diversityService";

// ============================================
// STORAGE HELPERS
// ============================================

function generateId(): string {
  return `run-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

// ============================================
// MINI-CURRICULUM GENERATION
// ============================================

/**
 * Generate a mini-curriculum focused on String Manipulation.
 * Orders subtopics from basic to advanced concepts.
 * One entry per subtopic (problem type selected at generation time).
 */
export function generateMiniCurriculum(
  size: number = DEFAULT_AUTO_RUN_CONFIG.miniCurriculumSize
): TopicQueueEntry[] {
  const stringModule = getModuleById("string-manipulation");

  if (!stringModule) {
    console.warn(
      "[autoModeService] String manipulation module not found, falling back"
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

  // One entry per subtopic (deduplicated)
  for (const subtopic of sortedSubtopics) {
    queue.push({
      moduleId: stringModule.id,
      subtopicId: subtopic.id,
      moduleName: stringModule.name,
      subtopicName: subtopic.name,
    });

    if (queue.length >= size) break;
  }

  return queue;
}

/**
 * Generate a weakness-based queue for after mini-curriculum.
 * One entry per subtopic (deduplicated), sorted by weakness.
 */
export function generateWeaknessBasedQueue(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _recentProblemTypes: string[]
): TopicQueueEntry[] {
  const modules = getAllModules();
  const stats = getStats();
  const topicStats = stats.perTopic;

  // Calculate mastery per subtopic
  const allEntries: Array<{
    entry: TopicQueueEntry;
    mastery: number;
  }> = [];

  for (const mod of modules) {
    for (const subtopic of mod.subtopics) {
      const stat = topicStats.find(
        (s) => s.topic.toLowerCase() === subtopic.name.toLowerCase()
      );
      const mastery =
        stat && stat.attempts > 0
          ? Math.round((stat.solved / stat.attempts) * 100)
          : 0;

      // One entry per subtopic (deduplicated)
      allEntries.push({
        entry: {
          moduleId: mod.id,
          subtopicId: subtopic.id,
          moduleName: mod.name,
          subtopicName: subtopic.name,
        },
        mastery,
      });
    }
  }

  // Sort by mastery (least mastered first = higher priority)
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
// LOG MIGRATION (Individual Keys -> Array)
// ============================================

/**
 * Migration helper: Move single-key runs into the main runs array.
 * This runs on service read if needed.
 */
function migrateRunsIfNeeded(existingRuns: AutoRunV2[]): AutoRunV2[] {
  if (typeof window === "undefined") return existingRuns;

  const migratedRuns: AutoRunV2[] = [];
  const keysToRemove: string[] = [];

  // Look for keys matching old pattern: pytrix_auto_run_v2_{id}
  // The prefix was `pytrix_auto_run_v2` (singular) + `_` + id
  // Note: STORAGE_KEY_V2 is now plural "pytrix_auto_runs_v2".
  const OLD_PREFIX = "pytrix_auto_run_v2_";

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(OLD_PREFIX)) {
      try {
        const val = localStorage.getItem(key);
        if (val) {
          const run = JSON.parse(val) as AutoRunV2;
          // Ensure it has status
          if (!run.status) run.status = "active";
          migratedRuns.push(run);
          keysToRemove.push(key);
        }
      } catch (e) {
        console.error("Failed to migrate run", key, e);
      }
    }
  }

  if (migratedRuns.length > 0) {
    // Merge with existing runs (deduplicate by ID just in case)
    const combined = [...existingRuns];
    for (const run of migratedRuns) {
      if (!combined.some((r) => r.id === run.id)) {
        combined.push(run);
      }
    }

    // Save new combined array
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(combined));

    // Cleanup old keys
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    console.log(
      `[autoModeService] Migrated ${migratedRuns.length} runs to V2 array storage.`
    );
    return combined;
  }

  return existingRuns;
}

// ============================================
// CORE CRUD
// ============================================

/**
 * Get all runs (cached read + write-through migration).
 */
export function getAllAutoRunsV2(): AutoRunV2[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem(STORAGE_KEY_V2);
  let runs: AutoRunV2[] = [];

  if (stored) {
    try {
      runs = JSON.parse(stored) as AutoRunV2[];
    } catch {
      console.warn("[autoModeService] Corrupted runs list, resetting.");
      runs = [];
    }
  }

  // Attempt migration of legacy single-key runs
  runs = migrateRunsIfNeeded(runs);

  // Sort by last updated (newest first)
  return runs.sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt);
}

/**
 * Save the entire list of runs.
 */
function saveAllRuns(runs: AutoRunV2[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(runs));
}

/**
 * Load a specific run by ID.
 */
export function loadAutoRunV2(runId: string): AutoRunV2 | null {
  const runs = getAllAutoRunsV2();
  const run = runs.find((r) => r.id === runId);

  if (!run) return null;

  // Apply decay logic on load (if stale)
  return applyDecay(run);
}

/**
 * Save (Update) a single run.
 */
export function saveRun(run: AutoRunV2): void {
  const runs = getAllAutoRunsV2();
  const index = runs.findIndex((r) => r.id === run.id);

  if (index >= 0) {
    runs[index] = run;
    saveAllRuns(runs);
  } else {
    // If likely a new run or missing, just push it
    runs.push(run);
    saveAllRuns(runs);
  }
}

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
    status: "active",

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
 * Delete a run.
 */
export function deleteAutoRunV2(runId: string): boolean {
  const runs = getAllAutoRunsV2();
  const filtered = runs.filter((r) => r.id !== runId);

  if (filtered.length !== runs.length) {
    saveAllRuns(filtered);
    return true;
  }
  return false;
}

/**
 * Update run name.
 */
export function updateRunName(runId: string, newName: string): boolean {
  const run = loadAutoRunV2(runId);
  if (run) {
    run.name = newName.trim();
    run.lastUpdatedAt = Date.now();
    saveRun(run);
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
      `[autoModeService] Applying decay: streak ${run.streak} → ${newStreak}`
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

  // Prevent consecutive repetition of same subtopic
  const current = getCurrentQueueEntry(run);
  if (current && isConsecutiveRepeat(current.subtopicId)) {
    // Find next different subtopic
    for (let i = run.currentIndex + 1; i < run.topicQueue.length; i++) {
      if (run.topicQueue[i].subtopicId !== current.subtopicId) {
        // Swap current with this different one
        const temp = run.topicQueue[run.currentIndex];
        run.topicQueue[run.currentIndex] = run.topicQueue[i];
        run.topicQueue[i] = temp;
        break;
      }
    }
  }

  run.lastUpdatedAt = Date.now();
  saveRun(run);
  return run;
}

/**
 * Skip current Advanced question and move to next module.
 * This is a NEUTRAL action - no penalties applied.
 *
 * - Does NOT reset streak
 * - Does NOT count as failure
 * - Does NOT downgrade difficulty
 * - Logged as "skipped" action in analytics
 *
 * Only intended for Advanced questions where user wants to progress
 * without getting stuck.
 */
export function skipToNextModule(run: AutoRunV2): AutoRunV2 {
  const current = getCurrentQueueEntry(run);
  if (!current) return run;

  const currentModuleId = current.moduleId;

  console.log(
    `[autoModeService] Skipping Advanced question in module "${current.moduleName}"`
  );

  // Find next entry with a different module
  let nextIndex = run.currentIndex + 1;
  while (nextIndex < run.topicQueue.length) {
    if (run.topicQueue[nextIndex].moduleId !== currentModuleId) {
      break;
    }
    nextIndex++;
  }

  // If no different module found in remaining queue, regenerate
  if (nextIndex >= run.topicQueue.length) {
    console.log(
      "[autoModeService] No different module found, regenerating queue"
    );
    run.topicQueue = generateWeaknessBasedQueue(run.recentProblemTypes);
    run.currentIndex = 0;
  } else {
    run.currentIndex = nextIndex;
    const nextEntry = run.topicQueue[nextIndex];
    console.log(
      `[autoModeService] Skipped to module "${nextEntry.moduleName}"`
    );
  }

  run.lastUpdatedAt = Date.now();
  saveRun(run);

  // Track skip in analytics (distinct from failures)
  incrementAnalytics("skips");

  return run;
}

/**
 * Jump to a specific index in the queue.
 * This is for intentional, user-initiated forward navigation (e.g., Jump Ahead).
 *
 * - Does NOT reset streak
 * - Does NOT change difficulty
 * - Does NOT mark skipped topics as completed
 * - Purely moves the queue pointer forward
 */
export function jumpToQueueIndex(
  run: AutoRunV2,
  targetIndex: number
): AutoRunV2 {
  if (targetIndex < 0 || targetIndex >= run.topicQueue.length) {
    console.warn(`[autoModeService] Invalid jump target index: ${targetIndex}`);
    return run;
  }

  const targetEntry = run.topicQueue[targetIndex];
  console.log(
    `[autoModeService] Jumping ahead to "${targetEntry.subtopicName}" in module "${targetEntry.moduleName}"`
  );

  // Return a NEW object so React detects the state change
  const updatedRun: AutoRunV2 = {
    ...run,
    currentIndex: targetIndex,
    lastUpdatedAt: Date.now(),
  };

  saveRun(updatedRun);

  return updatedRun;
}

/**
 * Navigation item for the module dropdown.
 */
export type NavigationItem =
  | { type: "header"; title: string }
  | {
      type: "item";
      entry: TopicQueueEntry;
      index: number;
      isCurrent: boolean;
      status: "completed" | "current" | "upcoming";
    };

/**
 * Get navigation items for the dropdown (Current Module + Next Module).
 * Scans the queue to find all items belonging to the current module and the next distinct module.
 */
export function getModuleNavigationItems(run: AutoRunV2): NavigationItem[] {
  const result: NavigationItem[] = [];
  const currentQEntry = getCurrentQueueEntry(run);

  if (!currentQEntry) return result;

  const currentModuleId = currentQEntry.moduleId;
  let nextModuleId: string | null = null;
  const currentModuleItems: NavigationItem[] = [];
  const nextModuleItems: NavigationItem[] = [];

  // 1. Scan for Current Module Items and determine Next Module ID
  // We scan the WHOLE queue to find all items for current module (even if previous)
  // But strictly, usually we only care about "what's in the queue".
  // Note: generateWeaknessBasedQueue might interleave, so this might collect scattered items if we just filter.
  // Requirement says "Current Module" listing all questions.
  // If queue is sorted by module (typical for curriculum), they are contiguous.
  // If interleaved, filtering by ID groups them visually, which is good.

  // Find next module ID by looking ahead from current index
  for (let i = run.currentIndex + 1; i < run.topicQueue.length; i++) {
    if (run.topicQueue[i].moduleId !== currentModuleId) {
      nextModuleId = run.topicQueue[i].moduleId;
      break;
    }
  }

  // 2. Build Lists
  // To preserve queue order within groups, we iterate queue once.

  for (let i = 0; i < run.topicQueue.length; i++) {
    const entry = run.topicQueue[i];
    const isCurrent = i === run.currentIndex;
    const status =
      i < run.currentIndex
        ? "completed"
        : i === run.currentIndex
        ? "current"
        : "upcoming";

    const item: NavigationItem = {
      type: "item",
      entry,
      index: i,
      isCurrent,
      status,
    };

    if (entry.moduleId === currentModuleId) {
      currentModuleItems.push(item);
    } else if (nextModuleId && entry.moduleId === nextModuleId) {
      // Only add next module items if they are "upcoming" relative to the current block?
      // Or just all items of that next module found in the queue?
      // Let's add all.
      nextModuleItems.push(item);
    }
  }

  // 3. Assemble Result
  if (currentModuleItems.length > 0) {
    result.push({ type: "header", title: "CURRENT MODULE" });
    result.push(...currentModuleItems);
  }

  if (nextModuleItems.length > 0) {
    result.push({ type: "header", title: "NEXT MODULE" });
    result.push(...nextModuleItems);
  }

  return result;
}

/**
 * Get next N topics from queue (for preview) - Legacy/Simple use
 */
export function getNextTopics(
  run: AutoRunV2,
  count: number = 3
): TopicQueueEntry[] {
  const result: TopicQueueEntry[] = [];
  const start = run.currentIndex + 1;
  const end = Math.min(start + count, run.topicQueue.length);

  for (let i = start; i < end; i++) {
    result.push(run.topicQueue[i]);
  }

  return result;
}

/**
 * Inject remediation questions into near-term queue.
 */
export function injectRemediationQuestions(
  run: AutoRunV2,
  subtopicId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _count: number = DEFAULT_AUTO_RUN_CONFIG.extraRemediationCount
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

  // Create remediation entries (just add subtopic - one entry)
  // Only add if not already in queue nearby
  const alreadyInQueue = run.topicQueue
    .slice(run.currentIndex, run.currentIndex + 5)
    .some((e) => e.subtopicId === subtopicId);

  if (alreadyInQueue) {
    console.log(
      `[autoModeService] Remediation skipped - subtopic already in queue nearby`
    );
    return run;
  }

  const remediationEntry: TopicQueueEntry = {
    moduleId: targetModule.id,
    subtopicId: targetSubtopic.id,
    moduleName: targetModule.name,
    subtopicName: targetSubtopic.name,
  };

  // Insert after current position
  const insertPos = run.currentIndex + 1;
  run.topicQueue.splice(insertPos, 0, remediationEntry);

  run.lastUpdatedAt = Date.now();
  saveRun(run);
  incrementAnalytics("remediationsTriggered");

  return run;
}

/**
 * Check if a subtopic is being repeated (solved previously or attempted significantly).
 */
export function isRepeatedSubtopic(
  run: AutoRunV2,
  subtopicId: string
): boolean {
  const stats = run.perSubtopicStats[subtopicId];
  // Requirement: "The current sub-topic has already been completed before".
  // Completed implies solved at least once.
  return !!stats && stats.solved > 0;
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

  // Update recent subtopics (for avoiding consecutive repeats)
  run.recentProblemTypes = [
    ...run.recentProblemTypes.slice(-4),
    entry.subtopicId,
  ];

  if (result === "correct") {
    run.streak++;
    run.perSubtopicStats[entry.subtopicId].solved++;
    run.perSubtopicStats[entry.subtopicId].consecutiveFailures = 0; // Reset failures
    run.completedQuestions++;

    // Check for promotion
    if (run.streak >= streakThreshold) {
      run = promoteSubtopicDifficulty(run, entry.subtopicId);
    }
  } else if (result === "incorrect") {
    run.streak = 0;
    incrementAnalytics("streakResets");

    // Increment consecutive failures
    const failures =
      (run.perSubtopicStats[entry.subtopicId].consecutiveFailures || 0) + 1;
    run.perSubtopicStats[entry.subtopicId].consecutiveFailures = failures;

    // Demote ONLY if sustained failure (>= 2 attempts) to prevent accidental demotion
    if (failures >= 2) {
      run = demoteSubtopicDifficulty(run, entry.subtopicId);

      // Inject remediation if enabled
      if (run.remediationMode) {
        run = injectRemediationQuestions(run, entry.subtopicId);
      }
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
      skips: 0,
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
      skips: 0,
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
      skips: 0,
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
// EXPORT / IMPORT LOGIC
// ============================================

export function exportRunToJSON(run: AutoRunV2): string {
  // Sanitize if necessary
  return JSON.stringify(run, null, 2);
}

export interface ImportError {
  error: string;
}

export function importRunFromJSON(jsonString: string): AutoRunV2 | ImportError {
  try {
    const data = JSON.parse(jsonString);
    // Basic validation
    if (data.version !== 2 || !data.id || !Array.isArray(data.topicQueue)) {
      return { error: "Invalid run file format (v2 required)." };
    }

    // Check for ID conflict, if generic, maybe regenerate?
    // For now, if ID exists, we'll append -imported-${timestamp}
    const runs = getAllAutoRunsV2();
    if (runs.some((r) => r.id === data.id)) {
      data.id = `${data.id}-imported-${Date.now()}`;
      data.name = `${data.name} (Imported)`;
    }

    const run = data as AutoRunV2;
    run.status = "paused"; // Don't auto-start
    saveRun(run);
    return run;
  } catch {
    return { error: "Failed to parse JSON file." };
  }
}

// ============================================
// HELPER EXPORTS
// ============================================

export { DEFAULT_AUTO_RUN_CONFIG };

// Re-export types for convenience
export type { AutoRunV2, TopicQueueEntry } from "./autoRunTypes";

// ============================================
// V1 COMPATIBILITY ALIASES
// ============================================
// These aliases support components built for V1 API

/** @deprecated Use getAllAutoRunsV2 */
export const getSaveFiles = getAllAutoRunsV2;

/** @deprecated Use createAutoRunV2 */
export const createSaveFile = createAutoRunV2;

/** @deprecated Use deleteAutoRunV2 */
export const deleteSaveFile = deleteAutoRunV2;

/** @deprecated Use AutoRunV2 */
export type AutoModeSaveFile = AutoRunV2;

/**
 * Get a summary of a run for display.
 * @deprecated V1 compatibility function
 */
export function getSaveFileSummary(run: AutoRunV2): string {
  const current = getCurrentQueueEntry(run);
  const topicName = current?.subtopicName || "Unknown";
  return `${run.completedQuestions} questions • ${topicName}`;
}

/**
 * Export a single run.
 * @deprecated Use exportRunToJSON
 */
export function exportRun(runId: string): AutoRunV2 | null {
  return loadAutoRunV2(runId);
}

/**
 * Export all runs.
 * @deprecated V1 compatibility function
 */
export function exportAllRuns(): { runs: AutoRunV2[]; exportedAt: number } {
  return {
    runs: getAllAutoRunsV2(),
    exportedAt: Date.now(),
  };
}

/**
 * Import runs from exported data.
 * @deprecated V1 compatibility function
 */
export function importRuns(data: { runs?: AutoRunV2[] }): {
  imported: number;
  skipped: number;
  errors: string[];
} {
  const result = { imported: 0, skipped: 0, errors: [] as string[] };

  if (!data.runs || !Array.isArray(data.runs)) {
    result.errors.push("Invalid import data format");
    return result;
  }

  const existingRuns = getAllAutoRunsV2();
  const existingIds = new Set(existingRuns.map((r) => r.id));

  for (const run of data.runs) {
    if (existingIds.has(run.id)) {
      result.skipped++;
    } else {
      saveRun(run);
      result.imported++;
    }
  }

  return result;
}
