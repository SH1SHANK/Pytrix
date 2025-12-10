/**
 * Auto Run Types v2
 *
 * Types for the curriculum-aware Auto Mode with adaptive difficulty.
 */

// ============================================
// TOPIC QUEUE (defined here to avoid circular imports)
// ============================================

/**
 * Entry in the topic queue.
 * Now subtopic-based (one entry per subtopic, not per problemType).
 * Problem type is selected at question generation time for variety.
 */
export interface TopicQueueEntry {
  moduleId: string;
  subtopicId: string;
  moduleName: string;
  subtopicName: string;
}

// ============================================
// TUNING CONFIGURATION
// ============================================

/**
 * Tuning parameters for adaptive behavior.
 * Can be overridden via settings or dev config.
 */
export interface AutoRunConfig {
  /** Correct answers needed to promote difficulty (default: 3) */
  streakToPromote: number;
  /** Same, when aggressive mode enabled (default: 2) */
  aggressiveStreakToPromote: number;
  /** Extra questions injected on failure (default: 2) */
  extraRemediationCount: number;
  /** Initial mini-curriculum size (default: 12) */
  miniCurriculumSize: number;
  /** Hours before streak decays by half (default: 24) */
  decayHours: number;
  /** Questions to prefetch ahead (default: 2) */
  prefetchBufferSize: number;
}

/**
 * Default tuning configuration.
 */
export const DEFAULT_AUTO_RUN_CONFIG: AutoRunConfig = {
  streakToPromote: 3,
  aggressiveStreakToPromote: 2,
  extraRemediationCount: 2,
  miniCurriculumSize: 12,
  decayHours: 24,
  prefetchBufferSize: 2,
};

// ============================================
// DIFFICULTY TYPES (imported from canonical source)
// ============================================

import { DifficultyLevel } from "@/lib/stores/statsStore";

// Re-export for convenience
export type { DifficultyLevel };

/**
 * Tracks difficulty pointer per subtopic.
 * Key is subtopicId, value is current difficulty level.
 */
export type DifficultyPointer = Record<string, DifficultyLevel>;

// ============================================
// RUN STATE
// ============================================

/**
 * Per-subtopic statistics within a run.
 */
export interface AutoRunSubtopicStats {
  attempts: number;
  solved: number;
  lastAttemptAt: number;
  consecutiveFailures?: number;
}

/**
 * Auto Run v2 state structure.
 */
export interface AutoRunV2 {
  /** Unique run identifier */
  id: string;
  /** Schema version for migrations */
  version: 2;
  /** Run name for display */
  name: string;
  /** Creation timestamp */
  createdAt: number;
  /** Last activity timestamp */
  lastUpdatedAt: number;
  /** Run status */
  status: "active" | "paused" | "completed";

  // ---- Curriculum ----
  /** Current topic queue */
  topicQueue: TopicQueueEntry[];
  /** Current position in queue */
  currentIndex: number;
  /** Whether initial mini-curriculum is complete */
  miniCurriculumComplete: boolean;

  // ---- Adaptive State ----
  /** Current correct-in-a-row streak */
  streak: number;
  /** Difficulty level per subtopic */
  difficultyPointer: DifficultyPointer;

  // ---- Run Statistics ----
  /** Total completed questions */
  completedQuestions: number;
  /** Stats per subtopic (keyed by subtopicId) */
  perSubtopicStats: Record<string, AutoRunSubtopicStats>;
  /** Recently used problem types (for repeat avoidance) */
  recentProblemTypes: string[];

  // ---- User Settings ----
  /** Aggressive progression mode (promote after 2 instead of 3) */
  aggressiveProgression: boolean;
  /** Remediation mode (auto-inject extra questions on failure) */
  remediationMode: boolean;
  /** Prefetch buffer size */
  prefetchSize: number;

  // ---- Tuning (optional override) ----
  config?: Partial<AutoRunConfig>;
}

// ============================================
// ATTEMPT TRACKING
// ============================================

export type AttemptResult = "correct" | "incorrect" | "partial";

/**
 * Record of a single attempt for analytics.
 */
export interface AttemptRecord {
  /** Run this attempt belongs to */
  runId: string;
  /** When the attempt occurred */
  timestamp: number;
  /** Module ID */
  moduleId: string;
  /** Subtopic ID */
  subtopicId: string;
  /** Problem type ID */
  problemTypeId: string;
  /** Difficulty of the question */
  difficulty: DifficultyLevel;
  /** Result of the attempt */
  result: AttemptResult;
  /** Time taken in milliseconds */
  timeTakenMs: number;
  /** Optional: tokens used for generation */
  tokensUsed?: number;
}

// ============================================
// ANALYTICS
// ============================================

/**
 * Lightweight analytics counters for tuning.
 */
export interface AdaptiveAnalytics {
  promotions: number;
  demotions: number;
  remediationsTriggered: number;
  streakResets: number;
  decaysApplied: number;
  /** Advanced questions skipped (neutral action, no penalty) */
  skips: number;
}

// ============================================
// STORAGE KEYS
// ============================================

export const STORAGE_KEY_V2 = "pytrix_auto_runs_v2";
export const STORAGE_KEY_STATS_V2 = "pytrix_stats_v2";
export const STORAGE_KEY_ANALYTICS = "pytrix_auto_analytics";
