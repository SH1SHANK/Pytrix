/**
 * Auto Mode Service - Save file management + topic queue generation
 *
 * Handles creating, loading, and updating Auto Mode runs.
 * Designed for localStorage now, replaceable with backend later.
 */

import { getWeakestTopics } from "./statsStore";
import { TOPICS } from "./mockQuestions";

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface AutoModeSaveFile {
  id: string;
  name: string;
  createdAt: number;
  lastUpdatedAt: number;
  topicQueue: string[];
  currentIndex: number;
  completedQuestions: number;
  perTopicCounts: Record<string, number>;
}

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEY = "pypractice-savefiles";
const QUESTIONS_PER_TOPIC = 3; // Questions before rotating to next topic

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateId(): string {
  return `save-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * Generate a topic queue with weakest topics first + randomness.
 */
function generateTopicQueue(): string[] {
  const allTopics = TOPICS.map((t) => t.name);
  const weakest = getWeakestTopics(3);

  // Start with weakest topics
  const queue = [...weakest];

  // Add remaining topics with some shuffle
  const remaining = allTopics.filter((t) => !weakest.includes(t));

  // Simple shuffle
  for (let i = remaining.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
  }

  queue.push(...remaining);

  // Repeat the queue a few times for longer sessions
  return [...queue, ...queue, ...queue];
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
    return JSON.parse(stored) as AutoModeSaveFile[];
  } catch {
    console.warn("[autoModeService] Corrupted save files, resetting.");
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

/**
 * Create a new save file.
 */
export function createSaveFile(name: string): AutoModeSaveFile {
  const saveFile: AutoModeSaveFile = {
    id: generateId(),
    name: name.trim() || `Run ${new Date().toLocaleDateString()}`,
    createdAt: Date.now(),
    lastUpdatedAt: Date.now(),
    topicQueue: generateTopicQueue(),
    currentIndex: 0,
    completedQuestions: 0,
    perTopicCounts: {},
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
 * Get the current topic for a save file.
 */
export function getCurrentTopic(saveFile: AutoModeSaveFile): string {
  if (saveFile.currentIndex >= saveFile.topicQueue.length) {
    // Wrap around
    return saveFile.topicQueue[0] || "Strings";
  }
  return saveFile.topicQueue[saveFile.currentIndex];
}

/**
 * Get the next topic in the queue (for prefetching).
 */
export function getNextTopic(saveFile: AutoModeSaveFile): string {
  const nextIndex = (saveFile.currentIndex + 1) % saveFile.topicQueue.length;
  return saveFile.topicQueue[nextIndex] || "Strings";
}

/**
 * Check if it's time to rotate to the next topic.
 * Rotates after QUESTIONS_PER_TOPIC questions in current topic.
 */
export function shouldRotateTopic(saveFile: AutoModeSaveFile): boolean {
  const currentTopic = getCurrentTopic(saveFile);
  const currentCount = saveFile.perTopicCounts[currentTopic] || 0;
  return currentCount >= QUESTIONS_PER_TOPIC;
}

/**
 * Advance to the next topic in the queue.
 */
export function advanceTopic(saveFile: AutoModeSaveFile): AutoModeSaveFile {
  const newIndex = (saveFile.currentIndex + 1) % saveFile.topicQueue.length;

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
  topicName: string
): AutoModeSaveFile | null {
  const saveFile = loadSaveFile(saveFileId);
  if (!saveFile) return null;

  const newPerTopicCounts = { ...saveFile.perTopicCounts };
  newPerTopicCounts[topicName] = (newPerTopicCounts[topicName] || 0) + 1;

  return updateSaveFile(saveFileId, {
    completedQuestions: saveFile.completedQuestions + 1,
    perTopicCounts: newPerTopicCounts,
  });
}

/**
 * Get a summary of the save file for display.
 */
export function getSaveFileSummary(saveFile: AutoModeSaveFile): string {
  const currentTopic = getCurrentTopic(saveFile);
  return `${saveFile.completedQuestions} questions • Currently on ${currentTopic}`;
}

/**
 * Get progress toward next topic rotation.
 */
export function getTopicProgress(saveFile: AutoModeSaveFile): {
  current: number;
  total: number;
  percent: number;
} {
  const currentTopic = getCurrentTopic(saveFile);
  const current = saveFile.perTopicCounts[currentTopic] || 0;
  const total = QUESTIONS_PER_TOPIC;
  const percent = Math.min(100, Math.round((current / total) * 100));

  return { current, total, percent };
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
    const existing = existingById.get(incomingRun.id);

    if (existing) {
      // ID conflict - compare lastUpdatedAt
      if (incomingRun.lastUpdatedAt > existing.lastUpdatedAt) {
        // Incoming is newer - replace
        const idx = updatedFiles.findIndex((f) => f.id === incomingRun.id);
        if (idx !== -1) {
          updatedFiles[idx] = incomingRun;
          result.imported++;
        }
      } else if (incomingRun.lastUpdatedAt === existing.lastUpdatedAt) {
        // Same timestamp - regenerate ID and add as new
        const newRun = { ...incomingRun, id: generateId() };
        updatedFiles.push(newRun);
        result.imported++;
      } else {
        // Existing is newer - skip
        result.skipped++;
      }
    } else {
      // No conflict - add directly
      updatedFiles.push(incomingRun);
      result.imported++;
    }
  }

  // Persist
  if (result.imported > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles));
  }

  return result;
}
