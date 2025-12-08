/**
 * History Store - Question attempt history with localStorage persistence
 *
 * Tracks all attempted questions for both Manual and Auto Mode.
 * Supports revisiting past questions with code snapshots.
 */

import { DifficultyLevel } from "./types";

// ============================================
// CONFIGURATION
// ============================================

export const HISTORY_CONFIG = {
  /** Maximum number of history entries to keep */
  MAX_ENTRIES: 100,
  /** Storage key */
  STORAGE_KEY: "pypractice-history",
};

// ============================================
// TYPES
// ============================================

export interface QuestionHistoryEntry {
  /** Unique ID for this history entry */
  id: string;
  /** Practice mode: manual or auto */
  mode: "manual" | "auto";
  /** Topic of the question */
  topic: string;
  /** Difficulty level */
  difficulty: DifficultyLevel | null;
  /** Original question ID */
  questionId: string;
  /** Question title */
  questionTitle: string;
  /** Full question description/text */
  questionText: string;
  /** User's code at time of last run */
  codeSnapshot: string;
  /** Whether Run & Check was pressed */
  wasSubmitted: boolean;
  /** Result of evaluation: true=correct, false=incorrect, null=not checked */
  wasCorrect: boolean | null;
  /** Timestamp of last run or edit (ms) */
  executedAt: number;
  /** Auto Mode run ID (null for manual) */
  runId: string | null;
  /** Sample input for the question */
  sampleInput?: string;
  /** Sample output for the question */
  sampleOutput?: string;
}

// ============================================
// HELPERS
// ============================================

function generateId(): string {
  return `hist-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

function loadHistory(): QuestionHistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(HISTORY_CONFIG.STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as QuestionHistoryEntry[];
  } catch {
    console.warn("[HistoryStore] Failed to load history");
    return [];
  }
}

function saveHistory(entries: QuestionHistoryEntry[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(HISTORY_CONFIG.STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error("[HistoryStore] Failed to save history:", err);
  }
}

// ============================================
// API
// ============================================

/**
 * Get all history entries, sorted by executedAt (newest first).
 */
export function getHistory(): QuestionHistoryEntry[] {
  const entries = loadHistory();
  return entries.sort((a, b) => b.executedAt - a.executedAt);
}

/**
 * Get a single history entry by ID.
 */
export function getHistoryEntry(id: string): QuestionHistoryEntry | null {
  const entries = loadHistory();
  return entries.find((e) => e.id === id) || null;
}

/**
 * Add a new history entry.
 * Automatically trims oldest entries if MAX_ENTRIES exceeded.
 */
export function addHistoryEntry(
  entry: Omit<QuestionHistoryEntry, "id">
): QuestionHistoryEntry {
  const entries = loadHistory();

  const newEntry: QuestionHistoryEntry = {
    ...entry,
    id: generateId(),
  };

  entries.unshift(newEntry); // Add to front (newest)

  // Trim if needed
  if (entries.length > HISTORY_CONFIG.MAX_ENTRIES) {
    entries.splice(HISTORY_CONFIG.MAX_ENTRIES);
  }

  saveHistory(entries);

  return newEntry;
}

/**
 * Update an existing history entry.
 */
export function updateHistoryEntry(
  id: string,
  updates: Partial<Omit<QuestionHistoryEntry, "id">>
): QuestionHistoryEntry | null {
  const entries = loadHistory();
  const index = entries.findIndex((e) => e.id === id);

  if (index === -1) {
    console.warn(`[HistoryStore] Entry not found: ${id}`);
    return null;
  }

  entries[index] = {
    ...entries[index],
    ...updates,
  };

  saveHistory(entries);
  return entries[index];
}

/**
 * Delete a history entry.
 */
export function deleteHistoryEntry(id: string): boolean {
  const entries = loadHistory();
  const index = entries.findIndex((e) => e.id === id);

  if (index === -1) return false;

  entries.splice(index, 1);
  saveHistory(entries);

  return true;
}

/**
 * Clear all history.
 */
export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_CONFIG.STORAGE_KEY);
}

/**
 * Find existing entry for a question (to update instead of duplicate).
 * Matches by questionId and mode.
 */
export function findExistingEntry(
  questionId: string,
  mode: "manual" | "auto"
): QuestionHistoryEntry | null {
  const entries = loadHistory();
  return (
    entries.find((e) => e.questionId === questionId && e.mode === mode) || null
  );
}

/**
 * Add or update a history entry for a question.
 * If an entry already exists for this question+mode, updates it.
 * Otherwise creates a new entry.
 */
export function upsertHistoryEntry(
  entry: Omit<QuestionHistoryEntry, "id">
): QuestionHistoryEntry {
  const existing = findExistingEntry(entry.questionId, entry.mode);

  if (existing) {
    return updateHistoryEntry(existing.id, entry) || existing;
  }

  return addHistoryEntry(entry);
}
