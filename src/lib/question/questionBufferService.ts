/**
 * Question Buffer Service
 *
 * Manages prefetched question buffers for instant "Next" experience.
 * Used by both Manual Practice and Auto Mode.
 *
 * Buffer keys: `${mode}:${topic}:${difficulty}`
 */

import { Question, DifficultyLevel } from "@/lib/types";
import { generateQuestion } from "@/lib/ai/aiClient";

// ============================================
// CONFIGURATION
// ============================================

export const BUFFER_CONFIG = {
  /**
   * Initial buffer sizes by difficulty.
   * Harder questions = smaller buffer (more expensive, user takes longer).
   */
  BUFFER_SIZE_BY_DIFFICULTY: {
    beginner: 3,
    intermediate: 2,
    advanced: 2,
  } as Record<DifficultyLevel, number>,

  /**
   * Trigger background refill when buffer drops to this level.
   */
  LOW_WATERMARK: 2,

  /**
   * Per-session limits (reset on page refresh).
   * Helps stay within free tier API limits.
   */
  MAX_QUESTION_CALLS_PER_SESSION: 50,
  MAX_SOLUTION_CALLS_PER_SESSION: 20,

  /**
   * Optional adaptive buffer sizing (not implemented yet).
   */
  ENABLE_ADAPTIVE_BUFFER: false,
  FAST_USER_THRESHOLD_MS: 30_000,
};

// ============================================
// TYPES
// ============================================

export interface BufferedQuestion {
  questionId: string;
  topic: string;
  difficulty: DifficultyLevel;
  question: Question;
  fetchedAt: number;
}

interface BufferState {
  questions: BufferedQuestion[];
  currentIndex: number;
  isPrefetching: boolean;
}

interface SessionUsage {
  questionCalls: number;
  solutionCalls: number;
}

// ============================================
// STATE (Module-level in-memory state)
// ============================================

// Buffers keyed by `${mode}:${topic}:${difficulty}`
const buffers = new Map<string, BufferState>();

// Session-level usage tracking
let sessionUsage: SessionUsage = {
  questionCalls: 0,
  solutionCalls: 0,
};

// ============================================
// HELPERS
// ============================================

function getBufferKey(
  mode: string,
  topic: string,
  difficulty: DifficultyLevel
): string {
  return `${mode}:${topic.toLowerCase()}:${difficulty}`;
}

function getOrCreateBuffer(key: string): BufferState {
  if (!buffers.has(key)) {
    buffers.set(key, {
      questions: [],
      currentIndex: -1,
      isPrefetching: false,
    });
  }
  return buffers.get(key)!;
}

// ============================================
// CORE API
// ============================================

/**
 * Initialize buffer for a practice session.
 * Returns the first question immediately; prefetches rest in background.
 *
 * @param mode - "manual" or "auto"
 * @param topic - Topic name (e.g., "Strings")
 * @param difficulty - Difficulty level
 * @returns Promise resolving to the first question
 */
export async function initBuffer(
  mode: string,
  topic: string,
  difficulty: DifficultyLevel
): Promise<Question | null> {
  const key = getBufferKey(mode, topic, difficulty);
  const buffer = getOrCreateBuffer(key);

  // Check session limits
  if (!canGenerateMoreQuestions()) {
    console.warn("[QuestionBuffer] Session question limit reached");
    return null;
  }

  // Generate first question immediately
  sessionUsage.questionCalls++;
  const firstQuestion = await generateQuestion(topic, difficulty);

  const bufferedQ: BufferedQuestion = {
    questionId: firstQuestion.id,
    topic,
    difficulty,
    question: firstQuestion,
    fetchedAt: Date.now(),
  };

  buffer.questions = [bufferedQ];
  buffer.currentIndex = 0;

  // Prefetch remaining in background (non-blocking)
  const targetSize = BUFFER_CONFIG.BUFFER_SIZE_BY_DIFFICULTY[difficulty];
  prefetchQuestions(key, topic, difficulty, targetSize - 1);

  return firstQuestion;
}

/**
 * Get the current question from the buffer.
 */
export function getCurrentQuestion(
  mode: string,
  topic: string,
  difficulty: DifficultyLevel
): Question | null {
  const key = getBufferKey(mode, topic, difficulty);
  const buffer = buffers.get(key);

  if (
    !buffer ||
    buffer.currentIndex < 0 ||
    buffer.currentIndex >= buffer.questions.length
  ) {
    return null;
  }

  return buffer.questions[buffer.currentIndex].question;
}

/**
 * Advance to the next question in the buffer.
 * Returns immediately if question is buffered; otherwise fetches new one.
 *
 * @returns The next question, or null if none available and limit reached
 */
export async function nextQuestion(
  mode: string,
  topic: string,
  difficulty: DifficultyLevel
): Promise<Question | null> {
  const key = getBufferKey(mode, topic, difficulty);
  const buffer = getOrCreateBuffer(key);

  const nextIndex = buffer.currentIndex + 1;

  // If we have a buffered question, return it instantly
  if (nextIndex < buffer.questions.length) {
    buffer.currentIndex = nextIndex;

    // Trigger background refill if low
    ensureBuffer(mode, topic, difficulty);

    return buffer.questions[nextIndex].question;
  }

  // No buffered question available - need to fetch
  if (!canGenerateMoreQuestions()) {
    console.warn("[QuestionBuffer] Session limit reached, no more questions");
    return null;
  }

  sessionUsage.questionCalls++;
  const newQuestion = await generateQuestion(topic, difficulty);

  const bufferedQ: BufferedQuestion = {
    questionId: newQuestion.id,
    topic,
    difficulty,
    question: newQuestion,
    fetchedAt: Date.now(),
  };

  buffer.questions.push(bufferedQ);
  buffer.currentIndex = buffer.questions.length - 1;

  // Trigger background refill
  ensureBuffer(mode, topic, difficulty);

  return newQuestion;
}

/**
 * Ensure buffer has enough questions; prefetch if below watermark.
 */
export function ensureBuffer(
  mode: string,
  topic: string,
  difficulty: DifficultyLevel
): void {
  const key = getBufferKey(mode, topic, difficulty);
  const buffer = buffers.get(key);

  if (!buffer) return;

  const remaining = buffer.questions.length - buffer.currentIndex - 1;
  const targetSize = BUFFER_CONFIG.BUFFER_SIZE_BY_DIFFICULTY[difficulty];

  if (remaining <= BUFFER_CONFIG.LOW_WATERMARK && !buffer.isPrefetching) {
    const toFetch = targetSize - remaining;
    prefetchQuestions(key, topic, difficulty, toFetch);
  }
}

/**
 * Prefetch questions in the background.
 */
async function prefetchQuestions(
  key: string,
  topic: string,
  difficulty: DifficultyLevel,
  count: number
): Promise<void> {
  const buffer = buffers.get(key);
  if (!buffer || buffer.isPrefetching) return;

  buffer.isPrefetching = true;

  console.log(`[QuestionBuffer] Prefetching ${count} questions for ${key}`);

  for (let i = 0; i < count; i++) {
    if (!canGenerateMoreQuestions()) {
      console.log("[QuestionBuffer] Stopping prefetch: session limit reached");
      break;
    }

    try {
      sessionUsage.questionCalls++;
      const question = await generateQuestion(topic, difficulty);

      const bufferedQ: BufferedQuestion = {
        questionId: question.id,
        topic,
        difficulty,
        question,
        fetchedAt: Date.now(),
      };

      buffer.questions.push(bufferedQ);
      console.log(`[QuestionBuffer] Prefetched: ${question.title}`);
    } catch (err) {
      console.warn("[QuestionBuffer] Prefetch failed:", err);
      break;
    }
  }

  buffer.isPrefetching = false;
}

// ============================================
// SESSION LIMITS
// ============================================

/**
 * Check if we can generate more questions in this session.
 */
export function canGenerateMoreQuestions(): boolean {
  return (
    sessionUsage.questionCalls < BUFFER_CONFIG.MAX_QUESTION_CALLS_PER_SESSION
  );
}

/**
 * Check if we can request more solutions in this session.
 */
export function canGenerateMoreSolutions(): boolean {
  return (
    sessionUsage.solutionCalls < BUFFER_CONFIG.MAX_SOLUTION_CALLS_PER_SESSION
  );
}

/**
 * Increment solution call count.
 */
export function recordSolutionCall(): void {
  sessionUsage.solutionCalls++;
}

/**
 * Get current session usage stats.
 */
export function getSessionUsage(): SessionUsage {
  return { ...sessionUsage };
}

/**
 * Reset session usage (called on page refresh or manually).
 */
export function resetSessionUsage(): void {
  sessionUsage = {
    questionCalls: 0,
    solutionCalls: 0,
  };
}

/**
 * Get buffer status for debugging/display.
 */
export function getBufferStatus(
  mode: string,
  topic: string,
  difficulty: DifficultyLevel
): {
  total: number;
  current: number;
  remaining: number;
  isPrefetching: boolean;
} {
  const key = getBufferKey(mode, topic, difficulty);
  const buffer = buffers.get(key);

  if (!buffer) {
    return { total: 0, current: -1, remaining: 0, isPrefetching: false };
  }

  return {
    total: buffer.questions.length,
    current: buffer.currentIndex,
    remaining: buffer.questions.length - buffer.currentIndex - 1,
    isPrefetching: buffer.isPrefetching,
  };
}

/**
 * Clear all buffers (useful for testing or mode switches).
 */
export function clearAllBuffers(): void {
  buffers.clear();
}
