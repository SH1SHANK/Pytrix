/**
 * Auto Mode Service - Save file management + topic-aware queue generation
 *
 * Handles creating, loading, and updating Auto Mode runs.
 * Uses topic hierarchy for smarter queueing with weak-area bias.
 */

import { getStats, type TopicStats } from "./statsStore";
import {
  getAllModules,
  type Module,
  type Subtopic,
  type ProblemType,
} from "./topicsStore";

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Queue entry with full topic hierarchy.
 */
export interface TopicQueueEntry {
  moduleId: string;
  subtopicId: string;
  problemTypeId: string;
  moduleName: string;
  subtopicName: string;
  problemTypeName: string;
}

/**
 * Auto Mode save file structure.
 */
export interface AutoModeSaveFile {
  id: string;
  name: string;
  createdAt: number;
  lastUpdatedAt: number;
  topicQueue: TopicQueueEntry[];
  currentIndex: number;
  completedQuestions: number;
  perTopicCounts: Record<string, number>; // keyed by problemTypeId
  recentProblemTypes: string[]; // last N problemTypeIds to avoid repeats
  prefetchSize: number; // configurable buffer size (default 2)
}

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEY = "pypractice-savefiles";
const QUESTIONS_PER_TOPIC = 3; // Questions before rotating to next topic
const DEFAULT_PREFETCH_SIZE = 2;
const RECENT_AVOID_COUNT = 5; // Avoid last N problem types

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateId(): string {
  return `save-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * Calculate mastery percentage for a module based on stats.
 * Falls back to 0% if no stats available.
 */
function getModuleMastery(
  moduleName: string,
  topicStats: TopicStats[]
): number {
  // Match by module name (legacy compatibility)
  const stat = topicStats.find(
    (s) => s.topic.toLowerCase() === moduleName.toLowerCase()
  );

  if (!stat || stat.attempts === 0) return 0;
  return Math.round((stat.solved / stat.attempts) * 100);
}

/**
 * Calculate mastery for a subtopic based on stats.
 */
function getSubtopicMastery(
  subtopicName: string,
  topicStats: TopicStats[]
): number {
  // Match by subtopic name
  const stat = topicStats.find(
    (s) => s.topic.toLowerCase() === subtopicName.toLowerCase()
  );

  if (!stat || stat.attempts === 0) return 0;
  return Math.round((stat.solved / stat.attempts) * 100);
}

/**
 * Fisher-Yates shuffle.
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Check if a problem type should be avoided (recently used).
 */
function shouldAvoidProblemType(
  problemTypeId: string,
  recentList: string[]
): boolean {
  return recentList.includes(problemTypeId);
}

interface ModuleWithMastery {
  module: Module;
  mastery: number;
}

interface SubtopicWithMastery {
  subtopic: Subtopic;
  mastery: number;
  module: Module;
}

interface ProblemTypeWithContext {
  problemType: ProblemType;
  subtopic: Subtopic;
  module: Module;
  mastery: number;
}

/**
 * Generate a topic queue with weakest areas first.
 * Algorithm:
 * 1. Get all modules, sort by mastery ASC (untouched first)
 * 2. For each module, get subtopics, sort by mastery ASC
 * 3. Select problem types from weakest subtopics
 * 4. Shuffle within same-mastery tiers
 * 5. Avoid recently used problem types
 */
export function generateTopicAwareQueue(
  recentProblemTypes: string[] = []
): TopicQueueEntry[] {
  const modules = getAllModules();
  const stats = getStats();
  const topicStats = stats.perTopic;

  // Step 1: Calculate module mastery and sort
  const modulesWithMastery: ModuleWithMastery[] = modules.map((m) => ({
    module: m,
    mastery: getModuleMastery(m.name, topicStats),
  }));

  // Sort by mastery (untouched/weak first)
  modulesWithMastery.sort((a, b) => a.mastery - b.mastery);

  // Step 2: Build flat list of problem types with context
  const allProblemTypes: ProblemTypeWithContext[] = [];

  for (const { module, mastery: moduleMastery } of modulesWithMastery) {
    // Get subtopics with mastery
    const subtopicsWithMastery: SubtopicWithMastery[] = module.subtopics.map(
      (st) => ({
        subtopic: st,
        mastery: getSubtopicMastery(st.name, topicStats),
        module,
      })
    );

    // Sort subtopics by mastery
    subtopicsWithMastery.sort((a, b) => a.mastery - b.mastery);

    // Add problem types with inherited mastery (use subtopic mastery + module mastery as tiebreaker)
    for (const { subtopic, mastery: subtopicMastery } of subtopicsWithMastery) {
      for (const pt of subtopic.problemTypes) {
        allProblemTypes.push({
          problemType: pt,
          subtopic,
          module,
          mastery: subtopicMastery * 100 + moduleMastery, // Combined score for sorting
        });
      }
    }
  }

  // Step 3: Sort by combined mastery score
  allProblemTypes.sort((a, b) => a.mastery - b.mastery);

  // Step 4: Shuffle within mastery tiers (group by same mastery)
  const tieredGroups: ProblemTypeWithContext[][] = [];
  let currentTier: ProblemTypeWithContext[] = [];
  let currentMastery = -1;

  for (const pt of allProblemTypes) {
    if (pt.mastery !== currentMastery) {
      if (currentTier.length > 0) {
        tieredGroups.push(shuffle(currentTier));
      }
      currentTier = [pt];
      currentMastery = pt.mastery;
    } else {
      currentTier.push(pt);
    }
  }
  if (currentTier.length > 0) {
    tieredGroups.push(shuffle(currentTier));
  }

  // Flatten back
  const shuffledProblemTypes = tieredGroups.flat();

  // Step 5: Filter out recently used (but keep some if too few options)
  const filtered = shuffledProblemTypes.filter(
    (pt) => !shouldAvoidProblemType(pt.problemType.id, recentProblemTypes)
  );

  // Use filtered if we have enough, otherwise use all
  const finalList = filtered.length >= 10 ? filtered : shuffledProblemTypes;

  // Step 6: Convert to queue entries (take first 50 for reasonable session length)
  const queue: TopicQueueEntry[] = finalList.slice(0, 50).map((pt) => ({
    moduleId: pt.module.id,
    subtopicId: pt.subtopic.id,
    problemTypeId: pt.problemType.id,
    moduleName: pt.module.name,
    subtopicName: pt.subtopic.name,
    problemTypeName: pt.problemType.name,
  }));

  return queue;
}

// Legacy function for backward compatibility
function generateTopicQueue(): TopicQueueEntry[] {
  return generateTopicAwareQueue([]);
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Get all save files from localStorage.
 */
export function getSaveFiles(): AutoModeSaveFile[] {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored) as AutoModeSaveFile[];
    // Migrate legacy save files if needed
    return parsed.map(migrateSaveFile);
  } catch {
    console.warn("[autoModeService] Corrupted save files, resetting.");
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

/**
 * Migrate legacy save files to new format.
 */
function migrateSaveFile(saveFile: AutoModeSaveFile): AutoModeSaveFile {
  // Add new fields if missing
  if (!Array.isArray(saveFile.recentProblemTypes)) {
    saveFile.recentProblemTypes = [];
  }
  if (typeof saveFile.prefetchSize !== "number") {
    saveFile.prefetchSize = DEFAULT_PREFETCH_SIZE;
  }
  // Check if topicQueue is old string[] format
  if (
    saveFile.topicQueue.length > 0 &&
    typeof saveFile.topicQueue[0] === "string"
  ) {
    // Regenerate with new format
    saveFile.topicQueue = generateTopicQueue();
    saveFile.currentIndex = 0;
  }
  return saveFile;
}

/**
 * Create a new save file.
 */
export function createSaveFile(
  name: string,
  prefetchSize: number = DEFAULT_PREFETCH_SIZE
): AutoModeSaveFile {
  const saveFile: AutoModeSaveFile = {
    id: generateId(),
    name: name.trim() || `Run ${new Date().toLocaleDateString()}`,
    createdAt: Date.now(),
    lastUpdatedAt: Date.now(),
    topicQueue: generateTopicQueue(),
    currentIndex: 0,
    completedQuestions: 0,
    perTopicCounts: {},
    recentProblemTypes: [],
    prefetchSize,
  };

  const existing = getSaveFiles();
  existing.push(saveFile);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

  return saveFile;
}

/**
 * Load a save file by ID.
 */
export function loadSaveFile(id: string): AutoModeSaveFile | null {
  const files = getSaveFiles();
  return files.find((f) => f.id === id) || null;
}

/**
 * Update a save file with new data.
 */
export function updateSaveFile(
  id: string,
  updates: Partial<AutoModeSaveFile>
): AutoModeSaveFile | null {
  if (typeof window === "undefined") {
    return null;
  }

  const files = getSaveFiles();
  const index = files.findIndex((f) => f.id === id);

  if (index === -1) {
    console.warn(`[autoModeService] Save file not found: ${id}`);
    return null;
  }

  files[index] = {
    ...files[index],
    ...updates,
    lastUpdatedAt: Date.now(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  return files[index];
}

/**
 * Delete a save file.
 */
export function deleteSaveFile(id: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const files = getSaveFiles();
  const filtered = files.filter((f) => f.id !== id);

  if (filtered.length === files.length) {
    return false; // Not found
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Get the current topic queue entry for a save file.
 */
export function getCurrentTopic(saveFile: AutoModeSaveFile): TopicQueueEntry {
  if (saveFile.currentIndex >= saveFile.topicQueue.length) {
    // Regenerate queue when exhausted
    return saveFile.topicQueue[0] || getDefaultQueueEntry();
  }
  return saveFile.topicQueue[saveFile.currentIndex];
}

/**
 * Get the next N topics in the queue (for prefetching).
 */
export function getNextTopics(
  saveFile: AutoModeSaveFile,
  count?: number
): TopicQueueEntry[] {
  const n = count ?? saveFile.prefetchSize;
  const result: TopicQueueEntry[] = [];

  for (let i = 1; i <= n; i++) {
    const nextIndex = (saveFile.currentIndex + i) % saveFile.topicQueue.length;
    if (saveFile.topicQueue[nextIndex]) {
      result.push(saveFile.topicQueue[nextIndex]);
    }
  }

  return result;
}

/**
 * Legacy: Get the next topic (single).
 */
export function getNextTopic(saveFile: AutoModeSaveFile): TopicQueueEntry {
  const next = getNextTopics(saveFile, 1);
  return next[0] || getCurrentTopic(saveFile);
}

/**
 * Get default queue entry (fallback).
 */
function getDefaultQueueEntry(): TopicQueueEntry {
  return {
    moduleId: "string-manipulation",
    subtopicId: "basic-string-operations",
    problemTypeId: "reverse-string",
    moduleName: "String Manipulation",
    subtopicName: "Basic String Operations",
    problemTypeName: "Reverse String",
  };
}

/**
 * Check if it's time to rotate to the next topic.
 * Rotates after QUESTIONS_PER_TOPIC questions in current topic.
 */
export function shouldRotateTopic(saveFile: AutoModeSaveFile): boolean {
  const currentEntry = getCurrentTopic(saveFile);
  const currentCount = saveFile.perTopicCounts[currentEntry.problemTypeId] || 0;
  return currentCount >= QUESTIONS_PER_TOPIC;
}

/**
 * Advance to the next topic in the queue.
 */
export function advanceTopic(saveFile: AutoModeSaveFile): AutoModeSaveFile {
  const newIndex = (saveFile.currentIndex + 1) % saveFile.topicQueue.length;

  // If we've wrapped around, consider regenerating the queue
  if (newIndex === 0) {
    const newQueue = generateTopicAwareQueue(saveFile.recentProblemTypes);
    return (
      updateSaveFile(saveFile.id, {
        currentIndex: 0,
        topicQueue: newQueue,
      }) || saveFile
    );
  }

  return (
    updateSaveFile(saveFile.id, {
      currentIndex: newIndex,
    }) || saveFile
  );
}

/**
 * Record a completed question in the save file.
 */
export function recordQuestionCompleted(
  saveFileId: string,
  problemTypeId: string
): AutoModeSaveFile | null {
  const saveFile = loadSaveFile(saveFileId);
  if (!saveFile) return null;

  // Update per-topic counts
  const newPerTopicCounts = { ...saveFile.perTopicCounts };
  newPerTopicCounts[problemTypeId] =
    (newPerTopicCounts[problemTypeId] || 0) + 1;

  // Update recent problem types (sliding window)
  const newRecent = [...saveFile.recentProblemTypes, problemTypeId].slice(
    -RECENT_AVOID_COUNT
  );

  return updateSaveFile(saveFileId, {
    completedQuestions: saveFile.completedQuestions + 1,
    perTopicCounts: newPerTopicCounts,
    recentProblemTypes: newRecent,
  });
}

/**
 * Get a summary of the save file for display.
 */
export function getSaveFileSummary(saveFile: AutoModeSaveFile): string {
  const currentEntry = getCurrentTopic(saveFile);
  return `${saveFile.completedQuestions} questions • ${currentEntry.moduleName} › ${currentEntry.subtopicName}`;
}

/**
 * Get progress toward next topic rotation.
 */
export function getTopicProgress(saveFile: AutoModeSaveFile): {
  current: number;
  total: number;
  percent: number;
} {
  const currentEntry = getCurrentTopic(saveFile);
  const current = saveFile.perTopicCounts[currentEntry.problemTypeId] || 0;
  const total = QUESTIONS_PER_TOPIC;
  const percent = Math.min(100, Math.round((current / total) * 100));

  return { current, total, percent };
}

/**
 * Update prefetch size for a save file.
 */
export function updatePrefetchSize(
  saveFileId: string,
  prefetchSize: number
): AutoModeSaveFile | null {
  return updateSaveFile(saveFileId, { prefetchSize });
}

/**
 * Regenerate the queue for a save file (e.g., after settings change).
 */
export function regenerateQueue(saveFileId: string): AutoModeSaveFile | null {
  const saveFile = loadSaveFile(saveFileId);
  if (!saveFile) return null;

  const newQueue = generateTopicAwareQueue(saveFile.recentProblemTypes);
  return updateSaveFile(saveFileId, {
    topicQueue: newQueue,
    currentIndex: 0,
  });
}

// ============================================
// EXPORT / IMPORT FUNCTIONS
// ============================================

/**
 * Export format for Auto Mode runs.
 */
export interface ExportedRuns {
  version: 1;
  exportedAt: number;
  runs: AutoModeSaveFile[];
}

/**
 * Export a single run by ID.
 */
export function exportRun(id: string): ExportedRuns | null {
  const saveFile = loadSaveFile(id);
  if (!saveFile) return null;

  return {
    version: 1,
    exportedAt: Date.now(),
    runs: [saveFile],
  };
}

/**
 * Export all runs.
 */
export function exportAllRuns(): ExportedRuns {
  return {
    version: 1,
    exportedAt: Date.now(),
    runs: getSaveFiles(),
  };
}

/**
 * Validate that an object matches the ExportedRuns structure.
 */
function isValidExportedRuns(data: unknown): data is ExportedRuns {
  if (typeof data !== "object" || data === null) return false;

  const obj = data as Record<string, unknown>;
  if (obj.version !== 1) return false;
  if (typeof obj.exportedAt !== "number") return false;
  if (!Array.isArray(obj.runs)) return false;

  // Validate each run has required fields
  for (const run of obj.runs) {
    if (typeof run !== "object" || run === null) return false;
    const r = run as Record<string, unknown>;
    if (typeof r.id !== "string") return false;
    if (typeof r.name !== "string") return false;
    if (typeof r.createdAt !== "number") return false;
    if (typeof r.lastUpdatedAt !== "number") return false;
    if (!Array.isArray(r.topicQueue)) return false;
    if (typeof r.currentIndex !== "number") return false;
    if (typeof r.completedQuestions !== "number") return false;
    if (typeof r.perTopicCounts !== "object") return false;
  }

  return true;
}

/**
 * Import runs from exported JSON data.
 * Handles ID conflicts by preferring newer lastUpdatedAt or regenerating ID.
 */
export function importRuns(data: unknown): {
  imported: number;
  skipped: number;
  errors: string[];
} {
  const result = { imported: 0, skipped: 0, errors: [] as string[] };

  // Validate structure
  if (!isValidExportedRuns(data)) {
    result.errors.push("Invalid export file format");
    return result;
  }

  if (data.runs.length === 0) {
    result.errors.push("No runs found in export file");
    return result;
  }

  const existingFiles = getSaveFiles();
  const existingById = new Map(existingFiles.map((f) => [f.id, f]));
  const updatedFiles = [...existingFiles];

  for (const incomingRun of data.runs) {
    // Migrate incoming run to new format
    const migratedRun = migrateSaveFile(incomingRun);
    const existing = existingById.get(migratedRun.id);

    if (existing) {
      // ID conflict - compare lastUpdatedAt
      if (migratedRun.lastUpdatedAt > existing.lastUpdatedAt) {
        // Incoming is newer - replace
        const idx = updatedFiles.findIndex((f) => f.id === migratedRun.id);
        if (idx !== -1) {
          updatedFiles[idx] = migratedRun;
          result.imported++;
        }
      } else if (migratedRun.lastUpdatedAt === existing.lastUpdatedAt) {
        // Same timestamp - regenerate ID and add as new
        const newRun = { ...migratedRun, id: generateId() };
        updatedFiles.push(newRun);
        result.imported++;
      } else {
        // Existing is newer - skip
        result.skipped++;
      }
    } else {
      // No conflict - add directly
      updatedFiles.push(migratedRun);
      result.imported++;
    }
  }

  // Persist
  if (result.imported > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles));
  }

  return result;
}
