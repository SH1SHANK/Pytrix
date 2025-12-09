/**
 * Question Fingerprint
 *
 * Lightweight fingerprinting system for question deduplication.
 * Each fingerprint captures the essential characteristics of a question
 * without storing the full question text.
 */

import type { Question, Difficulty } from "./types";
import {
  getArchetypeId,
  getOperationTags,
  getTagOverlap,
  type OperationTag,
} from "./archetypeRegistry";

// ============================================================================
// Types
// ============================================================================

/**
 * Minimal fingerprint for question comparison.
 * Designed to be small and fast to compare.
 */
export interface QuestionFingerprint {
  /** Module ID (e.g., "string-manipulation") */
  module: string;
  /** Subtopic ID (e.g., "two-pointer-techniques") */
  subtopic: string;
  /** Archetype ID (same as problemTypeId) */
  archetypeId: string;
  /** Operation tags for algorithmic categorization */
  operationTags: OperationTag[];
  /** Difficulty level */
  difficulty: Difficulty;
  /** Timestamp when fingerprint was created */
  timestamp: number;
}

/**
 * Serializable fingerprint for localStorage.
 */
export interface SerializedFingerprint {
  m: string; // module
  s: string; // subtopic
  a: string; // archetypeId
  o: string; // operationTags (comma-separated)
  d: string; // difficulty
  t: number; // timestamp
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Similarity threshold for considering questions as duplicates.
 * Questions with similarity >= this threshold trigger regeneration.
 */
export const SIMILARITY_THRESHOLD = 0.8;

/**
 * Weights for different fingerprint components in similarity calculation.
 */
const SIMILARITY_WEIGHTS = {
  module: 0.15,
  subtopic: 0.2,
  archetype: 0.35,
  operationTags: 0.2,
  difficulty: 0.1,
};

// ============================================================================
// Fingerprint Creation
// ============================================================================

/**
 * Creates a fingerprint from a Question object.
 *
 * @param question - The question to fingerprint
 * @param problemTypeId - Optional problem type ID if known
 * @returns QuestionFingerprint
 */
export function createFingerprint(
  question: Question,
  problemTypeId?: string
): QuestionFingerprint {
  // Derive archetype and tags from problem type ID
  const archetypeId = problemTypeId
    ? getArchetypeId(problemTypeId)
    : deriveArchetypeFromQuestion(question);

  const operationTags = getOperationTags(archetypeId, question.topic);

  return {
    module: question.topicId,
    subtopic: question.topic,
    archetypeId,
    operationTags,
    difficulty: question.difficulty,
    timestamp: Date.now(),
  };
}

/**
 * Derives an archetype ID from question content when problemTypeId is unknown.
 * Uses the question's topic and title to approximate.
 */
function deriveArchetypeFromQuestion(question: Question): string {
  // Use topic + first significant word from title
  const titleWords = question.title
    .toLowerCase()
    .replace(/\[.*?\]/g, "") // Remove difficulty tags
    .split(/\s+/)
    .filter((w) => w.length > 3);

  if (titleWords.length > 0) {
    return `${question.topic}-${titleWords[0]}`.toLowerCase();
  }

  return question.topic.toLowerCase();
}

// ============================================================================
// Similarity Calculation
// ============================================================================

/**
 * Calculates similarity between two fingerprints.
 *
 * @param fp1 - First fingerprint
 * @param fp2 - Second fingerprint
 * @returns Similarity score from 0 (completely different) to 1 (identical)
 */
export function calculateSimilarity(
  fp1: QuestionFingerprint,
  fp2: QuestionFingerprint
): number {
  let score = 0;

  // Module match
  if (fp1.module === fp2.module) {
    score += SIMILARITY_WEIGHTS.module;
  }

  // Subtopic match
  if (fp1.subtopic === fp2.subtopic) {
    score += SIMILARITY_WEIGHTS.subtopic;
  }

  // Archetype match (most important)
  if (fp1.archetypeId === fp2.archetypeId) {
    score += SIMILARITY_WEIGHTS.archetype;
  }

  // Operation tag overlap
  const tagOverlap = getTagOverlap(fp1.operationTags, fp2.operationTags);
  score += SIMILARITY_WEIGHTS.operationTags * tagOverlap;

  // Difficulty match
  if (fp1.difficulty === fp2.difficulty) {
    score += SIMILARITY_WEIGHTS.difficulty;
  }

  return score;
}

/**
 * Checks if a fingerprint is similar to any in a list.
 *
 * @param fingerprint - The fingerprint to check
 * @param history - List of previous fingerprints
 * @param threshold - Similarity threshold (default: SIMILARITY_THRESHOLD)
 * @returns True if similar to any fingerprint in history
 */
export function isSimilarToAny(
  fingerprint: QuestionFingerprint,
  history: QuestionFingerprint[],
  threshold: number = SIMILARITY_THRESHOLD
): boolean {
  for (const fp of history) {
    if (calculateSimilarity(fingerprint, fp) >= threshold) {
      return true;
    }
  }
  return false;
}

/**
 * Finds the most similar fingerprint in history.
 *
 * @param fingerprint - The fingerprint to compare
 * @param history - List of previous fingerprints
 * @returns The most similar fingerprint and its similarity score, or null
 */
export function findMostSimilar(
  fingerprint: QuestionFingerprint,
  history: QuestionFingerprint[]
): { fingerprint: QuestionFingerprint; similarity: number } | null {
  if (history.length === 0) return null;

  let mostSimilar = history[0];
  let maxSimilarity = calculateSimilarity(fingerprint, history[0]);

  for (let i = 1; i < history.length; i++) {
    const similarity = calculateSimilarity(fingerprint, history[i]);
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      mostSimilar = history[i];
    }
  }

  return { fingerprint: mostSimilar, similarity: maxSimilarity };
}

// ============================================================================
// Serialization
// ============================================================================

/**
 * Serializes a fingerprint for compact storage.
 */
export function serializeFingerprint(
  fp: QuestionFingerprint
): SerializedFingerprint {
  return {
    m: fp.module,
    s: fp.subtopic,
    a: fp.archetypeId,
    o: fp.operationTags.join(","),
    d: fp.difficulty,
    t: fp.timestamp,
  };
}

/**
 * Deserializes a fingerprint from storage.
 */
export function deserializeFingerprint(
  data: SerializedFingerprint
): QuestionFingerprint {
  return {
    module: data.m,
    subtopic: data.s,
    archetypeId: data.a,
    operationTags: data.o.split(",") as OperationTag[],
    difficulty: data.d as Difficulty,
    timestamp: data.t,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Creates a compact string representation of a fingerprint.
 * Used for debugging and logging.
 */
export function fingerprintToString(fp: QuestionFingerprint): string {
  return `${fp.module}/${fp.subtopic}/${fp.archetypeId}[${fp.operationTags.join(
    ","
  )}]@${fp.difficulty}`;
}

/**
 * Checks if a fingerprint matches specific criteria.
 */
export function matchesFilter(
  fp: QuestionFingerprint,
  filter: {
    module?: string;
    subtopic?: string;
    archetypeId?: string;
    difficulty?: Difficulty;
  }
): boolean {
  if (filter.module && fp.module !== filter.module) return false;
  if (filter.subtopic && fp.subtopic !== filter.subtopic) return false;
  if (filter.archetypeId && fp.archetypeId !== filter.archetypeId) return false;
  if (filter.difficulty && fp.difficulty !== filter.difficulty) return false;
  return true;
}
